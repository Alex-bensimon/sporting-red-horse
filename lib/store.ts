import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase/client';
import type { Lineup, Match, MatchPlayerStats, MatchSheet, Player, PlayerRating, Slot, UserMeta } from './types';

export function isFirebaseReady(){
  // Basic check: all env present
  return !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
}

export async function saveLineup(params: { name: string; formation: string; lineup: Lineup; matchId?: string | null; subs?: string[]; absentPlayers?: string[] }){
  if (!isFirebaseReady() || !db) {
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
    subs: Array.isArray(params.subs) ? params.subs : [],
    absentPlayers: Array.isArray(params.absentPlayers) ? params.absentPlayers : [],
    createdAt: serverTimestamp(),
  })
  return { id: ref.id }
}

export async function getMatches(){
  if (!isFirebaseReady() || !db) return []
  const snap = await getDocs(collection(db,'matches'))
  if (snap.empty) return []
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as Match))
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  if (!isFirebaseReady() || !db) return null
  const ref = doc(db, 'matches', matchId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Match,'id'>) }
}

export async function getLineupsForMatch(matchId: string){
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_lineups_store_v1')
    const list = raw ? JSON.parse(raw) : []
    return list.filter((l:any)=> l.matchId === matchId)
  }
  const qy = query(collection(db,'lineups'), where('matchId','==', matchId))
  const snap = await getDocs(qy)
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as any))
}

export async function getPlayers(){
  if (!isFirebaseReady() || !db) return []
  const snap = await getDocs(collection(db,'players'))
  if (snap.empty) return []
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as Player))
}

export async function getPlayerById(playerId: string): Promise<Player | null> {
  if (!isFirebaseReady() || !db) return null
  const ref = doc(db, 'players', playerId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Player, 'id'>) }
}

export async function updatePlayer(playerId: string, updates: Partial<Omit<Player, 'id'>>): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  const ref = doc(db, 'players', playerId)
  // Never allow id mutation
  const { id: _ignored, ...rest } = updates as any
  // Fetch existing to decide if we need to set uid on first link
  const snap = await getDoc(ref)
  const existing = snap.exists() ? (snap.data() as any) : null
  const shouldLinkUid = !!auth?.currentUser && (!existing || existing.uid == null)
  const payload = shouldLinkUid ? { ...rest, uid: auth!.currentUser!.uid } : rest
  await updateDoc(ref, payload as any)
}


// Users meta collection helpers
export async function getUserMetaByUid(uid: string): Promise<UserMeta | null> {
  if (!isFirebaseReady() || !db) return null
  const qy = query(collection(db, 'users'), where('uid', '==', uid))
  const snap = await getDocs(qy)
  if (snap.empty) return null
  const d = snap.docs[0]
  return d.data() as UserMeta
}

export async function upsertUserMeta(meta: UserMeta): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  
  // Nettoyer les données pour Firestore
  const cleanMeta = {
    playerId: meta.playerId,
    name: meta.name || '',
    isFirstConnection: meta.isFirstConnection ?? true,
    uid: meta.uid || null,
    email: meta.email || '',
    roles: Array.isArray(meta.roles) ? meta.roles : [],
    createdAt: new Date().toISOString()
  }
  
  console.log('Saving user meta:', cleanMeta)
  
  const ref = doc(db, 'users', meta.playerId)
  await setDoc(ref, cleanMeta, { merge: true })
}

export async function getUserMetaByPlayerId(playerId: string): Promise<UserMeta | null> {
  if (!isFirebaseReady() || !db) return null
  const ref = doc(db, 'users', playerId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as UserMeta
}

export async function setUserMetaEmail(playerId: string, email: string): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  await setDoc(doc(db, 'users', playerId), { email }, { merge: true })
}


export async function createMatch(payload: Omit<Match, 'id'>): Promise<{ id: string }>{
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  const ref = await addDoc(collection(db, 'matches'), payload as any)
  return { id: ref.id }
}

export async function createMatchSheet(matchSheet: Omit<MatchSheet, 'id' | 'createdAt'>) {
  if (!isFirebaseReady() || !db) {
    const id = 'local_sheet_' + Date.now()
    const sheet = { ...matchSheet, id, createdAt: Date.now() }
    const stored = localStorage.getItem('srh_match_sheets')
    const sheets = stored ? JSON.parse(stored) : []
    sheets.push(sheet)
    localStorage.setItem('srh_match_sheets', JSON.stringify(sheets))
    return { id }
  }

  // Use matchId as document ID to allow security rules to reference it
  const id = (matchSheet as any).matchId
  await setDoc(doc(db, 'match_sheets', id), {
    ...matchSheet,
    createdAt: serverTimestamp(),
  }, { merge: true })
  return { id }
}

export async function updateMatchSheet(sheetId: string, updates: Partial<MatchSheet>) {
  if (!isFirebaseReady() || !db) {
    const stored = localStorage.getItem('srh_match_sheets')
    const sheets = stored ? JSON.parse(stored) : []
    const index = sheets.findIndex((s: MatchSheet) => s.id === sheetId)
    if (index !== -1) {
      sheets[index] = { ...sheets[index], ...updates, lastModifiedAt: Date.now() }
      localStorage.setItem('srh_match_sheets', JSON.stringify(sheets))
    }
    return { id: sheetId }
  }

  await updateDoc(doc(db, 'match_sheets', sheetId), {
    ...updates,
    lastModifiedAt: serverTimestamp(),
  })
  return { id: sheetId }
}

export async function getMatchSheet(matchId: string): Promise<MatchSheet | null> {
  if (!isFirebaseReady() || !db) {
    const stored = localStorage.getItem('srh_match_sheets')
    const sheets = stored ? JSON.parse(stored) : []
    return sheets.find((s: MatchSheet) => s.matchId === matchId) || null
  }

  const ref = doc(db, 'match_sheets', matchId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as MatchSheet
}

export async function savePlayerRating(rating: Omit<PlayerRating, 'id' | 'createdAt'>) {
  if (!isFirebaseReady() || !db) {
    const id = 'local_rating_' + Date.now()
    const savedRating = { ...rating, id, createdAt: Date.now() }
    const stored = localStorage.getItem('srh_ratings')
    const ratings = stored ? JSON.parse(stored) : []
    // Check closed flag in local match_sheets
    const sheetsRaw = localStorage.getItem('srh_match_sheets')
    const sheets = sheetsRaw ? JSON.parse(sheetsRaw) : []
    const sheet = sheets.find((s:any)=> s.matchId === rating.matchId)
    if (sheet?.ratingsClosed) throw new Error('Votes fermés pour ce match')
    ratings.push(savedRating)
    localStorage.setItem('srh_ratings', JSON.stringify(ratings))
    return { id }
  }
  // Block if ratings closed
  const sheet = await getMatchSheet(rating.matchId)
  if (sheet?.ratingsClosed) throw new Error('Votes fermés pour ce match')
  // Block if match is not today or in the past yet
  const match = await getMatchById(rating.matchId)
  if (match?.date) {
    try {
      const today = new Date()
      const matchDate = new Date(match.date)
      const isPastOrToday = matchDate.toDateString() <= today.toDateString()
      if (!isPastOrToday) throw new Error('Les votes ouvrent le jour du match')
    } catch {}
  }

  const existingQuery = query(
    collection(db, 'player_ratings'),
    where('matchId', '==', rating.matchId),
    where('ratedPlayerId', '==', rating.ratedPlayerId),
    where('raterPlayerId', '==', rating.raterPlayerId)
  )
  const existingSnap = await getDocs(existingQuery)
  
  if (!existingSnap.empty) {
    const existingDoc = existingSnap.docs[0]
    await updateDoc(doc(db, 'player_ratings', existingDoc.id), {
      rating: rating.rating,
      comment: rating.comment || null,
    })
    return { id: existingDoc.id }
  }

  const dataToSave = {
    matchId: rating.matchId,
    ratedPlayerId: rating.ratedPlayerId,
    raterPlayerId: rating.raterPlayerId,
    rating: rating.rating,
    createdAt: serverTimestamp(),
  }
  
  if (rating.comment !== undefined && rating.comment !== null) {
    (dataToSave as any).comment = rating.comment
  }
  
  const ref = await addDoc(collection(db, 'player_ratings'), dataToSave)
  return { id: ref.id }
}

export async function closeRatingsForMatch(matchId: string, closedBy: string){
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_match_sheets')
    const sheets = raw ? JSON.parse(raw) : []
    const index = sheets.findIndex((s:any)=> s.matchId === matchId)
    if (index !== -1){
      sheets[index] = { ...sheets[index], ratingsClosed: true, ratingsClosedAt: Date.now(), ratingsClosedBy: closedBy }
      localStorage.setItem('srh_match_sheets', JSON.stringify(sheets))
      return { id: sheets[index].id }
    }
    return { id: 'local_sheet_unknown' }
  }
  await updateMatchSheet(matchId, { ratingsClosed: true, ratingsClosedAt: serverTimestamp(), ratingsClosedBy: closedBy })
  return { id: matchId }
}

export async function getPlayerRatings(matchId: string): Promise<PlayerRating[]> {
  if (!isFirebaseReady() || !db) {
    const stored = localStorage.getItem('srh_ratings')
    const ratings = stored ? JSON.parse(stored) : []
    return ratings.filter((r: PlayerRating) => r.matchId === matchId)
  }

  const qy = query(collection(db, 'player_ratings'), where('matchId', '==', matchId))
  const snap = await getDocs(qy)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlayerRating))
}

// Match player stats (captain input)
export async function upsertMatchPlayerStats(stats: Omit<MatchPlayerStats, 'id' | 'createdAt' | 'lastModifiedAt'>): Promise<{ id: string }>{
  if (!isFirebaseReady() || !db) {
    const key = 'srh_match_player_stats'
    const stored = localStorage.getItem(key)
    const list = stored ? JSON.parse(stored) : []
    const existingIndex = list.findIndex((s: any) => s.matchId === stats.matchId && s.playerId === stats.playerId)
    const now = Date.now()
    if (existingIndex !== -1) {
      list[existingIndex] = { ...list[existingIndex], ...stats, lastModifiedAt: now }
      localStorage.setItem(key, JSON.stringify(list))
      return { id: list[existingIndex].id }
    }
    const id = 'local_stats_'+now
    list.push({ id, ...stats, createdAt: now })
    localStorage.setItem(key, JSON.stringify(list))
    return { id }
  }
  // Try to find existing doc for player+match
  const qy = query(collection(db, 'match_player_stats'), where('matchId','==', stats.matchId), where('playerId','==', stats.playerId))
  const snap = await getDocs(qy)
  if (!snap.empty) {
    const d = snap.docs[0]
    await updateDoc(doc(db, 'match_player_stats', d.id), {
      ...stats,
      lastModifiedAt: serverTimestamp(),
    })
    return { id: d.id }
  }
  const ref = await addDoc(collection(db, 'match_player_stats'), {
    ...stats,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id }
}

export async function getMatchPlayerStats(matchId: string): Promise<MatchPlayerStats[]>{
  if (!isFirebaseReady() || !db) {
    const key = 'srh_match_player_stats'
    const stored = localStorage.getItem(key)
    const list = stored ? JSON.parse(stored) : []
    return list.filter((s:any)=> s.matchId === matchId)
  }
  const qy = query(collection(db, 'match_player_stats'), where('matchId','==', matchId))
  const snap = await getDocs(qy)
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as MatchPlayerStats))
}

export async function getPlayerStats(playerId: string): Promise<MatchPlayerStats[]>{
  if (!isFirebaseReady() || !db) {
    const key = 'srh_match_player_stats'
    const stored = localStorage.getItem(key)
    const list = stored ? JSON.parse(stored) : []
    return list.filter((s:any)=> s.playerId === playerId)
  }
  const qy = query(collection(db, 'match_player_stats'), where('playerId','==', playerId))
  const snap = await getDocs(qy)
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as MatchPlayerStats))
}

export async function getAllMatchPlayerStats(): Promise<MatchPlayerStats[]>{
  if (!isFirebaseReady() || !db) {
    const key = 'srh_match_player_stats'
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  }
  const snap = await getDocs(collection(db, 'match_player_stats'))
  return snap.docs.map(d=> ({ id: d.id, ...d.data() } as MatchPlayerStats))
}

export async function getPlayerAverageRatings(playerId: string): Promise<{ average: number; count: number }> {
  if (!isFirebaseReady() || !db) {
    const stored = localStorage.getItem('srh_ratings')
    const ratings = stored ? JSON.parse(stored) : []
    const playerRatings = ratings.filter((r: PlayerRating) => r.ratedPlayerId === playerId)
    if (playerRatings.length === 0) return { average: 0, count: 0 }
    const sum = playerRatings.reduce((acc: number, r: PlayerRating) => acc + r.rating, 0)
    return { average: Math.round((sum / playerRatings.length) * 10) / 10, count: playerRatings.length }
  }

  const qy = query(collection(db, 'player_ratings'), where('ratedPlayerId', '==', playerId))
  const snap = await getDocs(qy)
  const ratings = snap.docs.map(d => d.data() as PlayerRating)
  
  if (ratings.length === 0) return { average: 0, count: 0 }
  
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
  return { average: Math.round((sum / ratings.length) * 10) / 10, count: ratings.length }
}

export async function syncUserRoleIndex(uid: string, roles: string[] = []): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  await setDoc(doc(db, 'users_by_uid', uid), { roles }, { merge: true })
}

export async function getFormations(): Promise<Record<string, Slot[]>> {
  if (!isFirebaseReady() || !db) return {}
  const snap = await getDocs(collection(db, 'formations'))
  if (snap.empty) return {}
  const formations: Record<string, Slot[]> = {}
  snap.docs.forEach(doc => {
    formations[doc.id] = doc.data().slots
  })
  return formations
}

export async function getPresets(): Promise<Record<string, string[]>> {
  if (!isFirebaseReady() || !db) return {}
  const snap = await getDocs(collection(db, 'presets'))
  if (snap.empty) return {}
  const presets: Record<string, string[]> = {}
  snap.docs.forEach(doc => {
    presets[doc.id] = doc.data().playerIds
  })
  return presets
}

export async function savePreset(params: { id: string; formation: string; playerIds: (string | null)[]; bySlot?: Record<string, string | null> }){
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_presets_store_v1')
    const map = raw ? JSON.parse(raw) : {}
    map[params.id] = { formation: params.formation, playerIds: params.playerIds, bySlot: params.bySlot || null, createdAt: Date.now() }
    localStorage.setItem('srh_presets_store_v1', JSON.stringify(map))
    return { id: params.id }
  }
  const presetRef = doc(collection(db, 'presets'), params.id)
  await setDoc(presetRef, {
    formation: params.formation,
    playerIds: params.playerIds,
    bySlot: params.bySlot || null,
    createdAt: serverTimestamp(),
  }, { merge: true })
  return { id: params.id }
}

