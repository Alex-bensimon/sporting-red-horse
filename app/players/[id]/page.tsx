import { players as localPlayers } from '@/lib/data'
import type { Player } from '@/lib/types'
import localPlayersData from '@data/players.json'

// Required for static export with dynamic route
export function generateStaticParams(){
  return localPlayers.map(p => ({ id: p.id }))
}

export default async function PlayerPage({ params }:{ params:{ id:string }}){
  // Force static data at build time (Cloudflare) to avoid Firebase initialization
  const list = (localPlayersData as Player[])
  const p = list.find(x=> x.id===params.id)
  if (!p) return <section className="container py-16">Joueur introuvable.</section>
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
            <h3 className="mb-4 text-xl font-bold text-white">Statistiques</h3>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Vitesse" value={p.pace} emoji="💨" />
              <Stat label="Tir" value={p.shooting} emoji="⚽" />
              <Stat label="Passes" value={p.passing} emoji="🎯" />
              <Stat label="Dribble" value={p.dribbling} emoji="🎭" />
              <Stat label="Défense" value={p.defense} emoji="🛡️" />
              <Stat label="Physique" value={p.physical} emoji="💪" />
            </ul>
          </div>

          <div className="feature-card rounded-2xl p-6 text-sm text-zinc-300">
            <h3 className="mb-2 text-white font-semibold">Bio</h3>
            <p>
              Joueur du Sporting Red Horse. Ajoutez ici des informations (poste préféré, pied, taille, points forts, historique). Ces données pourront être migrées vers Firestore.
            </p>
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

