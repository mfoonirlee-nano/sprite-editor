import { describe, expect, it, vi } from 'vitest'
import { isImageFile, loadImageFile } from './importUtils'

describe('importUtils', () => {
  it('accepts only image files', () => {
    expect(isImageFile(new File(['x'], 'sprite.png', { type: 'image/png' }))).toBe(true)
    expect(isImageFile(new File(['x'], 'notes.txt', { type: 'text/plain' }))).toBe(false)
    expect(isImageFile(null)).toBe(false)
  })

  it('loads image file URLs once', () => {
    const loadImage = vi.fn()
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')

    expect(loadImageFile(new File(['x'], 'sprite.png', { type: 'image/png' }), loadImage)).toBe(true)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(loadImage).toHaveBeenCalledWith('blob:test')

    createObjectURL.mockRestore()
  })

  it('ignores non-image files', () => {
    const loadImage = vi.fn()

    expect(loadImageFile(new File(['x'], 'notes.txt', { type: 'text/plain' }), loadImage)).toBe(false)
    expect(loadImage).not.toHaveBeenCalled()
  })
})
