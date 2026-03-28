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
