import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sporting Red Horse • 7v7',
  description: "Site officiel du Sporting Red Horse : calendrier, actualités, médias, résumés, effectif et constructeur de compositions.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-black text-zinc-100">
        <header className="sticky top-0 z-30 glass-effect border-b border-redhorse-gold/20">
          <div className="container flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <img src="/logo.jpeg" alt="SRH" className="h-12 w-12 rounded-full ring-2 ring-redhorse-gold/30 transition-all duration-300 hover:ring-redhorse-gold/60" />
              <div>
                <h1 className="font-bold tracking-wide text-lg text-redhorse-gold">Sporting Red Horse</h1>
                <p className="text-xs text-zinc-400">Football à 7</p>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-8 text-base font-medium">
              <a href="/" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Accueil</a>
              <a href="/schedule" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Calendrier</a>
              <a href="/team" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Équipe</a>
               <a href="/stats" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Statistiques</a>
               <a href="/news" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Actualités</a>
              <a href="/guide" className="text-zinc-300 hover:text-redhorse-gold transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-redhorse-gold after:transition-all after:duration-300 hover:after:w-full">Guide</a>
              <a href="/builder" className="btn-primary rounded-lg px-6 py-3 text-white font-semibold">Compositions</a>
            </nav>
            <button className="lg:hidden p-3 text-redhorse-gold border border-redhorse-gold/30 rounded-lg hover:bg-redhorse-gold/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>
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
      </body>
    </html>
  )
}

