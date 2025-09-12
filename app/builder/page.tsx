"use client"
import { useAuth } from '@/lib/auth-context';
import { createMatchSheet, getFormations, getMatches, getMatchSheet, getPlayers, getPresets } from '@/lib/store';
import { useEffect, useMemo, useState } from 'react';
import { FutCard } from '../../components/FutCard';
import type { Lineup, MatchSheet, Player, Slot, PresetData } from '../../lib/types';

// Formations will be loaded from getFormations() - no more hardcoded data

const STORAGE_KEY = 'srh_lineups_by_match_v1'

export default function BuilderPage(){
  const { isCaptain, isAuthenticated, currentPlayer } = useAuth()
  const [formation,setFormation] = useState<string>('3-2-1')
  const [lineup,setLineup] = useState<Lineup>({})
  const [matchId,setMatchId] = useState<string>('friendly')
  const [players,setPlayers] = useState<any[]>([])
  const [matches,setMatches] = useState<any[]>([])
  const [absentPlayers,setAbsentPlayers] = useState<Set<string>>(new Set())
  const [formations, setFormations] = useState<Record<string, Slot[]>>({})
  const [presets, setPresets] = useState<Record<string, PresetData | string[]>>({})
  const [associating, setAssociating] = useState(false)

  useEffect(()=>{
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try{ 
      const data = JSON.parse(raw); 
      const saved = data[matchId]; 
      if (saved){ 
        setFormation(saved.formation||'3-2-1'); 
        setLineup(saved.lineup||{});
        setAbsentPlayers(new Set(saved.absentPlayers||[]));
      } 
    }catch{}
  },[matchId])

  // Overwrite with validated match sheet if it exists (takes precedence over localStorage)
  useEffect(()=>{
    if (!matchId) return
    getMatchSheet(matchId).then((sheet: MatchSheet | null)=>{
      if (!sheet) return
      const nextFormation = sheet.formationAtValidation || sheet.lineup?.formation || '3-2-1'
      const nextLineup: Lineup = (sheet.startersBySlot || sheet.lineup?.lineup || {}) as Lineup
      setFormation(nextFormation)
      setLineup(nextLineup)
      setAbsentPlayers(new Set(sheet.absentPlayers || []))
    }).catch(()=>{})
  },[matchId])

  useEffect(() => {
    Promise.all([getPlayers(), getMatches(), getFormations(), getPresets()]).then(([players, matches, formations, presets]) => {
      setPlayers(players)
      setMatches(matches)
      setFormations(formations)
      setPresets(presets)
      if(matches[0]) setMatchId(matches[0].id)
    })
  }, [])

  useEffect(()=>{
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data[matchId] = { formation, lineup, absentPlayers: Array.from(absentPlayers) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },[formation,lineup,matchId,absentPlayers])

  function onDrop(targetSlot:string, playerId:string, fromSlot?:string|null){
    setLineup(prev => {
      const next = { ...prev }
      if (fromSlot && fromSlot !== targetSlot) next[fromSlot] = null
      next[targetSlot] = playerId || null
      return next
    })
  }

  const selected = useMemo(()=> new Set(Object.values(lineup).filter(Boolean) as string[]),[lineup])
  const availablePlayers = useMemo(()=> players.filter(p=> !selected.has(p.id) && !absentPlayers.has(p.id)),[selected,players,absentPlayers])
  const absentPlayersList = useMemo(()=> players.filter(p=> absentPlayers.has(p.id)),[players,absentPlayers])
  const filledCount = selected.size
  const totalSlots = useMemo(()=> formations[formation]?.length || 0,[formation, formations])

  function toggleAbsent(playerId: string) {
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
              {isAuthenticated && isCaptain && (
                <button
                  className="ml-auto btn-secondary rounded-lg px-4 py-2 font-semibold disabled:opacity-50"
                  disabled={associating || matchId === 'friendly'}
                  onClick={async ()=>{
                    if (!currentPlayer) return
                    const confirmed = window.confirm("Vous êtes sur le point de modifier la feuille de match pour ce match avec la composition affichée. Continuer ?")
                    if (!confirmed) return
                    setAssociating(true)
                    try{
                      const actualPlayers = Object.values(lineup).filter(Boolean) as string[]
                      const payload: Omit<MatchSheet,'id'|'createdAt'> = {
                        matchId,
                        lineup: { name: 'Builder', formation, lineup },
                        actualPlayers,
                        absentPlayers: Array.from(absentPlayers),
                        startersBySlot: lineup,
                        formationAtValidation: formation,
                        createdBy: currentPlayer.id,
                      }
                      await createMatchSheet(payload)
                      window.location.href = `/matches/${matchId}`
                    } finally {
                      setAssociating(false)
                    }
                  }}
                >Associer à ce match</button>
              )}
            </div>
          </div>

          {/* Réglages de compo */}
          <div className="mb-4 glass-effect rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-zinc-400">Formation</div>
              <select value={formation} onChange={e=>{
                const next = e.target.value
                // Re-affecter les joueurs placés aux nouveaux postes
                try{
                  const currentPlayersIds = Object.values(lineup).filter(Boolean) as string[]
                  const layout = formations[next] || []
                  const result: Lineup = {}
                  const remaining = new Set(currentPlayersIds)
                  // Premier passage: match par poste
                  layout.forEach(slot => {
                    const matchId = Array.from(remaining).find(pid => players.find(p=>p.id===pid)?.position === slot.position)
                    if (matchId){ result[slot.key] = matchId; remaining.delete(matchId) } else { result[slot.key] = null }
                  })
                  // Second passage: remplir les postes restants avec les joueurs restants
                  layout.forEach(slot => {
                    if (!result[slot.key] && remaining.size){ const pid = Array.from(remaining)[0]; result[slot.key] = pid; remaining.delete(pid) }
                  })
                  setLineup(result)
                }catch{}
                setFormation(next)
              }} className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white">
            {Object.keys(formations || {}).map(k=> <option key={k}>{k}</option>)}
          </select>
          <div className="ml-2 text-sm text-zinc-400">Preset</div>
              <select onChange={(e)=>{
            const preset = presets[e.target.value as keyof typeof presets]
            if (!preset) return
            const layout = formations[formation] || []
            const next: Lineup = {}
            
            // Support ancien format (tableau) et nouveau format (objet)
            if (Array.isArray(preset)) {
              layout.forEach((slot, i)=> next[slot.key] = preset[i] || null)
              setLineup(next)
            } else {
              layout.forEach((slot, i)=> next[slot.key] = preset.starters[i] || null)
              setLineup(next)
              setAbsentPlayers(new Set(preset.absent || []))
            }
              }} className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white">
            <option value="">Preset…</option>
            {Object.keys(presets || {}).map(k=> <option key={k} value={k}>{k}</option>)}
          </select>
              <button className="ml-auto btn-secondary rounded-lg px-4 py-2 font-semibold" onClick={()=> setLineup({})}>Vider</button>
              <div className="text-sm text-zinc-400">{filledCount}/{totalSlots} placés</div>
            </div>
          </div>
        <div className="pitch">
          {(formations[formation] || []).map(s => (
            <DropSlot key={s.key} slot={s} playerId={lineup[s.key]||null} players={players} onDrop={onDrop} />
          ))}
        </div>
        </div>
        <div className="space-y-4">
          <div className="glass-effect rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Effectif disponible</h3>
              <span className="text-sm text-zinc-400">{availablePlayers.length} joueurs</span>
            </div>
            <div className="roster-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
              {availablePlayers.map(p=> (
                <div key={p.id} className="relative">
                  <Draggable id={p.id}>
                    <div className="group block transition-all duration-300 hover:scale-105 hover:-translate-y-2 cursor-grab active:cursor-grabbing">
                      <div className="feature-card rounded-2xl p-1">
                        <FutCard p={p} compact />
                      </div>
                    </div>
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
          </div>

          <div className="glass-effect rounded-2xl p-4 border border-red-500/20 bg-red-500/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/>
                </svg>
                Joueurs absents
              </h3>
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
  return (
    <div draggable onDragStart={onDragStart}>{children}</div>
  )
}

