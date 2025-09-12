"use client"
import { useAuth } from '@/lib/auth-context'
import { getUserMetaByPlayerId } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { currentPlayer, isAuthenticated, isCaptain, login, loginWithGoogle, register, registerWithGoogle, logout, players } = useAuth()
  const router = useRouter()
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  // Pré-remplir email si un meta existe déjà pour ce playerId
  useEffect(()=>{
    let mounted = true
    async function load(){
      if (!selectedPlayer) { setEmail(''); return }
      const meta = await getUserMetaByPlayerId(selectedPlayer)
      if (!mounted) return
      setEmail(meta?.email || '')
    }
    load()
    return ()=>{ mounted = false }
  },[selectedPlayer])
  
  // Nettoyer les attributs d'extension navigateur pour éviter les erreurs d'hydratation
  useEffect(() => {
    const removeExtensionAttributes = () => {
      // Nettoyer tous les attributs data-np-* (1Password, LastPass, etc.)
      document.querySelectorAll('[data-np-intersection-state], [data-np-autofill-field-type], [data-np-uid]').forEach(el => {
        el.removeAttribute('data-np-intersection-state')
        el.removeAttribute('data-np-autofill-field-type')
        el.removeAttribute('data-np-uid')
      })
    }
    removeExtensionAttributes()
    const observer = new MutationObserver(removeExtensionAttributes)
    observer.observe(document.body, { attributes: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && currentPlayer) {
      router.replace('/profile')
    }
  }, [isAuthenticated, currentPlayer, router])

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    const ok = await login(email, password)
    if (!ok) alert('Connexion échouée')
    if (ok) router.replace('/profile')
    setLoading(false)
  }

  async function handleRegister() {
    if (!selectedPlayer || !email || !password) return
    setLoading(true)
    const ok = await register(email, password, selectedPlayer)
    if (!ok) alert("Création de compte échouée")
    if (ok) router.replace('/profile')
    setLoading(false)
  }

  return (
    <section className="container py-8">
      <div className="max-w-md mx-auto">
        <div className="glass-effect rounded-2xl p-6">
          <h2 className="mb-6 text-3xl font-bold text-center bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
            Connexion Joueur
          </h2>
          
          {isAuthenticated ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg border border-redhorse-gold/20 bg-redhorse-gold/5">
                <h3 className="font-semibold text-redhorse-gold">Connecté en tant que</h3>
                <p className="text-lg text-white flex items-center gap-2">
                  {currentPlayer?.name}
                  {isCaptain && <span className="text-xs bg-redhorse-gold text-black px-2 py-1 rounded-full font-bold">👑 CAPITAINE</span>}
                </p>
                <p className="text-sm text-zinc-400">
                  {currentPlayer?.position === 'GK' ? '🥅 Gardien' :
                   currentPlayer?.position === 'DEF' ? '🛡️ Défenseur' :
                   currentPlayer?.position === 'MID' ? '⚡ Milieu' : '🎯 Attaquant'}
                </p>
              </div>
              <a href="/profile" className="w-full block rounded-lg bg-gradient-to-r from-redhorse-gold to-redhorse-red px-4 py-3 text-white font-semibold hover:opacity-90 transition-opacity">
                Éditer mon profil
              </a>
              
              <button 
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white hover:bg-zinc-700/50 transition-colors" 
                onClick={logout}
              >
                Se déconnecter
              </button>
              
              <div className="text-sm text-zinc-400">
                {isCaptain 
                  ? "En tant que capitaine, vous pouvez valider les feuilles de match et noter vos coéquipiers"
                  : "Vous pouvez maintenant noter vos coéquipiers après les matchs"
                }
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-sm">
                <button className={`px-3 py-1 rounded ${!isRegisterMode ? 'bg-redhorse-gold text-black' : 'bg-zinc-800 text-white border border-zinc-600'}`} onClick={()=>setIsRegisterMode(false)}>Se connecter</button>
                <button className={`px-3 py-1 rounded ${isRegisterMode ? 'bg-redhorse-gold text-black' : 'bg-zinc-800 text-white border border-zinc-600'}`} onClick={()=>setIsRegisterMode(true)}>Créer un compte</button>
              </div>
              {isRegisterMode && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Quel joueur êtes-vous ?
                  </label>
                  <select 
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white focus:border-redhorse-gold focus:outline-none" 
                    value={selectedPlayer} 
                    onChange={e => setSelectedPlayer(e.target.value)}
                  >
                    <option value="">Choisir un joueur...</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}{player.isCaptain ? ' 👑' : ''} - {
                            player.position === 'GK' ? '🥅 Gardien' :
                            player.position === 'DEF' ? '🛡️ Défenseur' :
                            player.position === 'MID' ? '⚡ Milieu' : '🎯 Attaquant'
                          }
                        </option>
                      ))
                    }
                  </select>
                  {!selectedPlayer && (
                    <p className="mt-2 text-xs text-yellow-400">Sélectionnez votre joueur pour activer l'inscription Google.</p>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">Email</label>
                <input type="email" value={email} onChange={e=> setEmail(e.target.value)} className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white focus:border-redhorse-gold focus:outline-none" placeholder="nom@domaine.com" />
                <label className="block text-sm font-medium text-zinc-300">Mot de passe</label>
                <input type="password" value={password} onChange={e=> setPassword(e.target.value)} className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white focus:border-redhorse-gold focus:outline-none" placeholder="Votre mot de passe" />

                {isRegisterMode ? (
                  <button 
                    className="w-full rounded-lg bg-gradient-to-r from-redhorse-gold to-redhorse-red px-4 py-3 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" 
                    onClick={handleRegister}
                    disabled={!selectedPlayer || !email || !password || loading}
                  >
                    {loading ? 'Création...' : 'Créer un compte'}
                  </button>
                ) : (
                  <button 
                    className="w-full rounded-lg bg-gradient-to-r from-redhorse-gold to-redhorse-red px-4 py-3 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" 
                    onClick={handleLogin}
                    disabled={!email || !password || loading}
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </button>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="flex-1 h-px bg-zinc-700"/>
                  <span>OU</span>
                  <div className="flex-1 h-px bg-zinc-700"/>
                </div>
                {isRegisterMode ? (
                  <button
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!selectedPlayer || loading}
                    onClick={async ()=>{
                      if (!selectedPlayer) return
                      setLoading(true)
                      const ok = await registerWithGoogle(selectedPlayer)
                      if (!ok) alert('Création avec Google échouée')
                      if (ok) router.replace('/profile')
                      setLoading(false)
                    }}
                    aria-disabled={!selectedPlayer || loading}
                    title={!selectedPlayer ? 'Sélectionnez d\'abord votre joueur' : undefined}
                  >
                    <span className="w-5 h-5 rounded-full bg-white text-[#4285F4] font-bold flex items-center justify-center">G</span>
                    Continuer avec Google
                  </button>
                ) : (
                  <button
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    onClick={async ()=>{
                      setLoading(true)
                      const ok = await loginWithGoogle()
                      if (!ok) alert('Connexion avec Google échouée')
                      if (ok) router.replace('/profile')
                      setLoading(false)
                    }}
                    disabled={loading}
                  >
                    <span className="w-5 h-5 rounded-full bg-white text-[#4285F4] font-bold flex items-center justify-center">G</span>
                    Se connecter avec Google
                  </button>
                )}
              </div>
              
              <div className="text-sm text-zinc-400 text-center">
                {isRegisterMode ? 'Créez votre compte avec votre email et mot de passe, puis associez-le à votre fiche joueur.' : 'Une fois connecté, vous pourrez noter anonymement vos coéquipiers après chaque match.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

