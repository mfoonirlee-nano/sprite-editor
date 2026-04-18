import type { ResizeAnchor } from '../types/spriteSheetTypes'

export const MinimumPositiveValue = 1
export const MaxColorChannelValue = 255

export const DefaultFrameWidth = 64
export const DefaultFrameHeight = 64
export const DefaultFrameCount = 4
export const DefaultFramesPerSecond = 10
export const DefaultBackgroundRemovalTolerance = 24
export const DefaultColorPickTolerance = 24

export const MaxUndoSnapshots = 20

export const FitViewPaddingPx = 60
export const MaximumInitialFitZoom = 4
export const MinZoomScale = 0.05
export const MaxZoomScale = 16
export const PreviewFallbackSizePx = 128
export const GridLineDashPattern = [3, 3]
export const SelectionDashPattern = [4, 3]
export const SelectionSecondaryDashOffset = 3.5
export const FrameIndexFontMinPx = 8
export const FrameIndexFontMaxPx = 12
export const FrameIndexLabelInsetPx = 3

export const MillisecondsPerSecond = 1000
export const AnimationCatchUpFrameLimit = 5
export const SelectionAntsStep = 0.4
export const SelectionAntsCycleLength = 7
export const SelectionAntsIntervalMs = 30

export const DefaultResizeAnchor: ResizeAnchor = { x: 'center', y: 'middle' }
export const ResizeAnchorRows: ResizeAnchor['y'][] = ['top', 'middle', 'bottom']
export const ResizeAnchorColumns: ResizeAnchor['x'][] = ['left', 'center', 'right']
