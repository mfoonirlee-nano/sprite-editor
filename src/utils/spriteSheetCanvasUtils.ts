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
