"use client"
import { useAuth } from '@/lib/auth-context'
import { closeRatingsForMatch, getMatches, getMatchPlayerStats, getMatchSheet, getPlayerRatingsForMatch, getPlayers } from '@/lib/store'
import type { Match, MatchPlayerStats, MatchSheet, Player, PlayerRating } from '@/lib/types'
import { useEffect, useState } from 'react'

export default function MatchDetailsClient({ matchId }: { matchId: string }) {
  const { isAuthenticated, isCaptain, currentPlayer } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [matchSheet, setMatchSheet] = useState<MatchSheet | null>(null)
  const [ratings, setRatings] = useState<PlayerRating[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<MatchPlayerStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [allMatches, sheet, playerRatings, allPlayers, stats] = await Promise.all([
          getMatches(),
          getMatchSheet(matchId),
          getPlayerRatingsForMatch(matchId),
          getPlayers(),
          getMatchPlayerStats(matchId)
        ])
        
        const foundMatch = allMatches.find(m => m.id === matchId)
        setMatch(foundMatch || null)
        setMatchSheet(sheet)
        setRatings(playerRatings)
        setPlayers(allPlayers)
        setPlayerStats(stats)
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [matchId])

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player ? player.name : 'Joueur inconnu'
  }

  const getPlayerStats = (playerId: string) => {
    const playerRatings = ratings.filter(r => r.ratedPlayerId === playerId)
    if (playerRatings.length === 0) return { average: 0, count: 0 }
    
    const sum = playerRatings.reduce((acc, r) => acc + r.rating, 0)
    return {
      average: Math.round((sum / playerRatings.length) * 10) / 10,
      count: playerRatings.length
    }
  }

  if (loading) {
    return (
      <section className="container py-16 text-center">
        <div className="text-zinc-400">Chargement des détails du match...</div>
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const matchDate = new Date(match.date)
  matchDate.setHours(0, 0, 0, 0)
  const isPastOrToday = matchDate <= today
  const isPast = matchDate < today

  return (
    <>
      <section className="relative py-10">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              Détails du match
            </h2>
            <div className="text-xl text-white">
              {new Date(match.date).toLocaleDateString('fr-FR', { 
                weekday: 'long',
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })} • {match.time || '19:00'}
            </div>
            <div className="text-zinc-400">
              SRH vs {match.opponent}
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Informations générales du match */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              ℹ️ Informations du match
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-redhorse-gold to-redhorse-red rounded-full flex items-center justify-center text-sm font-bold">
                    SRH
                  </div>
                  <span className="text-lg font-bold">vs</span>
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {match.opponent.split(' ').map(w => w[0]).join('').slice(0,2)}
                  </div>
                  <span className="text-lg font-semibold text-white">{match.opponent}</span>
                </div>
                
                <div className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {match.location}
                </div>
                
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  match.home 
                    ? 'bg-redhorse-gold/20 text-redhorse-gold' 
                    : 'bg-redhorse-red/20 text-redhorse-red'
                }`}>
                  {match.home ? '🏠 Domicile' : '✈️ Extérieur'}
                </div>
                
                {match.competition && (
                  <div className="inline-flex items-center px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-sm font-medium">
                    🏆 {match.competition}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                {isPast && (
                  <span className="px-3 py-1 bg-zinc-800/80 text-zinc-400 rounded-full text-sm">
                    Match terminé
                  </span>
                )}
                {matchSheet && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Feuille validée
                  </span>
                )}
                
                <div className="flex flex-col gap-2 mt-4">
                  <a href={`/matches/${matchId}`} className="btn-secondary rounded-lg px-4 py-2 text-white font-semibold text-center">📋 Composer l'équipe</a>
                  {isPastOrToday && matchSheet && isAuthenticated && !matchSheet.ratingsClosed && (
                    <a href={`/matches/${matchId}/ratings`} className="btn-primary rounded-lg px-4 py-2 text-white font-semibold text-center">⭐ Noter les joueurs</a>
                  )}
                  {isPastOrToday && isCaptain && (
                    <a href={`/matches/${matchId}/stats`} className="btn-primary rounded-lg px-4 py-2 text-white font-semibold text-center">📈 Entrer les statistiques</a>
                  )}
                  {isPastOrToday && isCaptain && matchSheet && !matchSheet.ratingsClosed && (
                    <CloseRatingsButton matchId={matchId} currentPlayerId={currentPlayer?.id} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Feuille de match */}
          {matchSheet && (
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                📋 Feuille de match officielle
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-redhorse-gold mb-3">
                    🟢 Joueurs présents ({matchSheet.actualPlayers.length})
                  </h4>
                  <div className="space-y-2">
                    {matchSheet.actualPlayers.map(playerId => {
                      const stats = getPlayerStats(playerId)
                      return (
                        <div key={playerId} className="flex items-center justify-between p-2 rounded bg-zinc-800/30">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">{getPlayerName(playerId)}</span>
                          </div>
                          {isPast && stats.count > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400">Note moyenne:</span>
                              <span className="text-sm font-semibold text-redhorse-gold">
                                {stats.average}/10
                              </span>
                              <span className="text-xs text-zinc-500">({stats.count})</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {matchSheet.absentPlayers.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-400 mb-3">
                      🔴 Joueurs absents ({matchSheet.absentPlayers.length})
                    </h4>
                    <div className="space-y-2">
                      {matchSheet.absentPlayers.map(playerId => (
                        <div key={playerId} className="flex items-center gap-2 text-sm opacity-60 p-2 rounded bg-red-500/10">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          {getPlayerName(playerId)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-zinc-700/50 text-xs text-zinc-400">
                Formation utilisée: <span className="text-white font-medium">{matchSheet.lineup.formation}</span>
                {matchSheet.createdBy && (
                  <span className="ml-4">
                    Validée par: <span className="text-white font-medium">{getPlayerName(matchSheet.createdBy)}</span>
                  </span>
                )}
                {matchSheet.lastModifiedBy && (
                  <span className="ml-4">
                    Dernière modification par: <span className="text-white font-medium">{getPlayerName(matchSheet.lastModifiedBy)}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Statistiques du match */}
          {isPastOrToday && playerStats.length > 0 && (
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                📈 Statistiques du match
              </h3>
              
              <div className="space-y-4">
                <MatchStatsDisplay stats={playerStats} players={players} />
              </div>
            </div>
          )}

          {/* Résultats des votes si fermés */}
          {matchSheet?.ratingsClosed && ratings.length > 0 && (
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                📊 Résultats des votes
              </h3>
              
              <div className="space-y-4">
                <PlayersAverages ratings={ratings} players={players} actualIds={matchSheet.actualPlayers} />
                
                {!isAuthenticated && (
                  <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400">
                      🔐 <a href="/login" className="underline hover:text-blue-300">Connectez-vous</a> pour voir le détail des notes et noter vos coéquipiers
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!matchSheet && (
            <div className="glass-effect rounded-2xl p-6 text-center border-2 border-dashed border-zinc-600">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-white mb-2">Feuille de match non disponible</h3>
              <p className="text-zinc-400 mb-4">
                {isCaptain 
                  ? "Créez une composition puis validez la feuille de match"
                  : "La feuille de match n'a pas encore été validée par un capitaine"
                }
              </p>
              <a
                href={`/matches/${matchId}`}
                className="btn-primary rounded-lg px-6 py-3 text-white font-semibold"
              >
                📋 Composer l'équipe
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function CloseRatingsButton({ matchId, currentPlayerId }: { matchId: string; currentPlayerId?: string }){
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eligible, setEligible] = useState(false)

  useEffect(() => {
    async function checkEligibility(){
      try{
        const votes = await getPlayerRatingsForMatch(matchId)
        const distinctRaters = new Set(votes.map(v=> v.raterPlayerId))
        setEligible(distinctRaters.size >= 7)
      }catch{
        setEligible(false)
      }
    }
    checkEligibility()
  },[matchId])

  async function handleClose(){
    if (!currentPlayerId) return
    setClosing(true)
    setError(null)
    try{
      await closeRatingsForMatch(matchId, currentPlayerId)
      window.location.reload()
    }catch(e:any){
      setError(e?.message || 'Erreur lors de la fermeture des votes')
    }finally{
      setClosing(false)
    }
  }

  if (!eligible) return null

  return (
    <div className="text-center">
      <button onClick={handleClose} disabled={closing} className="btn-primary rounded-lg px-4 py-2 text-white font-semibold w-full">
        {closing ? 'Fermeture…' : '🔒 Fermer les votes'}
      </button>
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
      <div className="text-xs text-zinc-400 mt-1">Disponible dès 7 votes minimum</div>
    </div>
  )
}

function MatchStatsDisplay({ stats, players }: { stats: MatchPlayerStats[]; players: Player[] }){
  const statsWithNames = stats
    .map(s => {
      const player = players.find(p => p.id === s.playerId)
      return { ...s, name: player?.name || 'Inconnu' }
    })
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))

  if (stats.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
          <div className="text-3xl font-bold text-redhorse-gold">
            {stats.reduce((sum, s) => sum + (s.goals || 0), 0)}
          </div>
          <div className="text-sm text-zinc-400">Buts</div>
        </div>
        <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
          <div className="text-3xl font-bold text-blue-400">
            {stats.reduce((sum, s) => sum + (s.assists || 0), 0)}
          </div>
          <div className="text-sm text-zinc-400">Passes D.</div>
        </div>
        <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
          <div className="text-3xl font-bold text-yellow-400">
            {stats.reduce((sum, s) => sum + (s.yellowCards || 0), 0)}
          </div>
          <div className="text-sm text-zinc-400">Cartons J.</div>
        </div>
        <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
          <div className="text-3xl font-bold text-red-400">
            {stats.reduce((sum, s) => sum + (s.redCards || 0), 0)}
          </div>
          <div className="text-sm text-zinc-400">Cartons R.</div>
        </div>
      </div>

      {/* Détail par joueur */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400 border-b border-zinc-700">
              <th className="pb-2">Joueur</th>
              <th className="pb-2 text-center">⚽</th>
              <th className="pb-2 text-center">🅰️</th>
              <th className="pb-2 text-center">🟨</th>
              <th className="pb-2 text-center">🟥</th>
              <th className="pb-2 text-center">⏱️</th>
            </tr>
          </thead>
          <tbody>
            {statsWithNames.map((stat) => (
              <tr key={stat.playerId} className="border-b border-zinc-800">
                <td className="py-3 text-white font-medium">{stat.name}</td>
                <td className="py-3 text-center">{stat.goals || '-'}</td>
                <td className="py-3 text-center">{stat.assists || '-'}</td>
                <td className="py-3 text-center">{stat.yellowCards || '-'}</td>
                <td className="py-3 text-center">{stat.redCards || '-'}</td>
                <td className="py-3 text-center">{stat.minutes || '-'}'</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlayersAverages({ ratings, players, actualIds }: { ratings: PlayerRating[]; players: Player[]; actualIds: string[] }){
  const data = actualIds.map(id => {
    const prs = ratings.filter(r=> r.ratedPlayerId === id)
    const avg = prs.length === 0 ? 0 : Math.round((prs.reduce((a,r)=> a + r.rating,0) / prs.length) * 10) / 10
    const p = players.find(x=>x.id===id)
    return { id, name: p?.name || 'Inconnu', average: avg, count: prs.length }
  }).sort((a,b)=> b.average - a.average)

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {data.map(row => (
        <div key={row.id} className="p-4 rounded-lg bg-zinc-800/50 flex items-center justify-between">
          <div className="text-white font-medium">{row.name}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-redhorse-gold">{row.average}</div>
            <div className="text-xs text-zinc-400">({row.count})</div>
          </div>
        </div>
      ))}
    </div>
  )
}