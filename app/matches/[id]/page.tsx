"use client"
import { getMatches } from '@/lib/store'
import type { Match } from '@/lib/types'
import { useEffect, useState } from 'react'
import MatchManager from './match-manager'
import Builder from './partial-builder'

export default function MatchPage({ params }:{ params:{ id:string }}){
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadMatch() {
      const allMatches = await getMatches()
      const foundMatch = allMatches.find(m => m.id === params.id)
      setMatch(foundMatch || null)
      setLoading(false)
    }
    loadMatch()
  }, [params.id])

  if (loading) {
    return (
      <section className="container py-16 text-center">
        <div className="text-zinc-400">Chargement...</div>
      </section>
    )
  }

  if (!match) {
    return <div className="container py-6">Match introuvable.</div>
  }

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
        <MatchManager matchId={match.id} key={`manager-${refreshKey}`} />
        <div className="mt-8">
          <Builder matchId={match.id} onLineupSaved={() => setRefreshKey(prev => prev + 1)} />
        </div>
      </section>
    </>
  )
}

