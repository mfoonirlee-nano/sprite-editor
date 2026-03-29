import type { MutableRefObject, RefObject } from 'react'
import type { Point } from '../types/selectionTypes'
import type { DrawableSource, RgbColor, SpriteState } from '../types/spriteSheetTypes'
import { createCanvas, getSourceHeight, getSourceWidth, readColorAt } from '../utils/spriteSheetCanvasUtils'

export interface UndoSnapshot {
  img: HTMLImageElement | null
  imgSrc: string
  editCanvas: HTMLCanvasElement | null
  sel: SpriteState['sel']
  selType: SpriteState['selType']
  currentFrame: number
  bgSampleColor: RgbColor | null
}

export interface SpriteCanvasRefs {
  mainRef: RefObject<HTMLCanvasElement | null>
  gridRef: RefObject<HTMLCanvasElement | null>
  selRef: RefObject<HTMLCanvasElement | null>
  previewRef: RefObject<HTMLCanvasElement | null>
}

export function createInitialSpriteState(): SpriteState {
  return {
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
  }
}

export function revokeObjectUrl(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function getDrawableSource(state: SpriteState): DrawableSource | null {
  return state.editCanvas ?? state.img
}

export function cloneDrawableSource(source: DrawableSource) {
  const canvas = createCanvas(getSourceWidth(source), getSourceHeight(source))
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(source, 0, 0)
  }
  return canvas
}

export function syncCanvasSizes(refs: SpriteCanvasRefs, source: DrawableSource | null) {
  const width = source ? getSourceWidth(source) : 0
  const height = source ? getSourceHeight(source) : 0
  ;[refs.mainRef.current, refs.gridRef.current, refs.selRef.current].forEach((canvas) => {
    if (!canvas) return
    canvas.width = width
    canvas.height = height
  })
}

export function getReadableContext(source: DrawableSource, samplerCanvasRef: MutableRefObject<HTMLCanvasElement | null>) {
  if (source instanceof HTMLCanvasElement) {
    return source.getContext('2d')
  }

  const width = getSourceWidth(source)
  const height = getSourceHeight(source)
  const canvas = samplerCanvasRef.current ?? createCanvas(width, height)
  if (!samplerCanvasRef.current) {
    samplerCanvasRef.current = canvas
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)
  return ctx
}

export function sampleColorAt(
  source: DrawableSource,
  point: Point,
  samplerCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
): RgbColor | null {
  const width = getSourceWidth(source)
  const height = getSourceHeight(source)
  const ctx = getReadableContext(source, samplerCanvasRef)
  if (!ctx) return null
  return readColorAt(ctx, width, height, point)
}
