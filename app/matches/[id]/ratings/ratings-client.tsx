"use client"
import { useAuth } from '@/lib/auth-context'
import { getMatches, getMatchSheet, getPlayerRatingsForMatch, getPlayers, savePlayerRating } from '@/lib/optimized-store'
import type { Match, MatchSheet, Player, PlayerRating } from '@/lib/types'
import { useEffect, useState } from 'react'

export default function RatingsClient({ matchId }: { matchId: string }) {
  const { currentPlayer, isAuthenticated } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [matchSheet, setMatchSheet] = useState<MatchSheet | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [ratings, setRatings] = useState<Record<string, { rating: number; comment: string }>>({})
  const [existingRatings, setExistingRatings] = useState<PlayerRating[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [matches, allPlayers, sheet, playerRatings] = await Promise.all([
        getMatches(),
        getPlayers(),
        getMatchSheet(matchId),
        getPlayerRatingsForMatch(matchId)
      ])
      
      const currentMatch = matches.find(m => m.id === matchId)
      setMatch(currentMatch || null)
      setMatchSheet(sheet)
      setPlayers(allPlayers)
      setExistingRatings(playerRatings)
      
      if (currentPlayer && sheet) {
        const myRatings: Record<string, { rating: number; comment: string }> = {}
        sheet.actualPlayers.forEach(playerId => {
          const existingRating = playerRatings.find(r => 
            r.ratedPlayerId === playerId && r.raterPlayerId === currentPlayer.id
          )
          if (existingRating) {
            myRatings[playerId] = {
              rating: existingRating.rating,
              comment: existingRating.comment || ''
            }
          }
        })
        setRatings(myRatings)
      }
    }
    
    loadData()
  }, [matchId, currentPlayer])

  const handleRatingChange = (playerId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: {
        rating,
        comment: prev[playerId]?.comment || ''
      }
    }))
  }

  const handleCommentChange = (playerId: string, comment: string) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: {
        rating: prev[playerId]?.rating || 0,
        comment
      }
    }))
  }

  const handleSubmit = async () => {
    if (!currentPlayer || !matchSheet) return
    
    setLoading(true)
    setSaved(false)
    
    try {
      const ratingPromises = Object.entries(ratings)
        .filter(([_, data]) => data.rating > 0)
        .map(([playerId, data]) =>
          savePlayerRating({
            matchId: matchId,
            ratedPlayerId: playerId,
            raterPlayerId: currentPlayer.id,
            rating: data.rating,
            comment: data.comment && data.comment.trim() ? data.comment : ''
          })
        )
      
      await Promise.all(ratingPromises)
      setSaved(true)
      
      // Rediriger immédiatement vers la page de détails
      window.location.href = `/matches/${matchId}/details`
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="container py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="glass-effect rounded-2xl p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Connexion requise</h2>
            <p className="text-zinc-400 mb-4">
              Vous devez être connecté pour noter vos coéquipiers
            </p>
            <a href="/login" className="btn-primary rounded-lg px-6 py-3 text-white font-semibold">
              Se connecter
            </a>
          </div>
        </div>
      </section>
    )
  }

  if (!match) {
    return (
      <section className="container py-8">
        <div className="text-center">Match introuvable.</div>
      </section>
    )
  }

  if (!matchSheet) {
    return (
      <section className="container py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-effect rounded-2xl p-6">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-bold mb-2">Feuille de match non disponible</h2>
            <p className="text-zinc-400 mb-4">
              La feuille de match n'a pas encore été créée pour ce match.
            </p>
            <a href={`/matches/${matchId}`} className="btn-primary rounded-lg px-6 py-3 text-white font-semibold">
              Voir le match
            </a>
          </div>
        </div>
      </section>
    )
  }

  if (matchSheet.ratingsClosed) {
    return (
      <section className="container py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-effect rounded-2xl p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Votes fermés</h2>
            <p className="text-zinc-400 mb-4">Les votes pour ce match ont été fermés par un capitaine.</p>
            <a href={`/matches/${matchId}/details`} className="btn-primary rounded-lg px-6 py-3 text-white font-semibold">
              Voir les résultats
            </a>
          </div>
        </div>
      </section>
    )
  }

  const actualPlayersData = matchSheet.actualPlayers
    .map(id => players.find(p => p.id === id))
    .filter(p => p && p.id !== currentPlayer?.id) as Player[]

  return (
    <>
      <section className="relative py-10">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              Notation des joueurs
            </h2>
            <div className="text-zinc-400">
              {new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} • {match.opponent}
            </div>
            <div className="text-sm text-zinc-500">
              Connecté en tant que <span className="text-redhorse-gold">{currentPlayer?.name}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <div className="max-w-4xl mx-auto">
          {saved && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-center">
              ✅ Vos notes ont été sauvegardées !
            </div>
          )}
          
          <div className="grid gap-6">
            {actualPlayersData.map(player => (
              <div key={player.id} className="glass-effect rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="feature-card rounded-xl p-1 w-20">
                    <div className="relative rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-900 p-3 text-center">
                      <div className="text-xs font-bold text-white">{player.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        {player.position === 'GK' ? 'GK' :
                         player.position === 'DEF' ? 'DEF' :
                         player.position === 'MID' ? 'MID' : 'ATT'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{player.name}</h3>
                    <p className="text-sm text-zinc-400">
                      {player.position === 'GK' ? '🥅 Gardien' :
                       player.position === 'DEF' ? '🛡️ Défenseur' :
                       player.position === 'MID' ? '⚡ Milieu' : '🎯 Attaquant'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Note sur 10 :
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                        <button
                          key={score}
                          onClick={() => handleRatingChange(player.id, score)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                            ratings[player.id]?.rating === score
                              ? 'bg-redhorse-gold text-black'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Commentaire (optionnel) :
                    </label>
                    <textarea
                      value={ratings[player.id]?.comment || ''}
                      onChange={(e) => handleCommentChange(player.id, e.target.value)}
                      placeholder="Votre commentaire sur la performance du joueur..."
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-redhorse-gold focus:outline-none resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {actualPlayersData.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={loading || Object.values(ratings).every(r => !r.rating)}
                className="btn-primary rounded-lg px-8 py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sauvegarde en cours...</span>
                  </>
                ) : (
                  'Sauvegarder mes notes'
                )}
              </button>
              <p className="text-sm text-zinc-500 mt-2">
                {loading ? 'Redirection vers les détails du match...' : 'Vos notes sont anonymes'}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}