import type { Dispatch, RefObject, SetStateAction } from 'react'
import { clampSelectionToBounds, cloneSelection, traceSelectionPath, translateSelection } from '../utils/selectionUtils'
import type { Point } from '../types/selectionTypes'
import type { DrawableSource, ResizeAnchor, RgbColor, SpriteState } from '../types/spriteSheetTypes'
import { cloneColor, colorsAreSimilar, computeResizeOffset, createCanvas, findConnectedColorPixelsInImageData, findConnectedOpaqueBoundsInImageData, getSourceHeight, getSourceWidth, readColorAt } from '../utils/spriteSheetCanvasUtils'
import { cloneDrawableSource, getReadableContext, type UndoSnapshot } from './spriteSheetCore'
import { createSpriteSheetHistory } from './spriteSheetHistory'

interface SpriteSheetEditsDeps {
  state: SpriteState
  setState: Dispatch<SetStateAction<SpriteState>>
  setCanUndo: Dispatch<SetStateAction<boolean>>
  undoStackRef: RefObject<UndoSnapshot[]>
  samplerCanvasRef: RefObject<HTMLCanvasElement | null>
  syncCanvasSizes: (source: DrawableSource | null) => void
  getDrawableSource: (state?: SpriteState) => DrawableSource | null
}

export function createSpriteSheetEdits({
  state,
  setState,
  setCanUndo,
  undoStackRef,
  samplerCanvasRef,
  syncCanvasSizes,
  getDrawableSource,
}: SpriteSheetEditsDeps) {
  const { createUndoSnapshot, pushUndoSnapshot, clearUndoStack, undo: undoHistory } = createSpriteSheetHistory({
    setState,
    setCanUndo,
    undoStackRef,
  })

  const autoSampleBackgroundColor = (source = getDrawableSource()): RgbColor | null => {
    if (!source) return null

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const ctx = getReadableContext(source, samplerCanvasRef)
    if (!ctx) return null
    const colors = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 },
    ]
      .map((point) => readColorAt(ctx, width, height, point))
      .filter((color): color is RgbColor => color !== null)

    if (!colors.length) return null
    let bestCluster: RgbColor[] = [colors[0]]
    colors.forEach((base) => {
      const cluster = colors.filter((candidate) => colorsAreSimilar(base, candidate, 24))
      if (cluster.length > bestCluster.length) {
        bestCluster = cluster
      }
    })

    const sourceColors = bestCluster.length > 1 ? bestCluster : colors
    const total = sourceColors.reduce(
      (acc, color) => ({ r: acc.r + color.r, g: acc.g + color.g, b: acc.b + color.b }),
      { r: 0, g: 0, b: 0 },
    )

    return {
      r: Math.round(total.r / sourceColors.length),
      g: Math.round(total.g / sourceColors.length),
      b: Math.round(total.b / sourceColors.length),
    }
  }

  const setBackgroundSample = (color: RgbColor | null) => {
    setState((prev) => ({ ...prev, bgSampleColor: color ? cloneColor(color) : null, bgPickMode: false }))
  }

  const setBackgroundPickMode = (active: boolean) => {
    setState((prev) => ({ ...prev, bgPickMode: active }))
  }

  const sampleBackgroundColorAt = (imgPt: Point) => {
    const source = getDrawableSource()
    if (!source) return
    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const ctx = getReadableContext(source, samplerCanvasRef)
    const color = ctx ? readColorAt(ctx, width, height, imgPt) : null
    if (!color) return
    setBackgroundSample(color)
  }

  const applyBackgroundRemoval = (targetColor = state.bgSampleColor) => {
    const source = getDrawableSource()
    if (!source || !targetColor || state.movingSel) return

    pushUndoSnapshot(state)
    const canvas = cloneDrawableSource(source)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const tolerance = Math.max(0, state.bgRemovalTolerance)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue
      if (
        Math.abs(data[i] - targetColor.r) <= tolerance &&
        Math.abs(data[i + 1] - targetColor.g) <= tolerance &&
        Math.abs(data[i + 2] - targetColor.b) <= tolerance
      ) {
        data[i + 3] = 0
      }
    }
    ctx.putImageData(imageData, 0, 0)

    setState((prev) => ({
      ...prev,
      editCanvas: canvas,
      floatingCanvas: null,
      movingSel: false,
      moveSelStart: null,
      floatOffset: { x: 0, y: 0 },
      bgSampleColor: cloneColor(targetColor),
      bgPickMode: false,
    }))
  }

  const autoRemoveBackground = () => {
    const sampled = autoSampleBackgroundColor()
    if (!sampled) return
    setState((prev) => ({ ...prev, bgSampleColor: sampled, bgPickMode: false }))
    applyBackgroundRemoval(sampled)
  }

  const undo = () => {
    undoHistory(state)
  }

  const resetEdits = () => {
    if (!state.editCanvas || state.movingSel) return
    pushUndoSnapshot(state)
    setState((prev) => ({
      ...prev,
      editCanvas: null,
      floatingCanvas: null,
      movingSel: false,
      moveSelStart: null,
      floatOffset: { x: 0, y: 0 },
      bgPickMode: false,
      bgSampleColor: null,
    }))
  }

  const pickConnectedOpaqueRegion = (imgPt: Point) => {
    const source = getDrawableSource()
    if (!source || state.movingSel) return

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const x = Math.min(width - 1, Math.max(0, Math.floor(imgPt.x)))
    const y = Math.min(height - 1, Math.max(0, Math.floor(imgPt.y)))
    const ctx = getReadableContext(source, samplerCanvasRef)
    if (!ctx) return

    const opaqueBounds = findConnectedOpaqueBoundsInImageData(ctx.getImageData(0, 0, width, height), { x, y })
    if (!opaqueBounds) return

    setState((prev) => ({
      ...prev,
      sel: { x: opaqueBounds.x, y: opaqueBounds.y, w: opaqueBounds.w, h: opaqueBounds.h },
      selStart: null,
      selType: 'rect',
      lassoDrawing: false,
      lassoPoints: [],
    }))
  }

  const pickConnectedColorRegion = (imgPt: Point) => {
    const source = getDrawableSource()
    if (!source || state.movingSel) return

    const width = getSourceWidth(source)
    const height = getSourceHeight(source)
    const ctx = getReadableContext(source, samplerCanvasRef)
    if (!ctx) return

    const pixels = findConnectedColorPixelsInImageData(ctx.getImageData(0, 0, width, height), imgPt, state.bgRemovalTolerance)
    if (!pixels || pixels.length === 0) return

    const xs = pixels.map((p) => p.x)
    const ys = pixels.map((p) => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    setState((prev) => ({
      ...prev,
      sel: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, points: pixels },
      selStart: null,
      selType: 'lasso',
      lassoDrawing: false,
      lassoPoints: [],
    }))
  }

  const deleteSelection = () => {
    const sel = state.sel
    const source = getDrawableSource()
    if (!sel || !source || state.movingSel) return

    pushUndoSnapshot(state)
    const canvas = cloneDrawableSource(source)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (sel.points?.length) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      sel.points.forEach(({ x, y }) => {
        const idx = (Math.round(y) * canvas.width + Math.round(x)) * 4
        imageData.data[idx + 3] = 0
      })
      ctx.putImageData(imageData, 0, 0)
    } else {
      ctx.clearRect(sel.x, sel.y, sel.w, sel.h)
    }

    setState((prev) => ({
      ...prev,
      editCanvas: canvas,
      sel: null,
      selStart: null,
      lassoDrawing: false,
      lassoPoints: [],
      floatingCanvas: null,
      movingSel: false,
      moveSelStart: null,
      floatOffset: { x: 0, y: 0 },
    }))
  }

  const resizeCanvas = (targetWidth: number, targetHeight: number, anchor: ResizeAnchor) => {
    const source = getDrawableSource()
    if (!source || state.movingSel) return

    pushUndoSnapshot(state)
    const nextWidth = Math.max(1, Math.round(targetWidth))
    const nextHeight = Math.max(1, Math.round(targetHeight))
    const dx = computeResizeOffset(nextWidth, getSourceWidth(source), anchor.x)
    const dy = computeResizeOffset(nextHeight, getSourceHeight(source), anchor.y)
    const resizedCanvas = createCanvas(nextWidth, nextHeight)
    const ctx = resizedCanvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, nextWidth, nextHeight)
    ctx.drawImage(source, dx, dy)
    syncCanvasSizes(resizedCanvas)
    setState((prev) => ({
      ...prev,
      editCanvas: resizedCanvas,
      sel: prev.sel ? clampSelectionToBounds(translateSelection(prev.sel, dx, dy), nextWidth, nextHeight) : null,
      lassoDrawing: false,
      lassoPoints: [],
      dragging: false,
      panStart: null,
      selStart: null,
      movingSel: false,
      moveSelStart: null,
      floatingCanvas: null,
      floatOffset: { x: 0, y: 0 },
      bgPickMode: false,
    }))
  }

  const startMovingSelection = (imgPt: Point) => {
    const sel = state.sel
    const source = getDrawableSource()
    if (!sel || !source) return

    const baseCanvas = cloneDrawableSource(source)
    const floatingCanvas = createCanvas(sel.w, sel.h)
    const floatingCtx = floatingCanvas.getContext('2d')
    const baseCtx = baseCanvas.getContext('2d')
    if (!floatingCtx || !baseCtx) return

    floatingCtx.save()
    traceSelectionPath(floatingCtx, sel, -sel.x, -sel.y)
    floatingCtx.clip()
    floatingCtx.drawImage(source, -sel.x, -sel.y)
    floatingCtx.restore()

    if (sel.points?.length) {
      baseCtx.save()
      traceSelectionPath(baseCtx, sel)
      baseCtx.clip()
      baseCtx.clearRect(sel.x, sel.y, sel.w, sel.h)
      baseCtx.restore()
    } else {
      baseCtx.clearRect(sel.x, sel.y, sel.w, sel.h)
    }

    setState((prev) => ({
      ...prev,
      movingSel: true,
      moveSelStart: { imgPt, selSnap: cloneSelection(sel) },
      editCanvas: baseCanvas,
      floatingCanvas,
      floatOffset: { x: sel.x, y: sel.y },
      bgPickMode: false,
    }))
  }

  const updateMovingSelection = (imgPt: Point) => {
    setState((prev) => {
      if (!prev.movingSel || !prev.moveSelStart) return prev
      const dx = Math.round(imgPt.x - prev.moveSelStart.imgPt.x)
      const dy = Math.round(imgPt.y - prev.moveSelStart.imgPt.y)
      const nextSel = translateSelection(prev.moveSelStart.selSnap, dx, dy)
      return { ...prev, sel: nextSel, floatOffset: { x: nextSel.x, y: nextSel.y } }
    })
  }

  const commitMovingSelection = () => {
    setState((prev) => {
      if (!prev.movingSel || !prev.editCanvas || !prev.floatingCanvas || !prev.moveSelStart) return prev

      const snapshotCanvas = createCanvas(prev.editCanvas.width, prev.editCanvas.height)
      const snapshotCtx = snapshotCanvas.getContext('2d')
      if (snapshotCtx) {
        snapshotCtx.drawImage(prev.editCanvas, 0, 0)
        snapshotCtx.drawImage(prev.floatingCanvas, Math.round(prev.moveSelStart.selSnap.x), Math.round(prev.moveSelStart.selSnap.y))
      }
      pushUndoSnapshot({ ...prev, editCanvas: snapshotCanvas, sel: cloneSelection(prev.moveSelStart.selSnap) })

      const committedCanvas = createCanvas(prev.editCanvas.width, prev.editCanvas.height)
      const committedCtx = committedCanvas.getContext('2d')
      if (!committedCtx) {
        return { ...prev, movingSel: false, moveSelStart: null, floatingCanvas: null }
      }

      committedCtx.drawImage(prev.editCanvas, 0, 0)
      committedCtx.drawImage(prev.floatingCanvas, Math.round(prev.floatOffset.x), Math.round(prev.floatOffset.y))
      return { ...prev, movingSel: false, moveSelStart: null, editCanvas: committedCanvas, floatingCanvas: null }
    })
  }

  return {
    createUndoSnapshot,
    pushUndoSnapshot,
    clearUndoStack,
    undo,
    resetEdits,
    pickConnectedOpaqueRegion,
    pickConnectedColorRegion,
    deleteSelection,
    resizeCanvas,
    setBackgroundSample,
    setBackgroundPickMode,
    sampleBackgroundColorAt,
    autoRemoveBackground,
    applyBackgroundRemoval,
    startMovingSelection,
    updateMovingSelection,
    commitMovingSelection,
  }
}
