"use client"
import { getLineupsForMatch, getMatches } from '@/lib/store'
import type { Match } from '@/lib/types'
import { useEffect, useState } from 'react'

export default function LineupsByMatch(){
  const [matchId,setMatchId] = useState<string>('')
  const [items,setItems] = useState<any[]>([])
  const [matches,setMatches] = useState<Match[]>([])
  useEffect(()=>{ getMatches().then(ms=>{ setMatches(ms); if (ms[0]) setMatchId(ms[0].id) }) },[])
  useEffect(()=>{ if (matchId) getLineupsForMatch(matchId).then(setItems) },[matchId])
  return (
    <section className="container py-6">
        <div className="mb-3 flex items-center gap-3">
        <h2 className="text-2xl font-bold">Compositions par match</h2>
          <select value={matchId} onChange={e=>setMatchId(e.target.value)} className="ml-auto rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
            {matches.map(m=> <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})} • {m.opponent}</option>)}
          </select>
      </div>
      {items.length===0 ? (
        <div className="text-sm text-zinc-400">Aucune composition enregistrée pour ce match.</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(it=> (
            <li key={it.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-zinc-400">{it.formation}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

