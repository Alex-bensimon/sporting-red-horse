import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/Header'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sporting Red Horse • 7v7',
  description: "Site officiel du Sporting Red Horse : calendrier, actualités, médias, résumés, effectif et constructeur de compositions.",
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-black text-zinc-100">
        <AuthProvider>
        <Header />
        <main>{children}</main>
        <footer className="glass-effect border-t border-redhorse-gold/20 mt-16">
          <div className="container py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-3">
                <img src="/logo.jpeg" className="h-10 w-10 rounded-full ring-2 ring-redhorse-gold/30" alt="SRH" />
                <div>
                  <div className="font-bold text-redhorse-gold">Sporting Red Horse</div>
                  <div className="text-xs text-zinc-400">© {new Date().getFullYear()} - Tous droits réservés</div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-redhorse-gold">Navigation</h4>
                <div className="space-y-2 text-sm">
                  <a href="/schedule" className="block text-zinc-400 hover:text-redhorse-gold transition-colors">Calendrier</a>
                  <a href="/team" className="block text-zinc-400 hover:text-redhorse-gold transition-colors">Équipe</a>
                  <a href="/stats" className="block text-zinc-400 hover:text-redhorse-gold transition-colors">Statistiques</a>
                  <a href="/news" className="block text-zinc-400 hover:text-redhorse-gold transition-colors">Actualités</a>
                  <a href="/builder" className="block text-zinc-400 hover:text-redhorse-gold transition-colors">Compositions</a>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-redhorse-gold">Ressources</h4>
                <div className="space-y-2 text-sm">
                  <a href="/guide" className="block text-zinc-400 hover:text-redhorse-gold transition-colors">Guide Football 7</a>
                  <a href="/builder" className="block text-zinc-400 hover:text-redhorse-gold transition-colors">Construire une composition</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  )
}

