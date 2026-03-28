export interface Point {
  x: number
  y: number
}

export interface Selection {
  x: number
  y: number
  w: number
  h: number
  points?: Point[]
}
