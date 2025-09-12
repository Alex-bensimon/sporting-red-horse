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
  uid?: string
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
  heightCm?: number
  weightKg?: number
  isCaptain?: boolean
}

export type Slot = { key: string; x: number; y: number; position: Player['position'] | 'ANY' }
export type Lineup = Record<string, string | null>

export type SavedLineup = {
  id?: string
  name: string
  formation: string
  lineup: Lineup
  subs?: string[]
  absentPlayers?: string[]
  matchId?: string | null
  createdAt?: any
}

export type MatchSheet = {
  id?: string
  matchId: string
  lineup: SavedLineup
  actualPlayers: string[]
  absentPlayers: string[]
  startersBySlot?: Lineup
  formationAtValidation?: string
  subs?: string[]
  createdAt?: any
  createdBy?: string
  lastModifiedAt?: any
  lastModifiedBy?: string
  ratingsClosed?: boolean
  ratingsClosedAt?: any
  ratingsClosedBy?: string
}

export type PlayerRating = {
  id?: string
  matchId: string
  ratedPlayerId: string
  raterPlayerId: string
  rating: number
  comment?: string
  createdAt?: any
}

export type MatchPlayerStats = {
  id?: string
  matchId: string
  playerId: string
  goals?: number
  assists?: number
  yellowCards?: number
  redCards?: number
  cleanSheet?: boolean
  minutes?: number
  createdAt?: any
  lastModifiedAt?: any
  createdBy?: string
  lastModifiedBy?: string
}

export type AuthenticatedPlayer = {
  id: string
  playerId: string
  isAuthenticated: boolean
  lastLogin?: any
}

export type UserMeta = {
  playerId: string
  name: string
  isFirstConnection: boolean
  uid?: string
  email?: string
  roles?: string[]
}

export type PresetData = {
  starters: string[]
  subs: string[]
  absent: string[]
}

