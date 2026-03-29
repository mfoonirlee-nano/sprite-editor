import type { Dispatch, RefObject, SetStateAction } from 'react'
import { traceSelectionPath } from '../utils/selectionUtils'
import type { DrawableSource, SpriteState } from '../types/spriteSheetTypes'
import { getSourceWidth, getSourceHeight } from '../utils/spriteSheetCanvasUtils'

interface SpriteSheetRenderingDeps {
  state: SpriteState
  setState: Dispatch<SetStateAction<SpriteState>>
  mainRef: RefObject<HTMLCanvasElement | null>
  gridRef: RefObject<HTMLCanvasElement | null>
  selRef: RefObject<HTMLCanvasElement | null>
  previewRef: RefObject<HTMLCanvasElement | null>
  getDrawableSource: (state?: SpriteState) => DrawableSource | null
}

export function createSpriteSheetRendering({
  state,
  setState,
  mainRef,
  gridRef,
  selRef,
  previewRef,
  getDrawableSource,
}: SpriteSheetRenderingDeps) {
  const fitView = (source = getDrawableSource()) => {
    const wrap = mainRef.current?.parentElement
    if (!source || !wrap) return

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const rect = wrap.getBoundingClientRect()
    const scaleX = (rect.width - 60) / width
    const scaleY = (rect.height - 60) / height
    const zoom = Math.min(scaleX, scaleY, 4)

    setState((prev) => ({
      ...prev,
      zoom,
      panX: (rect.width - width * zoom) / 2,
      panY: (rect.height - height * zoom) / 2,
    }))
  }

  const setZoomCenter = (zoom: number, cx?: number, cy?: number) => {
    const wrap = mainRef.current?.parentElement
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    const mx = cx !== undefined ? cx - rect.left : rect.width / 2
    const my = cy !== undefined ? cy - rect.top : rect.height / 2
    const nextZoom = Math.min(Math.max(zoom, 0.05), 16)
    const panX = mx - (mx - state.panX) * (nextZoom / state.zoom)
    const panY = my - (my - state.panY) * (nextZoom / state.zoom)
    setState((prev) => ({ ...prev, zoom: nextZoom, panX, panY }))
  }

  const drawMain = () => {
    const main = mainRef.current
    const source = getDrawableSource()
    if (!source || !main) return

    const ctx = main.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, main.width, main.height)
    ctx.drawImage(source, 0, 0)
    if (state.floatingCanvas) {
      ctx.drawImage(state.floatingCanvas, Math.round(state.floatOffset.x), Math.round(state.floatOffset.y))
    }
  }

  const drawPreview = () => {
    const preview = previewRef.current
    const source = getDrawableSource()
    if (!preview) return

    const ctx = preview.getContext('2d')
    if (!ctx) return
    if (!source) {
      preview.width = 128
      preview.height = 128
      ctx.clearRect(0, 0, preview.width, preview.height)
      return
    }

    const sourceWidth = getSourceWidth(source)
    const columns = Math.max(1, Math.floor((sourceWidth - state.ox) / state.fw))
    const col = state.currentFrame % columns
    const row = Math.floor(state.currentFrame / columns)
    preview.width = state.fw
    preview.height = state.fh
    ctx.clearRect(0, 0, preview.width, preview.height)
    ctx.drawImage(source, state.ox + col * state.fw, state.oy + row * state.fh, state.fw, state.fh, 0, 0, state.fw, state.fh)
  }

  const updateGridCanvas = (source = getDrawableSource()) => {
    const grid = gridRef.current
    if (!source || !grid) return

    const ctx = grid.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, grid.width, grid.height)
    if (!state.showGrid) return

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    ctx.strokeStyle = 'rgba(124,106,247,0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    for (let x = state.ox; x <= width; x += state.fw) {
      ctx.beginPath()
      ctx.moveTo(x + 0.5, state.oy)
      ctx.lineTo(x + 0.5, height)
      ctx.stroke()
    }
    for (let y = state.oy; y <= height; y += state.fh) {
      ctx.beginPath()
      ctx.moveTo(state.ox, y + 0.5)
      ctx.lineTo(width, y + 0.5)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(124,106,247,0.7)'
    ctx.font = `${Math.max(8, Math.min(12, state.fw / 6))}px monospace`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const columns = Math.max(1, Math.floor((width - state.ox) / state.fw))
    for (let i = 0; i < state.fcount; i++) {
      const col = i % columns
      const row = Math.floor(i / columns)
      ctx.fillText(String(i), state.ox + col * state.fw + 3, state.oy + row * state.fh + 3)
    }
  }

  const drawSelCanvas = () => {
    const canvas = selRef.current
    const source = getDrawableSource()
    if (!source || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!state.sel) {
      if (state.lassoDrawing && state.lassoPoints.length > 1) {
        ctx.save()
        ctx.strokeStyle = 'rgba(124,106,247,0.9)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        ctx.lineDashOffset = -state.antsOffset
        ctx.beginPath()
        state.lassoPoints.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)))
        ctx.stroke()
        ctx.restore()
      }
      return
    }

    ctx.save()
    ctx.fillStyle = 'rgba(124,106,247,0.10)'
    traceSelectionPath(ctx, state.sel)
    ctx.fill()
    ctx.strokeStyle = '#7c6af7'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.lineDashOffset = -state.antsOffset
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.setLineDash([4, 3])
    ctx.lineDashOffset = -(state.antsOffset + 3.5)
    ctx.stroke()
    ctx.restore()
  }

  return { fitView, setZoomCenter, drawMain, drawPreview, updateGridCanvas, drawSelCanvas }
}
