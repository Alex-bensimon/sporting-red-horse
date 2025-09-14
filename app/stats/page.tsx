"use client"
import { getPlayers, getMatches, getStatsForPages, getRatingsForPages } from '@/lib/optimized-store'
import type { Player, MatchPlayerStats, Match, PlayerRating } from '@/lib/types'
import { countFinishedMatches } from '@/lib/match-utils'
import { areAllFiltersDisabled } from '@/lib/filter-debug'
import { useEffect, useMemo, useState } from 'react'

type MetricKey = keyof Pick<Player, 'rating' | 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defense' | 'physical'>

export default function StatsPage(){
  const [players, setPlayers] = useState<Player[]>([])
  const [metric, setMetric] = useState<MetricKey>('rating')
  const [matchStats, setMatchStats] = useState<MatchPlayerStats[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([])
  const [loading, setLoading] = useState(true)
  const [matchFilter, setMatchFilter] = useState<'all' | 'home' | 'away'>('all')
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [timeFrameFilter, setTimeFrameFilter] = useState<'all' | 'current-season' | 'last-3-months'>('all')

  useEffect(()=>{ 
    async function loadData() {
      const [playersData, matchesData, statsData, ratingsData] = await Promise.all([
        getPlayers(),
        getMatches(),
        getStatsForPages(),
        getRatingsForPages()
      ])
      setPlayers(playersData)
      setMatches(matchesData)
      setMatchStats(statsData.all)
      setPlayerRatings(ratingsData.all)
      setLoading(false)
    }
    loadData()
  },[])

  const overview = useMemo(()=>{
    const numPlayers = players.length
    const avg = (key: MetricKey) => numPlayers === 0 ? 0 : Math.round(players.reduce((a,p)=> a + Number(p[key] || 0), 0) / numPlayers)
    const byPos = (pos: Player['position']) => players.filter(p=> p.position === pos).length
    const bestOverall = [...players].sort((a,b)=> b.rating - a.rating)[0]
    return {
      numPlayers,
      avgRating: avg('rating'),
      avgPace: avg('pace'),
      avgShooting: avg('shooting'),
      avgPassing: avg('passing'),
      avgDribbling: avg('dribbling'),
      avgDefense: avg('defense'),
      avgPhysical: avg('physical'),
      byPos: {
        GK: byPos('GK'),
        DEF: byPos('DEF'),
        MID: byPos('MID'),
        FWD: byPos('FWD'),
      },
      bestOverall,
    }
  },[players])
  
  // Compétitions disponibles
  const availableCompetitions = useMemo(() => {
    const competitions = new Set<string>()
    matches.forEach(match => {
      if (match.competition) {
        competitions.add(match.competition)
      }
    })
    return Array.from(competitions).sort()
  }, [matches])

  // Données filtrées par tous les critères
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Filtre domicile/extérieur
      if (matchFilter !== 'all') {
        if (matchFilter === 'home' && !m.home) return false
        if (matchFilter === 'away' && m.home) return false
      }
      
      // Filtre compétition
      if (competitionFilter !== 'all') {
        const competition = m.competition || 'Sans compétition'
        if (competition !== competitionFilter) return false
      }
      
      // Filtre période
      if (timeFrameFilter !== 'all') {
        const matchDate = new Date(m.date)
        const now = new Date()
        
        if (timeFrameFilter === 'current-season') {
          // Considère septembre comme début de saison
          const seasonStart = new Date(now.getFullYear(), 8, 1) // Septembre = mois 8
          if (now.getMonth() < 8) {
            seasonStart.setFullYear(now.getFullYear() - 1)
          }
          if (matchDate < seasonStart) return false
        }
        
        if (timeFrameFilter === 'last-3-months') {
          const threeMonthsAgo = new Date()
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
          if (matchDate < threeMonthsAgo) return false
        }
      }
      
      return true
    })
  }, [matches, matchFilter, competitionFilter, timeFrameFilter])
  
  const filteredMatchIds = useMemo(() => {
    return new Set(filteredMatches.map(m => m.id))
  }, [filteredMatches])
  
  const filteredMatchStats = useMemo(() => {
    // Appliquer tous les filtres (pas seulement matchFilter)
    if (areAllFiltersDisabled(matchFilter, competitionFilter, timeFrameFilter)) {
      return matchStats
    }
    return matchStats.filter(s => filteredMatchIds.has(s.matchId))
  }, [matchStats, filteredMatchIds, matchFilter, competitionFilter, timeFrameFilter])
  
  const filteredRatings = useMemo(() => {
    // Appliquer tous les filtres (pas seulement matchFilter)
    if (areAllFiltersDisabled(matchFilter, competitionFilter, timeFrameFilter)) {
      return playerRatings
    }
    return playerRatings.filter(r => filteredMatchIds.has(r.matchId))
  }, [playerRatings, filteredMatchIds, matchFilter, competitionFilter, timeFrameFilter])
  
  const clubStats = useMemo(() => {
    if (filteredMatchStats.length === 0) return null
    
    // Debug en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎛️ Filtres actifs - Matchs: ${filteredMatches.length}, Stats: ${filteredMatchStats.length}, Ratings: ${filteredRatings.length}`)
    }
    
    const totalGoals = filteredMatchStats.reduce((sum, s) => sum + (s.goals || 0), 0)
    const totalAssists = filteredMatchStats.reduce((sum, s) => sum + (s.assists || 0), 0)
    const totalYellowCards = filteredMatchStats.reduce((sum, s) => sum + (s.yellowCards || 0), 0)
    const totalRedCards = filteredMatchStats.reduce((sum, s) => sum + (s.redCards || 0), 0)
    const totalCleanSheets = filteredMatchStats.reduce((sum, s) => sum + (s.cleanSheet ? 1 : 0), 0)
    const totalMinutes = filteredMatchStats.reduce((sum, s) => sum + (s.minutes || 0), 0)
    // Ne compter que les matchs terminés (passés)
    const matchesPlayed = countFinishedMatches(filteredMatches)
    const playersWithStats = new Set(filteredMatchStats.map(s => s.playerId)).size
    
    // Top performers
    const playerGoals = filteredMatchStats.reduce((acc, s) => {
      if (!acc[s.playerId]) acc[s.playerId] = { goals: 0, assists: 0, matches: 0 }
      acc[s.playerId].goals += s.goals || 0
      acc[s.playerId].assists += s.assists || 0
      acc[s.playerId].matches += 1
      return acc
    }, {} as Record<string, {goals: number, assists: number, matches: number}>)
    
    const topScorer = Object.entries(playerGoals).reduce((best, [playerId, stats]) => {
      if (stats.goals > (best?.stats.goals || 0)) {
        const player = players.find(p => p.id === playerId)
        return player ? { player, stats } : best
      }
      return best
    }, null as {player: Player, stats: {goals: number, assists: number, matches: number}} | null)
    
    const topAssist = Object.entries(playerGoals).reduce((best, [playerId, stats]) => {
      if (stats.assists > (best?.stats.assists || 0)) {
        const player = players.find(p => p.id === playerId)
        return player ? { player, stats } : best
      }
      return best
    }, null as {player: Player, stats: {goals: number, assists: number, matches: number}} | null)
    
    return {
      totalGoals,
      totalAssists,
      totalYellowCards,
      totalRedCards,
      totalCleanSheets,
      totalMinutes,
      matchesPlayed,
      playersWithStats,
      avgGoalsPerMatch: matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(1) : '0.0',
      avgAssistsPerMatch: matchesPlayed > 0 ? (totalAssists / matchesPlayed).toFixed(1) : '0.0',
      topScorer,
      topAssist
    }
  }, [filteredMatchStats, filteredMatches, players])
  
  const ratingsStats = useMemo(() => {
    if (filteredRatings.length === 0) return null
    
    // Grouper par joueur puis par match pour calculer les moyennes par match
    const playerMatchRatings = filteredRatings.reduce((acc, rating) => {
      if (!acc[rating.ratedPlayerId]) {
        acc[rating.ratedPlayerId] = {}
      }
      if (!acc[rating.ratedPlayerId][rating.matchId]) {
        acc[rating.ratedPlayerId][rating.matchId] = []
      }
      acc[rating.ratedPlayerId][rating.matchId].push(rating.rating)
      return acc
    }, {} as Record<string, Record<string, number[]>>)
    
    // Calculer les moyennes par match pour chaque joueur
    const playerMatchAverages = Object.entries(playerMatchRatings).reduce((acc, [playerId, matchRatings]) => {
      acc[playerId] = Object.values(matchRatings).map(ratings => 
        Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
      )
      return acc
    }, {} as Record<string, number[]>)
    
    // Statistiques globales basées sur les moyennes par match
    const allMatchAverages = Object.values(playerMatchAverages).flat()
    const totalRatings = filteredRatings.length
    const overallAverage = allMatchAverages.length > 0 ? 
      Math.round((allMatchAverages.reduce((sum, avg) => sum + avg, 0) / allMatchAverages.length) * 10) / 10 : 0
    const playersRated = Object.keys(playerMatchAverages).length
    
    // Meilleur joueur basé sur la moyenne de ses moyennes par match
    const bestRatedPlayer = Object.entries(playerMatchAverages)
      .reduce((best, [playerId, matchAvgs]) => {
        const playerAverage = Math.round((matchAvgs.reduce((sum, avg) => sum + avg, 0) / matchAvgs.length) * 10) / 10
        if (playerAverage > (best?.average || 0)) {
          const player = players.find(p => p.id === playerId)
          return player ? { player, average: playerAverage, count: matchAvgs.length } : best
        }
        return best
      }, null as { player: Player; average: number; count: number } | null)
    
    return {
      totalRatings,
      overallAverage,
      playersRated,
      bestRatedPlayer
    }
  }, [filteredRatings, players])
  
  const topRatedPlayers = useMemo(() => {
    if (filteredRatings.length === 0) return []
    
    // Grouper par joueur puis par match
    const playerMatchRatings = filteredRatings.reduce((acc, rating) => {
      if (!acc[rating.ratedPlayerId]) {
        acc[rating.ratedPlayerId] = {}
      }
      if (!acc[rating.ratedPlayerId][rating.matchId]) {
        acc[rating.ratedPlayerId][rating.matchId] = []
      }
      acc[rating.ratedPlayerId][rating.matchId].push(rating.rating)
      return acc
    }, {} as Record<string, Record<string, number[]>>)
    
    // Calculer les moyennes par match puis la moyenne générale
    return Object.entries(playerMatchRatings)
      .map(([playerId, matchRatings]) => {
        const player = players.find(p => p.id === playerId)
        if (!player) return null
        
        const matchAverages = Object.values(matchRatings).map(ratings => 
          Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
        )
        const playerAverage = Math.round((matchAverages.reduce((sum, avg) => sum + avg, 0) / matchAverages.length) * 10) / 10
        
        return {
          ...player,
          averageRating: playerAverage,
          ratingsCount: Object.values(matchRatings).reduce((sum, ratings) => sum + ratings.length, 0),
          matchesRated: matchAverages.length
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.averageRating || 0) - (a?.averageRating || 0))
      .slice(0, 10)
  }, [filteredRatings, players])

  const metrics: { key: MetricKey; label: string; emoji: string }[] = [
    { key: 'rating', label: 'Note', emoji: '📊' },
    { key: 'pace', label: 'Vitesse', emoji: '💨' },
    { key: 'shooting', label: 'Tir', emoji: '⚽' },
    { key: 'passing', label: 'Passes', emoji: '🎯' },
    { key: 'dribbling', label: 'Dribble', emoji: '🎭' },
    { key: 'defense', label: 'Défense', emoji: '🛡️' },
    { key: 'physical', label: 'Physique', emoji: '💪' },
  ]

  const topForMetric = useMemo(()=>{
    const list = [...players]
      .sort((a,b)=> Number(b[metric]) - Number(a[metric]) || b.rating - a.rating)
      .slice(0,8)
    return list
  },[players, metric])

  if (loading) {
    return (
      <section className="container py-16 text-center">
        <div className="text-zinc-400">Chargement des statistiques...</div>
      </section>
    )
  }

  return (
    <>
      <section className="relative py-16">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              Statistiques de l'Équipe
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Aperçu des performances individuelles et du collectif du Sporting Red Horse
            </p>
          </div>
          
          {/* Filtres avancés */}
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🎛️ Filtres
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Filtre domicile/extérieur */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Type de match</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'all', label: 'Tous', emoji: '🏟️' },
                    { key: 'home', label: 'Domicile', emoji: '🏠' },
                    { key: 'away', label: 'Extérieur', emoji: '✈️' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setMatchFilter(filter.key as 'all' | 'home' | 'away')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        matchFilter === filter.key
                          ? 'bg-redhorse-gold/20 border-redhorse-gold text-redhorse-gold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-redhorse-gold/40'
                      }`}
                    >
                      <span className="mr-1">{filter.emoji}</span>
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre compétition */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Compétition</label>
                <select
                  value={competitionFilter}
                  onChange={(e) => setCompetitionFilter(e.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
                >
                  <option value="all">🏆 Toutes les compétitions</option>
                  {availableCompetitions.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                  <option value="Sans compétition">Sans compétition</option>
                </select>
              </div>

              {/* Filtre période */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Période</label>
                <select
                  value={timeFrameFilter}
                  onChange={(e) => setTimeFrameFilter(e.target.value as 'all' | 'current-season' | 'last-3-months')}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
                >
                  <option value="all">📅 Toutes les périodes</option>
                  <option value="current-season">🗓️ Saison en cours</option>
                  <option value="last-3-months">📆 3 derniers mois</option>
                </select>
              </div>
            </div>

            {/* Bouton reset + compteur */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-zinc-400">
                <span className="font-semibold text-redhorse-gold">{filteredMatches.length}</span> 
                {filteredMatches.length === 1 ? ' match' : ' matchs'} sélectionné{filteredMatches.length > 1 ? 's' : ''}
                {filteredMatches.length !== matches.length && (
                  <span className="text-zinc-500"> sur {matches.length}</span>
                )}
              </div>
              <button
                onClick={() => {
                  setMatchFilter('all')
                  setCompetitionFilter('all')
                  setTimeFrameFilter('all')
                }}
                className="text-sm text-zinc-400 hover:text-zinc-300 underline"
              >
                ↻ Réinitialiser
              </button>
            </div>
          </div>

          {/* Statistiques globales du club */}
          {clubStats && (
            <div className="glass-effect rounded-2xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                🏆 Statistiques du Club
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatTile title="Buts marqués" value={clubStats.totalGoals} subtitle={`Moy. ${clubStats.avgGoalsPerMatch}/match`} icon="⚽" />
                <StatTile title="Passes décisives" value={clubStats.totalAssists} subtitle={`Moy. ${clubStats.avgAssistsPerMatch}/match`} icon="🎯" />
                <StatTile title="Matchs joués" value={clubStats.matchesPlayed} subtitle={`${clubStats.playersWithStats} joueurs actifs`} icon="🏟️" />
                <StatTile title="Clean Sheets" value={clubStats.totalCleanSheets} subtitle="Défense solide" icon="🥅" />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {clubStats.topScorer && (
                  <div className="feature-card rounded-xl p-4">
                    <div className="text-sm text-zinc-400 mb-2 font-medium flex items-center gap-2">
                      ⚽ Meilleur buteur
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-redhorse-gold">{clubStats.topScorer.stats.goals}</div>
                      <div>
                        <div className="text-white font-semibold">{clubStats.topScorer.player.name}</div>
                        <div className="text-xs text-zinc-400">{clubStats.topScorer.stats.matches} matchs</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {clubStats.topAssist && (
                  <div className="feature-card rounded-xl p-4">
                    <div className="text-sm text-zinc-400 mb-2 font-medium flex items-center gap-2">
                      🎯 Meilleur passeur
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-blue-400">{clubStats.topAssist.stats.assists}</div>
                      <div>
                        <div className="text-white font-semibold">{clubStats.topAssist.player.name}</div>
                        <div className="text-xs text-zinc-400">{clubStats.topAssist.stats.matches} matchs</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {(clubStats.totalYellowCards > 0 || clubStats.totalRedCards > 0) && (
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  {clubStats.totalYellowCards > 0 && (
                    <div className="feature-card rounded-xl p-4">
                      <div className="text-sm text-zinc-400 mb-1 font-medium">🟨 Cartons jaunes</div>
                      <div className="text-2xl font-bold text-yellow-400">{clubStats.totalYellowCards}</div>
                    </div>
                  )}
                  {clubStats.totalRedCards > 0 && (
                    <div className="feature-card rounded-xl p-4">
                      <div className="text-sm text-zinc-400 mb-1 font-medium">🟥 Cartons rouges</div>
                      <div className="text-2xl font-bold text-red-400">{clubStats.totalRedCards}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Statistiques des notes */}
          {ratingsStats && (
            <div className="glass-effect rounded-2xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                ⭐ Notes des Joueurs
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatTile title="Notes données" value={ratingsStats.totalRatings} subtitle="Total" icon="📝" />
                <StatTile title="Moyenne générale" value={ratingsStats.overallAverage} subtitle="Sur 10" icon="⭐" />
                {ratingsStats.bestRatedPlayer && (
                  <>
                    <div className="feature-card rounded-xl p-4">
                      <div className="text-sm text-zinc-400 mb-2 font-medium flex items-center gap-2">
                        🏆 Meilleur joueur
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-redhorse-gold">{ratingsStats.bestRatedPlayer.average}</div>
                        <div>
                          <div className="text-white font-semibold">{ratingsStats.bestRatedPlayer.player.name}</div>
                          <div className="text-xs text-zinc-400">{ratingsStats.bestRatedPlayer.count} notes</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Statistiques individuelles des joueurs */}
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              👤 Profils Joueurs
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile title="Joueurs" value={overview.numPlayers} subtitle="Effectif total" icon="👥" />
              <StatTile title="Note moyenne" value={overview.avgRating} subtitle="Équipe" icon="📊" />
              <StatTile title="Meilleur joueur" value={overview.bestOverall?.rating ?? 0} subtitle={overview.bestOverall?.name || '—'} icon="🏅" />
              <div className="feature-card rounded-xl p-4">
                <div className="text-sm text-zinc-400 mb-2 font-medium">Répartition par poste</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <MiniTile label="GK" value={overview.byPos.GK} />
                  <MiniTile label="DEF" value={overview.byPos.DEF} />
                  <MiniTile label="MID" value={overview.byPos.MID} />
                  <MiniTile label="FWD" value={overview.byPos.FWD} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="text-sm font-medium text-zinc-300">Classement par attribut:</div>
              <div className="flex flex-wrap gap-2">
                {metrics.map(m => (
                  <button
                    key={m.key}
                    onClick={()=> setMetric(m.key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${metric === m.key ? 'bg-redhorse-gold/20 border-redhorse-gold text-redhorse-gold' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-redhorse-gold/40'}`}
                  >
                    <span className="mr-1">{m.emoji}</span>{m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard current metric */}
          <article className="feature-card rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-white">
              {metrics.find(m=>m.key===metric)?.emoji} Top {metrics.find(m=>m.key===metric)?.label} (Attributs)
            </h3>
            <ul className="space-y-3">
              {topForMetric.map((p, idx)=> (
                <li key={p.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx===0?'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900': 'bg-zinc-700 text-zinc-200'}`}>{idx+1}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{p.name} <span className="text-xs text-zinc-400">({p.position})</span></div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-redhorse-gold to-redhorse-red" style={{ width: `${Math.min(100, Number(p[metric]))}%` }} />
                    </div>
                  </div>
                  <div className="w-12 text-right font-bold text-redhorse-gold">{Number(p[metric])}</div>
                </li>
              ))}
              {topForMetric.length === 0 && (
                <div className="text-sm text-zinc-400">Aucune donnée disponible</div>
              )}
            </ul>
          </article>

          {/* Top rated players */}
          {topRatedPlayers.length > 0 ? (
            <article className="feature-card rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-white">
                ⭐ Top Joueurs Notés (Performances en match)
              </h3>
              <ul className="space-y-3">
                {topRatedPlayers.map((p, idx)=> p && (
                  <li key={p.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx===0?'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900': 'bg-zinc-700 text-zinc-200'}`}>{idx+1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{p.name} <span className="text-xs text-zinc-400">({p.position})</span></div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600" style={{ width: `${Math.min(100, (p.averageRating / 10) * 100)}%` }} />
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{p.matchesRated} match{(p.matchesRated || 0) > 1 ? 's' : ''} • {p.ratingsCount} note{p.ratingsCount > 1 ? 's' : ''}</div>
                    </div>
                    <div className="w-12 text-right font-bold text-yellow-400">{p.averageRating}</div>
                  </li>
                ))}
              </ul>
            </article>
          ) : (
            <article className="feature-card rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-white">Moyennes par attribut</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {metrics.map(m=> (
                  <div key={m.key} className="glass-effect rounded-lg p-4">
                    <div className="text-sm text-zinc-400 mb-1">{m.emoji} {m.label}</div>
                    <div className="text-2xl font-bold text-redhorse-gold">
                      {m.key==='rating' ? overview.avgRating :
                       m.key==='pace' ? overview.avgPace :
                       m.key==='shooting' ? overview.avgShooting :
                       m.key==='passing' ? overview.avgPassing :
                       m.key==='dribbling' ? overview.avgDribbling :
                       m.key==='defense' ? overview.avgDefense : overview.avgPhysical}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  )
}

function StatTile({ title, value, subtitle, icon }: { title: string; value: number | string; subtitle?: string; icon?: string }){
  return (
    <div className="feature-card rounded-xl p-4">
      <div className="text-sm text-zinc-400 mb-1 font-medium">{icon ? <span className="mr-2">{icon}</span> : null}{title}</div>
      <div className="text-3xl font-extrabold text-redhorse-gold">{value}</div>
      {subtitle && <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>}
    </div>
  )
}

function MiniTile({ label, value }: { label: string; value: number }){
  return (
    <div className="rounded-lg bg-zinc-900/60 border border-zinc-700 p-2">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  )
}

