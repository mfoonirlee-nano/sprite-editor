export const isImageFile = (file: File | null | undefined): file is File => !!file && file.type.startsWith('image/')

export const loadImageFile = (file: File | null | undefined, loadImage: (src: string) => void) => {
  if (!isImageFile(file)) return false
  loadImage(URL.createObjectURL(file))
  return true
}
