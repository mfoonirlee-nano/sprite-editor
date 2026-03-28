import React from 'react'
import type { SpriteSheetController } from '../../hooks/useSpriteSheet'
import { isPointInSelection } from '../../utils/selectionUtils'

interface SpriteViewportProps {
  spriteSheet: SpriteSheetController
}

export default function SpriteViewport({ spriteSheet }: SpriteViewportProps) {
  const {
    s,
    setS,
    mainRef,
    gridRef,
    selRef,
    setZoomCenter,
    startMovingSelection,
    updateMovingSelection,
    commitMovingSelection,
    sampleBackgroundColorAt,
    setBackgroundPickMode,
  } = spriteSheet
  const [hoveringSelection, setHoveringSelection] = React.useState(false)

  React.useEffect(() => {
    const t = `translate(${s.panX}px, ${s.panY}px) scale(${s.zoom})`
    const elMain = mainRef.current
    const elGrid = gridRef.current
    const elSel = selRef.current
    if (!elMain || !elGrid || !elSel) return
    elMain.style.transform = t
    elGrid.style.transform = t
    elSel.style.transform = t
  }, [gridRef, mainRef, selRef, s.panX, s.panY, s.zoom])

  const screenToImage = (sx: number, sy: number) => {
    const wrap = mainRef.current?.parentElement as HTMLElement | null
    if (!wrap) return { x: 0, y: 0 }
    const rect = wrap.getBoundingClientRect()
    return { x: (sx - rect.left - s.panX) / s.zoom, y: (sy - rect.top - s.panY) / s.zoom }
  }

  const finishInteraction = () => {
    setS((prev) => {
      if (prev.dragging) {
        return { ...prev, dragging: false, panStart: null }
      }

      if (prev.lassoDrawing) {
        const pts = prev.lassoPoints
        if (pts.length >= 3) {
          const xs = pts.map((p) => p.x)
          const ys = pts.map((p) => p.y)
          const minX = Math.min(...xs)
          const minY = Math.min(...ys)
          const maxX = Math.max(...xs)
          const maxY = Math.max(...ys)
          return {
            ...prev,
            sel: { x: minX, y: minY, w: maxX - minX, h: maxY - minY, points: pts },
            lassoDrawing: false,
            lassoPoints: [],
          }
        }
        return { ...prev, lassoDrawing: false, lassoPoints: [] }
      }

      if (prev.movingSel) {
        return prev
      }

      if (prev.tool === 'select' && prev.selStart) {
        return { ...prev, selStart: null }
      }

      return prev
    })

    if (s.movingSel) {
      commitMovingSelection()
      return
    }

    if (s.tool === 'select' && s.selStart) {
      setS((prev) => ({ ...prev, selStart: null }))
    }
  }

  return (
    <div
      id="sprite-canvas-wrap"
      className="canvas-wrap-bg flex-1 overflow-hidden relative rounded-lg border border-[#2e2e40] shadow-inner shadow-black/50"
      onWheel={(e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.93 : 1.07
        setZoomCenter(s.zoom * delta, e.clientX, e.clientY)
      }}
      onPointerDown={(e) => {
        const currentTarget = e.currentTarget
        currentTarget.setPointerCapture(e.pointerId)

        const pt = screenToImage(e.clientX, e.clientY)

        if (s.bgPickMode && e.button === 0) {
          sampleBackgroundColorAt(pt)
          setBackgroundPickMode(false)
          return
        }

        if (e.button === 0 && s.sel && isPointInSelection(pt, s.sel)) {
          startMovingSelection(pt)
          return
        }

        if (s.tool === 'pan' || e.button === 1) {
          setS((prev) => ({ ...prev, dragging: true, panStart: { x: e.clientX - prev.panX, y: e.clientY - prev.panY } }))
        } else if (s.tool === 'lasso' && s.img) {
          setS((prev) => ({ ...prev, lassoDrawing: true, lassoPoints: [pt], sel: null, selType: 'lasso' }))
        } else if (s.tool === 'select' && s.img) {
          setS((prev) => ({ ...prev, selStart: pt, sel: { x: pt.x, y: pt.y, w: 0, h: 0 }, selType: 'rect' }))
        }
      }}
      onPointerMove={(e) => {
        if (!s.img) return
        const pt = screenToImage(e.clientX, e.clientY)
        const isOverSelection = !!s.sel && isPointInSelection(pt, s.sel)
        setHoveringSelection(isOverSelection)
        if (s.movingSel) {
          updateMovingSelection(pt)
          return
        }
        if (s.dragging) {
          setS((prev) => ({ ...prev, panX: e.clientX - (prev.panStart?.x ?? 0), panY: e.clientY - (prev.panStart?.y ?? 0) }))
          return
        }
        if (s.lassoDrawing && (e.buttons & 1) === 1) {
          const last = s.lassoPoints[s.lassoPoints.length - 1]
          if (!last) return
          const dist = Math.hypot(pt.x - last.x, pt.y - last.y)
          if (dist > 1.5 / s.zoom) {
            setS((prev) => ({ ...prev, lassoPoints: prev.lassoPoints.concat(pt) }))
          }
          return
        }
        if (s.tool === 'select' && s.selStart && (e.buttons & 1) === 1) {
          const sx = Math.min(s.selStart.x, pt.x)
          const sy = Math.min(s.selStart.y, pt.y)
          const sw = Math.abs(pt.x - s.selStart.x)
          const sh = Math.abs(pt.y - s.selStart.y)
          setS((prev) => ({ ...prev, sel: { x: sx, y: sy, w: sw, h: sh } }))
        }
      }}
      onPointerLeave={() => setHoveringSelection(false)}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
        finishInteraction()
      }}
      onPointerCancel={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
        finishInteraction()
      }}
      style={{ cursor: s.bgPickMode ? 'copy' : s.movingSel ? 'grabbing' : hoveringSelection ? 'grab' : s.tool === 'pan' ? (s.dragging ? 'grabbing' : 'grab') : s.tool === 'select' || s.tool === 'lasso' ? 'crosshair' : 'default' }}
    >
      <canvas ref={mainRef} className="absolute origin-top-left shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ imageRendering: 'pixelated' }} />
      <canvas ref={gridRef} className="absolute origin-top-left pointer-events-none" style={{ imageRendering: 'pixelated' }} />
      <canvas ref={selRef} className="absolute origin-top-left pointer-events-none" />

      <div className="absolute top-4 right-4 bg-[#1a1a22]/80 backdrop-blur border border-[#2e2e40] rounded-lg p-2 flex items-center gap-4 text-xs shadow-lg">
        <div className="text-[#8888a8] font-mono">
          Zoom: {Math.round(s.zoom * 100)}%
        </div>
      </div>
    </div>
  )
}
