"use client"
import { useAuth } from '@/lib/auth-context'
import { createMatch, deleteMatch, getMatches, getMatchSheet, updateMatch } from '@/lib/store'
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
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  
  // Nouveaux filtres
  const [filters, setFilters] = useState({
    homeAway: 'all' as 'all' | 'home' | 'away',
    competition: 'all',
    timeFrame: 'all' as 'all' | 'upcoming' | 'past',
    month: 'all'
  })
  
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

  // Listes pour les filtres
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>()
    matches.forEach(match => {
      const date = new Date(match.date)
      const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      monthsSet.add(monthYear)
    })
    return Array.from(monthsSet).sort()
  }, [matches])

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Filtre par recherche textuelle
      if (q && !`${m.opponent} ${m.location} ${m.competition||''}`.toLowerCase().includes(q.toLowerCase())) {
        return false
      }
      
      // Filtre domicile/extérieur
      if (filters.homeAway !== 'all') {
        if (filters.homeAway === 'home' && !m.home) return false
        if (filters.homeAway === 'away' && m.home) return false
      }
      
      // Filtre compétition
      if (filters.competition !== 'all') {
        const competition = m.competition || 'Sans compétition'
        if (competition !== filters.competition) return false
      }
      
      // Filtre période
      if (filters.timeFrame !== 'all') {
        const matchDate = new Date(m.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (filters.timeFrame === 'upcoming' && matchDate < today) return false
        if (filters.timeFrame === 'past' && matchDate >= today) return false
      }
      
      // Filtre par mois
      if (filters.month !== 'all') {
        const matchDate = new Date(m.date)
        const matchMonthYear = matchDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        if (matchMonthYear !== filters.month) return false
      }
      
      return true
    })
  }, [matches, q, filters])

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
      lines.push(`SUMMARY:${m.home ? `SRH vs ${m.opponent}` : `${m.opponent} vs SRH`}${m.home?' (Domicile)':' (Extérieur)'}`)
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
          
          {/* Barre de recherche et boutons */}
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

          {/* Filtres avancés */}
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🎛️ Filtres
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Filtre domicile/extérieur */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Type de match</label>
                <select
                  value={filters.homeAway}
                  onChange={(e) => setFilters({...filters, homeAway: e.target.value as 'all' | 'home' | 'away'})}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
                >
                  <option value="all">🏟️ Tous les matchs</option>
                  <option value="home">🏠 Domicile</option>
                  <option value="away">✈️ Extérieur</option>
                </select>
              </div>

              {/* Filtre compétition */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Compétition</label>
                <select
                  value={filters.competition}
                  onChange={(e) => setFilters({...filters, competition: e.target.value})}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
                >
                  <option value="all">🏆 Toutes les compétitions</option>
                  {uniqueCompetitions.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                  <option value="Sans compétition">Sans compétition</option>
                </select>
              </div>

              {/* Filtre période */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Période</label>
                <select
                  value={filters.timeFrame}
                  onChange={(e) => setFilters({...filters, timeFrame: e.target.value as 'all' | 'upcoming' | 'past'})}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
                >
                  <option value="all">📅 Toutes les dates</option>
                  <option value="upcoming">⏭️ À venir</option>
                  <option value="past">⏮️ Passés</option>
                </select>
              </div>

              {/* Filtre mois */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Mois</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({...filters, month: e.target.value})}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-white focus:border-redhorse-gold focus:outline-none"
                >
                  <option value="all">📆 Tous les mois</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bouton reset filtres */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  homeAway: 'all',
                  competition: 'all',
                  timeFrame: 'all',
                  month: 'all'
                })}
                className="text-sm text-zinc-400 hover:text-zinc-300 underline"
              >
                ↻ Réinitialiser les filtres
              </button>
            </div>
          </div>

          {isCaptain && (showAdd || editingMatch) && (
            <div className="glass-effect rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">{editingMatch ? 'Modifier le match' : 'Nouveau match'}</h3>
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
                  if (editingMatch) {
                    await updateMatch(editingMatch.id, payload as any)
                  } else {
                    await createMatch(payload as any)
                  }
                  const ms = await getMatches(); setMatches(ms); setShowAdd(false); setEditingMatch(null); setDraft({ date: '', time: '19:00', opponent: '', home: true, location: '', competition: '' })
                }}>Enregistrer</button>
                <button className="btn-secondary rounded-lg px-6 py-3" onClick={()=> { setShowAdd(false); setEditingMatch(null) }}>Annuler</button>
              </div>
              <style jsx>{`
                .input{ border-radius:.5rem; border:1px solid rgb(63 63 70); background:rgba(24,24,27,.5); padding:.75rem 1rem; color:white; }
              `}</style>
            </div>
          )}
        </div>
      </section>

      <section className="container pb-16">
        {/* Compteur de résultats */}
        <div className="mb-6 text-center">
          <p className="text-zinc-400">
            <span className="font-semibold text-redhorse-gold">{filteredMatches.length}</span> 
            {filteredMatches.length === 1 ? ' match trouvé' : ' matchs trouvés'}
            {filteredMatches.length !== matches.length && (
              <span className="text-zinc-500"> sur {matches.length} au total</span>
            )}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.sort((a,b)=> a.date.localeCompare(b.date)).map(m=> {
            const hasSheet = matchSheets[m.id]
            const isPast = new Date(m.date) < new Date()
            
            return (
              <article 
                key={m.id} 
                className="feature-card rounded-2xl p-6 group relative hover:scale-105 transition-transform cursor-pointer"
                onClick={() => window.location.href = `/matches/${m.id}/details`}
              >
                <div className="relative mb-4">
                  <div className="space-y-1">
                    <div className="text-sm text-redhorse-gold font-medium">
                      {new Date(m.date).toLocaleDateString('fr-FR',{weekday:'long', day:'numeric', month:'long'})}
                    </div>
                    <div className="text-2xl font-bold text-zinc-400">
                      {m.time||'19:00'}
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${m.home ? 'bg-redhorse-gold/20 text-redhorse-gold' : 'bg-redhorse-red/20 text-redhorse-red'}`}>
                      {m.home ? '🏠 Domicile' : '✈️ Extérieur'}
                    </div>
                    {m.competition && (
                      <div className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium">
                        🏆 {m.competition}
                      </div>
                    )}
                    {isPast ? (
                      <div className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">
                        Terminé
                      </div>
                    ) : hasSheet && (
                      <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                        ✅ Feuille validée
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {m.home ? (
                      <>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
                          <img src="/logo.webp" alt="SRH" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-lg font-bold">vs</span>
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {m.opponent.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {m.opponent.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-lg font-bold">vs</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
                          <img src="/logo.webp" alt="SRH" className="w-full h-full object-cover" />
                        </div>
                      </>
                    )}
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
                  
                  
                  <div className="pt-2 border-t border-zinc-700/50">
                    
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <a
                        href={`/matches/${m.id}/details`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium text-redhorse-gold border border-redhorse-gold/30 rounded-md px-2 py-1 hover:bg-redhorse-gold/10 hover:border-redhorse-gold transition-all cursor-pointer"
                      >
                        📋 Détails
                      </a>
                      <a
                        href={`/matches/${m.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium text-zinc-400 border border-zinc-600 rounded-md px-2 py-1 hover:bg-zinc-700/50 hover:text-zinc-200 hover:border-zinc-500 transition-all cursor-pointer"
                      >
                        ⚡ Composer
                      </a>
                      {isPast && hasSheet && isAuthenticated && (
                        <a
                          href={`/matches/${m.id}/ratings`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-medium text-blue-400 border border-blue-400/30 rounded-md px-2 py-1 hover:bg-blue-400/10 hover:border-blue-400 transition-all cursor-pointer"
                        >
                          ⭐ Noter
                        </a>
                      )}
                      {isCaptain && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMatch(m)
                              setDraft({
                                date: m.date,
                                time: m.time || '19:00',
                                opponent: m.opponent,
                                home: m.home,
                                location: m.location,
                                competition: m.competition || ''
                              })
                            }}
                            className="text-xs font-medium text-yellow-400 border border-yellow-400/30 rounded-md px-2 py-1 hover:bg-yellow-400/10 hover:border-yellow-400 transition-all cursor-pointer"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowConfirmDelete(m.id)
                            }}
                            className="text-xs font-medium text-red-400 border border-red-400/30 rounded-md px-2 py-1 hover:bg-red-400/10 hover:border-red-400 transition-all cursor-pointer"
                          >
                            🗑️ Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
              </article>
            )
          })}
        </div>
        
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfirmDelete(null)}>
            <div className="bg-zinc-900 p-6 rounded-xl max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Confirmer la suppression</h3>
              <p className="text-zinc-400 mb-6">Êtes-vous sûr de vouloir supprimer ce match ? Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button
                  className="btn-primary bg-red-600 hover:bg-red-700 rounded-lg px-6 py-3"
                  onClick={async () => {
                    await deleteMatch(showConfirmDelete)
                    const ms = await getMatches()
                    setMatches(ms)
                    setShowConfirmDelete(null)
                  }}
                >
                  Supprimer
                </button>
                <button
                  className="btn-secondary rounded-lg px-6 py-3"
                  onClick={() => setShowConfirmDelete(null)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        
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

