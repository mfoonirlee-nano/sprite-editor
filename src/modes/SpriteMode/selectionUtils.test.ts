import { describe, expect, it } from 'vitest'
import { clampSelectionToBounds, cloneSelection, isPointInSelection, translateSelection } from '../../utils/selectionUtils'

describe('selectionUtils', () => {
  it('clones nested selection points', () => {
    const original = { x: 1, y: 2, w: 3, h: 4, points: [{ x: 5, y: 6 }] }
    const cloned = cloneSelection(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.points).not.toBe(original.points)
  })

  it('translates bbox and polygon points together', () => {
    const translated = translateSelection(
      { x: 1, y: 2, w: 3, h: 4, points: [{ x: 1, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 6 }] },
      10,
      -2,
    )

    expect(translated).toEqual({
      x: 11,
      y: 0,
      w: 3,
      h: 4,
      points: [{ x: 11, y: 0 }, { x: 14, y: 0 }, { x: 14, y: 4 }],
    })
  })

  it('clamps rectangular selections to canvas bounds', () => {
    expect(clampSelectionToBounds({ x: -2, y: 3, w: 8, h: 6 }, 5, 7)).toEqual({
      x: 0,
      y: 3,
      w: 5,
      h: 4,
    })
  })

  it('drops lasso selections that lose too many points', () => {
    expect(
      clampSelectionToBounds(
        { x: -1, y: -1, w: 4, h: 4, points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: 2, y: 2 }] },
        2,
        2,
      ),
    ).toBeNull()
  })

  it('checks polygon and rectangle hit testing', () => {
    expect(isPointInSelection({ x: 2, y: 2 }, { x: 0, y: 0, w: 4, h: 4 })).toBe(true)
    expect(isPointInSelection({ x: 5, y: 5 }, { x: 0, y: 0, w: 4, h: 4 })).toBe(false)
    expect(
      isPointInSelection(
        { x: 1, y: 1 },
        { x: 0, y: 0, w: 4, h: 4, points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }] },
      ),
    ).toBe(true)
  })
})
