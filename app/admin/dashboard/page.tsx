"use client"
import { useAuth } from '@/lib/auth-context'
import { getAllPlayerRatings, getMatches, getPlayers } from '@/lib/store'
import type { Match, Player, PlayerRating } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type MatchRatingData = {
  matchId: string
  matchInfo: Match
  ratings: Array<{
    rating: PlayerRating
    raterName: string
    ratedName: string
  }>
}

type FilterState = {
  matchId: string
  raterPlayerId: string
  ratedPlayerId: string
}

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc' | 'rater-name' | 'rated-name'

// Fonction helper pour obtenir les couleurs selon la note
function getRatingColor(rating: number): string {
  if (rating >= 0 && rating <= 2) {
    return 'bg-red-900/50 text-red-400'
  } else if (rating >= 3 && rating <= 4) {
    return 'bg-orange-900/50 text-orange-400'
  } else if (rating >= 5 && rating <= 6) {
    return 'bg-yellow-900/30 text-yellow-300'
  } else if (rating >= 7 && rating <= 8) {
    return 'bg-green-900/40 text-green-300'
  } else if (rating >= 9 && rating <= 10) {
    return 'bg-green-900/70 text-green-200'
  } else {
    return 'bg-zinc-900/50 text-zinc-400'
  }
}

export default function AdminDashboard() {
  const { currentPlayer, isAuthenticated, isAuthLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<MatchRatingData[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    matchId: '',
    raterPlayerId: '',
    ratedPlayerId: ''
  })
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped')

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || currentPlayer?.id !== 'pF1')) {
      router.push('/')
      return
    }
  }, [isAuthenticated, currentPlayer, isAuthLoading, router])

  useEffect(() => {
    if (!isAuthenticated || currentPlayer?.id !== 'pF1') return

    async function loadData() {
      try {
        setLoading(true)
        const [ratings, playersData, matchesData] = await Promise.all([
          getAllPlayerRatings(),
          getPlayers(),
          getMatches()
        ])

        setPlayers(playersData)
        setMatches(matchesData)

        const playerMap = new Map(playersData.map(p => [p.id, p]))
        const matchMap = new Map(matchesData.map(m => [m.id, m]))

        // Group ratings by match
        const ratingsByMatch = new Map<string, PlayerRating[]>()
        ratings.forEach(rating => {
          if (!ratingsByMatch.has(rating.matchId)) {
            ratingsByMatch.set(rating.matchId, [])
          }
          ratingsByMatch.get(rating.matchId)!.push(rating)
        })

        // Build the final data structure
        const matchRatingsData: MatchRatingData[] = []
        ratingsByMatch.forEach((matchRatings, matchId) => {
          const matchInfo = matchMap.get(matchId)
          if (!matchInfo) return

          const ratingsWithNames = matchRatings.map(rating => ({
            rating,
            raterName: playerMap.get(rating.raterPlayerId)?.name || 'Inconnu',
            ratedName: playerMap.get(rating.ratedPlayerId)?.name || 'Inconnu'
          }))

          matchRatingsData.push({
            matchId,
            matchInfo,
            ratings: ratingsWithNames
          })
        })

        setData(matchRatingsData)
      } catch (err) {
        console.error('Error loading admin dashboard data:', err)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, currentPlayer])

  // Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Appliquer les filtres
    if (filters.matchId) {
      result = result.filter(match => match.matchId === filters.matchId)
    }

    // Filtrer les ratings dans chaque match
    result = result.map(match => ({
      ...match,
      ratings: match.ratings.filter(item => {
        const matchesRater = !filters.raterPlayerId || item.rating.raterPlayerId === filters.raterPlayerId
        const matchesRated = !filters.ratedPlayerId || item.rating.ratedPlayerId === filters.ratedPlayerId
        return matchesRater && matchesRated
      })
    })).filter(match => match.ratings.length > 0) // Supprimer les matchs sans ratings après filtrage

    // Appliquer le tri
    if (viewMode === 'grouped') {
      // Tri par match
      result.sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.matchInfo.date).getTime() - new Date(a.matchInfo.date).getTime()
          case 'date-asc':
            return new Date(a.matchInfo.date).getTime() - new Date(b.matchInfo.date).getTime()
          default:
            return 0
        }
      })

      // Trier les ratings dans chaque match
      result.forEach(match => {
        match.ratings.sort((a, b) => {
          switch (sortBy) {
            case 'rating-desc':
              return b.rating.rating - a.rating.rating
            case 'rating-asc':
              return a.rating.rating - b.rating.rating
            case 'rater-name':
              return a.raterName.localeCompare(b.raterName, 'fr')
            case 'rated-name':
              return a.ratedName.localeCompare(b.ratedName, 'fr')
            default:
              return 0
          }
        })
      })
    }

    return result
  }, [data, filters, sortBy, viewMode])

  // Mode plat : toutes les notes dans un seul tableau
  const flatRatings = useMemo(() => {
    const allRatings = filteredAndSortedData.flatMap(match => 
      match.ratings.map(item => ({
        ...item,
        matchInfo: match.matchInfo
      }))
    )

    // Trier le tableau plat
    allRatings.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.matchInfo.date).getTime() - new Date(a.matchInfo.date).getTime()
        case 'date-asc':
          return new Date(a.matchInfo.date).getTime() - new Date(b.matchInfo.date).getTime()
        case 'rating-desc':
          return b.rating.rating - a.rating.rating
        case 'rating-asc':
          return a.rating.rating - b.rating.rating
        case 'rater-name':
          return a.raterName.localeCompare(b.raterName, 'fr')
        case 'rated-name':
          return a.ratedName.localeCompare(b.ratedName, 'fr')
        default:
          return 0
      }
    })

    return allRatings
  }, [filteredAndSortedData, sortBy])

  if (isAuthLoading || (!isAuthenticated || currentPlayer?.id !== 'pF1')) {
    return <div className="container py-8">Chargement...</div>
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redhorse-gold mx-auto"></div>
          <p className="mt-4 text-zinc-400">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-r from-redhorse-gold to-redhorse-red p-3 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-zinc-400">Vue d'ensemble des notes par match</p>
        </div>
      </div>

      {/* Filtres et contrôles */}
      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Filtre par match */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Match</label>
            <select
              value={filters.matchId}
              onChange={(e) => setFilters(prev => ({ ...prev, matchId: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
            >
              <option value="">Tous les matchs</option>
              {matches.map(match => (
                <option key={match.id} value={match.id}>
                  {new Date(match.date).toLocaleDateString('fr-FR')} - {match.home ? 'vs' : '@'} {match.opponent}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par évaluateur */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Évaluateur</label>
            <select
              value={filters.raterPlayerId}
              onChange={(e) => setFilters(prev => ({ ...prev, raterPlayerId: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
            >
              <option value="">Tous les évaluateurs</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          {/* Filtre par évalué */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Évalué</label>
            <select
              value={filters.ratedPlayerId}
              onChange={(e) => setFilters(prev => ({ ...prev, ratedPlayerId: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
            >
              <option value="">Tous les évalués</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Tri</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
            >
              <option value="date-desc">Date (récent → ancien)</option>
              <option value="date-asc">Date (ancien → récent)</option>
              <option value="rating-desc">Note (haute → basse)</option>
              <option value="rating-asc">Note (basse → haute)</option>
              <option value="rater-name">Évaluateur (A → Z)</option>
              <option value="rated-name">Évalué (A → Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Mode d'affichage */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-300">Affichage :</span>
            <div className="flex bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-redhorse-gold text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Par match
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'flat'
                    ? 'bg-redhorse-gold text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Liste complète
              </button>
            </div>
          </div>

          {/* Guide des couleurs */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <span className="text-zinc-400">Échelle :</span>
            <span className={`px-1.5 py-0.5 rounded ${getRatingColor(1)}`}>0-2</span>
            <span className={`px-1.5 py-0.5 rounded ${getRatingColor(3)}`}>3-4</span>
            <span className={`px-1.5 py-0.5 rounded ${getRatingColor(5)}`}>5-6</span>
            <span className={`px-1.5 py-0.5 rounded ${getRatingColor(7)}`}>7-8</span>
            <span className={`px-1.5 py-0.5 rounded ${getRatingColor(9)}`}>9-10</span>
          </div>

          {/* Statistiques */}
          <div className="text-sm text-zinc-400">
            {viewMode === 'grouped' 
              ? `${filteredAndSortedData.reduce((sum, match) => sum + match.ratings.length, 0)} notes sur ${filteredAndSortedData.length} matchs`
              : `${flatRatings.length} notes au total`
            }
          </div>

          {/* Reset filters */}
          <button
            onClick={() => {
              setFilters({ matchId: '', raterPlayerId: '', ratedPlayerId: '' })
              setSortBy('date-desc')
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-redhorse-gold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-8 text-center">
          <p className="text-zinc-400">Aucune note trouvée</p>
        </div>
      ) : viewMode === 'grouped' ? (
        // Mode groupé par match
        <div className="space-y-6">
          {filteredAndSortedData.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-8 text-center">
              <p className="text-zinc-400">Aucun résultat avec ces filtres</p>
            </div>
          ) : (
            filteredAndSortedData.map((matchData) => (
              <div key={matchData.matchId} className="bg-zinc-900/50 border border-zinc-700 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-redhorse-gold/20 to-redhorse-red/20 p-4 border-b border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {matchData.matchInfo.home ? 'vs' : '@'} {matchData.matchInfo.opponent}
                      </h2>
                      <p className="text-zinc-400">
                        {new Date(matchData.matchInfo.date).toLocaleDateString('fr-FR')} - {matchData.matchInfo.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Notes filtrées</p>
                      <p className="text-2xl font-bold text-redhorse-gold">{matchData.ratings.length}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left py-2 text-zinc-400 font-medium">Évaluateur</th>
                          <th className="text-left py-2 text-zinc-400 font-medium">Évalué</th>
                          <th className="text-center py-2 text-zinc-400 font-medium">Note</th>
                          <th className="text-left py-2 text-zinc-400 font-medium">Commentaire</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchData.ratings.map((item, index) => (
                          <tr key={item.rating.id || index} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                            <td className="py-3 text-zinc-300">{item.raterName}</td>
                            <td className="py-3 text-zinc-300">{item.ratedName}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${getRatingColor(item.rating.rating)}`}>
                                {item.rating.rating}/10
                              </span>
                            </td>
                            <td className="py-3 text-zinc-400 max-w-xs truncate">
                              {item.rating.comment || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Mode liste complète
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-redhorse-gold/20 to-redhorse-red/20 p-4 border-b border-zinc-700">
            <h2 className="text-xl font-semibold text-white">Toutes les notes</h2>
            <p className="text-zinc-400">Liste complète avec filtres appliqués</p>
          </div>

          <div className="p-4">
            {flatRatings.length === 0 ? (
              <p className="text-zinc-500 italic text-center py-8">Aucun résultat avec ces filtres</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-2 text-zinc-400 font-medium">Match</th>
                      <th className="text-left py-2 text-zinc-400 font-medium">Date</th>
                      <th className="text-left py-2 text-zinc-400 font-medium">Évaluateur</th>
                      <th className="text-left py-2 text-zinc-400 font-medium">Évalué</th>
                      <th className="text-center py-2 text-zinc-400 font-medium">Note</th>
                      <th className="text-left py-2 text-zinc-400 font-medium">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatRatings.map((item, index) => (
                      <tr key={item.rating.id || index} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                        <td className="py-3 text-zinc-300">
                          {item.matchInfo.home ? 'vs' : '@'} {item.matchInfo.opponent}
                        </td>
                        <td className="py-3 text-zinc-400">
                          {new Date(item.matchInfo.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 text-zinc-300">{item.raterName}</td>
                        <td className="py-3 text-zinc-300">{item.ratedName}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getRatingColor(item.rating.rating)}`}>
                            {item.rating.rating}/10
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400 max-w-xs truncate">
                          {item.rating.comment || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}