"use client"
import { FutCard } from '@/components/FutCard'
import { formations, players, presets } from '@/lib/data'
import type { Lineup, Slot } from '@/lib/types'
import { useMemo, useState } from 'react'

import { saveLineup } from '@/lib/store'

export default function Builder({ matchId }:{ matchId: string }){
  const [formation,setFormation] = useState<string>('3-2-1')
  const [lineup,setLineup] = useState<Lineup>({})
  const [name,setName] = useState('Compo')
  const selected = useMemo(()=> new Set(Object.values(lineup).filter(Boolean) as string[]),[lineup])
  const bench = useMemo(()=> players.filter(p=> !selected.has(p.id)),[selected])
  const [subs,setSubs] = useState<string[]>([])

  function onDrop(slot:string, playerId:string){ setLineup(prev => ({ ...prev, [slot]: playerId })) }

  const [savedId,setSavedId] = useState<string|null>(null)

  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <input value={name} onChange={e=>setName(e.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2" />
          <select value={formation} onChange={e=>setFormation(e.target.value)} className="ml-auto rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
            {Object.keys(formations).map(k=> <option key={k}>{k}</option>)}
          </select>
          <button className="rounded-md border border-zinc-700 px-3 py-2" onClick={()=> setLineup({})}>Vider</button>
          <select onChange={(e)=>{ const pr = presets[e.target.value as keyof typeof presets]; if (!pr) return; const layout = formations[formation]; const next: Lineup = {}; layout.forEach((slot,i)=> next[slot.key] = pr[i] || null); setLineup(next) }} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
            <option value="">Preset…</option>
            {Object.keys(presets).map(k=> <option key={k} value={k}>{k}</option>)}
          </select>
          <button className="rounded-md bg-redhorse-red px-3 py-2" onClick={async()=>{
            const { id } = await saveLineup({ name, formation, lineup, matchId })
            setSavedId(id)
          }}>Enregistrer</button>
        </div>
        <div className="pitch">
          {formations[formation].map(s => (
            <DropSlot key={s.key} slot={s} playerId={lineup[s.key]||null} onDrop={onDrop} />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
        <h3 className="mb-2 font-semibold">Effectif</h3>
        <div className="roster-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          {bench.map(p=> (
            <Draggable key={p.id} id={p.id}>
              <div className="cursor-grab active:cursor-grabbing"><FutCard p={p} compact /></div>
            </Draggable>
          ))}
        </div>
        <h4 className="mt-3 text-sm font-semibold">Remplaçants sélectionnés</h4>
        <div className="roster-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          {subs.map(id=>{
            const p = players.find(x=>x.id===id)!; return (
              <div key={id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs">{p.name}</div>
            )
          })}
        </div>
        {savedId && <div className="mt-3 text-sm text-emerald-400">Composition enregistrée ({savedId}).</div>}
      </div>
    </div>
  )
}

function DropSlot({ slot, playerId, onDrop }:{ slot:Slot; playerId:string|null; onDrop:(slot:string, playerId:string)=>void }){
  function handleDrop(e:React.DragEvent){ e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (!id) return; onDrop(slot.key, id) }
  return (
    <div style={{ left:`calc(${slot.x}% - 60px)`, top:`calc(${slot.y}% - 80px)` }} className="absolute h-[140px] w-[120px]">
      <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop} className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-white/30 bg-white/5 text-xs text-white/70">
        {playerId ? <FutCard p={players.find(p=>p.id===playerId)!} compact /> : <span>+ {slot.key}</span>}
      </div>
    </div>
  )
}

function Draggable({ id, children }:{ id:string; children:React.ReactNode }){
  function onDragStart(e:React.DragEvent){ e.dataTransfer.setData('text/plain', id) }
  function onDoubleClick(){
    // double-clic pour ajouter en remplaçant (évite une UI complexe)
    const evt = new CustomEvent('srh:add-sub',{ detail:{ id } })
    window.dispatchEvent(evt)
  }
  return (<div draggable onDragStart={onDragStart} onDoubleClick={onDoubleClick}>{children}</div>)
}

