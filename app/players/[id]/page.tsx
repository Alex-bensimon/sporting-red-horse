"use client"
import { getPlayerById, getPlayers, getPlayerStats, getMatches, getPlayerRatings } from '@/lib/store'
import type { Player, MatchPlayerStats, Match, PlayerRating } from '@/lib/types'
import { useEffect, useState } from 'react'


export default function PlayerPage({ params }:{ params:{ id:string }}){
  const [p, setP] = useState<Player | null>(null)
  const [stats, setStats] = useState<MatchPlayerStats[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [ratings, setRatings] = useState<PlayerRating[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(()=>{ 
    async function loadPlayerData() {
      const [player, playerStats, allMatches, playerRatings] = await Promise.all([
        getPlayerById(params.id),
        getPlayerStats(params.id),
        getMatches(),
        getPlayerRatings(params.id)
      ])
      setP(player)
      setStats(playerStats)
      setMatches(allMatches)
      setRatings(playerRatings)
      setLoading(false)
    }
    loadPlayerData()
  },[params.id])
  if (loading) return <section className="container py-16 text-center"><div className="text-zinc-400">Chargement...</div></section>
  if (!p) return <section className="container py-16">Joueur introuvable.</section>
  
  // Calcul des statistiques agrégées
  const totalGoals = stats.reduce((sum, s) => sum + (s.goals || 0), 0)
  const totalAssists = stats.reduce((sum, s) => sum + (s.assists || 0), 0)
  const totalYellowCards = stats.reduce((sum, s) => sum + (s.yellowCards || 0), 0)
  const totalRedCards = stats.reduce((sum, s) => sum + (s.redCards || 0), 0)
  const totalCleanSheets = stats.reduce((sum, s) => sum + (s.cleanSheet ? 1 : 0), 0)
  const totalMinutes = stats.reduce((sum, s) => sum + (s.minutes || 0), 0)
  const matchesPlayed = stats.length
  
  // Calcul des statistiques de notes - par match
  // Grouper les notes par match pour calculer la moyenne par match
  const ratingsByMatch = ratings.reduce((acc, rating) => {
    if (!acc[rating.matchId]) {
      acc[rating.matchId] = []
    }
    acc[rating.matchId].push(rating.rating)
    return acc
  }, {} as Record<string, number[]>)
  
  // Calculer les moyennes par match
  const matchAverages = Object.values(ratingsByMatch).map(matchRatings => 
    Math.round((matchRatings.reduce((sum, r) => sum + r, 0) / matchRatings.length) * 10) / 10
  )
  
  // Statistiques basées sur les moyennes par match
  const averageRating = matchAverages.length > 0 ? 
    Math.round((matchAverages.reduce((sum, avg) => sum + avg, 0) / matchAverages.length) * 10) / 10 : 0
  const bestRating = matchAverages.length > 0 ? Math.max(...matchAverages) : 0
  const worstRating = matchAverages.length > 0 ? Math.min(...matchAverages) : 0
  const ratingsCount = ratings.length
  
  // Calcul du temps de jeu
  const avgMinutesPerMatch = matchesPlayed > 0 ? Math.round(totalMinutes / matchesPlayed) : 0
  
  // Stats par match avec infos du match
  const statsWithMatches = stats.map(stat => {
    const match = matches.find(m => m.id === stat.matchId)
    return { ...stat, match }
  }).sort((a, b) => {
    if (!a.match || !b.match) return 0
    return new Date(b.match.date).getTime() - new Date(a.match.date).getTime()
  })
  return (
    <>
      <section className="relative py-16">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              {p.name}
            </h2>
            <div className="text-zinc-400">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/60 text-sm">
                Poste: <b className="text-white">{p.position}</b>
              </span>
              {p.jersey ? <span className="ml-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/60 text-sm">N° <b className="text-white">{p.jersey}</b></span> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 pb-16 md:grid-cols-[1fr_1fr]">
        <div className="feature-card rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-zinc-400">Note générale</div>
              <div className="text-5xl font-extrabold text-redhorse-gold">{p.rating}</div>
            </div>
            <div className="w-20 h-20 bg-gradient-to-r from-redhorse-gold to-redhorse-red rounded-full flex items-center justify-center font-bold text-black">
              {p.position}
            </div>
          </div>
          <div className="mt-6 h-64 rounded-xl overflow-hidden bg-zinc-800/30">
            <img 
              src={p.photo || `/players/${p.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'')}.webp`} 
              alt={p.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-zinc-900/60 border border-zinc-700 p-3">
              <div className="text-zinc-400">Taille</div>
              <div className="text-lg font-bold text-white">{p.heightCm ? `${p.heightCm} cm` : '—'}</div>
            </div>
            <div className="rounded-lg bg-zinc-900/60 border border-zinc-700 p-3">
              <div className="text-zinc-400">Poids</div>
              <div className="text-lg font-bold text-white">{p.weightKg ? `${p.weightKg} kg` : '—'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Attributs</h3>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Vitesse" value={p.pace} emoji="💨" />
              <Stat label="Tir" value={p.shooting} emoji="⚽" />
              <Stat label="Passes" value={p.passing} emoji="🎯" />
              <Stat label="Dribble" value={p.dribbling} emoji="🎭" />
              <Stat label="Défense" value={p.defense} emoji="🛡️" />
              <Stat label="Physique" value={p.physical} emoji="💪" />
            </ul>
          </div>
          
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Statistiques de Match</h3>
            {matchesPlayed > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                    <div className="text-2xl font-bold text-redhorse-gold">{totalGoals}</div>
                    <div className="text-sm text-zinc-400">⚽ Buts</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{totalAssists}</div>
                    <div className="text-sm text-zinc-400">🎯 Passes D.</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{matchesPlayed}</div>
                    <div className="text-sm text-zinc-400">🎮 Matchs</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{totalMinutes}'</div>
                    <div className="text-sm text-zinc-400">⏱️ Temps total</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-400">{avgMinutesPerMatch}'</div>
                    <div className="text-sm text-zinc-400">📊 Temps moyen</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{totalYellowCards}</div>
                    <div className="text-sm text-zinc-400">🟨 Cartons J.</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{totalRedCards}</div>
                    <div className="text-sm text-zinc-400">🟥 Cartons R.</div>
                  </div>
                  {p.position === 'GK' && (
                    <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">{totalCleanSheets}</div>
                      <div className="text-sm text-zinc-400">🥅 Clean Sheets</div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Historique des performances</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {statsWithMatches.map((stat, index) => (
                      <div key={stat.id || index} className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <div className="text-zinc-400">
                            {stat.match ? (
                              <>
                                {new Date(stat.match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                <div className="text-xs">{stat.match.opponent}</div>
                              </>
                            ) : (
                              'Match inconnu'
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          {(stat.goals || 0) > 0 && <span className="text-redhorse-gold">⚽{stat.goals}</span>}
                          {(stat.assists || 0) > 0 && <span className="text-blue-400">🎯{stat.assists}</span>}
                          {stat.cleanSheet && <span className="text-emerald-400">🥅</span>}
                          {(stat.yellowCards || 0) > 0 && <span className="text-yellow-400">🟨{stat.yellowCards}</span>}
                          {(stat.redCards || 0) > 0 && <span className="text-red-400">🟥{stat.redCards}</span>}
                          {stat.minutes && <span className="text-zinc-400">{stat.minutes}'</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Aucune statistique de match disponible</p>
              </div>
            )}
          </div>

          <div className="glass-effect rounded-2xl p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Notes des Coéquipiers</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                <div className="text-3xl font-bold text-yellow-400">{averageRating || '-'}</div>
                <div className="text-sm text-zinc-400">⭐ Moyenne</div>
              </div>
              <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{bestRating || '-'}</div>
                <div className="text-sm text-zinc-400">🏆 Meilleure</div>
              </div>
              <div className="text-center p-3 bg-zinc-900/60 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">{worstRating || '-'}</div>
                <div className="text-sm text-zinc-400">📉 Plus basse</div>
              </div>
            </div>
            
            {Object.keys(ratingsByMatch).length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Historique des notes par match ({Object.keys(ratingsByMatch).length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(ratingsByMatch)
                    .sort(([matchIdA], [matchIdB]) => {
                      const matchA = matches.find(m => m.id === matchIdA)
                      const matchB = matches.find(m => m.id === matchIdB)
                      if (!matchA || !matchB) return 0
                      return new Date(matchB.date).getTime() - new Date(matchA.date).getTime()
                    })
                    .map(([matchId, matchRatings]) => {
                      const match = matches.find(m => m.id === matchId)
                      const avgRating = Math.round((matchRatings.reduce((sum, r) => sum + r, 0) / matchRatings.length) * 10) / 10
                      const bestRating = Math.max(...matchRatings)
                      const worstRating = Math.min(...matchRatings)
                      
                      return (
                        <div key={matchId} className="p-3 bg-zinc-900/30 rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-zinc-400">
                              {match ? (
                                <>
                                  {new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                  <div className="text-xs">{match.opponent}</div>
                                </>
                              ) : (
                                'Match inconnu'
                              )}
                            </div>
                            <div className="text-xs text-zinc-500">{matchRatings.length} note{matchRatings.length > 1 ? 's' : ''}</div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-4">
                              <div className={`font-bold ${
                                avgRating >= 8 ? 'text-green-400' :
                                avgRating >= 7 ? 'text-yellow-400' :
                                avgRating >= 6 ? 'text-orange-400' : 'text-red-400'
                              }`}>
                                ⭐ {avgRating}
                              </div>
                              <div className="text-green-400">🏆 {bestRating}</div>
                              <div className="text-orange-400">📉 {worstRating}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500">
                <div className="text-4xl mb-2">⭐</div>
                <p>Aucune note reçue pour le moment</p>
              </div>
            )}
          </div>

        </div>
      </section>
    </>
  )
}

function Stat({ label, value, emoji }:{ label:string; value:number; emoji:string }){
  return (
    <li className="rounded-lg bg-zinc-900/60 border border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="text-zinc-400">{emoji} {label}</div>
        <div className="text-lg font-bold text-redhorse-gold">{value}</div>
      </div>
    </li>
  )
}

