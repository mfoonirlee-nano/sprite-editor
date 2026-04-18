import { useRef, useState } from 'react'
import { MaxUndoSnapshots } from '../constants/spriteSheetConstants'
import { createInitialSpriteState, getDrawableSource as getSourceFromState, revokeObjectUrl, syncCanvasSizes as syncSizes, type SpriteCanvasRefs, type UndoSnapshot } from './spriteSheetCore'
import { createSpriteSheetEdits } from './spriteSheetEdits'
import { useSpriteSheetEffects } from './spriteSheetEffects'
import { createSpriteSheetRendering } from './spriteSheetRendering'

export function useSpriteSheet() {
  const [canUndo, setCanUndo] = useState(false)
  const [s, setS] = useState(createInitialSpriteState)

  const mainRef = useRef<HTMLCanvasElement | null>(null)
  const gridRef = useRef<HTMLCanvasElement | null>(null)
  const selRef = useRef<HTMLCanvasElement | null>(null)
  const previewRef = useRef<HTMLCanvasElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const undoStackRef = useRef<UndoSnapshot[]>([])
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const refs: SpriteCanvasRefs = { mainRef, gridRef, selRef, previewRef }
  const getDrawableSource = (state = s) => getSourceFromState(state)
  const syncCanvasSizes = (source: ReturnType<typeof getDrawableSource>) => syncSizes(refs, source)

  const rendering = createSpriteSheetRendering({
    state: s,
    setState: setS,
    mainRef,
    gridRef,
    selRef,
    previewRef,
    getDrawableSource,
  })

  const edits = createSpriteSheetEdits({
    state: s,
    setState: setS,
    setCanUndo,
    undoStackRef,
    samplerCanvasRef,
    syncCanvasSizes,
    getDrawableSource,
  })

  useSpriteSheetEffects({
    state: s,
    setState: setS,
    objectUrlRef,
    revokeObjectUrl,
    getDrawableSource: () => getDrawableSource(),
    syncCanvasSizes,
    updateGridCanvas: rendering.updateGridCanvas,
    drawMain: rendering.drawMain,
    drawPreview: rendering.drawPreview,
    drawSelCanvas: rendering.drawSelCanvas,
  })

  const loadImage = (src: string) => {
    if (s.movingSel) return

    const img = new Image()
    const nextObjectUrl = src.startsWith('blob:') ? src : null
    const prevObjectUrl = objectUrlRef.current
    const snapshot = s.img ? edits.createUndoSnapshot(s) : null

    img.onload = () => {
      syncCanvasSizes(img)
      if (snapshot) {
        undoStackRef.current = [...undoStackRef.current, snapshot].slice(-MaxUndoSnapshots)
        setCanUndo(true)
      } else {
        edits.clearUndoStack()
      }

      if (prevObjectUrl && prevObjectUrl !== nextObjectUrl) {
        revokeObjectUrl(prevObjectUrl)
      }
      objectUrlRef.current = nextObjectUrl

      setS((prev) => {
        const imgWidth = img.naturalWidth
        const imgHeight = img.naturalHeight
        const fw = prev.fw
        const fh = imgHeight
        const fcount = Math.max(1, Math.floor(imgWidth / fw))
        return {
          ...prev,
          img,
          imgSrc: src,
          fh,
          fcount,
          currentFrame: 0,
          isPlaying: false,
          timer: 0,
          lastTime: 0,
          selType: 'rect',
          sel: null,
          lassoDrawing: false,
          lassoPoints: [],
          dragging: false,
          panStart: null,
          selStart: null,
          movingSel: false,
          moveSelStart: null,
          editCanvas: null,
          floatingCanvas: null,
          floatOffset: { x: 0, y: 0 },
          bgSampleColor: null,
          bgPickMode: false,
        }
      })

      rendering.fitView(img)
    }

    img.onerror = () => {
      if (nextObjectUrl && nextObjectUrl !== prevObjectUrl) {
        revokeObjectUrl(nextObjectUrl)
      }
    }

    img.src = src
  }

  return {
    s,
    setS,
    canUndo,
    mainRef,
    gridRef,
    selRef,
    previewRef,
    loadImage,
    fitView: rendering.fitView,
    setZoomCenter: rendering.setZoomCenter,
    updateGridCanvas: rendering.updateGridCanvas,
    getDrawableSource,
    setBackgroundSample: edits.setBackgroundSample,
    setBackgroundPickMode: edits.setBackgroundPickMode,
    sampleBackgroundColorAt: edits.sampleBackgroundColorAt,
    autoRemoveBackground: edits.autoRemoveBackground,
    applyBackgroundRemoval: edits.applyBackgroundRemoval,
    undo: edits.undo,
    resetEdits: edits.resetEdits,
    pickConnectedOpaqueRegion: edits.pickConnectedOpaqueRegion,
    pickConnectedColorRegion: edits.pickConnectedColorRegion,
    applySharpening: edits.applySharpening,
    deleteSelection: edits.deleteSelection,
    startMovingSelection: edits.startMovingSelection,
    updateMovingSelection: edits.updateMovingSelection,
    commitMovingSelection: edits.commitMovingSelection,
    resizeCanvas: edits.resizeCanvas,
  }
}

export type SpriteSheetController = ReturnType<typeof useSpriteSheet>
