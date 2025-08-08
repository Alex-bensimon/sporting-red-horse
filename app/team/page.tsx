"use client"
import { FutCard } from '@/components/FutCard';
import { getPlayers } from '@/lib/store';
import type { Player } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

export default function TeamPage(){
  const [pos,setPos] = useState<'ALL'|'GK'|'DEF'|'MID'|'FWD'>('ALL')
  const [sort,setSort] = useState<keyof Player>('rating')
  const [players,setPlayers] = useState<Player[]>([])

  useEffect(()=>{ getPlayers().then(setPlayers) },[])

  const filtered = useMemo(()=> players
    .filter(p=> pos==='ALL' || p.position===pos)
    .sort((a,b)=> (Number(b[sort]) - Number(a[sort])) || b.rating-a.rating)
  ,[pos,sort,players])

  return (
    <>
      <section className="relative py-16">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              Notre Équipe
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Découvrez les joueurs du Sporting Red Horse avec leurs statistiques détaillées
            </p>
          </div>

          <div className="glass-effect rounded-2xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-redhorse-gold">{players.length}</div>
                  <div className="text-sm text-zinc-400">Joueurs</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-redhorse-gold">
                    {Math.round(players.reduce((acc, p) => acc + p.rating, 0) / players.length || 0)}
                  </div>
                  <div className="text-sm text-zinc-400">Note Moy.</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-redhorse-gold">
                    {players.filter(p => p.position === 'FWD').length}
                  </div>
                  <div className="text-sm text-zinc-400">Attaquants</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-redhorse-gold">
                    {players.filter(p => p.position === 'DEF').length}
                  </div>
                  <div className="text-sm text-zinc-400">Défenseurs</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-300">Position:</label>
                  <select 
                    className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-white focus:border-redhorse-gold focus:outline-none" 
                    value={pos} 
                    onChange={e=>setPos(e.target.value as any)}
                  >
                    <option value="ALL">🏆 Tous</option>
                    <option value="GK">🥅 Gardiens</option>
                    <option value="DEF">🛡️ Défenseurs</option>
                    <option value="MID">⚡ Milieux</option>
                    <option value="FWD">🎯 Attaquants</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-300">Trier par:</label>
                  <select 
                    className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-white focus:border-redhorse-gold focus:outline-none" 
                    value={String(sort)} 
                    onChange={e=>setSort(e.target.value as any)}
                  >
                    <option value="rating">📊 Note</option>
                    <option value="pace">💨 Vitesse</option>
                    <option value="shooting">⚽ Tir</option>
                    <option value="passing">🎯 Passes</option>
                    <option value="dribbling">🎭 Dribble</option>
                    <option value="defense">🛡️ Défense</option>
                    <option value="physical">💪 Physique</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">
              {pos === 'ALL' ? 'Effectif Complet' : 
               pos === 'GK' ? 'Gardiens' :
               pos === 'DEF' ? 'Défenseurs' :
               pos === 'MID' ? 'Milieux de terrain' :
               'Attaquants'} 
              <span className="ml-2 text-redhorse-gold">({filtered.length})</span>
            </h3>
            <div className="text-sm text-zinc-400">
              Trié par {sort === 'rating' ? 'note globale' : 
                       sort === 'pace' ? 'vitesse' :
                       sort === 'shooting' ? 'tir' :
                       sort === 'passing' ? 'passes' :
                       sort === 'dribbling' ? 'dribble' :
                       sort === 'defense' ? 'défense' : 'physique'}
            </div>
          </div>
        </div>
        
        <div className="team-grid grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] justify-items-center">
          {filtered.map((p, index) => (
            <div key={p.id} className="relative group">
              {index < 3 && (
                <div className={`absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800' :
                    'bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100'}`}>
                  {index + 1}
                </div>
              )}
              <a href={`/players/${p.id}`} className="block transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                <div className="feature-card rounded-2xl p-1">
                  <FutCard p={p} compact />
                </div>
              </a>
            </div>
          ))}
        </div>
        
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-zinc-400 mb-2">Aucun joueur trouvé</h3>
            <p className="text-zinc-500">Aucun joueur ne correspond aux critères sélectionnés</p>
          </div>
        )}
      </section>
    </>
  )
}

