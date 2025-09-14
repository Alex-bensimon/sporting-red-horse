import type { Match, MatchPlayerStats, PlayerRating } from './types'

/**
 * Fonction de debug pour vérifier que les filtres sont correctement appliqués
 * À utiliser uniquement en développement
 */
export function debugFilters(
  matches: Match[],
  matchStats: MatchPlayerStats[],
  playerRatings: PlayerRating[],
  filteredMatches: Match[],
  filteredStats: MatchPlayerStats[],
  filteredRatings: PlayerRating[]
) {
  console.group('🔍 Debug Filtres Stats')
  
  const filteredMatchIds = new Set(filteredMatches.map(m => m.id))
  
  console.log('Matchs totaux:', matches.length)
  console.log('Matchs filtrés:', filteredMatches.length)
  console.log('IDs matchs filtrés:', Array.from(filteredMatchIds))
  
  console.log('\nStats totales:', matchStats.length)
  console.log('Stats filtrées:', filteredStats.length)
  
  console.log('\nRatings totaux:', playerRatings.length)
  console.log('Ratings filtrés:', filteredRatings.length)
  
  // Vérification de cohérence
  const statsWithInvalidMatch = filteredStats.filter(s => !filteredMatchIds.has(s.matchId))
  const ratingsWithInvalidMatch = filteredRatings.filter(r => !filteredMatchIds.has(r.matchId))
  
  if (statsWithInvalidMatch.length > 0) {
    console.warn('⚠️ Stats avec matchs non filtrés:', statsWithInvalidMatch.length)
  } else {
    console.log('✅ Toutes les stats correspondent aux matchs filtrés')
  }
  
  if (ratingsWithInvalidMatch.length > 0) {
    console.warn('⚠️ Ratings avec matchs non filtrés:', ratingsWithInvalidMatch.length)
  } else {
    console.log('✅ Tous les ratings correspondent aux matchs filtrés')
  }
  
  console.groupEnd()
}

/**
 * Fonction pour vérifier si tous les filtres sont désactivés
 */
export function areAllFiltersDisabled(
  matchFilter: string,
  competitionFilter: string,
  timeFrameFilter: string
): boolean {
  return matchFilter === 'all' && competitionFilter === 'all' && timeFrameFilter === 'all'
}