import localMatchesData from '@data/matches.json'
import localPlayersData from '@data/players.json'
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase/client'
import { matches as localMatches } from './data'
import type { Lineup, Match, Player } from './types'

export function isFirebaseReady(){
  // Basic check: all env present
  return !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
}

export async function saveLineup(params: { name: string; formation: string; lineup: Lineup; matchId?: string | null }){
  if (!isFirebaseReady()) {
    // Fallback: store under localStorage list
    const raw = localStorage.getItem('srh_lineups_store_v1')
    const list = raw ? JSON.parse(raw) : []
    const id = 'local_'+Date.now()
    list.push({ id, ...params, createdAt: Date.now() })
    localStorage.setItem('srh_lineups_store_v1', JSON.stringify(list))
    return { id }
  }
  const ref = await addDoc(collection(db, 'lineups'), {
    name: params.name,
    formation: params.formation,
    lineup: params.lineup,
    matchId: params.matchId || null,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id }
}

export async function getMatches(){
  if (!isFirebaseReady()) return (localMatchesData as Match[])
  const snap = await getDocs(collection(db,'matches'))
  if (snap.empty) return localMatches
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as any))
}

export async function getLineupsForMatch(matchId: string){
  if (!isFirebaseReady()) {
    const raw = localStorage.getItem('srh_lineups_store_v1')
    const list = raw ? JSON.parse(raw) : []
    return list.filter((l:any)=> l.matchId === matchId)
  }
  const qy = query(collection(db,'lineups'), where('matchId','==', matchId))
  const snap = await getDocs(qy)
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as any))
}

export async function getPlayers(){
  if (!isFirebaseReady()) return (localPlayersData as Player[])
  const snap = await getDocs(collection(db,'players'))
  if (snap.empty) return (localPlayersData as Player[])
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as any))
}

