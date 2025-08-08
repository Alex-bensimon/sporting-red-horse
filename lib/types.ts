export type Match = {
  id: string
  date: string
  time?: string
  opponent: string
  home: boolean
  location: string
  competition?: string
}

export type Player = {
  id: string
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  rating: number
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defense: number
  physical: number
  side?: 'L' | 'R' | 'C'
  photo?: string
  jersey?: number
}

export type Slot = { key: string; x: number; y: number; position: Player['position'] | 'ANY' }
export type Lineup = Record<string, string | null>

export type SavedLineup = {
  id?: string
  name: string
  formation: string
  lineup: Lineup
  subs?: string[]
  matchId?: string | null
  createdAt?: any
}

