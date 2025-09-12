import sponsors from '@data/sponsors.json';

export default function HomePage(){
  return (
    <>
      <section className="relative min-h-[50vh] flex items-center">
        <div className="hero-bg"></div>
        <div className="container grid gap-10 py-12 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-redhorse-gold via-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
                  Bienvenue au<br />Sporting Red Horse
                </span>
              </h2>
              <p className="text-lg md:text-xl text-zinc-300 leading-relaxed max-w-2xl">
                Suivez le calendrier, les actualités, les médias, consultez les résumés
                de matchs, découvrez l&apos;effectif et construisez vos compositions
                d'équipe.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a className="btn-primary rounded-lg px-6 py-3 font-semibold text-center" href="/builder">
                Construire une composition
              </a>
              <a className="btn-secondary rounded-lg px-6 py-3 text-center font-semibold" href="/schedule">
                Voir le calendrier
              </a>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-redhorse-gold">7v7</div>
                <div className="text-sm text-zinc-400">Format de jeu</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-redhorse-gold">14</div>
                <div className="text-sm text-zinc-400">Joueurs</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-redhorse-gold">2025</div>
                <div className="text-sm text-zinc-400">Saison</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-redhorse-red/20 to-redhorse-gold/20 rounded-full blur-3xl"></div>
            <img 
              src="/logo_animated.gif" 
              alt="SRH" 
              className="h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96 rounded-full drop-shadow-2xl ring-4 ring-redhorse-gold/20 hover:ring-redhorse-gold/40 transition-all duration-500 relative z-10" 
            />
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="relative py-6">
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-redhorse-gold" />
            <div className="text-sm font-semibold text-zinc-300">Partenaires</div>
          </div>
          <div className="marquee">
            <div className="marquee__track">
              {[...sponsors, ...sponsors].map((s, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
                  <img src={s.image} alt={s.name} className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-contain p-1"/>
                  <span className="text-xs text-zinc-400">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 relative">
        <div className="container">
          <div className="text-center mb-10 space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold text-white">Fonctionnalités</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Découvrez tous les outils pour gérer votre équipe et suivre les performances
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Feature 
              title="Calendrier" 
              text="Tous les matchs, export .ics et filtrage rapide pour ne rien manquer."
              href="/schedule"
              icon="📅"
            />
            <Feature 
              title="Équipe" 
              text="Cartes style FUT avec statistiques détaillées pour chaque joueur."
              href="/team"
              icon="👥"
            />
            <Feature 
              title="Compositions" 
              text="Terrain interactif, presets tactiques et sauvegarde par match."
              href="/builder"
              icon="⚽"
            />
            <Feature 
              title="Guide Tactique" 
              text="Guide complet du football à 7 avec formations et conseils."
              href="/guide"
              icon="📚"
            />
            <Feature 
              title="Statistiques" 
              text="Analyses détaillées des performances individuelles et collectives."
              href="/stats"
              icon="📊"
            />
            <Feature 
              title="Actualités" 
              text="Toutes les news, résultats et moments forts de l'équipe."
              href="/news"
              icon="📰"
            />
          </div>
        </div>
      </section>
    </>
  )
}

function Feature({title, text, href, icon}: {title: string; text: string; href: string; icon?: string}) {
  return (
    <a href={href} className="feature-card block rounded-2xl p-6 group">
      <div className="flex items-center gap-3 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <div className="text-xl font-bold text-white group-hover:text-redhorse-gold transition-colors">{title}</div>
      </div>
      <p className="text-zinc-300 leading-relaxed">{text}</p>
      <div className="mt-4 flex items-center text-redhorse-gold text-sm font-medium">
        En savoir plus
        <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </a>
  )
}

