import type { Dispatch, RefObject, SetStateAction } from 'react'
import { FitViewPaddingPx, FrameIndexFontMaxPx, FrameIndexFontMinPx, FrameIndexLabelInsetPx, GridLineDashPattern, MaxZoomScale, MaximumInitialFitZoom, MinZoomScale, PreviewFallbackSizePx, SelectionDashPattern, SelectionSecondaryDashOffset } from '../constants/spriteSheetConstants'
import type { DrawableSource, SpriteState } from '../types/spriteSheetTypes'
import { traceSelectionPath } from '../utils/selectionUtils'
import { getSourceHeight, getSourceWidth } from '../utils/spriteSheetCanvasUtils'

interface SpriteSheetRenderingDeps {
  state: SpriteState
  setState: Dispatch<SetStateAction<SpriteState>>
  mainRef: RefObject<HTMLCanvasElement | null>
  gridRef: RefObject<HTMLCanvasElement | null>
  selRef: RefObject<HTMLCanvasElement | null>
  guidesRef: RefObject<HTMLCanvasElement | null>
  previewRef: RefObject<HTMLCanvasElement | null>
  getDrawableSource: (state?: SpriteState) => DrawableSource | null
}

export function createSpriteSheetRendering({
  state,
  setState,
  mainRef,
  gridRef,
  selRef,
  guidesRef,
  previewRef,
  getDrawableSource,
}: SpriteSheetRenderingDeps) {
  const fitView = (source = getDrawableSource()) => {
    const wrap = mainRef.current?.parentElement
    if (!source || !wrap) return

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const rect = wrap.getBoundingClientRect()
    const scaleX = (rect.width - FitViewPaddingPx) / width
    const scaleY = (rect.height - FitViewPaddingPx) / height
    const zoom = Math.min(scaleX, scaleY, MaximumInitialFitZoom)

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
    const nextZoom = Math.min(Math.max(zoom, MinZoomScale), MaxZoomScale)
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
      preview.width = PreviewFallbackSizePx
      preview.height = PreviewFallbackSizePx
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
    ctx.setLineDash(GridLineDashPattern)
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
    ctx.font = `${Math.max(FrameIndexFontMinPx, Math.min(FrameIndexFontMaxPx, state.fw / 6))}px monospace`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const columns = Math.max(1, Math.floor((width - state.ox) / state.fw))
    for (let i = 0; i < state.fcount; i++) {
      const col = i % columns
      const row = Math.floor(i / columns)
      ctx.fillText(String(i), state.ox + col * state.fw + FrameIndexLabelInsetPx, state.oy + row * state.fh + FrameIndexLabelInsetPx)
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
        ctx.setLineDash(SelectionDashPattern)
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
    ctx.setLineDash(SelectionDashPattern)
    ctx.lineDashOffset = -state.antsOffset
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.setLineDash(SelectionDashPattern)
    ctx.lineDashOffset = -(state.antsOffset + SelectionSecondaryDashOffset)
    ctx.stroke()
    ctx.restore()
  }

  const drawGuides = (draggingGuide?: { axis: 'x' | 'y'; position: number } | null) => {
    const canvas = guidesRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const all = draggingGuide
      ? [...state.guides, draggingGuide]
      : state.guides
    if (all.length === 0) return

    const GUIDE_COLOR = 'rgba(255, 80, 80, 0.9)'
    const RULER_LEFT = 40
    const RULER_BOTTOM = 24

    ctx.save()
    ctx.strokeStyle = GUIDE_COLOR
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    for (const g of all) {
      ctx.beginPath()
      if (g.axis === 'x') {
        const sx = Math.round(state.panX + g.position * state.zoom) + 0.5
        ctx.moveTo(sx, 0)
        ctx.lineTo(sx, canvas.height)
      } else {
        const sy = Math.round(state.panY + g.position * state.zoom) + 0.5
        ctx.moveTo(0, sy)
        ctx.lineTo(canvas.width, sy)
      }
      ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.font = '10px monospace'
    ctx.textBaseline = 'bottom'
    for (const g of all) {
      if (g.axis === 'x' && state.fw > 0) {
        const sx = Math.round(state.panX + g.position * state.zoom) + 0.5
        const rel = ((g.position - state.ox) % state.fw + state.fw) % state.fw
        const dist = Math.round(Math.min(rel, state.fw - rel))
        const label = String(dist)
        const tw = ctx.measureText(label).width
        const lx = sx + 4
        const ly = canvas.height - RULER_BOTTOM - 4
        ctx.fillStyle = 'rgba(20, 20, 30, 0.75)'
        ctx.fillRect(lx - 1, ly - 12, tw + 4, 14)
        ctx.fillStyle = GUIDE_COLOR
        ctx.fillText(label, lx + 1, ly)
      } else if (g.axis === 'y' && state.fh > 0) {
        const sy = Math.round(state.panY + g.position * state.zoom) + 0.5
        const rel = ((g.position - state.oy) % state.fh + state.fh) % state.fh
        const dist = Math.round(Math.min(rel, state.fh - rel))
        const label = String(dist)
        const tw = ctx.measureText(label).width
        const lx = RULER_LEFT + 4
        const ly = sy - 3
        ctx.fillStyle = 'rgba(20, 20, 30, 0.75)'
        ctx.fillRect(lx - 1, ly - 12, tw + 4, 14)
        ctx.fillStyle = GUIDE_COLOR
        ctx.fillText(label, lx + 1, ly)
      }
    }
    ctx.restore()
  }

  return { fitView, setZoomCenter, drawMain, drawPreview, updateGridCanvas, drawSelCanvas, drawGuides }
}
