import type { Point, Selection } from '../types/selectionTypes'

export type { Point, Selection } from '../types/selectionTypes'

export const cloneSelection = (sel: Selection): Selection => ({
  ...sel,
  points: sel.points ? sel.points.map((point) => ({ ...point })) : undefined,
})

export const translateSelection = (sel: Selection, dx: number, dy: number): Selection => ({
  ...sel,
  x: sel.x + dx,
  y: sel.y + dy,
  points: sel.points ? sel.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) : undefined,
})

export const traceSelectionPath = (ctx: CanvasRenderingContext2D, sel: Selection, offsetX = 0, offsetY = 0) => {
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

export const clampSelectionToBounds = (sel: Selection, width: number, height: number) => {
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

export const isPointInPolygon = (point: Point, polygon: Point[]) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export const isPointInSelection = (point: Point, sel: Selection) => {
  if (sel.points?.length) {
    return isPointInPolygon(point, sel.points)
  }
  return point.x >= sel.x && point.x <= sel.x + sel.w && point.y >= sel.y && point.y <= sel.y + sel.h
}
