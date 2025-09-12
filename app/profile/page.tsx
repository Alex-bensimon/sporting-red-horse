"use client"
import { useAuth } from '@/lib/auth-context'
import { updatePlayer } from '@/lib/store'
import type { Player } from '@/lib/types'
import { useEffect, useState } from 'react'

const numberFields: (keyof Player)[] = ['rating','pace','shooting','passing','dribbling','defense','physical','jersey','heightCm','weightKg']

export default function ProfilePage(){
  const { currentPlayer, isAuthenticated, isAuthLoading } = useAuth()
  const [form, setForm] = useState<Partial<Player>>({})
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(()=>{
    if (currentPlayer) {
      const { id, ...rest } = currentPlayer
      setForm(rest)
    }
  },[currentPlayer])

  const canEdit = isAuthenticated && currentPlayer

  async function handleSave(e: React.FormEvent){
    e.preventDefault()
    if (!currentPlayer) return
    setSaving(true)
    setSuccessMessage('')
    setErrorMessage('')
    
    try {
      // normalize numbers
      const updates: Partial<Player> = { ...form }
      for (const key of numberFields){
        const v = (updates as any)[key]
        if (v !== undefined && v !== null && v !== '') (updates as any)[key] = Number(v)
      }
      await updatePlayer(currentPlayer.id, updates as Partial<Omit<Player,'id'>>)
      setSuccessMessage('Profil mis à jour avec succès ✅')
      // Refresh après 1.5s
      setTimeout(() => window.location.reload(), 1500)
    } catch (e){
      console.error(e)
      setErrorMessage('Erreur lors de la mise à jour du profil. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  if (isAuthLoading) {
    return (
      <section className="container py-16">
        <div className="max-w-lg mx-auto text-center glass-effect rounded-2xl p-8">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-redhorse-gold/30 border-t-redhorse-gold"></div>
          <div className="text-zinc-400">Vérification de votre session…</div>
        </div>
      </section>
    )
  }

  if (!canEdit) {
    return (
      <section className="container py-16">
        <div className="max-w-lg mx-auto text-center glass-effect rounded-2xl p-8">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connexion requise</h2>
          <p className="text-zinc-400 mb-6">Connectez-vous pour éditer votre profil joueur.</p>
          <a href="/login" className="btn-primary inline-block rounded-lg px-6 py-3 text-white font-semibold">Aller à la connexion</a>
        </div>
      </section>
    )
  }

  return (
    <section className="container py-12">
      {saving && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/90 p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-redhorse-gold/30 border-t-redhorse-gold"></div>
            <div className="text-sm text-zinc-300">Enregistrement en cours…</div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header avec photo de profil */}
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-6">
            {(() => {
              const fallback = `/players/${currentPlayer.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'')}.webp`
              const src = currentPlayer.photo || fallback
              return (
                <img
                  src={src}
                  alt={currentPlayer.name}
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-redhorse-gold/50"
                />
              )
            })()}
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{currentPlayer.name}</h2>
              <div className="flex items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-1">
                  {currentPlayer.position === 'GK' ? '🥅' :
                   currentPlayer.position === 'DEF' ? '🛡️' :
                   currentPlayer.position === 'MID' ? '⚡' : '🎯'}
                  {currentPlayer.position}
                </span>
                {currentPlayer.jersey && <span>#{currentPlayer.jersey}</span>}
                {currentPlayer.isCaptain && <span className="text-redhorse-gold font-bold">👑 Capitaine</span>}
              </div>
            </div>
          </div>
        </div>

        <h3 className="mb-6 text-xl font-bold text-redhorse-gold">
          Modifier mon profil
        </h3>
        
        {/* Messages de feedback */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSave} className="space-y-8">
          {/* Informations générales */}
          <div className="glass-effect rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informations générales
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Nom" name="name">
                <input 
                  value={form.name || ''} 
                  onChange={e=> setForm(f=>({...f, name: e.target.value}))} 
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors" 
                  placeholder="Votre nom complet"
                />
              </Field>
              <Field label="Poste" name="position">
                <select 
                  value={form.position || ''} 
                  onChange={e=> setForm(f=>({...f, position: e.target.value as Player['position']}))} 
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors"
                >
                  <option value="" className="bg-zinc-800 text-zinc-400">Choisir votre poste…</option>
                  <option value="GK" className="bg-zinc-800 text-white">🥅 GARDIEN</option>
                  <option value="DEF" className="bg-zinc-800 text-white">🛡️ DÉFENSEUR</option>
                  <option value="MID" className="bg-zinc-800 text-white">⚡ MILIEU</option>
                  <option value="FWD" className="bg-zinc-800 text-white">🎯 ATTAQUANT</option>
                </select>
              </Field>
              <Field label="Côté préférentiel" name="side">
                <select 
                  value={form.side || ''} 
                  onChange={e=> setForm(f=>({...f, side: (e.target.value || undefined) as Player['side']}))} 
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors"
                >
                  <option value="" className="bg-zinc-800 text-zinc-400">Pas de préférence</option>
                  <option value="L" className="bg-zinc-800 text-white">👈 Gauche</option>
                  <option value="C" className="bg-zinc-800 text-white">🎯 Centre</option>
                  <option value="R" className="bg-zinc-800 text-white">👉 Droite</option>
                </select>
              </Field>
              <Field label="N° de maillot" name="jersey">
                <input 
                  type="number" 
                  min="1" 
                  max="99" 
                  value={form.jersey ?? ''} 
                  onChange={e=> setForm(f=>({...f, jersey: Number(e.target.value) || undefined}))} 
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors" 
                  placeholder="Ex: 10"
                />
              </Field>
              <Field label="URL de votre photo" name="photo" className="md:col-span-2">
                <input 
                  value={form.photo || ''} 
                  onChange={e=> setForm(f=>({...f, photo: e.target.value || undefined}))} 
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors" 
                  placeholder="https://example.com/votre-photo.jpg"
                />
              </Field>
            </div>
          </div>
          
          {/* Caractéristiques physiques */}
          <div className="glass-effect rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Caractéristiques physiques
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Taille (cm)" name="heightCm">
                <input 
                  type="number" 
                  min="150" 
                  max="220" 
                  value={form.heightCm ?? ''} 
                  onChange={e=> setForm(f=>({...f, heightCm: Number(e.target.value) || undefined}))} 
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors" 
                  placeholder="175"
                />
              </Field>
              <Field label="Poids (kg)" name="weightKg">
                <input 
                  type="number" 
                  min="40" 
                  max="150" 
                  value={form.weightKg ?? ''} 
                  onChange={e=> setForm(f=>({...f, weightKg: Number(e.target.value) || undefined}))} 
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors" 
                  placeholder="70"
                />
              </Field>
            </div>
          </div>

          {/* Statistiques de jeu */}
          <div className="glass-effect rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistiques de jeu <span className="text-sm text-zinc-400 font-normal">(sur 100)</span>
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              {(['rating','pace','shooting','passing','dribbling','defense','physical'] as (keyof Player)[]).map(k=> (
                <Field key={String(k)} label={labelFor(k)} name={String(k)}>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1" 
                      max="99" 
                      value={(form as any)[k] ?? ''} 
                      onChange={e=> setForm(f=> ({...f, [k]: e.target.value}))} 
                      className="w-full pl-4 pr-12 py-3 bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-redhorse-gold focus:ring-2 focus:ring-redhorse-gold/20 focus:outline-none transition-colors" 
                      placeholder="85"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 text-sm font-medium bg-zinc-800 px-1 rounded">/99</div>
                  </div>
                </Field>
              ))}
            </div>
          </div>

          {/* Rôle (lecture seule) */}
          <div className="glass-effect rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Rôle dans l'équipe
            </h4>
            <div className="flex items-center gap-3 p-4 bg-redhorse-gold/5 border border-redhorse-gold/20 rounded-lg">
              <div className="h-5 w-5 rounded border border-redhorse-gold/50 flex items-center justify-center bg-zinc-800 select-none">
                {currentPlayer?.isCaptain ? '👑' : ''}
              </div>
              <div className="text-white flex items-center gap-2">
                {currentPlayer?.isCaptain ? 'Capitaine de l\'équipe' : 'Joueur'}
                <span className="text-sm text-zinc-400">(géré par l\'administration)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit" 
              disabled={saving} 
              className={`flex-1 btn-primary rounded-lg px-6 py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform ${saving ? 'animate-pulse scale-[0.99]' : ''}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer les modifications
                </>
              )}
            </button>
            <a 
              href={`/players/${currentPlayer!.id}`} 
              className="flex-shrink-0 rounded-lg border border-zinc-600 px-6 py-3 text-white hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir ma fiche publique
            </a>
          </div>
        </form>
      </div>
    </section>
  )
}

function Field({ label, name, children, className = '' }: { label: string; name: string; children: React.ReactNode; className?: string }){
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-semibold text-zinc-200" htmlFor={name}>{label}</label>
      {children}
    </div>
  )
}

function labelFor(k: keyof Player){
  switch(k){
    case 'rating': return 'Note globale'
    case 'pace': return 'Vitesse'
    case 'shooting': return 'Tir'
    case 'passing': return 'Passes'
    case 'dribbling': return 'Dribble'
    case 'defense': return 'Défense'
    case 'physical': return 'Physique'
    default: return String(k)
  }
}