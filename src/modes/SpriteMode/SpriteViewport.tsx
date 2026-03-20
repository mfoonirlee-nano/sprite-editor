import React from 'react'
import { useSpriteSheet } from './useSpriteSheet'

export default function SpriteViewport() {
  const { s, setS, mainRef, gridRef, selRef, setZoomCenter } = useSpriteSheet()

  const applyTransform = () => {
    const t = `translate(${s.panX}px, ${s.panY}px) scale(${s.zoom})`
    const elMain = mainRef.current!
    const elGrid = gridRef.current!
    const elSel = selRef.current!
    elMain.style.transform = t
    elGrid.style.transform = t
    elSel.style.transform = t
  }

  React.useEffect(() => {
    applyTransform()
  }, [s.panX, s.panY, s.zoom])

  const screenToImage = (sx: number, sy: number) => {
    const rect = (mainRef.current!.parentElement! as HTMLElement).getBoundingClientRect()
    return { x: (sx - rect.left - s.panX) / s.zoom, y: (sy - rect.top - s.panY) / s.zoom }
  }

  return (
    <div
      id="sprite-canvas-wrap"
      className="canvas-wrap-bg flex-1 overflow-hidden relative rounded-lg border border-[#2e2e40] shadow-inner shadow-black/50"
      onWheel={(e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.85 : 1.15
        setZoomCenter(s.zoom * delta, e.clientX, e.clientY)
      }}
      onMouseDown={(e) => {
        if (s.tool === 'pan' || e.button === 1) {
          setS((prev) => ({ ...prev, dragging: true, panStart: { x: e.clientX - prev.panX, y: e.clientY - prev.panY } }))
        } else if (s.tool === 'lasso' && s.img) {
          const pt = screenToImage(e.clientX, e.clientY)
          setS((prev) => ({ ...prev, lassoDrawing: true, lassoPoints: [pt], sel: null }))
        } else if (s.tool === 'select' && s.img) {
          const pt = screenToImage(e.clientX, e.clientY)
          setS((prev) => ({ ...prev, selStart: pt, sel: { x: pt.x, y: pt.y, w: 0, h: 0 } }))
        }
      }}
      onMouseMove={(e) => {
        if (!s.img) return
        if (s.dragging) {
          setS((prev) => ({ ...prev, panX: e.clientX - (prev.panStart?.x ?? 0), panY: e.clientY - (prev.panStart?.y ?? 0) }))
          return
        }
        const pt = screenToImage(e.clientX, e.clientY)
        if (s.lassoDrawing && e.buttons === 1) {
          const last = s.lassoPoints[s.lassoPoints.length - 1]
          const dist = Math.hypot(pt.x - last.x, pt.y - last.y)
          if (dist > 1.5 / s.zoom) {
            setS((prev) => ({ ...prev, lassoPoints: prev.lassoPoints.concat(pt) }))
          }
          return
        }
        if (s.tool === 'select' && s.selStart && e.buttons === 1) {
          const sx = Math.min(s.selStart.x, pt.x)
          const sy = Math.min(s.selStart.y, pt.y)
          const sw = Math.abs(pt.x - s.selStart.x)
          const sh = Math.abs(pt.y - s.selStart.y)
          setS((prev) => ({ ...prev, sel: { x: sx, y: sy, w: sw, h: sh } }))
        }
      }}
      onMouseUp={() => {
        if (s.dragging) {
          setS((prev) => ({ ...prev, dragging: false, panStart: null }))
          return
        }
        if (s.lassoDrawing) {
          const pts = s.lassoPoints
          if (pts.length >= 3) {
            const xs = pts.map((p) => p.x)
            const ys = pts.map((p) => p.y)
            const minX = Math.min(...xs), minY = Math.min(...ys)
            const maxX = Math.max(...xs), maxY = Math.max(...ys)
            setS((prev) => ({ ...prev, sel: { x: minX, y: minY, w: maxX - minX, h: maxY - minY, points: pts }, lassoDrawing: false, lassoPoints: [] }))
          } else {
            setS((prev) => ({ ...prev, lassoDrawing: false, lassoPoints: [] }))
          }
          return
        }
        if (s.tool === 'select' && s.selStart) {
          setS((prev) => ({ ...prev, selStart: null }))
        }
      }}
      style={{ cursor: s.tool === 'pan' ? (s.dragging ? 'grabbing' : 'grab') : s.tool === 'select' || s.tool === 'lasso' ? 'crosshair' : 'default' }}
    >
      <canvas ref={mainRef} className="absolute origin-top-left shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ imageRendering: 'pixelated' }} />
      <canvas ref={gridRef} className="absolute origin-top-left pointer-events-none" style={{ imageRendering: 'pixelated' }} />
      <canvas ref={selRef} className="absolute origin-top-left pointer-events-none" />

      {/* 悬浮视图控件 */}
      <div className="absolute top-4 right-4 bg-[#1a1a22]/80 backdrop-blur border border-[#2e2e40] rounded-lg p-2 flex items-center gap-4 text-xs shadow-lg">
        <div className="text-[#8888a8] font-mono">
          Zoom: {Math.round(s.zoom * 100)}%
        </div>
      </div>
    </div>
  )
}
