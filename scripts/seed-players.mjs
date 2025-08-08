// Seed players into Firestore using Admin SDK
import admin from 'firebase-admin'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(fs.readFileSync(resolve(__dirname,'../data/players.json'),'utf-8'))

const localCredPath = resolve(__dirname, '../cred.json')
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() })
  } else if (fs.existsSync(localCredPath)) {
    const sa = JSON.parse(fs.readFileSync(localCredPath,'utf-8'))
    admin.initializeApp({ credential: admin.credential.cert(sa) })
  } else {
    console.error('No credentials: set GOOGLE_APPLICATION_CREDENTIALS or add web/cred.json')
    process.exit(1)
  }
}
const db = admin.firestore()

const batch = db.batch()
data.forEach(p => { const ref = db.collection('players').doc(p.id); batch.set(ref, p, { merge: true }) })
await batch.commit()
console.log(`Seeded ${data.length} players`)

