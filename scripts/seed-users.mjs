// Seed users meta collection from players list using Firebase Admin SDK
// Usage: npm run seed:users
// Requires GOOGLE_APPLICATION_CREDENTIALS env var or a local cred.json at project root

import admin from 'firebase-admin'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Load players as source of truth for names/ids
const playersPath = resolve(root, 'data/players.json')
if (!fs.existsSync(playersPath)) {
  console.error('Missing data/players.json')
  process.exit(1)
}
const players = JSON.parse(fs.readFileSync(playersPath, 'utf-8'))

// Initialize Admin SDK
const localCredPath = resolve(root, 'cred.json')
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() })
  } else if (fs.existsSync(localCredPath)) {
    const sa = JSON.parse(fs.readFileSync(localCredPath, 'utf-8'))
    admin.initializeApp({ credential: admin.credential.cert(sa) })
  } else {
    console.error('No credentials: set GOOGLE_APPLICATION_CREDENTIALS or add cred.json at project root')
    process.exit(1)
  }
}

const db = admin.firestore()

// Prefer local data/users.json if present, otherwise derive from players
const usersPath = resolve(root, 'data/users.json')
let usersMeta
if (fs.existsSync(usersPath)) {
  usersMeta = JSON.parse(fs.readFileSync(usersPath, 'utf-8'))
} else {
  usersMeta = players.map((p) => ({
    playerId: p.id,
    name: p.name,
    isFirstConnection: true,
    uid: null,
    email: '',
  }))
}

// Upsert in batch, using playerId as document ID for idempotency
const batch = db.batch()
usersMeta.forEach((u) => {
  const ref = db.collection('users').doc(u.playerId)
  batch.set(ref, u, { merge: true })
  // Also index by uid if present
  if (u.uid) {
    const idxRef = db.collection('users_by_uid').doc(u.uid)
    batch.set(idxRef, { roles: u.roles || [] }, { merge: true })
  }
})
await batch.commit()

console.log(`Seeded ${usersMeta.length} user meta documents into 'users' collection`)

