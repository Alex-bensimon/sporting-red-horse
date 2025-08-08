"use client"
import { useMemo, useState } from 'react'

type NewsItem = {
  id: string
  title: string
  date: string
  tag?: 'Match' | 'Club' | 'Transfert' | 'Media'
  excerpt: string
}

const initialNews: NewsItem[] = [
  { id:'n1', title:'Victoire 3-1 contre FC Lynx', date:'2025-09-07', tag:'Match', excerpt:'Belle prestation collective avec un doublé de Alex.' },
  { id:'n2', title:'Nouveau maillot domicile', date:'2025-09-05', tag:'Club', excerpt:'Découvrez le nouveau design or et rouge du SRH.' },
  { id:'n3', title:'Highlights de la pré-saison', date:'2025-09-01', tag:'Media', excerpt:'Les meilleures actions en vidéo, à ne pas manquer.' },
]

export default function NewsPage(){
  const [q,setQ] = useState('')
  const [tag,setTag] = useState<'All' | NewsItem['tag']>('All')

  const list = useMemo(()=>
    initialNews
      .filter(n=> (tag==='All' || n.tag===tag))
      .filter(n=> !q || `${n.title} ${n.excerpt}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a,b)=> b.date.localeCompare(a.date))
  ,[q,tag])

  return (
    <>
      <section className="relative py-16">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              Actualités du Club
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              News, résultats et moments forts du Sporting Red Horse
            </p>
          </div>

          <div className="glass-effect rounded-2xl p-6 mb-8">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] items-center">
              <input 
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-400 focus:border-redhorse-gold focus:outline-none focus:ring-2 focus:ring-redhorse-gold/20" 
                placeholder="🔍 Rechercher une actu..." 
                value={q} 
                onChange={e=>setQ(e.target.value)} 
              />
              <select 
                className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white focus:border-redhorse-gold focus:outline-none"
                value={tag}
                onChange={e=>setTag(e.target.value as any)}
              >
                <option value="All">🔥 Tout</option>
                <option value="Match">⚽ Match</option>
                <option value="Club">🏟️ Club</option>
                <option value="Transfert">🔁 Transfert</option>
                <option value="Media">🎥 Media</option>
              </select>
              <div className="text-sm text-zinc-400">{list.length} actu{list.length>1?'s':''}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map(n=> (
            <article key={n.id} className="feature-card rounded-2xl p-6 group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-redhorse-gold font-medium">
                  {new Date(n.date).toLocaleDateString('fr-FR',{weekday:'long', day:'numeric', month:'long'})}
                </div>
                {n.tag && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                    {n.tag}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-redhorse-gold transition-colors">{n.title}</h3>
              <p className="text-zinc-300 text-sm">{n.excerpt}</p>
            </article>
          ))}

          {list.length===0 && (
            <div className="text-center py-16 md:col-span-2 lg:col-span-3">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-bold text-zinc-400 mb-2">Aucune actualité</h3>
              <p className="text-zinc-500">Revenez bientôt pour de nouvelles informations</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

