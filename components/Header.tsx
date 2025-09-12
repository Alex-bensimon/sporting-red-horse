"use client"
import { useAuth } from '@/lib/auth-context'
import { useEffect, useRef, useState } from 'react'

export default function Header() {
  const { currentPlayer, isAuthenticated, isCaptain, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <header className="sticky top-0 z-30 glass-effect border-b border-redhorse-gold/20">
      <div className="container flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-4">
          <a href="/" aria-label="Aller à l'accueil">
            <img src="/logo.jpeg" alt="SRH" className="h-12 w-12 rounded-full ring-2 ring-redhorse-gold/30 transition-all duration-300 hover:ring-redhorse-gold/60" />
          </a>
          <div>
            <h1 className="font-bold tracking-wide text-lg text-redhorse-gold">Sporting Red Horse</h1>
            <p className="text-xs text-zinc-400">Football à 7</p>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-8 text-base font-medium">
          <a href="/" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Accueil</a>
          <a href="/schedule" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Calendrier</a>
          <a href="/team" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Équipe</a>
          <a href="/stats" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Statistiques</a>
          <a href="/news" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Actualités</a>
          <a href="/guide" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Guide</a>
          <a href="/builder" className="btn-primary rounded-lg px-6 py-3 text-white font-semibold">Compositions</a>
          
          {isAuthenticated && currentPlayer ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-2 rounded-lg border border-redhorse-gold/30 bg-redhorse-gold/5 hover:bg-redhorse-gold/10 transition-colors"
              >
                {(() => {
                  const fallback = `/players/${currentPlayer.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'')}.webp`
                  const src = currentPlayer.photo || fallback
                  return (
                    <img
                      src={src}
                      alt={currentPlayer.name}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-redhorse-gold/50"
                    />
                  )
                })()}
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{currentPlayer.name}</div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    {currentPlayer.position === 'GK' ? '🥅' :
                     currentPlayer.position === 'DEF' ? '🛡️' :
                     currentPlayer.position === 'MID' ? '⚡' : '🎯'}
                    {currentPlayer.position}
                    {isCaptain && <span className="text-redhorse-gold">👑</span>}
                  </div>
                </div>
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-redhorse-gold/20 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    <a
                      href="/profile"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10 rounded-lg transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon profil
                    </a>
                    <div className="h-px bg-zinc-700 my-1" />
                    <button
                      onClick={() => {
                        logout()
                        setShowDropdown(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">🔐 Connexion</a>
          )}
        </nav>
        
        <button
          className="lg:hidden p-3 text-redhorse-gold border border-redhorse-gold/30 rounded-lg hover:bg-redhorse-gold/10 transition-colors"
          aria-expanded={showMobileMenu}
          aria-label="Ouvrir le menu"
          onClick={()=> setShowMobileMenu(v=>!v)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden ${showMobileMenu ? 'block' : 'hidden'} border-t border-redhorse-gold/20 bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70`}> 
        <nav className="container py-3 space-y-1">
          <a href="/" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">Accueil</a>
          <a href="/schedule" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">Calendrier</a>
          <a href="/team" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">Équipe</a>
          <a href="/stats" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">Statistiques</a>
          <a href="/news" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">Actualités</a>
          <a href="/guide" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">Guide</a>
          <a href="/builder" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-white bg-gradient-to-r from-redhorse-gold to-redhorse-red text-center font-semibold">Compositions</a>

          {isAuthenticated && currentPlayer ? (
            <div className="mt-2 border-t border-zinc-800 pt-2">
              <a href="/profile" onClick={()=> setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">Mon profil</a>
              <button
                onClick={()=> { logout(); setShowMobileMenu(false) }}
                className="w-full text-left block px-3 py-2 rounded-lg text-zinc-300 hover:text-red-400 hover:bg-red-400/10"
              >Se déconnecter</button>
            </div>
          ) : (
            <a href="/login" onClick={()=> setShowMobileMenu(false)} className="block mt-2 px-3 py-2 rounded-lg text-zinc-300 hover:text-redhorse-gold hover:bg-redhorse-gold/10">🔐 Connexion</a>
          )}
        </nav>
      </div>
    </header>
  )
}