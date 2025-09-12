// Seed formations and presets into Firestore using Admin SDK
import admin from 'firebase-admin'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const formations = JSON.parse(fs.readFileSync(resolve(__dirname,'../data/formations.json'),'utf-8'))
const presets = JSON.parse(fs.readFileSync(resolve(__dirname,'../data/presets.json'),'utf-8'))

const localCredPath = resolve(__dirname, '../cred.json')
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() })
  } else if (fs.existsSync(localCredPath)) {
    const sa = JSON.parse(fs.readFileSync(localCredPath,'utf-8'))
    admin.initializeApp({ credential: admin.credential.cert(sa) })
  } else {
    console.error('No credentials: set GOOGLE_APPLICATION_CREDENTIALS or add cred.json')
    process.exit(1)
  }
}
const db = admin.firestore()

const batch = db.batch()

// Seed formations
Object.entries(formations).forEach(([name, slots]) => {
  const ref = db.collection('formations').doc(name)
  batch.set(ref, { name, slots, createdAt: new Date() }, { merge: true })
})

// Seed presets  
Object.entries(presets).forEach(([name, playerIds]) => {
  const ref = db.collection('presets').doc(name)
  batch.set(ref, { name, playerIds, createdAt: new Date() }, { merge: true })
})

await batch.commit()
console.log(`Seeded ${Object.keys(formations).length} formations`)
console.log(`Seeded ${Object.keys(presets).length} presets`)