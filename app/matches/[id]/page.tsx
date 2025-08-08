import { matches } from '@/lib/data'
import Builder from './partial-builder'

export function generateStaticParams(){
  return matches.map(m => ({ id: m.id }))
}

export default function MatchPage({ params }:{ params:{ id:string }}){
  const match = matches.find(m=> m.id===params.id)
  if (!match) return <div className="container py-6">Match introuvable.</div>
  return (
    <>
      <section className="relative py-10">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
            {new Date(match.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'long'})} • {match.opponent}
          </h2>
          <div className="text-zinc-400 mt-2">{match.home ? 'Domicile' : 'Extérieur'} • {match.location}</div>
        </div>
      </section>
      <section className="container pb-12">
        <Builder matchId={match.id} />
      </section>
    </>
  )
}

