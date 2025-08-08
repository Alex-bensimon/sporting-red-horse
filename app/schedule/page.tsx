"use client"
import { useMemo, useState } from 'react';

type Match = { id:string; date:string; time?:string; opponent:string; home:boolean; location:string; competition?:string }

const initialMatches: Match[] = [
  { id:'m1', date:'2025-09-07', time:'19:30', opponent:'FC Lynx', home:true, location:'Parc des Sports 1', competition:'Ligue 7v7' },
  { id:'m2', date:'2025-09-14', time:'20:15', opponent:'US Raptors', home:false, location:'Stade Municipal 3', competition:'Ligue 7v7' },
  { id:'m3', date:'2025-09-21', time:'18:00', opponent:'AS Orion', home:true, location:'Parc des Sports 1', competition:'Coupe' },
]

export default function SchedulePage(){
  const [q,setQ] = useState('')
  const matches = useMemo(()=> initialMatches.filter(m => !q || `${m.opponent} ${m.location} ${m.competition||''}`.toLowerCase().includes(q.toLowerCase())),[q])

  function exportICS(){
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SRH//Calendar//FR']
    matches.forEach(m=>{
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
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.sort((a,b)=> a.date.localeCompare(b.date)).map(m=> (
            <article key={m.id} className="feature-card rounded-2xl p-6 group">
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
              </div>
            </article>
          ))}
        </div>
        
        {matches.length === 0 && (
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

