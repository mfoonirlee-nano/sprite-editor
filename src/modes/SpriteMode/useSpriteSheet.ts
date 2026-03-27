import { useEffect, useRef, useState } from 'react'

export type Tool = 'pan' | 'select' | 'lasso'

type Point = { x: number; y: number }
type DrawableSource = HTMLImageElement | HTMLCanvasElement
export type RgbColor = { r: number; g: number; b: number }
export type ResizeAnchorX = 'left' | 'center' | 'right'
export type ResizeAnchorY = 'top' | 'middle' | 'bottom'
export interface ResizeAnchor {
  x: ResizeAnchorX
  y: ResizeAnchorY
}

export interface Selection {
  x: number
  y: number
  w: number
  h: number
  points?: Point[]
}

export interface SpriteState {
  img: HTMLImageElement | null
  imgSrc: string
  panX: number
  panY: number
  zoom: number
  tool: Tool
  selType: 'rect' | 'lasso'
  sel: Selection | null
  lassoDrawing: boolean
  lassoPoints: Point[]
  currentFrame: number
  isPlaying: boolean
  timer: number
  lastTime: number
  showGrid: boolean
  dragging: boolean
  panStart: { x: number; y: number } | null
  selStart: Point | null
  movingSel: boolean
  moveSelStart: { imgPt: Point; selSnap: Selection } | null
  editCanvas: HTMLCanvasElement | null
  floatingCanvas: HTMLCanvasElement | null
  floatOffset: Point
  antsOffset: number
  fw: number
  fh: number
  fcount: number
  fps: number
  ox: number
  oy: number
  bgRemovalTolerance: number
  bgSampleColor: RgbColor | null
  bgPickMode: boolean
}

const cloneSelection = (sel: Selection): Selection => ({
  ...sel,
  points: sel.points ? sel.points.map((point) => ({ ...point })) : undefined,
})

const translateSelection = (sel: Selection, dx: number, dy: number): Selection => ({
  ...sel,
  x: sel.x + dx,
  y: sel.y + dy,
  points: sel.points ? sel.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) : undefined,
})

const getSourceWidth = (source: DrawableSource) => source instanceof HTMLImageElement ? source.naturalWidth : source.width
const getSourceHeight = (source: DrawableSource) => source instanceof HTMLImageElement ? source.naturalHeight : source.height

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width))
  canvas.height = Math.max(1, Math.ceil(height))
  return canvas
}

const traceSelectionPath = (ctx: CanvasRenderingContext2D, sel: Selection, offsetX = 0, offsetY = 0) => {
  ctx.beginPath()
  if (sel.points?.length) {
    sel.points.forEach((point, index) => {
      const x = point.x + offsetX
      const y = point.y + offsetY
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    return
  }
  ctx.rect(sel.x + offsetX, sel.y + offsetY, sel.w, sel.h)
}

const cloneColor = (color: RgbColor): RgbColor => ({ ...color })

const computeResizeOffset = (targetSize: number, sourceSize: number, anchor: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
  if (anchor === 'left' || anchor === 'top') return 0
  if (anchor === 'center' || anchor === 'middle') return Math.round((targetSize - sourceSize) / 2)
  return targetSize - sourceSize
}

const clampSelectionToBounds = (sel: Selection, width: number, height: number) => {
  const maxX = width - 1
  const maxY = height - 1
  if (maxX < 0 || maxY < 0) return null

  if (sel.points?.length) {
    const points = sel.points.filter((point) => point.x >= 0 && point.x <= maxX && point.y >= 0 && point.y <= maxY)
    if (points.length < 3) return null
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
      points,
    }
  }

  const left = Math.max(0, sel.x)
  const top = Math.max(0, sel.y)
  const right = Math.min(width, sel.x + sel.w)
  const bottom = Math.min(height, sel.y + sel.h)
  if (right <= left || bottom <= top) return null
  return { x: left, y: top, w: right - left, h: bottom - top }
}

const colorsAreSimilar = (a: RgbColor, b: RgbColor, tolerance: number) => (
  Math.abs(a.r - b.r) <= tolerance &&
  Math.abs(a.g - b.g) <= tolerance &&
  Math.abs(a.b - b.b) <= tolerance
)

export function useSpriteSheet() {
  const [s, setS] = useState<SpriteState>({
    img: null,
    imgSrc: '',
    panX: 0,
    panY: 0,
    zoom: 1,
    tool: 'pan',
    selType: 'rect',
    sel: null,
    lassoDrawing: false,
    lassoPoints: [],
    currentFrame: 0,
    isPlaying: false,
    timer: 0,
    lastTime: 0,
    showGrid: true,
    dragging: false,
    panStart: null,
    selStart: null,
    movingSel: false,
    moveSelStart: null,
    editCanvas: null,
    floatingCanvas: null,
    floatOffset: { x: 0, y: 0 },
    antsOffset: 0,
    fw: 64,
    fh: 64,
    fcount: 4,
    fps: 10,
    ox: 0,
    oy: 0,
    bgRemovalTolerance: 24,
    bgSampleColor: null,
    bgPickMode: false,
  })

  const mainRef = useRef<HTMLCanvasElement | null>(null)
  const gridRef = useRef<HTMLCanvasElement | null>(null)
  const selRef = useRef<HTMLCanvasElement | null>(null)
  const previewRef = useRef<HTMLCanvasElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const revokeObjectUrl = (url: string | null) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }

  const getDrawableSource = (state = s): DrawableSource | null => state.editCanvas ?? state.img

  const cloneDrawableSource = (source: DrawableSource) => {
    const canvas = createCanvas(getSourceWidth(source), getSourceHeight(source))
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(source, 0, 0)
    }
    return canvas
  }

  const syncCanvasSizes = (source: DrawableSource | null) => {
    const width = source ? getSourceWidth(source) : 0
    const height = source ? getSourceHeight(source) : 0
    const canvases = [mainRef.current, gridRef.current, selRef.current]
    canvases.forEach((canvas) => {
      if (!canvas) return
      canvas.width = width
      canvas.height = height
    })
  }

  const sampleColorAt = (source: DrawableSource, point: Point): RgbColor | null => {
    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const x = Math.min(width - 1, Math.max(0, Math.floor(point.x)))
    const y = Math.min(height - 1, Math.max(0, Math.floor(point.y)))
    const canvas = cloneDrawableSource(source)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data
    if (a === 0) return null
    return { r, g, b }
  }

  const autoSampleBackgroundColor = (source = getDrawableSource()): RgbColor | null => {
    if (!source) return null

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const corners = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 },
    ]

    const colors = corners
      .map((point) => sampleColorAt(source, point))
      .filter((color): color is RgbColor => color !== null)

    if (!colors.length) return null

    const clusterTolerance = 24
    let bestCluster: RgbColor[] = [colors[0]]

    colors.forEach((base) => {
      const cluster = colors.filter((candidate) => colorsAreSimilar(base, candidate, clusterTolerance))
      if (cluster.length > bestCluster.length) {
        bestCluster = cluster
      }
    })

    const sourceColors = bestCluster.length > 1 ? bestCluster : colors
    const total = sourceColors.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
      }),
      { r: 0, g: 0, b: 0 },
    )

    return {
      r: Math.round(total.r / sourceColors.length),
      g: Math.round(total.g / sourceColors.length),
      b: Math.round(total.b / sourceColors.length),
    }
  }

  const applyBackgroundRemoval = (targetColor = s.bgSampleColor) => {
    const source = getDrawableSource()
    if (!source || !targetColor) return

    const canvas = cloneDrawableSource(source)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const tolerance = Math.max(0, s.bgRemovalTolerance)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue
      if (
        Math.abs(data[i] - targetColor.r) <= tolerance &&
        Math.abs(data[i + 1] - targetColor.g) <= tolerance &&
        Math.abs(data[i + 2] - targetColor.b) <= tolerance
      ) {
        data[i + 3] = 0
      }
    }

    ctx.putImageData(imageData, 0, 0)

    setS((prev) => ({
      ...prev,
      editCanvas: canvas,
      floatingCanvas: null,
      movingSel: false,
      moveSelStart: null,
      floatOffset: { x: 0, y: 0 },
      bgSampleColor: cloneColor(targetColor),
      bgPickMode: false,
    }))
  }

  const autoRemoveBackground = () => {
    const sampled = autoSampleBackgroundColor()
    if (!sampled) return
    setS((prev) => ({ ...prev, bgSampleColor: sampled, bgPickMode: false }))
    applyBackgroundRemoval(sampled)
  }

  const setBackgroundSample = (color: RgbColor | null) => {
    setS((prev) => ({
      ...prev,
      bgSampleColor: color ? cloneColor(color) : null,
      bgPickMode: false,
    }))
  }

  const setBackgroundPickMode = (active: boolean) => {
    setS((prev) => ({ ...prev, bgPickMode: active }))
  }

  const sampleBackgroundColorAt = (imgPt: Point) => {
    const source = getDrawableSource()
    if (!source) return
    const color = sampleColorAt(source, imgPt)
    if (!color) return
    setBackgroundSample(color)
  }

  const resetEdits = () => {
    setS((prev) => ({
      ...prev,
      editCanvas: null,
      floatingCanvas: null,
      movingSel: false,
      moveSelStart: null,
      floatOffset: { x: 0, y: 0 },
      bgPickMode: false,
      bgSampleColor: null,
    }))
  }

  const resizeCanvas = (targetWidth: number, targetHeight: number, anchor: ResizeAnchor) => {
    const source = getDrawableSource()
    if (!source) return

    const nextWidth = Math.max(1, Math.round(targetWidth))
    const nextHeight = Math.max(1, Math.round(targetHeight))
    const sourceWidth = getSourceWidth(source)
    const sourceHeight = getSourceHeight(source)
    const dx = computeResizeOffset(nextWidth, sourceWidth, anchor.x)
    const dy = computeResizeOffset(nextHeight, sourceHeight, anchor.y)
    const resizedCanvas = createCanvas(nextWidth, nextHeight)
    const resizedCtx = resizedCanvas.getContext('2d')
    if (!resizedCtx) return

    resizedCtx.clearRect(0, 0, nextWidth, nextHeight)
    resizedCtx.drawImage(source, dx, dy)
    syncCanvasSizes(resizedCanvas)

    setS((prev) => ({
      ...prev,
      editCanvas: resizedCanvas,
      sel: prev.sel ? clampSelectionToBounds(translateSelection(prev.sel, dx, dy), nextWidth, nextHeight) : null,
      lassoDrawing: false,
      lassoPoints: [],
      dragging: false,
      panStart: null,
      selStart: null,
      movingSel: false,
      moveSelStart: null,
      floatingCanvas: null,
      floatOffset: { x: 0, y: 0 },
      bgPickMode: false,
    }))
  }

  const startMovingSelection = (imgPt: Point) => {
    const sel = s.sel
    const source = getDrawableSource()
    if (!sel || !source) return

    const baseCanvas = cloneDrawableSource(source)
    const floatingCanvas = createCanvas(sel.w, sel.h)
    const floatingCtx = floatingCanvas.getContext('2d')
    const baseCtx = baseCanvas.getContext('2d')
    if (!floatingCtx || !baseCtx) return

    floatingCtx.save()
    traceSelectionPath(floatingCtx, sel, -sel.x, -sel.y)
    floatingCtx.clip()
    floatingCtx.drawImage(source, -sel.x, -sel.y)
    floatingCtx.restore()

    if (sel.points?.length) {
      baseCtx.save()
      traceSelectionPath(baseCtx, sel)
      baseCtx.clip()
      baseCtx.clearRect(sel.x, sel.y, sel.w, sel.h)
      baseCtx.restore()
    } else {
      baseCtx.clearRect(sel.x, sel.y, sel.w, sel.h)
    }

    setS((prev) => ({
      ...prev,
      movingSel: true,
      moveSelStart: { imgPt, selSnap: cloneSelection(sel) },
      editCanvas: baseCanvas,
      floatingCanvas,
      floatOffset: { x: sel.x, y: sel.y },
      bgPickMode: false,
    }))
  }

  const updateMovingSelection = (imgPt: Point) => {
    setS((prev) => {
      if (!prev.movingSel || !prev.moveSelStart) return prev
      const dx = Math.round(imgPt.x - prev.moveSelStart.imgPt.x)
      const dy = Math.round(imgPt.y - prev.moveSelStart.imgPt.y)
      const nextSel = translateSelection(prev.moveSelStart.selSnap, dx, dy)
      return {
        ...prev,
        sel: nextSel,
        floatOffset: { x: nextSel.x, y: nextSel.y },
      }
    })
  }

  const commitMovingSelection = () => {
    setS((prev) => {
      if (!prev.movingSel || !prev.editCanvas || !prev.floatingCanvas) return prev

      const committedCanvas = createCanvas(prev.editCanvas.width, prev.editCanvas.height)
      const committedCtx = committedCanvas.getContext('2d')
      if (!committedCtx) {
        return {
          ...prev,
          movingSel: false,
          moveSelStart: null,
          floatingCanvas: null,
        }
      }

      committedCtx.drawImage(prev.editCanvas, 0, 0)
      committedCtx.drawImage(prev.floatingCanvas, Math.round(prev.floatOffset.x), Math.round(prev.floatOffset.y))

      return {
        ...prev,
        movingSel: false,
        moveSelStart: null,
        editCanvas: committedCanvas,
        floatingCanvas: null,
      }
    })
  }

  useEffect(() => {
    let id = 0
    const loop = (ts: number) => {
      id = requestAnimationFrame(loop)
      if (!s.img) return
      drawMain()
      if (s.isPlaying) {
        const dt = ts - (s.lastTime || ts)
        setS((prev) => ({ ...prev, lastTime: ts, timer: prev.timer + dt }))
        const interval = 1000 / s.fps
        if (s.timer >= interval) {
          let timer = s.timer
          if (timer > interval * 5) timer = timer % interval
          let cf = s.currentFrame
          while (timer >= interval) {
            cf = (cf + 1) % s.fcount
            timer -= interval
          }
          setS((prev) => ({ ...prev, currentFrame: cf, timer }))
        }
      } else {
        setS((prev) => ({ ...prev, lastTime: ts }))
      }
      drawPreview()
      drawSelCanvas()
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.img, s.isPlaying, s.fps, s.currentFrame, s.timer, s.lastTime, s.sel, s.lassoDrawing, s.lassoPoints, s.antsOffset, s.fw, s.fh, s.fcount, s.ox, s.oy, s.editCanvas, s.floatingCanvas, s.floatOffset.x, s.floatOffset.y, s.movingSel])

  useEffect(() => {
    const t = setInterval(() => setS((prev) => ({ ...prev, antsOffset: (prev.antsOffset + 0.4) % 7 })), 30)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const source = getDrawableSource()
    syncCanvasSizes(source)
    if (!source) return
    updateGridCanvas(source)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.img, s.editCanvas, s.showGrid, s.fw, s.fh, s.fcount, s.ox, s.oy])

  useEffect(() => {
    return () => revokeObjectUrl(objectUrlRef.current)
  }, [])

  const loadImage = (src: string) => {
    const img = new Image()
    const nextObjectUrl = src.startsWith('blob:') ? src : null
    const prevObjectUrl = objectUrlRef.current

    img.onload = () => {
      syncCanvasSizes(img)

      if (prevObjectUrl && prevObjectUrl !== nextObjectUrl) {
        revokeObjectUrl(prevObjectUrl)
      }
      objectUrlRef.current = nextObjectUrl

      setS((prev) => ({
        ...prev,
        img,
        imgSrc: src,
        currentFrame: 0,
        isPlaying: false,
        timer: 0,
        lastTime: 0,
        selType: 'rect',
        sel: null,
        lassoDrawing: false,
        lassoPoints: [],
        dragging: false,
        panStart: null,
        selStart: null,
        movingSel: false,
        moveSelStart: null,
        editCanvas: null,
        floatingCanvas: null,
        floatOffset: { x: 0, y: 0 },
        bgSampleColor: null,
        bgPickMode: false,
      }))

      fitView(img)
    }

    img.onerror = () => {
      if (nextObjectUrl && nextObjectUrl !== prevObjectUrl) {
        revokeObjectUrl(nextObjectUrl)
      }
    }

    img.src = src
  }

  const fitView = (source = getDrawableSource()) => {
    const wrap = mainRef.current?.parentElement
    if (!source || !wrap) return

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const rect = wrap.getBoundingClientRect()
    const scaleX = (rect.width - 60) / width
    const scaleY = (rect.height - 60) / height
    const z = Math.min(scaleX, scaleY, 4)

    setS((prev) => ({
      ...prev,
      zoom: z,
      panX: (rect.width - width * z) / 2,
      panY: (rect.height - height * z) / 2,
    }))
  }

  const setZoomCenter = (z: number, cx?: number, cy?: number) => {
    const wrap = mainRef.current?.parentElement
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    const mx = cx !== undefined ? cx - rect.left : rect.width / 2
    const my = cy !== undefined ? cy - rect.top : rect.height / 2
    const oldZ = s.zoom
    z = Math.min(Math.max(z, 0.05), 16)
    const panX = mx - (mx - s.panX) * (z / oldZ)
    const panY = my - (my - s.panY) * (z / oldZ)
    setS((prev) => ({ ...prev, zoom: z, panX, panY }))
  }

  const drawMain = () => {
    const main = mainRef.current
    const source = getDrawableSource()
    if (!source || !main) return

    const ctx = main.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, main.width, main.height)
    ctx.drawImage(source, 0, 0)
    if (s.floatingCanvas) {
      ctx.drawImage(s.floatingCanvas, Math.round(s.floatOffset.x), Math.round(s.floatOffset.y))
    }
  }

  const drawPreview = () => {
    const pv = previewRef.current
    const source = getDrawableSource()
    if (!pv) return

    const pvCtx = pv.getContext('2d')
    if (!pvCtx) return

    if (!source) {
      pv.width = 128
      pv.height = 128
      pvCtx.clearRect(0, 0, pv.width, pv.height)
      return
    }

    const sourceWidth = getSourceWidth(source)
    const c = Math.max(1, Math.floor((sourceWidth - s.ox) / s.fw))
    const col = s.currentFrame % c
    const row = Math.floor(s.currentFrame / c)
    pv.width = s.fw
    pv.height = s.fh
    pvCtx.clearRect(0, 0, pv.width, pv.height)
    pvCtx.drawImage(source, s.ox + col * s.fw, s.oy + row * s.fh, s.fw, s.fh, 0, 0, s.fw, s.fh)
  }

  const updateGridCanvas = (source = getDrawableSource()) => {
    const grid = gridRef.current
    if (!source || !grid) return

    const gc = grid.getContext('2d')
    if (!gc) return

    gc.clearRect(0, 0, grid.width, grid.height)
    if (!s.showGrid) return

    const W = getSourceWidth(source)
    const H = getSourceHeight(source)
    const cw = s.fw
    const ch = s.fh
    gc.strokeStyle = 'rgba(124,106,247,0.5)'
    gc.lineWidth = 1
    gc.setLineDash([3, 3])
    for (let x = s.ox; x <= W; x += cw) {
      gc.beginPath()
      gc.moveTo(x + 0.5, s.oy)
      gc.lineTo(x + 0.5, H)
      gc.stroke()
    }
    for (let y = s.oy; y <= H; y += ch) {
      gc.beginPath()
      gc.moveTo(s.ox, y + 0.5)
      gc.lineTo(W, y + 0.5)
      gc.stroke()
    }
    gc.setLineDash([])
    gc.fillStyle = 'rgba(124,106,247,0.7)'
    gc.font = `${Math.max(8, Math.min(12, cw / 6))}px monospace`
    gc.textAlign = 'left'
    gc.textBaseline = 'top'
    const c = Math.max(1, Math.floor((W - s.ox) / cw))
    for (let i = 0; i < s.fcount; i++) {
      const col = i % c
      const row = Math.floor(i / c)
      gc.fillText(String(i), s.ox + col * cw + 3, s.oy + row * ch + 3)
    }
  }

  const drawSelCanvas = () => {
    const canvas = selRef.current
    const source = getDrawableSource()
    if (!source || !canvas) return

    const selCtx = canvas.getContext('2d')
    if (!selCtx) return

    selCtx.clearRect(0, 0, canvas.width, canvas.height)
    const sel = s.sel
    if (!sel) {
      if (s.lassoDrawing && s.lassoPoints.length > 1) {
        selCtx.save()
        selCtx.strokeStyle = 'rgba(124,106,247,0.9)'
        selCtx.lineWidth = 1
        selCtx.setLineDash([4, 3])
        selCtx.lineDashOffset = -s.antsOffset
        selCtx.beginPath()
        s.lassoPoints.forEach((point, index) => (index === 0 ? selCtx.moveTo(point.x, point.y) : selCtx.lineTo(point.x, point.y)))
        selCtx.stroke()
        selCtx.restore()
      }
      return
    }

    selCtx.save()
    selCtx.fillStyle = 'rgba(124,106,247,0.10)'
    traceSelectionPath(selCtx, sel)
    selCtx.fill()
    selCtx.strokeStyle = '#7c6af7'
    selCtx.lineWidth = 1
    selCtx.setLineDash([4, 3])
    selCtx.lineDashOffset = -s.antsOffset
    selCtx.stroke()
    selCtx.strokeStyle = 'rgba(255,255,255,0.4)'
    selCtx.setLineDash([4, 3])
    selCtx.lineDashOffset = -(s.antsOffset + 3.5)
    selCtx.stroke()
    selCtx.restore()
  }

  return {
    s,
    setS,
    mainRef,
    gridRef,
    selRef,
    previewRef,
    loadImage,
    fitView,
    setZoomCenter,
    updateGridCanvas,
    getDrawableSource,
    setBackgroundSample,
    setBackgroundPickMode,
    sampleBackgroundColorAt,
    autoRemoveBackground,
    applyBackgroundRemoval,
    resetEdits,
    startMovingSelection,
    updateMovingSelection,
    commitMovingSelection,
    resizeCanvas,
  }
}

export type SpriteSheetController = ReturnType<typeof useSpriteSheet>
