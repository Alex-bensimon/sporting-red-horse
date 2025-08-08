// Seed Firestore using Firebase Admin (best for CI or local seeding)
// Uses GOOGLE_APPLICATION_CREDENTIALS if set, otherwise tries local cred.json
import admin from 'firebase-admin'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataPath = resolve(root, 'data/seed.json')

if (!admin.apps.length) {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const localCredPath = resolve(root, 'cred.json')
  if (envPath) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() })
  } else if (fs.existsSync(localCredPath)) {
    const sa = JSON.parse(fs.readFileSync(localCredPath, 'utf-8'))
    admin.initializeApp({ credential: admin.credential.cert(sa) })
  } else {
    console.error('No credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or add cred.json at project root (web/cred.json).')
    process.exit(1)
  }
}

const db = admin.firestore()
const seed = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

async function upsertCollection(name, docs, idKey='id'){
  const batch = db.batch()
  docs.forEach(docData => {
    const id = docData[idKey] || db.collection(name).doc().id
    const ref = db.collection(name).doc(id)
    batch.set(ref, docData, { merge: true })
  })
  await batch.commit()
  console.log(`Seeded ${docs.length} docs into ${name}`)
}

await upsertCollection('players', seed.players)
await upsertCollection('matches', seed.matches)
console.log('Seed complete.')

