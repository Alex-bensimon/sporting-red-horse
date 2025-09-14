import type { Match, Player, MatchPlayerStats, PlayerRating } from '@/lib/types'

// Cache simple en mémoire avec TTL
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set<T>(key: string, data: T, ttlMinutes: number = 10): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  invalidate(keyPattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new CacheManager()

// Clés de cache standardisées
export const CACHE_KEYS = {
  PLAYERS: 'players',
  MATCHES: 'matches',
  MATCH: (id: string) => `match_${id}`,
  MATCH_SHEET: (id: string) => `match_sheet_${id}`,
  MATCH_STATS: (id: string) => `match_stats_${id}`,
  MATCH_RATINGS: (id: string) => `match_ratings_${id}`,
  PLAYER_STATS: (id: string) => `player_stats_${id}`,
  PLAYER_RATINGS: (id: string) => `player_ratings_${id}`,
  ALL_STATS: 'all_match_stats',
  ALL_RATINGS: 'all_player_ratings'
} as const

// Types pour les fonctions de cache
export type CacheKey = string
export type CacheTTL = number // en minutes