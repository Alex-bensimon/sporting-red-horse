import type { Match } from './types'

/**
 * Vérifie si un match est terminé (dans le passé)
 * Un match est considéré comme terminé s'il a eu lieu avant la fin de la journée courante
 */
export function isMatchFinished(match: Match): boolean {
  const matchDate = new Date(match.date)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // Fin de la journée courante
  
  return matchDate < today
}

/**
 * Vérifie si un match est terminé ou en cours aujourd'hui
 * Utile pour les fonctionnalités qui peuvent être activées le jour même
 */
export function isMatchFinishedOrToday(match: Match): boolean {
  const matchDate = new Date(match.date)
  matchDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return matchDate <= today
}

/**
 * Filtre une liste de matchs pour ne garder que ceux qui sont terminés
 */
export function getFinishedMatches(matches: Match[]): Match[] {
  return matches.filter(isMatchFinished)
}

/**
 * Compte le nombre de matchs terminés dans une liste
 */
export function countFinishedMatches(matches: Match[]): number {
  return matches.filter(isMatchFinished).length
}