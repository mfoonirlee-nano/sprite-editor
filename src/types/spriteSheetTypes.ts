import type { Point, Selection } from './selectionTypes'

export type Tool = 'pan' | 'select' | 'lasso' | 'framePick' | 'colorPick'

export type DrawableSource = HTMLImageElement | HTMLCanvasElement
export type RgbColor = { r: number; g: number; b: number }
export type ResizeAnchorX = 'left' | 'center' | 'right'
export type ResizeAnchorY = 'top' | 'middle' | 'bottom'

export interface ResizeAnchor {
  x: ResizeAnchorX
  y: ResizeAnchorY
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
  bgSampleColor: RgbColor | null
  bgPickMode: boolean
  colorPickTolerance: number
}
