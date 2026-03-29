import { useEffect } from 'react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { AnimationCatchUpFrameLimit, MillisecondsPerSecond, SelectionAntsCycleLength, SelectionAntsIntervalMs, SelectionAntsStep } from '../constants/spriteSheetConstants'
import type { DrawableSource, SpriteState } from '../types/spriteSheetTypes'

interface SpriteSheetEffectsDeps {
  state: SpriteState
  setState: Dispatch<SetStateAction<SpriteState>>
  objectUrlRef: RefObject<string | null>
  revokeObjectUrl: (url: string | null) => void
  getDrawableSource: () => DrawableSource | null
  syncCanvasSizes: (source: DrawableSource | null) => void
  updateGridCanvas: (source?: DrawableSource | null) => void
  drawMain: () => void
  drawPreview: () => void
  drawSelCanvas: () => void
}

export function useSpriteSheetEffects({
  state,
  setState,
  objectUrlRef,
  revokeObjectUrl,
  getDrawableSource,
  syncCanvasSizes,
  updateGridCanvas,
  drawMain,
  drawPreview,
  drawSelCanvas,
}: SpriteSheetEffectsDeps) {
  useEffect(() => {
    let id = 0
    const loop = (ts: number) => {
      id = requestAnimationFrame(loop)
      if (!state.img) return
      drawMain()
      if (state.isPlaying) {
        const dt = ts - (state.lastTime || ts)
        setState((prev) => ({ ...prev, lastTime: ts, timer: prev.timer + dt }))
        const interval = MillisecondsPerSecond / state.fps
        if (state.timer >= interval) {
          let timer = state.timer
          if (timer > interval * AnimationCatchUpFrameLimit) timer %= interval
          let currentFrame = state.currentFrame
          while (timer >= interval) {
            currentFrame = (currentFrame + 1) % state.fcount
            timer -= interval
          }
          setState((prev) => ({ ...prev, currentFrame, timer }))
        }
      } else {
        setState((prev) => ({ ...prev, lastTime: ts }))
      }
      drawPreview()
      drawSelCanvas()
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [state.img, state.isPlaying, state.fps, state.currentFrame, state.timer, state.lastTime, state.sel, state.lassoDrawing, state.lassoPoints, state.antsOffset, state.fw, state.fh, state.fcount, state.ox, state.oy, state.editCanvas, state.floatingCanvas, state.floatOffset.x, state.floatOffset.y, state.movingSel, drawMain, drawPreview, drawSelCanvas, setState])

  useEffect(() => {
    const timer = setInterval(
      () => setState((prev) => ({ ...prev, antsOffset: (prev.antsOffset + SelectionAntsStep) % SelectionAntsCycleLength })),
      SelectionAntsIntervalMs,
    )
    return () => clearInterval(timer)
  }, [setState])

  useEffect(() => {
    const source = getDrawableSource()
    syncCanvasSizes(source)
    if (!source) return
    updateGridCanvas(source)
  }, [state.img, state.editCanvas, state.showGrid, state.fw, state.fh, state.fcount, state.ox, state.oy, getDrawableSource, syncCanvasSizes, updateGridCanvas])

  useEffect(() => {
    const currentObjectUrl = objectUrlRef.current
    return () => revokeObjectUrl(currentObjectUrl)
  }, [objectUrlRef, revokeObjectUrl])
}
