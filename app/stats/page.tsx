"use client"
import { getPlayers } from '@/lib/store'
import type { Player } from '@/lib/types'
import { useEffect, useMemo, useState } from 'react'

type MetricKey = keyof Pick<Player, 'rating' | 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defense' | 'physical'>

export default function StatsPage(){
  const [players, setPlayers] = useState<Player[]>([])
  const [metric, setMetric] = useState<MetricKey>('rating')

  useEffect(()=>{ getPlayers().then(setPlayers) },[])

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

          <div className="glass-effect rounded-2xl p-6 mb-8">
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
              <div className="text-sm font-medium text-zinc-300">Classement par métrique:</div>
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
              {metrics.find(m=>m.key===metric)?.emoji} Top {metrics.find(m=>m.key===metric)?.label}
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

          {/* Averages by metric */}
          <article className="feature-card rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Moyennes par métrique</h3>
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

