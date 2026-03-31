export type RefStation = {
  name: string
  url: string
  country: string
  bitrate: string
}

export type RefNode = {
  id: string
  name: string
  level: 1 | 2 | 3 | 4
  parent: string | null
  color: string
  stations: RefStation[]
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  index?: number
  vx?: number
  vy?: number
}

export type RefLink = {
  source: string | RefNode
  target: string | RefNode
}

export type HoveredNode = {
  name: string
  level: string
  stationCount: number
  hint: string
  x: number
  y: number
}

export type AudioLevels = {
  bass: number
  energy: number
}

export type ViewportState = {
  x: number
  y: number
  k: number
  focusX: number
  focusY: number
  activeRootId: string | null
  activeRootColor: string | null
  activeRootX: number
  activeRootY: number
  activeRootGlow: number
}
