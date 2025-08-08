/**
 * Script de création des collections Firestore.
 * A lancer localement avec ts-node ou node (après transpilation) une fois les
 * variables d'environnement NEXT_PUBLIC_* remplies.
 */
import { collection, doc, getFirestore, setDoc } from 'firebase/firestore'
import { app } from '../firebase/client'
import { matches } from '../lib/data'

async function main(){
  if (!app) throw new Error('Firebase non configuré: définissez les variables NEXT_PUBLIC_FIREBASE_* pour exécuter le seed.')
  const db = getFirestore(app)
  for (const m of matches){
    await setDoc(doc(collection(db,'matches'), m.id), m as any)
    console.log('Match seeded:', m.id)
  }
  console.log('Done.')
}

main().catch(e=>{ console.error(e); process.exit(1) })

