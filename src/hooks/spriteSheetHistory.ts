import type { Dispatch, RefObject, SetStateAction } from 'react'
import { MaxUndoSnapshots } from '../constants/spriteSheetConstants'
import type { SpriteState } from '../types/spriteSheetTypes'
import { cloneSelection } from '../utils/selectionUtils'
import { cloneColor } from '../utils/spriteSheetCanvasUtils'
import { cloneDrawableSource, type UndoSnapshot } from './spriteSheetCore'

interface SpriteSheetHistoryDeps {
  setState: Dispatch<SetStateAction<SpriteState>>
  setCanUndo: Dispatch<SetStateAction<boolean>>
  undoStackRef: RefObject<UndoSnapshot[]>
}

export function createSpriteSheetHistory({ setState, setCanUndo, undoStackRef }: SpriteSheetHistoryDeps) {
  const createUndoSnapshot = (snapshotState: SpriteState): UndoSnapshot => ({
    img: snapshotState.img,
    imgSrc: snapshotState.imgSrc,
    editCanvas: snapshotState.editCanvas ? cloneDrawableSource(snapshotState.editCanvas) : null,
    sel: snapshotState.sel ? cloneSelection(snapshotState.sel) : null,
    selType: snapshotState.selType,
    currentFrame: snapshotState.currentFrame,
    bgSampleColor: snapshotState.bgSampleColor ? cloneColor(snapshotState.bgSampleColor) : null,
  })

  const pushUndoSnapshot = (snapshotState: SpriteState) => {
    if (!snapshotState.img) return
    undoStackRef.current = [...undoStackRef.current, createUndoSnapshot(snapshotState)].slice(-MaxUndoSnapshots)
    setCanUndo(undoStackRef.current.length > 0)
  }

  const clearUndoStack = () => {
    if (!undoStackRef.current.length) return
    undoStackRef.current = []
    setCanUndo(false)
  }

  const undo = (state: SpriteState) => {
    if (state.movingSel || !undoStackRef.current.length) return
    const snapshot = undoStackRef.current[undoStackRef.current.length - 1]
    undoStackRef.current = undoStackRef.current.slice(0, -1)
    setCanUndo(undoStackRef.current.length > 0)
    setState((prev) => ({
      ...prev,
      img: snapshot.img,
      imgSrc: snapshot.imgSrc,
      editCanvas: snapshot.editCanvas ? cloneDrawableSource(snapshot.editCanvas) : null,
      sel: snapshot.sel ? cloneSelection(snapshot.sel) : null,
      selType: snapshot.selType,
      currentFrame: snapshot.currentFrame,
      bgSampleColor: snapshot.bgSampleColor ? cloneColor(snapshot.bgSampleColor) : null,
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

  return { createUndoSnapshot, pushUndoSnapshot, clearUndoStack, undo }
}
