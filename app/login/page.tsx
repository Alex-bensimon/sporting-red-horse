"use client"
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/client';

export default function LoginPage(){
  // Note: react-firebase-hooks not installed to keep deps minimal; simple local state alternative
  const user = auth?.currentUser || null
  async function login(){ if (!auth || !googleProvider) return; await signInWithPopup(auth, googleProvider) }
  async function logout(){ if (!auth) return; await signOut(auth) }
  return (
    <section className="container py-8">
      <h2 className="mb-3 text-2xl font-bold">Authentification</h2>
      {user ? (
        <div className="space-y-2">
          <div>Connecté: {user.email}</div>
          <button className="rounded-md border border-zinc-700 px-3 py-2" onClick={logout}>Se déconnecter</button>
        </div>
      ) : (
        <button className="rounded-md bg-redhorse-red px-3 py-2" onClick={login}>Se connecter avec Google</button>
      )}
    </section>
  )
}

