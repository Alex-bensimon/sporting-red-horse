import { app, auth, db } from '@/firebase/client'
import type { Match, MatchSheet, MatchPlayerStats, Player, PlayerRating, UserMeta, Formation, PresetData, Lineup, SavedLineup, Slot } from '@/lib/types'
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { DocumentReference, Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'

// Utility to check if Firebase is ready
function isFirebaseReady() {
  const hasEnv = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
  return hasEnv && app && auth && db
}

// Matches
export async function getMatches(): Promise<Match[]> {
  if (!isFirebaseReady() || !db) return []
  const snap = await getDocs(collection(db, 'matches'))
  if (snap.empty) return []
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Match))
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  if (!isFirebaseReady() || !db) return null
  const ref = doc(db, 'matches', matchId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Match, 'id'>) }
}

export async function saveLineup(lineup: any, userId: string): Promise<{ id: string }> {
  if (!isFirebaseReady() || !db) {
    const id = 'local_' + Date.now()
    const raw = localStorage.getItem('srh_lineups')
    const list = raw ? JSON.parse(raw) : []
    list.push({ ...lineup, createdBy: userId, createdAt: Date.now(), id })
    localStorage.setItem('srh_lineups', JSON.stringify(list))
    return { id }
  }
  const ref = await addDoc(collection(db, 'lineups'), {
    ...lineup,
    createdBy: userId,
    createdAt: Date.now()
  })
  return { id: ref.id }
}

export async function getLineups(matchId: string) {
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_lineups')
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

export async function updateMatch(matchId: string, updates: Partial<Omit<Match, 'id'>>): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  const ref = doc(db, 'matches', matchId)
  await updateDoc(ref, updates as any)
}

export async function deleteMatch(matchId: string): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  
  // Delete all related documents first
  const deletePromises: Promise<void>[] = []
  
  // Delete match_player_stats
  const statsQuery = query(collection(db, 'match_player_stats'), where('matchId', '==', matchId))
  const statsSnap = await getDocs(statsQuery)
  statsSnap.docs.forEach(doc => {
    deletePromises.push(deleteDoc(doc.ref))
  })
  
  // Delete player_ratings
  const ratingsQuery = query(collection(db, 'player_ratings'), where('matchId', '==', matchId))
  const ratingsSnap = await getDocs(ratingsQuery)
  ratingsSnap.docs.forEach(doc => {
    deletePromises.push(deleteDoc(doc.ref))
  })
  
  // Delete match_sheets (using matchId as document ID)
  const matchSheetRef = doc(db, 'match_sheets', matchId)
  const matchSheetSnap = await getDoc(matchSheetRef)
  if (matchSheetSnap.exists()) {
    deletePromises.push(deleteDoc(matchSheetRef))
  }
  
  // Execute all deletes in parallel
  await Promise.all(deletePromises)
  
  // Finally delete the match itself
  const matchRef = doc(db, 'matches', matchId)
  await deleteDoc(matchRef)
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
  const ref = doc(db, 'match_sheets', id)
  const payload = {
    ...matchSheet,
    createdAt: serverTimestamp(),
    id
  }
  await setDoc(ref, payload as any)
  return { id }
}

export async function updateMatchSheet(sheetId: string, updates: Partial<MatchSheet>) {
  if (!isFirebaseReady() || !db) {
    const stored = localStorage.getItem('srh_match_sheets')
    const sheets = stored ? JSON.parse(stored) : []
    const index = sheets.findIndex((s: any) => s.id === sheetId)
    if (index >= 0) {
      sheets[index] = { ...sheets[index], ...updates }
      localStorage.setItem('srh_match_sheets', JSON.stringify(sheets))
    }
    return
  }
  
  const ref = doc(db, 'match_sheets', sheetId)
  await updateDoc(ref, updates as any)
}

export async function getMatchSheet(matchId: string): Promise<MatchSheet | null> {
  if (!isFirebaseReady() || !db) {
    const stored = localStorage.getItem('srh_match_sheets')
    if (stored) {
      const sheets = JSON.parse(stored)
      const sheet = sheets.find((s: any) => s.matchId === matchId)
      if (sheet) return sheet
    }
    return null
  }
  
  const ref = doc(db, 'match_sheets', matchId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt
  } as MatchSheet
}

export async function getPresetsForMatch(matchId: string){
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_presets')
    const list = raw ? JSON.parse(raw) : []
    return list.filter((p:any) => !matchId || p.matchId === matchId || p.isGlobal)
  }
  
  // Fetch global presets and match-specific presets
  const globalQuery = query(collection(db, 'presets'), where('isGlobal', '==', true))
  const matchQuery = query(collection(db, 'presets'), where('matchId', '==', matchId))
  
  const [globalSnap, matchSnap] = await Promise.all([
    getDocs(globalQuery),
    getDocs(matchQuery)
  ])
  
  const globalPresets = globalSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const matchPresets = matchSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  
  return [...globalPresets, ...matchPresets]
}

export async function savePreset(preset: any) {
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_presets')
    const list = raw ? JSON.parse(raw) : []
    list.push({ ...preset, id: 'local_' + Date.now() })
    localStorage.setItem('srh_presets', JSON.stringify(list))
    return
  }
  
  await addDoc(collection(db, 'presets'), preset)
}

// Player ratings (peer ratings)
export async function savePlayerRating(rating: Omit<PlayerRating, 'id' | 'createdAt'>): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  
  await addDoc(collection(db, 'player_ratings'), {
    ...rating,
    createdAt: serverTimestamp()
  })
}

export async function getPlayerRatingsForMatch(matchId: string): Promise<PlayerRating[]> {
  if (!isFirebaseReady() || !db) return []
  
  const qy = query(collection(db, 'player_ratings'), where('matchId', '==', matchId))
  const snap = await getDocs(qy)
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toMillis() : d.data().createdAt
  } as PlayerRating))
}

export async function closeRatingsForMatch(matchId: string, closedBy: string): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  
  await updateMatchSheet(matchId, { ratingsClosed: true, ratingsClosedAt: serverTimestamp(), ratingsClosedBy: closedBy })
}

export async function hasUserRatedPlayer(matchId: string, raterPlayerId: string, ratedPlayerId: string): Promise<boolean> {
  if (!isFirebaseReady() || !db) return false
  
  const qy = query(
    collection(db, 'player_ratings'),
    where('matchId', '==', matchId),
    where('raterPlayerId', '==', raterPlayerId),
    where('ratedPlayerId', '==', ratedPlayerId)
  )
  
  const snap = await getDocs(qy)
  return !snap.empty
}

export async function getPlayerRatingsSummary(matchId: string): Promise<{ playerId: string, average: number, count: number }[]> {
  const ratings = await getPlayerRatingsForMatch(matchId)
  
  const summary = ratings.reduce((acc, rating) => {
    if (!acc[rating.ratedPlayerId]) {
      acc[rating.ratedPlayerId] = { sum: 0, count: 0 }
    }
    acc[rating.ratedPlayerId].sum += rating.rating
    acc[rating.ratedPlayerId].count++
    return acc
  }, {} as Record<string, { sum: number, count: number }>)
  
  return Object.entries(summary).map(([playerId, stats]) => ({
    playerId,
    average: Math.round((stats.sum / stats.count) * 10) / 10,
    count: stats.count
  }))
}

// Match player stats (captain input)
export async function saveMatchPlayerStats(stats: Omit<MatchPlayerStats, 'id' | 'createdAt'>): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  
  // Check if stats already exist for this player and match
  const qy = query(
    collection(db, 'match_player_stats'),
    where('matchId', '==', stats.matchId),
    where('playerId', '==', stats.playerId)
  )
  
  const snap = await getDocs(qy)
  
  if (!snap.empty) {
    // Update existing stats
    const docRef = snap.docs[0].ref
    await updateDoc(docRef, {
      ...stats,
      updatedAt: serverTimestamp()
    } as any)
  } else {
    // Create new stats
    await addDoc(collection(db, 'match_player_stats'), {
      ...stats,
      createdAt: serverTimestamp()
    })
  }
}

export async function getMatchPlayerStats(matchId: string): Promise<MatchPlayerStats[]> {
  if (!isFirebaseReady() || !db) return []
  
  const qy = query(collection(db, 'match_player_stats'), where('matchId', '==', matchId))
  const snap = await getDocs(qy)
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toMillis() : d.data().createdAt
  } as MatchPlayerStats))
}

// Presets
export async function getGlobalPresets() {
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_presets')
    const list = raw ? JSON.parse(raw) : []
    return list.filter((p:any) => p.isGlobal)
  }
  
  const qy = query(collection(db, 'presets'), where('isGlobal', '==', true))
  const snap = await getDocs(qy)
  
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deletePreset(presetId: string) {
  if (!isFirebaseReady() || !db) {
    const raw = localStorage.getItem('srh_presets')
    const list = raw ? JSON.parse(raw) : []
    const filtered = list.filter((p:any) => p.id !== presetId)
    localStorage.setItem('srh_presets', JSON.stringify(filtered))
    return
  }
  
  await deleteDoc(doc(db, 'presets', presetId))
}

// Auth functions
export async function loginUser(email: string, password: string): Promise<User> {
  if (!isFirebaseReady() || !auth) throw new Error('Firebase non configuré')
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function registerUser(email: string, password: string): Promise<User> {
  if (!isFirebaseReady() || !auth) throw new Error('Firebase non configuré')
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function loginWithGoogle(): Promise<User> {
  if (!isFirebaseReady() || !auth) throw new Error('Firebase non configuré')
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function logoutUser(): Promise<void> {
  if (!isFirebaseReady() || !auth) throw new Error('Firebase non configuré')
  await auth.signOut()
}

// Get player stats for a specific player across all matches
export async function getPlayerStats(playerId: string): Promise<MatchPlayerStats[]> {
  if (!isFirebaseReady() || !db) return []
  
  const qy = query(collection(db, 'match_player_stats'), where('playerId', '==', playerId))
  const snap = await getDocs(qy)
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toMillis() : d.data().createdAt
  } as MatchPlayerStats))
}

// Get player ratings for a specific player across all matches
export async function getPlayerRatings(playerId: string): Promise<PlayerRating[]> {
  if (!isFirebaseReady() || !db) return []
  
  const qy = query(collection(db, 'player_ratings'), where('ratedPlayerId', '==', playerId))
  const snap = await getDocs(qy)
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toMillis() : d.data().createdAt
  } as PlayerRating))
}

// Sync user role index for security rules
export async function syncUserRoleIndex(uid: string, roles: string[]): Promise<void> {
  if (!isFirebaseReady() || !db) throw new Error('Firebase non configuré')
  
  const ref = doc(db, 'user_roles', uid)
  await setDoc(ref, { roles, updatedAt: serverTimestamp() })
}

// Formations - static data for now, could be moved to Firestore later
export async function getFormations(): Promise<Record<string, Slot[]>> {
  // Return common football formations as slots
  const formations: Record<string, Slot[]> = {
    'f433': [
      { key: 'gk1', x: 50, y: 10, position: 'GK' }, // GK
      { key: 'lb1', x: 20, y: 30, position: 'DEF' }, // LB
      { key: 'cb1', x: 40, y: 30, position: 'DEF' }, // CB
      { key: 'cb2', x: 60, y: 30, position: 'DEF' }, // CB
      { key: 'rb1', x: 80, y: 30, position: 'DEF' }, // RB
      { key: 'cm1', x: 30, y: 55, position: 'MID' }, // CM
      { key: 'cm2', x: 50, y: 50, position: 'MID' }, // CM
      { key: 'cm3', x: 70, y: 55, position: 'MID' }, // CM
      { key: 'lw1', x: 25, y: 80, position: 'FWD' }, // LW
      { key: 'st1', x: 50, y: 85, position: 'FWD' }, // ST
      { key: 'rw1', x: 75, y: 80, position: 'FWD' }, // RW
    ],
    'f442': [
      { key: 'gk1', x: 50, y: 10, position: 'GK' }, // GK
      { key: 'lb1', x: 20, y: 30, position: 'DEF' }, // LB
      { key: 'cb1', x: 40, y: 30, position: 'DEF' }, // CB
      { key: 'cb2', x: 60, y: 30, position: 'DEF' }, // CB
      { key: 'rb1', x: 80, y: 30, position: 'DEF' }, // RB
      { key: 'lm1', x: 20, y: 60, position: 'MID' }, // LM
      { key: 'cm1', x: 40, y: 55, position: 'MID' }, // CM
      { key: 'cm2', x: 60, y: 55, position: 'MID' }, // CM
      { key: 'rm1', x: 80, y: 60, position: 'MID' }, // RM
      { key: 'st1', x: 40, y: 85, position: 'FWD' }, // ST
      { key: 'st2', x: 60, y: 85, position: 'FWD' }, // ST
    ],
    'f352': [
      { key: 'gk1', x: 50, y: 10, position: 'GK' }, // GK
      { key: 'cb1', x: 35, y: 30, position: 'DEF' }, // CB
      { key: 'cb2', x: 50, y: 25, position: 'DEF' }, // CB
      { key: 'cb3', x: 65, y: 30, position: 'DEF' }, // CB
      { key: 'lwb1', x: 15, y: 60, position: 'MID' }, // LWB
      { key: 'cm1', x: 35, y: 55, position: 'MID' }, // CM
      { key: 'cm2', x: 50, y: 50, position: 'MID' }, // CM
      { key: 'cm3', x: 65, y: 55, position: 'MID' }, // CM
      { key: 'rwb1', x: 85, y: 60, position: 'MID' }, // RWB
      { key: 'st1', x: 40, y: 85, position: 'FWD' }, // ST
      { key: 'st2', x: 60, y: 85, position: 'FWD' }, // ST
    ]
  }
  
  return formations
}

// Get presets - wrapper around existing function, returns as Record for compatibility
export async function getPresets(matchId?: string): Promise<Record<string, PresetData | string[]>> {
  let presetsList: any[]
  if (matchId) {
    presetsList = await getPresetsForMatch(matchId)
  } else {
    presetsList = await getGlobalPresets()
  }
  
  // Convert array to Record format expected by the component
  const presetsRecord: Record<string, PresetData | string[]> = {}
  presetsList.forEach((preset, index) => {
    const key = preset.name || preset.id || `preset_${index}`
    presetsRecord[key] = preset
  })
  
  return presetsRecord
}

// Get lineups for a specific match
export async function getLineupsForMatch(matchId: string): Promise<SavedLineup[]> {
  return await getLineups(matchId) as SavedLineup[]
}

// Upsert match player stats (wrapper around existing function)
export async function upsertMatchPlayerStats(stats: Omit<MatchPlayerStats, 'id' | 'createdAt'>): Promise<void> {
  return await saveMatchPlayerStats(stats)
}

// Get all match player stats across all matches
export async function getAllMatchPlayerStats(): Promise<MatchPlayerStats[]> {
  if (!isFirebaseReady() || !db) return []
  
  const snap = await getDocs(collection(db, 'match_player_stats'))
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toMillis() : d.data().createdAt
  } as MatchPlayerStats))
}

// Get all player ratings across all matches
export async function getAllPlayerRatings(): Promise<PlayerRating[]> {
  if (!isFirebaseReady() || !db) return []
  
  const snap = await getDocs(collection(db, 'player_ratings'))
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toMillis() : d.data().createdAt
  } as PlayerRating))
}