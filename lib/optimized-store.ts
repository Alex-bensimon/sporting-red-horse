import { cache, CACHE_KEYS } from './cache'
import * as originalStore from './store'
import type { Match, Player, MatchPlayerStats, PlayerRating, MatchSheet } from './types'

// Fonctions optimisées avec cache

export async function getPlayers(): Promise<Player[]> {
  const cached = cache.get<Player[]>(CACHE_KEYS.PLAYERS)
  if (cached) return cached
  
  const players = await originalStore.getPlayers()
  cache.set(CACHE_KEYS.PLAYERS, players, 30) // Cache 30 minutes
  return players
}

export async function getMatches(): Promise<Match[]> {
  const cached = cache.get<Match[]>(CACHE_KEYS.MATCHES)
  if (cached) return cached
  
  const matches = await originalStore.getMatches()
  cache.set(CACHE_KEYS.MATCHES, matches, 15) // Cache 15 minutes
  return matches
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const cacheKey = CACHE_KEYS.MATCH(matchId)
  const cached = cache.get<Match>(cacheKey)
  if (cached) return cached
  
  const match = await originalStore.getMatchById(matchId)
  if (match) {
    cache.set(cacheKey, match, 15)
  }
  return match
}

export async function getMatchSheet(matchId: string): Promise<MatchSheet | null> {
  const cacheKey = CACHE_KEYS.MATCH_SHEET(matchId)
  const cached = cache.get<MatchSheet>(cacheKey)
  if (cached) return cached
  
  const sheet = await originalStore.getMatchSheet(matchId)
  if (sheet) {
    cache.set(cacheKey, sheet, 10) // Plus court car peut changer souvent
  }
  return sheet
}

// Optimisation cruciale : éviter getAllMatchPlayerStats sauf si vraiment nécessaire
export async function getStatsForPages(): Promise<{
  byPlayer: Record<string, MatchPlayerStats[]>
  byMatch: Record<string, MatchPlayerStats[]>
  all: MatchPlayerStats[]
}> {
  const cacheKey = 'processed_stats'
  const cached = cache.get<{
    byPlayer: Record<string, MatchPlayerStats[]>
    byMatch: Record<string, MatchPlayerStats[]>  
    all: MatchPlayerStats[]
  }>(cacheKey)
  if (cached) return cached
  
  const allStats = await originalStore.getAllMatchPlayerStats()
  
  // Pré-traitement pour éviter les filtres répétés
  const byPlayer: Record<string, MatchPlayerStats[]> = {}
  const byMatch: Record<string, MatchPlayerStats[]> = {}
  
  allStats.forEach(stat => {
    // Grouper par joueur
    if (!byPlayer[stat.playerId]) {
      byPlayer[stat.playerId] = []
    }
    byPlayer[stat.playerId].push(stat)
    
    // Grouper par match
    if (!byMatch[stat.matchId]) {
      byMatch[stat.matchId] = []
    }
    byMatch[stat.matchId].push(stat)
  })
  
  const result = { byPlayer, byMatch, all: allStats }
  cache.set(cacheKey, result, 20) // Cache 20 minutes
  return result
}

// Même optimisation pour les ratings
export async function getRatingsForPages(): Promise<{
  byPlayer: Record<string, PlayerRating[]>
  byMatch: Record<string, PlayerRating[]>
  all: PlayerRating[]
}> {
  const cacheKey = 'processed_ratings'
  const cached = cache.get<{
    byPlayer: Record<string, PlayerRating[]>
    byMatch: Record<string, PlayerRating[]>
    all: PlayerRating[]
  }>(cacheKey)
  if (cached) return cached
  
  const allRatings = await originalStore.getAllPlayerRatings()
  
  const byPlayer: Record<string, PlayerRating[]> = {}
  const byMatch: Record<string, PlayerRating[]> = {}
  
  allRatings.forEach(rating => {
    // Grouper par joueur noté
    if (!byPlayer[rating.ratedPlayerId]) {
      byPlayer[rating.ratedPlayerId] = []
    }
    byPlayer[rating.ratedPlayerId].push(rating)
    
    // Grouper par match
    if (!byMatch[rating.matchId]) {
      byMatch[rating.matchId] = []
    }
    byMatch[rating.matchId].push(rating)
  })
  
  const result = { byPlayer, byMatch, all: allRatings }
  cache.set(cacheKey, result, 15) // Cache 15 minutes
  return result
}

// Fonctions optimisées pour pages spécifiques
export async function getPlayerStats(playerId: string): Promise<MatchPlayerStats[]> {
  const cacheKey = CACHE_KEYS.PLAYER_STATS(playerId)
  const cached = cache.get<MatchPlayerStats[]>(cacheKey)
  if (cached) return cached
  
  // Utiliser les données pré-traitées si disponibles
  const processedStats = cache.get<{byPlayer: Record<string, MatchPlayerStats[]>}>('processed_stats')
  if (processedStats?.byPlayer[playerId]) {
    const stats = processedStats.byPlayer[playerId]
    cache.set(cacheKey, stats, 15)
    return stats
  }
  
  // Sinon faire la requête directe
  const stats = await originalStore.getPlayerStats(playerId)
  cache.set(cacheKey, stats, 15)
  return stats
}

export async function getPlayerRatings(playerId: string): Promise<PlayerRating[]> {
  const cacheKey = CACHE_KEYS.PLAYER_RATINGS(playerId)
  const cached = cache.get<PlayerRating[]>(cacheKey)
  if (cached) return cached
  
  // Utiliser les données pré-traitées si disponibles
  const processedRatings = cache.get<{byPlayer: Record<string, PlayerRating[]>}>('processed_ratings')
  if (processedRatings?.byPlayer[playerId]) {
    const ratings = processedRatings.byPlayer[playerId]
    cache.set(cacheKey, ratings, 15)
    return ratings
  }
  
  // Sinon faire la requête directe
  const ratings = await originalStore.getPlayerRatings(playerId)
  cache.set(cacheKey, ratings, 15)
  return ratings
}

export async function getPlayerRatingsForMatch(matchId: string): Promise<PlayerRating[]> {
  const cacheKey = CACHE_KEYS.MATCH_RATINGS(matchId)
  const cached = cache.get<PlayerRating[]>(cacheKey)
  if (cached) return cached
  
  // Utiliser les données pré-traitées si disponibles  
  const processedRatings = cache.get<{byMatch: Record<string, PlayerRating[]>}>('processed_ratings')
  if (processedRatings?.byMatch[matchId]) {
    const ratings = processedRatings.byMatch[matchId]
    cache.set(cacheKey, ratings, 10)
    return ratings
  }
  
  // Sinon faire la requête directe
  const ratings = await originalStore.getPlayerRatingsForMatch(matchId)
  cache.set(cacheKey, ratings, 10)
  return ratings
}

export async function getMatchPlayerStats(matchId: string): Promise<MatchPlayerStats[]> {
  const cacheKey = CACHE_KEYS.MATCH_STATS(matchId)
  const cached = cache.get<MatchPlayerStats[]>(cacheKey)
  if (cached) return cached
  
  // Utiliser les données pré-traitées si disponibles
  const processedStats = cache.get<{byMatch: Record<string, MatchPlayerStats[]>}>('processed_stats')
  if (processedStats?.byMatch[matchId]) {
    const stats = processedStats.byMatch[matchId]
    cache.set(cacheKey, stats, 10)
    return stats
  }
  
  // Sinon faire la requête directe
  const stats = await originalStore.getMatchPlayerStats(matchId)
  cache.set(cacheKey, stats, 10)
  return stats
}

// Fonction pour invalider le cache quand des données changent
export function invalidateCache(type: 'match' | 'player' | 'stats' | 'ratings', id?: string) {
  switch (type) {
    case 'match':
      if (id) {
        cache.invalidate(`match_${id}`)
        cache.invalidate(`match_sheet_${id}`)
        cache.invalidate(`match_stats_${id}`)
        cache.invalidate(`match_ratings_${id}`)
      }
      cache.invalidate('matches')
      break
    case 'player':
      if (id) {
        cache.invalidate(`player_stats_${id}`)
        cache.invalidate(`player_ratings_${id}`)
      }
      cache.invalidate('players')
      break
    case 'stats':
      cache.invalidate('processed_stats')
      cache.invalidate('player_stats_')
      cache.invalidate('match_stats_')
      break
    case 'ratings':
      cache.invalidate('processed_ratings')
      cache.invalidate('player_ratings_')
      cache.invalidate('match_ratings_')
      break
  }
}

// Fonctions avec invalidation de cache automatique
export async function savePlayerRating(rating: Parameters<typeof originalStore.savePlayerRating>[0]): Promise<void> {
  await originalStore.savePlayerRating(rating)
  invalidateCache('ratings', rating.matchId)
}

export async function saveMatchPlayerStats(stats: Parameters<typeof originalStore.saveMatchPlayerStats>[0]): Promise<void> {
  await originalStore.saveMatchPlayerStats(stats)
  invalidateCache('stats', stats.matchId)
}

export async function createMatchSheet(sheet: Parameters<typeof originalStore.createMatchSheet>[0]) {
  const result = await originalStore.createMatchSheet(sheet)
  invalidateCache('match', (sheet as any).matchId)
  return result
}

export async function updateMatchSheet(sheetId: string, updates: Parameters<typeof originalStore.updateMatchSheet>[1]) {
  await originalStore.updateMatchSheet(sheetId, updates)
  invalidateCache('match', sheetId)
}

export async function updatePlayer(playerId: string, updates: Parameters<typeof originalStore.updatePlayer>[1]): Promise<void> {
  await originalStore.updatePlayer(playerId, updates)
  invalidateCache('player', playerId)
}

// Réexporter toutes les autres fonctions du store original
export * from './store'