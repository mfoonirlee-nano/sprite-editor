import { useEffect, useRef, useState } from 'react'

export type Tool = 'pan' | 'select' | 'lasso'

export interface Selection {
  x: number
  y: number
  w: number
  h: number
  points?: Array<{ x: number; y: number }>
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
  lassoPoints: Array<{ x: number; y: number }>
  currentFrame: number
  isPlaying: boolean
  timer: number
  lastTime: number
  showGrid: boolean
  dragging: boolean
  panStart: { x: number; y: number } | null
  selStart: { x: number; y: number } | null
  movingSel: boolean
  moveSelStart: { imgPt: { x: number; y: number }; selSnap: Selection } | null
  editCanvas: HTMLCanvasElement | null
  floatingCanvas: HTMLCanvasElement | null
  floatOffset: { x: number; y: number }
  antsOffset: number
  // params
  fw: number
  fh: number
  fcount: number
  fps: number
  ox: number
  oy: number
}

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
  })

  const mainRef = useRef<HTMLCanvasElement | null>(null)
  const gridRef = useRef<HTMLCanvasElement | null>(null)
  const selRef = useRef<HTMLCanvasElement | null>(null)
  const previewRef = useRef<HTMLCanvasElement | null>(null)

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
  }, [s.img, s.isPlaying, s.fps, s.currentFrame, s.timer, s.lastTime, s.sel, s.lassoDrawing, s.lassoPoints, s.antsOffset, s.fw, s.fh, s.fcount, s.ox, s.oy])

  useEffect(() => {
    const t = setInterval(() => setS((prev) => ({ ...prev, antsOffset: (prev.antsOffset + 0.4) % 7 })), 30)
    return () => clearInterval(t)
  }, [])

  const loadImage = (src: string) => {
    const img = new Image()
    img.onload = () => {
      setS((prev) => ({
        ...prev,
        img,
        imgSrc: src,
        currentFrame: 0,
      }))
      const main = mainRef.current!
      const grid = gridRef.current!
      const sel = selRef.current!
      main.width = img.naturalWidth
      main.height = img.naturalHeight
      grid.width = img.naturalWidth
      grid.height = img.naturalHeight
      sel.width = img.naturalWidth
      sel.height = img.naturalHeight
      updateGridCanvas(img)
      fitView()
    }
    img.onerror = () => {
      // ignore
    }
    img.src = src
  }

  const fitView = () => {
    if (!s.img) return
    const wrap = mainRef.current!.parentElement!
    const rect = wrap.getBoundingClientRect()
    const scaleX = (rect.width - 60) / s.img.naturalWidth
    const scaleY = (rect.height - 60) / s.img.naturalHeight
    const z = Math.min(scaleX, scaleY, 4)
    setS((prev) => ({
      ...prev,
      zoom: z,
      panX: (rect.width - s.img!.naturalWidth * z) / 2,
      panY: (rect.height - s.img!.naturalHeight * z) / 2,
    }))
  }

  const setZoomCenter = (z: number, cx?: number, cy?: number) => {
    const wrap = mainRef.current!.parentElement!
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
    if (!s.img) return
    const ctx = mainRef.current!.getContext('2d')!
    ctx.clearRect(0, 0, mainRef.current!.width, mainRef.current!.height)
    if (s.editCanvas) {
      ctx.drawImage(s.editCanvas, 0, 0)
      if (s.floatingCanvas) {
        ctx.drawImage(s.floatingCanvas, Math.round(s.floatOffset.x), Math.round(s.floatOffset.y))
      }
    } else {
      ctx.drawImage(s.img, 0, 0)
    }
  }

  const drawPreview = () => {
    const pv = previewRef.current
    if (!pv) return
    const pvCtx = pv.getContext('2d')!
    if (!s.img) {
      pv.width = 128
      pv.height = 128
      pvCtx.clearRect(0, 0, pv.width, pv.height)
      return
    }
    const c = Math.max(1, Math.floor((s.img.naturalWidth - s.ox) / s.fw))
    const col = s.currentFrame % c
    const row = Math.floor(s.currentFrame / c)
    pv.width = s.fw
    pv.height = s.fh
    pvCtx.clearRect(0, 0, pv.width, pv.height)
    pvCtx.drawImage(s.img, s.ox + col * s.fw, s.oy + row * s.fh, s.fw, s.fh, 0, 0, s.fw, s.fh)
  }

  const updateGridCanvas = (img = s.img) => {
    if (!img) return
    const gc = gridRef.current!.getContext('2d')!
    gc.clearRect(0, 0, gridRef.current!.width, gridRef.current!.height)
    if (!s.showGrid) return
    const W = img.naturalWidth
    const H = img.naturalHeight
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
    if (!s.img) return
    const selCtx = selRef.current!.getContext('2d')!
    selCtx.clearRect(0, 0, selRef.current!.width, selRef.current!.height)
    const sel = s.sel
    if (!sel) {
      if (s.lassoDrawing && s.lassoPoints.length > 1) {
        selCtx.save()
        selCtx.strokeStyle = 'rgba(124,106,247,0.9)'
        selCtx.lineWidth = 1
        selCtx.setLineDash([4, 3])
        selCtx.lineDashOffset = -s.antsOffset
        selCtx.beginPath()
        s.lassoPoints.forEach((p, i) => (i === 0 ? selCtx.moveTo(p.x, p.y) : selCtx.lineTo(p.x, p.y)))
        selCtx.stroke()
        selCtx.restore()
      }
      return
    }
    selCtx.save()
    selCtx.fillStyle = 'rgba(124,106,247,0.10)'
    selCtx.beginPath()
    if (sel.points) {
      sel.points.forEach((p, i) => (i === 0 ? selCtx.moveTo(p.x, p.y) : selCtx.lineTo(p.x, p.y)))
      selCtx.closePath()
    } else {
      selCtx.rect(sel.x, sel.y, sel.w, sel.h)
    }
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
  }
}
