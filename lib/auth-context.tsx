"use client"
import { auth, googleProvider } from '@/firebase/client'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'
import { getPlayerById, getPlayers, getUserMetaByPlayerId, getUserMetaByUid, syncUserRoleIndex, upsertUserMeta } from './store'
import type { Player } from './types'

type AuthContextType = {
  currentPlayer: Player | null
  isAuthenticated: boolean
  isCaptain: boolean
  isAuthLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  register: (email: string, password: string, playerId: string) => Promise<boolean>
  registerWithGoogle: (playerId: string) => Promise<boolean>
  logout: () => void
  players: Player[]
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [isCaptain, setIsCaptain] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    getPlayers().then(setPlayers)
    const unsub = auth ? onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setIsAuthenticated(false)
          setCurrentPlayer(null)
          setIsCaptain(false)
          return
        }

        await user.getIdToken()
        setIsAuthenticated(true)

        // Récupérer le meta utilisateur via uid, puis le Player correspondant
        const meta = await getUserMetaByUid(user.uid)
        if (meta?.playerId) {
          const p = await getPlayerById(meta.playerId)
          if (p) setCurrentPlayer(p)
        }

        setIsCaptain(Boolean(meta?.roles?.includes('captain')))
      } catch (error) {
        console.warn('Auth state change error:', error)
        setIsAuthenticated(false)
        setCurrentPlayer(null)
        setIsCaptain(false)
      } finally {
        setIsAuthLoading(false)
      }
    }) : undefined
    if (!auth) setIsAuthLoading(false)
    return () => { if (unsub) unsub() }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (e) {
      console.error('Login error:', e)
      return false
    }
  }

  const register = async (email: string, password: string, playerId: string): Promise<boolean> => {
    if (!auth) return false
    try {
      // Vérifier que le joueur existe et n'est pas déjà lié
      const player = await getPlayerById(playerId)
      if (!player) throw new Error('Joueur introuvable')
      
      const existingMeta = await getUserMetaByPlayerId(playerId)
      if (existingMeta?.uid) {
        throw new Error('Ce joueur est déjà associé à un compte')
      }

      // Créer le compte
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      
      // Attendre que le token soit disponible
      await cred.user.getIdToken(true)
      
      // Attendre un peu pour la propagation
      await new Promise(resolve => setTimeout(resolve, 500))

      // Créer le document utilisateur
      const roles = (player.isCaptain === true) ? ['captain'] : []
      await upsertUserMeta({
        playerId,
        name: player.name,
        isFirstConnection: false,
        uid: cred.user.uid,
        email,
        roles,
      })
      
      // Créer l'index par UID pour les règles de sécurité
      await syncUserRoleIndex(cred.user.uid, roles)

      // Mettre à jour immédiatement l'état local pour éviter d'avoir à refresh
      setIsAuthenticated(true)
      setCurrentPlayer(player)
      setIsCaptain(player.isCaptain === true)

      return true
    } catch (e) {
      console.error('Register error:', e)
      return false
    }
  }

  const loginWithGoogle = async (): Promise<boolean> => {
    if (!auth || !googleProvider) return false
    try {
      await signInWithPopup(auth, googleProvider)
      return true
    } catch (e) {
      console.error('Google login error:', e)
      return false
    }
  }

  const registerWithGoogle = async (playerId: string): Promise<boolean> => {
    if (!auth || !googleProvider) return false
    try {
      // Vérifier que le joueur existe et n'est pas déjà lié
      const player = await getPlayerById(playerId)
      if (!player) throw new Error('Joueur introuvable')
      
      const existingMeta = await getUserMetaByPlayerId(playerId)
      if (existingMeta?.uid) {
        throw new Error('Ce joueur est déjà associé à un compte')
      }

      // Connexion Google
      const cred = await signInWithPopup(auth, googleProvider)
      
      // Attendre que le token soit disponible
      await cred.user.getIdToken(true)
      
      // Attendre un peu pour la propagation
      await new Promise(resolve => setTimeout(resolve, 500))

      // Créer le document utilisateur
      const roles = (player.isCaptain === true) ? ['captain'] : []
      await upsertUserMeta({
        playerId,
        name: player.name,
        isFirstConnection: false,
        uid: cred.user.uid,
        email: cred.user.email || '',
        roles,
      })
      
      // Créer l'index par UID pour les règles de sécurité
      await syncUserRoleIndex(cred.user.uid, roles)
      
      // Mettre à jour immédiatement l'état local pour éviter d'avoir à refresh
      setIsAuthenticated(true)
      setCurrentPlayer(player)
      setIsCaptain(player.isCaptain === true)

      return true
    } catch (e) {
      console.error('Google register error:', e)
      return false
    }
  }

  const logout = () => {
    setCurrentPlayer(null)
    setIsAuthenticated(false)
    setIsCaptain(false)
    if (auth) { try { void signOut(auth) } catch {} }
  }

  return (
    <AuthContext.Provider value={{ currentPlayer, isAuthenticated, isCaptain, isAuthLoading, login, loginWithGoogle, register, registerWithGoogle, logout, players }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}