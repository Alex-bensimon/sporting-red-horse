"use client"
import { useAuth } from '@/lib/auth-context'
import { getMatches, getMatchPlayerStats, getMatchSheet, getPlayers, upsertMatchPlayerStats } from '@/lib/store'
import type { Match, MatchPlayerStats, MatchSheet, Player } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function CaptainStatsClient({ matchId }: { matchId: string }){
  const { isAuthenticated, isCaptain, currentPlayer } = useAuth()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [matchSheet, setMatchSheet] = useState<MatchSheet | null>(null)
  const [existing, setExisting] = useState<Record<string, Partial<MatchPlayerStats>>>({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(()=>{
    async function load(){
      const [matches, allPlayers, sheet, existingStats] = await Promise.all([
        getMatches(),
        getPlayers(),
        getMatchSheet(matchId),
        getMatchPlayerStats(matchId),
      ])
      setMatch(matches.find(m=>m.id===matchId) || null)
      setPlayers(allPlayers)
      setMatchSheet(sheet)
      const map: Record<string, Partial<MatchPlayerStats>> = {}
      existingStats.forEach(s=> { map[s.playerId] = s })
      setExisting(map)
    }
    load()
  },[matchId])

  const actualPlayers = useMemo(()=> (matchSheet?.actualPlayers || [])
    .map(id => players.find(p=>p.id===id))
    .filter(Boolean) as Player[]
  ,[matchSheet, players])

  if (!isAuthenticated || !isCaptain) {
    return (
      <section className="container py-12">
        <div className="text-center glass-effect p-6 rounded-2xl">
          Accès réservé aux capitaines
        </div>
      </section>
    )
  }

  if (!match || !matchSheet) {
    return (
      <section className="container py-12">
        <div className="text-center">Chargement…</div>
      </section>
    )
  }

  async function saveAll(){
    if (!currentPlayer) {
      setSaveError('Vous devez être connecté pour sauvegarder')
      return
    }
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    try{
      const ops = actualPlayers.map(p=> upsertMatchPlayerStats({
        matchId,
        playerId: p.id,
        goals: Number(existing[p.id]?.goals || 0),
        assists: Number(existing[p.id]?.assists || 0),
        yellowCards: Number(existing[p.id]?.yellowCards || 0),
        redCards: Number(existing[p.id]?.redCards || 0),
        minutes: Number(existing[p.id]?.minutes || 0),
        createdBy: currentPlayer.id,
        lastModifiedBy: currentPlayer.id,
      }))
      await Promise.all(ops)
      setSaveSuccess(true)
      setTimeout(() => {
        router.push(`/matches/${matchId}/details`)
      }, 1500)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  function setField(playerId: string, key: keyof MatchPlayerStats, value: any){
    setExisting(prev=> ({ ...prev, [playerId]: { ...prev[playerId], [key]: value }}))
  }

  return (
    <>
      <section className="relative py-10">
        <div className="hero-bg" />
        <div className="container relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">Statistiques du match</h2>
            <div className="text-zinc-400">{new Date(match.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'long'})} • {match.opponent}</div>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {actualPlayers.map(p=> (
            <div key={p.id} className="glass-effect rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-white">{p.name}</div>
                <div className="text-xs text-zinc-400">{p.position}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <NumberField label="Buts" value={Number(existing[p.id]?.goals || 0)} onChange={v=> setField(p.id,'goals', v)} />
                <NumberField label="Passes D." value={Number(existing[p.id]?.assists || 0)} onChange={v=> setField(p.id,'assists', v)} />
                <NumberField label="Jaunes" value={Number(existing[p.id]?.yellowCards || 0)} onChange={v=> setField(p.id,'yellowCards', v)} />
                <NumberField label="Rouges" value={Number(existing[p.id]?.redCards || 0)} onChange={v=> setField(p.id,'redCards', v)} />
                <NumberField label="Minutes" value={Number(existing[p.id]?.minutes || 0)} onChange={v=> setField(p.id,'minutes', v)} />
              </div>
            </div>
          ))}

          <div className="text-center pt-2 space-y-2">
            <button onClick={saveAll} disabled={saving} className="btn-primary rounded-lg px-6 py-3 text-white font-semibold disabled:opacity-50">
              {saving ? 'Sauvegarde…' : 'Enregistrer toutes les stats'}
            </button>
            {saveSuccess && (
              <div className="text-green-400 font-medium">
                ✅ Statistiques enregistrées avec succès !
              </div>
            )}
            {saveError && (
              <div className="text-red-400 font-medium">
                ❌ {saveError}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function NumberField({ label, value, onChange }:{ label:string; value:number; onChange:(v:number)=>void }){
  return (
    <div>
      <div className="text-xs text-zinc-400 mb-1">{label}</div>
      <input type="number" value={value} onChange={e=> onChange(Number(e.target.value || 0))} className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white" />
    </div>
  )
}

