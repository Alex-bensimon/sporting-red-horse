"use client"
import { getMatches, getPlayers } from '@/lib/store';
import { useEffect, useMemo, useState } from 'react';
import { FutCard } from '../../components/FutCard';
import { formations, presets } from '../../lib/data';
import type { Lineup, Player, Slot } from '../../lib/types';

const formationsLocal: Record<string, Slot[]> = {
  '3-2-1': [
    { key:'GK', x:50,y:92, position:'GK' },
    { key:'CB-L', x:25,y:70, position:'DEF' },
    { key:'CB-C', x:50,y:66, position:'DEF' },
    { key:'CB-R', x:75,y:70, position:'DEF' },
    { key:'CM-L', x:35,y:45, position:'MID' },
    { key:'CM-R', x:65,y:45, position:'MID' },
    { key:'ST',   x:50,y:18, position:'FWD' },
  ],
  '2-3-1': [
    { key:'GK', x:50,y:92, position:'GK' },
    { key:'CB-L', x:33,y:70, position:'DEF' },
    { key:'CB-R', x:67,y:70, position:'DEF' },
    { key:'CM-L', x:24,y:46, position:'MID' },
    { key:'CM-C', x:50,y:42, position:'MID' },
    { key:'CM-R', x:76,y:46, position:'MID' },
    { key:'ST',   x:50,y:18, position:'FWD' },
  ],
  '4-2': [
    { key:'GK', x:50,y:92, position:'GK' },
    { key:'LB', x:20,y:72, position:'DEF' },
    { key:'CB-L', x:38,y:68, position:'DEF' },
    { key:'CB-R', x:62,y:68, position:'DEF' },
    { key:'RB', x:80,y:72, position:'DEF' },
    { key:'ST-L', x:38,y:28, position:'FWD' },
    { key:'ST-R', x:62,y:28, position:'FWD' },
  ],
  '3-3': [
    { key:'GK', x:50,y:92, position:'GK' },
    { key:'CB-L', x:30,y:72, position:'DEF' },
    { key:'CB-C', x:50,y:68, position:'DEF' },
    { key:'CB-R', x:70,y:72, position:'DEF' },
    { key:'CM-L', x:32,y:44, position:'MID' },
    { key:'CM-C', x:50,y:40, position:'MID' },
    { key:'CM-R', x:68,y:44, position:'MID' },
  ],
  '1-4-1': [
    { key:'GK', x:50,y:92, position:'GK' },
    { key:'LB', x:28,y:70, position:'DEF' },
    { key:'CB-L', x:40,y:68, position:'DEF' },
    { key:'CB-R', x:60,y:68, position:'DEF' },
    { key:'RB', x:72,y:70, position:'DEF' },
    { key:'DM', x:50,y:46, position:'MID' },
    { key:'ST', x:50,y:18, position:'FWD' },
  ],
}

const STORAGE_KEY = 'srh_lineups_by_match_v1'

export default function BuilderPage(){
  const [formation,setFormation] = useState<string>('3-2-1')
  const [lineup,setLineup] = useState<Lineup>({})
  const [matchId,setMatchId] = useState<string>('friendly')
  const [players,setPlayers] = useState<any[]>([])
  const [matches,setMatches] = useState<any[]>([])

  useEffect(()=>{
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try{ const data = JSON.parse(raw); const saved = data[matchId]; if (saved){ setFormation(saved.formation||'3-2-1'); setLineup(saved.lineup||{});} }catch{}
  },[])

  useEffect(()=>{ getPlayers().then(setPlayers); getMatches().then(ms=>{ setMatches(ms); if(ms[0]) setMatchId(ms[0].id) }) },[])

  useEffect(()=>{
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data[matchId] = { formation, lineup }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },[formation,lineup,matchId])

  function onDrop(targetSlot:string, playerId:string, fromSlot?:string|null){
    setLineup(prev => {
      const next = { ...prev }
      if (fromSlot && fromSlot !== targetSlot) next[fromSlot] = null
      next[targetSlot] = playerId || null
      return next
    })
  }

  const selected = useMemo(()=> new Set(Object.values(lineup).filter(Boolean) as string[]),[lineup])
  const bench = useMemo(()=> players.filter(p=> !selected.has(p.id)),[selected,players])
  const filledCount = selected.size
  const totalSlots = useMemo(()=> formations[formation].length,[formation])

  return (
    <>
      <section className="relative py-10">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">Constructeur de composition</h2>
            <p className="text-zinc-400">Placez vos joueurs sur le terrain, choisissez une formation et associez-la à un match</p>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 pb-12 md:grid-cols-[1.2fr_.8fr]">
        <div>
          {/* Choix du match + associer */}
          <div className="mb-4 glass-effect rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-zinc-400">Match</div>
              <select value={matchId} onChange={e=>{ setMatchId(e.target.value); const raw=localStorage.getItem(STORAGE_KEY); const d=raw?JSON.parse(raw):{}; const saved=d[e.target.value]; setLineup(saved?.lineup||{}); setFormation(saved?.formation||'3-2-1'); }} className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white">
            {matches.map(m=> <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})} • {m.opponent}</option>)}
            <option value="friendly">Amical</option>
          </select>
              <a className="ml-auto btn-secondary rounded-lg px-4 py-2 font-semibold" href={`/matches/${matchId}`}>Associer à ce match</a>
            </div>
          </div>

          {/* Réglages de compo */}
          <div className="mb-4 glass-effect rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-zinc-400">Formation</div>
              <select value={formation} onChange={e=>setFormation(e.target.value)} className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white">
            {Object.keys(formations).map(k=> <option key={k}>{k}</option>)}
          </select>
          <div className="ml-2 text-sm text-zinc-400">Preset</div>
              <select onChange={(e)=>{
            const preset = presets[e.target.value as keyof typeof presets]
            if (!preset) return
            const layout = formations[formation]
            const next: Lineup = {}
            layout.forEach((slot, i)=> next[slot.key] = preset[i] || null)
            setLineup(next)
              }} className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white">
            <option value="">Preset…</option>
            {Object.keys(presets).map(k=> <option key={k} value={k}>{k}</option>)}
          </select>
              <button className="ml-auto btn-secondary rounded-lg px-4 py-2 font-semibold" onClick={()=> setLineup({})}>Vider</button>
              <div className="text-sm text-zinc-400">{filledCount}/{totalSlots} placés</div>
            </div>
          </div>
        <div className="pitch">
          {formations[formation].map(s => (
            <DropSlot key={s.key} slot={s} playerId={lineup[s.key]||null} players={players} onDrop={onDrop} />
          ))}
        </div>
        </div>
        <div className="glass-effect rounded-2xl p-4">
          <h3 className="mb-3 font-semibold text-white">Effectif</h3>
          <div className="roster-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
            {bench.map(p=> (
              <Draggable key={p.id} id={p.id}>
                <div className="group block transition-all duration-300 hover:scale-105 hover:-translate-y-2 cursor-grab active:cursor-grabbing">
                  <div className="feature-card rounded-2xl p-1">
                    <FutCard p={p} compact />
                  </div>
                </div>
              </Draggable>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function DropSlot({ slot, playerId, players, onDrop }:{ slot:Slot; playerId:string|null; players:Player[]; onDrop:(slot:string, playerId:string, fromSlot?:string|null)=>void }){
  function handleDrop(e:React.DragEvent){
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    const from = e.dataTransfer.getData('application/srh-origin') || null
    onDrop(slot.key, id, from)
  }
  const filled = Boolean(playerId)
  return (
    <div
      style={{ left:`calc(${slot.x}% - 60px)`, top:`calc(${slot.y}% - 80px)` }}
      className={`drop-slot ${filled ? 'drop-slot-filled' : ''}`}
    >
      <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop} className="drop-slot-inner">
        {filled ? (
          <div className="relative">
            <button
              type="button"
              className="slot-remove"
              title="Retirer ce joueur"
              onClick={(e)=>{ e.stopPropagation(); onDrop(slot.key, ''); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div
              draggable
              onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', playerId!); e.dataTransfer.setData('application/srh-origin', slot.key) }}
            >
              <FutCard p={players.find(p=>p.id===playerId)!} compact displayPosition={slot.key} detailHref={`/players/${playerId}`} />
            </div>
          </div>
        ) : <span>+ {slot.key}</span>}
      </div>
    </div>
  )
}

function Draggable({ id, children }:{ id:string; children:React.ReactNode }){
  function onDragStart(e:React.DragEvent){ e.dataTransfer.setData('text/plain', id) }
  return (
    <div draggable onDragStart={onDragStart}>{children}</div>
  )
}

