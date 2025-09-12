"use client"
import { useAuth } from '@/lib/auth-context'
import { createMatch, getMatches, getMatchSheet } from '@/lib/store'
import type { Match, MatchSheet } from '@/lib/types'
import { useEffect, useMemo, useState } from 'react'

export default function SchedulePage(){
  const { isAuthenticated, isCaptain } = useAuth()
  const [q,setQ] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [matchSheets, setMatchSheets] = useState<Record<string, MatchSheet>>({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ date: '', time: '19:00', opponent: '', home: true, location: '', competition: '' })
  
  // Valeurs uniques pour l'autocomplétion
  const uniqueOpponents = useMemo(() => [...new Set(matches.map(m => m.opponent).filter(Boolean))], [matches])
  const uniqueLocations = useMemo(() => [...new Set(matches.map(m => m.location).filter(Boolean))], [matches])
  const uniqueCompetitions = useMemo(() => [...new Set(matches.map(m => m.competition).filter(Boolean))], [matches])

  useEffect(() => {
    async function loadData() {
      try {
        const allMatches = await getMatches()
        setMatches(allMatches)
        
        const sheetsPromises = allMatches.map(async (match) => {
          const sheet = await getMatchSheet(match.id)
          return { matchId: match.id, sheet }
        })
        
        const sheetsResults = await Promise.all(sheetsPromises)
        const sheetsMap: Record<string, MatchSheet> = {}
        sheetsResults.forEach(({ matchId, sheet }) => {
          if (sheet) sheetsMap[matchId] = sheet
        })
        setMatchSheets(sheetsMap)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const filteredMatches = useMemo(()=> matches.filter(m => !q || `${m.opponent} ${m.location} ${m.competition||''}`.toLowerCase().includes(q.toLowerCase())),[matches, q])

  function exportICS(){
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SRH//Calendar//FR']
    filteredMatches.forEach(m=>{
      const start = new Date(`${m.date}T${(m.time||'19:00')}:00`)
      const end = new Date(start.getTime()+90*60000)
      const fmt = (d:Date)=> d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${m.id}@srh`)
      lines.push(`DTSTAMP:${fmt(new Date())}`)
      lines.push(`DTSTART:${fmt(start)}`)
      lines.push(`DTEND:${fmt(end)}`)
      lines.push(`SUMMARY:SRH vs ${m.opponent}${m.home?' (Domicile)':' (Extérieur)'}`)
      lines.push(`LOCATION:${m.location}`)
      if (m.competition) lines.push(`CATEGORIES:${m.competition}`)
      lines.push('END:VEVENT')
    })
    lines.push('END:VCALENDAR')
    const blob = new Blob([lines.join('\n')],{type:'text/calendar'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'srh-calendrier.ics'
    a.click();
  }

  if (loading) {
    return (
      <section className="container py-16 text-center">
        <div className="text-zinc-400">Chargement du calendrier...</div>
      </section>
    )
  }

  return (
    <>
      <section className="relative py-16">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              Calendrier des Matchs
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Retrouvez tous nos prochains matchs et exportez votre calendrier personnel
            </p>
          </div>
          
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <input 
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-400 focus:border-redhorse-gold focus:outline-none focus:ring-2 focus:ring-redhorse-gold/20" 
                  placeholder="🔍 Rechercher par équipe, lieu ou compétition..." 
                  value={q} 
                  onChange={e=>setQ(e.target.value)} 
                />
              </div>
              <button 
                onClick={exportICS} 
                className="btn-secondary rounded-lg px-6 py-3 font-semibold whitespace-nowrap"
              >
                📅 Exporter .ics
              </button>
              {isCaptain && (
                <button onClick={()=> setShowAdd(v=>!v)} className="btn-primary rounded-lg px-6 py-3 font-semibold whitespace-nowrap">
                  ➕ Ajouter un match
                </button>
              )}
            </div>
          </div>

          {isCaptain && showAdd && (
            <div className="glass-effect rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Nouveau match</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input 
                  type="date" 
                  className="input" 
                  value={draft.date} 
                  onChange={e=> setDraft({...draft, date: e.target.value})} 
                />
                <input 
                  type="time" 
                  className="input" 
                  value={draft.time} 
                  onChange={e=> setDraft({...draft, time: e.target.value})} 
                />
                <div className="relative">
                  <input 
                    className="input w-full" 
                    placeholder="Adversaire" 
                    value={draft.opponent} 
                    onChange={e=> setDraft({...draft, opponent: e.target.value})}
                    list="opponents-list"
                  />
                  <datalist id="opponents-list">
                    {uniqueOpponents.map(opponent => (
                      <option key={opponent} value={opponent} />
                    ))}
                  </datalist>
                </div>
                <div className="relative">
                  <input 
                    className="input w-full" 
                    placeholder="Lieu" 
                    value={draft.location} 
                    onChange={e=> setDraft({...draft, location: e.target.value})}
                    list="locations-list"
                  />
                  <datalist id="locations-list">
                    {uniqueLocations.map(location => (
                      <option key={location} value={location} />
                    ))}
                  </datalist>
                </div>
                <div className="relative">
                  <input 
                    className="input w-full" 
                    placeholder="Compétition (optionnel)" 
                    value={draft.competition} 
                    onChange={e=> setDraft({...draft, competition: e.target.value})}
                    list="competitions-list"
                  />
                  <datalist id="competitions-list">
                    {uniqueCompetitions.map(competition => (
                      <option key={competition} value={competition} />
                    ))}
                  </datalist>
                </div>
                <label className="text-sm text-zinc-300 flex items-center gap-2">
                  <input type="checkbox" checked={draft.home} onChange={e=> setDraft({...draft, home: e.target.checked})} /> 
                  Domicile
                </label>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="btn-primary rounded-lg px-6 py-3" onClick={async()=>{
                  const payload = { ...draft }
                  if (!payload.date || !payload.opponent || !payload.location){ alert('Champs requis manquants'); return }
                  await createMatch(payload as any)
                  const ms = await getMatches(); setMatches(ms); setShowAdd(false); setDraft({ date: '', time: '19:00', opponent: '', home: true, location: '', competition: '' })
                }}>Enregistrer</button>
                <button className="btn-secondary rounded-lg px-6 py-3" onClick={()=> setShowAdd(false)}>Annuler</button>
              </div>
              <style jsx>{`
                .input{ border-radius:.5rem; border:1px solid rgb(63 63 70); background:rgba(24,24,27,.5); padding:.75rem 1rem; color:white; }
              `}</style>
            </div>
          )}
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.sort((a,b)=> a.date.localeCompare(b.date)).map(m=> {
            const hasSheet = matchSheets[m.id]
            const isPast = new Date(m.date) < new Date()
            
            return (
              <article key={m.id} className="feature-card rounded-2xl p-6 group relative cursor-pointer hover:scale-105 transition-transform" onClick={() => window.location.href = `/matches/${m.id}/details`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="text-sm text-redhorse-gold font-medium">
                      {new Date(m.date).toLocaleDateString('fr-FR',{weekday:'long', day:'numeric', month:'long'})}
                    </div>
                    <div className="text-2xl font-bold text-zinc-400">
                      {m.time||'19:00'}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${m.home ? 'bg-redhorse-gold/20 text-redhorse-gold' : 'bg-redhorse-red/20 text-redhorse-red'}`}>
                    {m.home ? '🏠 Domicile' : '✈️ Extérieur'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-redhorse-gold to-redhorse-red rounded-full flex items-center justify-center text-sm font-bold">
                      SRH
                    </div>
                    <span className="text-lg font-bold">vs</span>
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {m.opponent.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white group-hover:text-redhorse-gold transition-colors">
                    {m.opponent}
                  </h3>
                  
                  <div className="flex items-center text-zinc-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    {m.location}
                  </div>
                  
                  {m.competition && (
                    <div className="inline-block px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium">
                      🏆 {m.competition}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {hasSheet && (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Feuille validée
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a
                        href={`/matches/${m.id}/details`}
                        className="text-xs font-medium text-redhorse-gold hover:text-redhorse-gold/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📋 Détails
                      </a>
                      <a
                        href={`/matches/${m.id}`}
                        className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⚡ Composer
                      </a>
                      {isPast && hasSheet && isAuthenticated && (
                        <a
                          href={`/matches/${m.id}/ratings`}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⭐ Noter
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {isPast && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded-full text-xs">
                    Terminé
                  </div>
                )}
              </article>
            )
          })}
        </div>
        
        {filteredMatches.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-xl font-bold text-zinc-400 mb-2">Aucun match trouvé</h3>
            <p className="text-zinc-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </section>
    </>
  )
}

