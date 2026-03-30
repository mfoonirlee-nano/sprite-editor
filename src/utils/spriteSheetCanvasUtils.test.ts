import { describe, expect, it } from 'vitest'
import { findConnectedOpaqueBoundsInImageData } from './spriteSheetCanvasUtils'

const createImageData = (width: number, height: number, opaquePoints: Array<[number, number]>) => {
  const data = new Uint8ClampedArray(width * height * 4)
  opaquePoints.forEach(([x, y]) => {
    const offset = (y * width + x) * 4
    data[offset + 3] = 255
  })
  return { width, height, data } as ImageData
}

describe('spriteSheetCanvasUtils', () => {
  it('returns null when the clicked pixel is transparent', () => {
    const imageData = createImageData(4, 4, [[1, 1]])

    expect(findConnectedOpaqueBoundsInImageData(imageData, { x: 0, y: 0 })).toBeNull()
  })

  it('returns tight bounds for the connected opaque region containing the clicked pixel', () => {
    const imageData = createImageData(6, 5, [
      [1, 1],
      [2, 1],
      [1, 2],
      [4, 3],
    ])

    expect(findConnectedOpaqueBoundsInImageData(imageData, { x: 1, y: 1 })).toEqual({
      x: 1,
      y: 1,
      w: 2,
      h: 2,
    })
  })

  it('treats diagonal pixels as separate regions', () => {
    const imageData = createImageData(4, 4, [
      [1, 1],
      [2, 2],
    ])

    expect(findConnectedOpaqueBoundsInImageData(imageData, { x: 1, y: 1 })).toEqual({
      x: 1,
      y: 1,
      w: 1,
      h: 1,
    })
  })
})
