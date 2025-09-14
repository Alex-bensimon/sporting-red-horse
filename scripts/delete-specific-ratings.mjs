// Delete player ratings with specific comment
// Usage: node scripts/delete-specific-ratings.mjs

import admin from 'firebase-admin'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

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

async function deleteSpecificRatings() {
  try {
    console.log('Recherche des documents à supprimer...')
    
    const ratingsRef = db.collection('player_ratings')
    const snapshot = await ratingsRef
      .where('comment', '==', 'Pas à ton poste habituel malheureusement.')
      .get()
    
    if (snapshot.empty) {
      console.log('Aucun document trouvé avec ce commentaire.')
      return
    }
    
    console.log(`${snapshot.size} document(s) trouvé(s) avec ce commentaire.`)
    
    const batch = db.batch()
    const deletedIds = []
    
    snapshot.docs.forEach((doc) => {
      console.log(`Suppression du document: ${doc.id}`)
      batch.delete(doc.ref)
      deletedIds.push(doc.id)
    })
    
    await batch.commit()
    
    console.log(`✅ ${deletedIds.length} document(s) supprimé(s) avec succès.`)
    console.log('IDs supprimés:', deletedIds)
    
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    process.exit(1)
  }
}

deleteSpecificRatings()
  .then(() => {
    console.log('Script terminé.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })