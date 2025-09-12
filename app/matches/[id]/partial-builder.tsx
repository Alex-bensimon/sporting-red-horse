"use client"
import { FutCard } from '@/components/FutCard'
import { getFormations, getPresets } from '@/lib/store'
import type { Lineup, Player, Slot } from '@/lib/types'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/lib/auth-context'
import { createMatchSheet, getMatchSheet, getPlayers, saveLineup, savePreset, updateMatchSheet } from '@/lib/store'

export default function Builder({ matchId, onLineupSaved }:{ matchId: string; onLineupSaved?: () => void }){
  const { isCaptain, currentPlayer } = useAuth()
  const [formation,setFormation] = useState<string>('3-2-1')
  const [lineup,setLineup] = useState<Lineup>({})
  const [name,setName] = useState('Compo')
  const [playersList, setPlayersList] = useState<Player[]>([])
  const [formations, setFormations] = useState<Record<string, Slot[]>>({})
  const [presets, setPresets] = useState<Record<string, string[]>>({})
  
  useEffect(() => {
    async function loadData() {
      const [playersData, formationsData, presetsData, sheet] = await Promise.all([
        getPlayers(),
        getFormations(),
        getPresets(),
        getMatchSheet(matchId)
      ])
      setPlayersList(playersData)
      setFormations(formationsData)
      setPresets(presetsData)
      setMatchSheet(sheet)
      const formationKeys = Object.keys(formationsData || {})
      if (formationKeys.length > 0 && !formationKeys.includes(formation)) {
        setFormation(formationKeys[0])
      }
      // If a match sheet exists for this match, prefill UI (unless user already modified absents)
      if (sheet){
        const nextFormation = sheet.formationAtValidation || sheet.lineup?.formation || formation
        const nextLineup = (sheet.startersBySlot || sheet.lineup?.lineup || {}) as Lineup
        setFormation(nextFormation)
        setLineup(nextLineup)
        if (!hasTouchedAbsent.current) setAbsentPlayers(new Set(sheet.absentPlayers || []))
      }
    }
    loadData()
  }, [matchId])

  const selected = useMemo(()=> new Set(Object.values(lineup).filter(Boolean) as string[]),[lineup])
  const [absentPlayers,setAbsentPlayers] = useState<Set<string>>(new Set())
  // Les remplaçants sont automatiquement tous les joueurs qui ne sont ni titulaires ni absents
  const subs = useMemo(()=> playersList.filter(p=> !selected.has(p.id) && !absentPlayers.has(p.id)).map(p => p.id),[playersList, selected, absentPlayers])
  const bench = useMemo(()=> playersList.filter(p=> !selected.has(p.id) && !absentPlayers.has(p.id)),[playersList, selected, absentPlayers])
  const absentPlayersList = useMemo(()=> playersList.filter(p=> absentPlayers.has(p.id)),[playersList, absentPlayers])

  function onDrop(targetSlot:string, playerId:string, fromSlot?:string|null){
    setLineup(prev => {
      const next = { ...prev }
      if (fromSlot && fromSlot !== targetSlot) next[fromSlot] = null
      next[targetSlot] = playerId || null
      return next
    })
  }

  const hasTouchedAbsent = useRef(false)
  function toggleAbsent(playerId: string) {
    hasTouchedAbsent.current = true
    setAbsentPlayers(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
        setLineup(current => {
          const updated = { ...current }
          Object.keys(updated).forEach(slot => {
            if (updated[slot] === playerId) {
              updated[slot] = null
            }
          })
          return updated
        })
      }
      return next
    })
  }

  const [savedId,setSavedId] = useState<string|null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [matchSheet, setMatchSheet] = useState(null)

  const handleCreateMatchSheet = async () => {
    if (!currentPlayer || !isCaptain) return
    setCreating(true)
    
    try {
      // 1. Enregistrer d'abord la composition
      const { id } = await saveLineup({ 
        name, 
        formation, 
        lineup, 
        matchId, 
        subs, 
        absentPlayers: Array.from(absentPlayers) 
      })
      
      // 2. Enregistrer le preset
      const layout = formations[formation] || []
      const ordered = layout.map(s => lineup[s.key] || null)
      await savePreset({ id: name, formation, playerIds: ordered, bySlot: lineup })
      
      // 3. Créer la feuille de match
      const starters = Object.values(lineup).filter(Boolean) as string[]
      const actualPlayers = [...starters, ...subs]
      const absentPlayersArray = Array.from(absentPlayers)
      
      await createMatchSheet({
        matchId,
        lineup: {
          id,
          name,
          formation,
          lineup,
          subs,
          absentPlayers: absentPlayersArray,
          matchId,
          createdAt: new Date().toISOString()
        },
        actualPlayers,
        absentPlayers: absentPlayersArray,
        startersBySlot: lineup,
        formationAtValidation: formation,
        subs,
        createdBy: currentPlayer.id
      })
      
      setSavedId(id)
      if (onLineupSaved) onLineupSaved()
    } catch (error) {
      console.error('Erreur lors de la création de la feuille de match:', error)
    } finally {
      setCreating(false)
    }
  }

  const canCreateMatchSheet = isCaptain && Object.values(lineup).some(Boolean)
  const hasMatchSheet = Boolean(matchSheet)
  
  const handleUpdateMatchSheet = async () => {
    if (!currentPlayer || !isCaptain || !matchSheet) return
    setUpdating(true)
    
    try {
      const starters = Object.values(lineup).filter(Boolean) as string[]
      const actualPlayers = [...starters, ...subs]
      const absentPlayersArray = Array.from(absentPlayers)
      
      await updateMatchSheet(matchSheet.id!, {
        actualPlayers,
        absentPlayers: absentPlayersArray,
        startersBySlot: lineup,
        formationAtValidation: formation,
        subs,
        lastModifiedBy: currentPlayer.id
      })
      
      if (onLineupSaved) onLineupSaved()
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la feuille de match:', error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={name} onChange={e=>setName(e.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2" />
        <select value={formation} onChange={e=>{
          const next = e.target.value
          try{
            const currentPlayersIds = Object.values(lineup).filter(Boolean) as string[]
            const layout = formations[next] || []
            const result: Lineup = {}
            const remaining = new Set(currentPlayersIds)
            layout.forEach(slot => {
              const matchId = Array.from(remaining).find(pid => playersList.find(p=>p.id===pid)?.position === slot.position)
              if (matchId){ result[slot.key] = matchId; remaining.delete(matchId) } else { result[slot.key] = null }
            })
            layout.forEach(slot => {
              if (!result[slot.key] && remaining.size){ const pid = Array.from(remaining)[0]; result[slot.key] = pid; remaining.delete(pid) }
            })
            setLineup(result)
          }catch{}
          setFormation(next)
        }} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
          {Object.keys(formations || {}).map(k=> <option key={k}>{k}</option>)}
        </select>
        <button className="rounded-md border border-zinc-700 px-3 py-2" onClick={()=> setLineup({})}>Vider</button>
        <select onChange={(e)=>{ const pr = presets[e.target.value as keyof typeof presets]; if (!pr) return; const layout = formations[formation] || []; const next: Lineup = {}; layout.forEach((slot,i)=> next[slot.key] = pr[i] || null); setLineup(next) }} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
          <option value="">Preset…</option>
          {Object.keys(presets || {}).map(k=> <option key={k} value={k}>{k}</option>)}
        </select>
        <button className="rounded-md bg-zinc-700 px-3 py-2" onClick={async()=>{
          const { id } = await saveLineup({ name, formation, lineup, matchId, subs, absentPlayers: Array.from(absentPlayers) })
          // Enregistrer aussi un preset avec mapping par slot
          const layout = formations[formation] || []
          const ordered = layout.map(s => lineup[s.key] || null)
          await savePreset({ id: name, formation, playerIds: ordered, bySlot: lineup })
          setSavedId(id)
          // Notifier le parent que la composition a été sauvée
          if (onLineupSaved) onLineupSaved()
        }}>Enregistrer</button>
        {canCreateMatchSheet && !hasMatchSheet && (
          <button 
            className="rounded-md bg-redhorse-red px-3 py-2 font-semibold" 
            onClick={handleCreateMatchSheet}
            disabled={creating}
          >
            {creating ? '👑 Validation...' : '👑 Valider la feuille de match'}
          </button>
        )}
        {canCreateMatchSheet && hasMatchSheet && (
          <button 
            className="rounded-md bg-blue-600 px-3 py-2 font-semibold" 
            onClick={handleUpdateMatchSheet}
            disabled={updating}
          >
            {updating ? '⏳ Mise à jour...' : '🔄 Mettre à jour la feuille de match'}
          </button>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <div className="pitch">
          {(formations[formation] || []).map(s => (
            <DropSlot key={s.key} slot={s} playerId={lineup[s.key]||null} onDrop={onDrop} players={playersList} />
          ))}
        </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
        <h3 className="mb-2 font-semibold">Effectif</h3>
        <div className="roster-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          {bench.map(p=> (
            <div key={p.id} className="relative">
              <Draggable id={p.id}>
                <div className="cursor-grab active:cursor-grabbing"><FutCard p={p} compact /></div>
              </Draggable>
              <button
                onClick={() => toggleAbsent(p.id)}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors"
                title="Marquer comme absent"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {subs.length > 0 && (
          <>
            <h4 className="mt-3 text-sm font-semibold text-blue-400">🔄 Remplaçants ({subs.length})</h4>
            <div className="roster-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
              {subs.map(id=>{
                const p = playersList.find(x=>x.id===id)!; return (
                  <div key={id} className="rounded-lg border border-blue-800/50 bg-blue-950/30 p-2 text-xs text-blue-300">
                    {p.name}
                  </div>
                )
              })}
            </div>
          </>
        )}
        <div className="glass-effect rounded-2xl p-4 border border-red-500/20 bg-red-500/5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-red-400 flex items-center gap-2">🔴 Joueurs absents</h4>
            <span className="text-sm text-red-400">{absentPlayersList.length} absent{absentPlayersList.length !== 1 ? 's' : ''}</span>
          </div>
          {absentPlayersList.length > 0 ? (
            <div className="roster-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
              {absentPlayersList.map(p=> (
                <div key={p.id} className="relative opacity-60">
                  <div className="cursor-not-allowed">
                    <div className="feature-card rounded-2xl p-1 filter grayscale">
                      <FutCard p={p} compact />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAbsent(p.id)}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors"
                    title="Marquer comme présent"
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-zinc-500">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm">Tous les joueurs sont disponibles</p>
            </div>
          )}
        </div>
        {savedId && <div className="mt-3 text-sm text-emerald-400">Composition enregistrée ({savedId}).</div>}
      </div>
      </div>
    </div>
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
              <FutCard p={players.find(p=>p.id===playerId)!} compact displayPosition={slot.key} detailHref={`/players/${playerId}`} detailPosition="bottom-right" />
            </div>
          </div>
        ) : <span>+ {slot.key}</span>}
      </div>
    </div>
  )
}

function Draggable({ id, children }:{ id:string; children:React.ReactNode }){
  function onDragStart(e:React.DragEvent){ e.dataTransfer.setData('text/plain', id) }
  return (<div draggable onDragStart={onDragStart}>{children}</div>)
}

