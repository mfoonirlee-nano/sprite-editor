import type { Point } from '../types/selectionTypes'
import type { DrawableSource, RgbColor, ResizeAnchorX, ResizeAnchorY } from '../types/spriteSheetTypes'

export const getSourceWidth = (source: DrawableSource) => source instanceof HTMLImageElement ? source.naturalWidth : source.width
export const getSourceHeight = (source: DrawableSource) => source instanceof HTMLImageElement ? source.naturalHeight : source.height

export const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width))
  canvas.height = Math.max(1, Math.ceil(height))
  return canvas
}

export const cloneColor = (color: RgbColor): RgbColor => ({ ...color })

export const computeResizeOffset = (targetSize: number, sourceSize: number, anchor: ResizeAnchorX | ResizeAnchorY) => {
  if (anchor === 'left' || anchor === 'top') return 0
  if (anchor === 'center' || anchor === 'middle') return Math.round((targetSize - sourceSize) / 2)
  return targetSize - sourceSize
}

export const colorsAreSimilar = (a: RgbColor, b: RgbColor, tolerance: number) => (
  Math.abs(a.r - b.r) <= tolerance &&
  Math.abs(a.g - b.g) <= tolerance &&
  Math.abs(a.b - b.b) <= tolerance
)

export const readColorAt = (ctx: CanvasRenderingContext2D, width: number, height: number, point: Point): RgbColor | null => {
  const x = Math.min(width - 1, Math.max(0, Math.floor(point.x)))
  const y = Math.min(height - 1, Math.max(0, Math.floor(point.y)))
  const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data
  if (a === 0) return null
  return { r, g, b }
}

export const findConnectedColorPixelsInImageData = (imageData: ImageData, point: Point, tolerance: number): Point[] | null => {
  const { width, height, data } = imageData
  const startX = Math.min(width - 1, Math.max(0, Math.floor(point.x)))
  const startY = Math.min(height - 1, Math.max(0, Math.floor(point.y)))
  const startOffset = (startY * width + startX) * 4
  const startA = data[startOffset + 3]
  if (startA === 0) return null

  const startR = data[startOffset]
  const startG = data[startOffset + 1]
  const startB = data[startOffset + 2]

  const visited = new Uint8Array(width * height)
  const queue: Array<[number, number]> = [[startX, startY]]
  visited[startY * width + startX] = 1
  const pixels: Point[] = []

  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i]
    pixels.push({ x, y })

    const neighbors: Array<[number, number]> = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]

    neighbors.forEach(([nextX, nextY]) => {
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) return
      const offset = nextY * width + nextX
      if (visited[offset]) return
      visited[offset] = 1
      const idx = offset * 4
      if (data[idx + 3] === 0) return
      if (
        Math.abs(data[idx] - startR) <= tolerance &&
        Math.abs(data[idx + 1] - startG) <= tolerance &&
        Math.abs(data[idx + 2] - startB) <= tolerance
      ) {
        queue.push([nextX, nextY])
      }
    })
  }

  return pixels.length > 0 ? pixels : null
}

// Removes edge jaggies by eroding spike pixels — opaque pixels with ≤1 opaque
// 4-directional neighbor are sticking out alone and get removed. Runs `iterations`
// passes so each pass can expose new spikes uncovered by the previous one.
// `selMask` restricts which pixels are candidates for removal (undefined = all).
export const cleanEdgeJaggies = (imageData: ImageData, iterations: number, selMask?: Set<number>): ImageData => {
  const { width, height } = imageData
  let data = new Uint8ClampedArray(imageData.data)

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Uint8ClampedArray(data)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const i = idx * 4
        if (data[i + 3] === 0) continue
        if (selMask && !selMask.has(idx)) continue

        // Treat pixels with alpha <= 16 as transparent so decontaminated
        // semi-transparent fringe pixels don't count as solid neighbors.
        const ALPHA_THRESHOLD = 16
        let opaqueNeighbors = 0
        if (x > 0 && data[i - 4 + 3] > ALPHA_THRESHOLD) opaqueNeighbors++
        if (x < width - 1 && data[i + 4 + 3] > ALPHA_THRESHOLD) opaqueNeighbors++
        if (y > 0 && data[i - width * 4 + 3] > ALPHA_THRESHOLD) opaqueNeighbors++
        if (y < height - 1 && data[i + width * 4 + 3] > ALPHA_THRESHOLD) opaqueNeighbors++

        if (opaqueNeighbors <= 1) next[i + 3] = 0
      }
    }
    data = next
  }

  return new ImageData(data, width, height)
}

// Defringe + edge cleanup pipeline shared by background removal and delete-selection.
// Uses proper alpha matting to produce smooth, natural edges:
//   Phase 1 — Build a distance field from transparent pixels (8-connected).
//   Phase 2 — For each pixel in the "edge band" (dist 1‥MAX_EDGE_DEPTH) that could
//             be background-contaminated, estimate the true foreground color by sampling
//             the nearest deep-interior pixel, then compute alpha via the matting equation
//             C = α·F + (1−α)·B. Decontaminate RGB and set alpha accordingly.
//   Phase 3 — Gaussian-smooth the alpha channel at the outermost edge to eliminate the
//             staircase aliasing pattern.
//   Phase 4 — Sweep near-zero alpha remnants and clean isolated spike pixels.
// `seedMask` (optional): if provided, distance field only seeds from transparent pixels
// marked in this mask (1 = seed). Use this when only specific deleted pixels should trigger
// defringe (e.g., deleteSelection), so pre-existing transparency doesn't affect the result.
// Pass null/undefined to seed from ALL transparent pixels (background removal mode).
export const defringeAndCleanEdges = (imageData: ImageData, targetColor: RgbColor, tolerance: number, seedMask?: Uint8Array | null): ImageData => {
  const { width, height, data } = imageData
  const total = width * height
  const MAX_EDGE_DEPTH = 5
  const SEARCH_RADIUS = 5
  const tR = targetColor.r, tG = targetColor.g, tB = targetColor.b

  // ─── Phase 1: Build distance field from transparency (8-connected BFS) ───
  // 0 = transparent, 1..MAX_EDGE_DEPTH = edge band, 255 = deep interior (uncontaminated)
  const dist = new Uint8Array(total)
  dist.fill(255)
  const bfsQ: number[] = []

  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3] === 0) dist[i] = 0
  }

  // Seed dist=1 from transparent pixels' 8-neighbors.
  // If seedMask is provided, ONLY seed from transparent pixels that are in the mask —
  // so only the boundary of the newly-deleted region gets processed.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (dist[i] !== 0) continue
      if (seedMask && !seedMask[i]) continue
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const ni = ny * width + nx
          if (data[ni * 4 + 3] > 0 && dist[ni] === 255) {
            dist[ni] = 1
            bfsQ.push(ni)
          }
        }
      }
    }
  }

  // BFS expand to fill dist 2..MAX_EDGE_DEPTH
  for (let qi = 0; qi < bfsQ.length; qi++) {
    const idx = bfsQ[qi]
    const d = dist[idx]
    if (d >= MAX_EDGE_DEPTH) continue
    const bx = idx % width, by = (idx - bx) / width
    const nd = d + 1
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = bx + dx, ny = by + dy
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const ni = ny * width + nx
        if (data[ni * 4 + 3] > 0 && nd < dist[ni]) {
          dist[ni] = nd
          bfsQ.push(ni)
        }
      }
    }
  }

  // ─── Phase 2: Alpha matting + color decontamination for edge-band pixels ───
  // Generous Euclidean threshold: pixels within this distance of the bg color are candidates
  const eucThreshold = (tolerance + 50) * 1.73

  for (let i = 0; i < total; i++) {
    const d = dist[i]
    if (d === 0 || d === 255) continue // skip transparent and deep interior
    const pi = i * 4
    const pa = data[pi + 3]
    if (pa === 0) continue
    const pr = data[pi], pg = data[pi + 1], pb = data[pi + 2]

    // Quick eligibility: is this pixel plausibly background-contaminated?
    const cdr = pr - tR, cdg = pg - tG, cdb = pb - tB
    const eucDist = Math.sqrt(cdr * cdr + cdg * cdg + cdb * cdb)
    if (eucDist > eucThreshold) continue

    // Find nearest deep-interior pixel as foreground color reference
    const px = i % width, py = (i - px) / width
    let fgR = -1, fgG = -1, fgB = -1, bestD2 = Infinity
    const sx0 = Math.max(0, px - SEARCH_RADIUS), sx1 = Math.min(width - 1, px + SEARCH_RADIUS)
    const sy0 = Math.max(0, py - SEARCH_RADIUS), sy1 = Math.min(height - 1, py + SEARCH_RADIUS)

    for (let sy = sy0; sy <= sy1; sy++) {
      for (let sx = sx0; sx <= sx1; sx++) {
        const si = sy * width + sx
        // Require: deep interior (dist > MAX_EDGE_DEPTH, i.e. 255), fully opaque, and
        // not itself matching the removed background color
        if (dist[si] <= MAX_EDGE_DEPTH) continue
        if (data[si * 4 + 3] < 200) continue
        const spi = si * 4
        if (
          Math.abs(data[spi] - tR) <= tolerance &&
          Math.abs(data[spi + 1] - tG) <= tolerance &&
          Math.abs(data[spi + 2] - tB) <= tolerance
        ) continue
        const d2 = (sx - px) * (sx - px) + (sy - py) * (sy - py)
        if (d2 < bestD2) {
          bestD2 = d2
          fgR = data[spi]; fgG = data[spi + 1]; fgB = data[spi + 2]
        }
      }
    }

    if (fgR < 0) {
      // Fallback: no interior reference — use max-channel heuristic
      const maxDiff = Math.max(Math.abs(cdr), Math.abs(cdg), Math.abs(cdb))
      const bgRatio = 1 - maxDiff / 255
      if (bgRatio > 0.85) {
        data[pi + 3] = 0
      } else if (bgRatio > 0.15) {
        const keep = 1 - bgRatio
        data[pi] = Math.round(Math.max(0, Math.min(255, (pr - (1 - keep) * tR) / keep)))
        data[pi + 1] = Math.round(Math.max(0, Math.min(255, (pg - (1 - keep) * tG) / keep)))
        data[pi + 2] = Math.round(Math.max(0, Math.min(255, (pb - (1 - keep) * tB) / keep)))
        data[pi + 3] = Math.round(pa * keep)
      }
      continue
    }

    // ── Alpha matting ──
    // C = α·F + (1−α)·B → α_ch = (C_ch - B_ch) / (F_ch - B_ch)
    // Weight each channel's estimate by |F_ch - B_ch| for numerical stability.
    const dfR = fgR - tR, dfG = fgG - tG, dfB = fgB - tB
    const wR = Math.abs(dfR), wG = Math.abs(dfG), wB = Math.abs(dfB)
    let aN = 0, aD = 0
    if (wR > 10) { aN += wR * ((pr - tR) / dfR); aD += wR }
    if (wG > 10) { aN += wG * ((pg - tG) / dfG); aD += wG }
    if (wB > 10) { aN += wB * ((pb - tB) / dfB); aD += wB }
    const alpha = aD > 0 ? Math.max(0, Math.min(1, aN / aD)) : (d / MAX_EDGE_DEPTH)

    if (alpha < 0.05) {
      data[pi + 3] = 0
    } else if (alpha < 0.95) {
      // Decontaminate: blend unmixed color with nearest fg (trust unmix at high α,
      // trust nearest fg at low α, since unmixing amplifies noise for small α).
      const unmR = (pr - (1 - alpha) * tR) / alpha
      const unmG = (pg - (1 - alpha) * tG) / alpha
      const unmB = (pb - (1 - alpha) * tB) / alpha
      const t = alpha // trust weight for unmixed value
      data[pi] = Math.round(Math.max(0, Math.min(255, t * unmR + (1 - t) * fgR)))
      data[pi + 1] = Math.round(Math.max(0, Math.min(255, t * unmG + (1 - t) * fgG)))
      data[pi + 2] = Math.round(Math.max(0, Math.min(255, t * unmB + (1 - t) * fgB)))
      data[pi + 3] = Math.round(pa * alpha)
    }
    // else alpha >= 0.95: pixel is effectively pure foreground — leave untouched
  }

  // ─── Phase 3: Gaussian smooth alpha at outer edge (dist 1–2) ───
  // Softens the staircase aliasing pattern; only decreases alpha, never increases.
  const origA = new Uint8ClampedArray(total)
  for (let i = 0; i < total; i++) origA[i] = data[i * 4 + 3]

  for (let i = 0; i < total; i++) {
    if (dist[i] < 1 || dist[i] > 2 || origA[i] === 0) continue
    const ex = i % width, ey = (i - ex) / width
    if (ex === 0 || ex >= width - 1 || ey === 0 || ey >= height - 1) continue
    // 3×3 Gaussian kernel: [1 2 1; 2 4 2; 1 2 1] / 16
    const sum =
      origA[i - width - 1]     + origA[i - width] * 2 + origA[i - width + 1] +
      origA[i - 1] * 2         + origA[i] * 4         + origA[i + 1] * 2 +
      origA[i + width - 1]     + origA[i + width] * 2 + origA[i + width + 1]
    // Only reduce alpha — never fill transparency back in
    data[i * 4 + 3] = Math.min(origA[i], Math.round(sum / 16))
  }

  // ─── Phase 4: Cleanup ───
  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3] <= 16) data[i * 4 + 3] = 0
  }

  return cleanEdgeJaggies(imageData, 2)
}

export const findConnectedOpaqueBoundsInImageData = (imageData: ImageData, point: Point) => {
  const { width, height, data } = imageData
  const startX = Math.min(width - 1, Math.max(0, Math.floor(point.x)))
  const startY = Math.min(height - 1, Math.max(0, Math.floor(point.y)))
  const startIndex = (startY * width + startX) * 4 + 3
  if (data[startIndex] === 0) return null

  const visited = new Uint8Array(width * height)
  const queue: Array<[number, number]> = [[startX, startY]]
  visited[startY * width + startX] = 1

  let minX = startX
  let minY = startY
  let maxX = startX
  let maxY = startY

  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y

    const neighbors: Array<[number, number]> = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]

    neighbors.forEach(([nextX, nextY]) => {
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) return
      const offset = nextY * width + nextX
      if (visited[offset]) return
      visited[offset] = 1
      if (data[offset * 4 + 3] === 0) return
      queue.push([nextX, nextY])
    })
  }

  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}
