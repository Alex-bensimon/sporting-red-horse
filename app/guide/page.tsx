export default function GuidePage(){
  return (
    <>
      <section className="relative py-16">
        <div className="hero-bg"></div>
        <div className="container relative z-10">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-redhorse-gold to-redhorse-red bg-clip-text text-transparent">
              Guide Tactique
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Maîtrisez le football à 7 avec notre guide complet : règles, formations et conseils tactiques
            </p>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-8 lg:gap-12">
          
          {/* Règles essentielles */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">📋</span>
              Règles Essentielles
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="feature-card rounded-2xl p-6">
                <h4 className="text-xl font-bold text-redhorse-gold mb-4 flex items-center gap-2">
                  <span>⚽</span>
                  Hors-jeu
                </h4>
                <p className="text-zinc-300 mb-3">
                  Appliqué uniquement dans la zone des <strong className="text-redhorse-gold">13 mètres</strong> de la ligne de but
                </p>
                <div className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-3">
                  💡 Plus de liberté de mouvement dans le milieu de terrain
                </div>
              </div>

              <div className="feature-card rounded-2xl p-6">
                <h4 className="text-xl font-bold text-redhorse-gold mb-4 flex items-center gap-2">
                  <span>🔄</span>
                  Remplacements
                </h4>
                <p className="text-zinc-300 mb-3">
                  <strong className="text-redhorse-gold">Illimités</strong> à tout moment avec autorisation de l'arbitre
                </p>
                <div className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-3">
                  💡 Permet de gérer la fatigue et adapter la tactique
                </div>
              </div>

              <div className="feature-card rounded-2xl p-6">
                <h4 className="text-xl font-bold text-redhorse-gold mb-4 flex items-center gap-2">
                  <span>⚡</span>
                  Coups francs
                </h4>
                <p className="text-zinc-300 mb-3">
                  Tous <strong className="text-redhorse-gold">directs</strong>, mur à respecter : <strong>6 mètres</strong>
                </p>
                <div className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-3">
                  💡 Opportunités de buts plus fréquentes qu'à 11
                </div>
              </div>

              <div className="feature-card rounded-2xl p-6">
                <h4 className="text-xl font-bold text-redhorse-gold mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  Pénalty
                </h4>
                <p className="text-zinc-300 mb-3">
                  Distance : <strong className="text-redhorse-gold">9 mètres</strong> du but
                </p>
                <div className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-3">
                  💡 Plus proche qu'à 11 contre 11 (11m), exige précision
                </div>
              </div>
            </div>
          </div>

          {/* Formations tactiques */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">⚽</span>
              Formations Tactiques
            </h3>
            <div className="grid gap-6 lg:grid-cols-2">
              
              <div className="feature-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-redhorse-gold to-redhorse-red rounded-full flex items-center justify-center font-bold text-black">
                    3-2-1
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Formation Défensive</h4>
                    <p className="text-sm text-zinc-400">Bloc compact et contres</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Défense très solide et compacte</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Simple à mettre en place</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">❌</span>
                    <span className="text-zinc-300">Attaquant souvent isolé</span>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400">
                  💡 <strong>Idéale pour :</strong> Équipes défensives, préserver un avantage
                </div>
              </div>

              <div className="feature-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-redhorse-gold to-redhorse-red rounded-full flex items-center justify-center font-bold text-black">
                    2-3-1
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Contrôle du Milieu</h4>
                    <p className="text-sm text-zinc-400">Domination technique</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Contrôle du milieu de terrain</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Polyvalence tactique</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">❌</span>
                    <span className="text-zinc-300">Vulnérable sur les côtés</span>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400">
                  💡 <strong>Idéale pour :</strong> Équipes techniques, possession de balle
                </div>
              </div>

              <div className="feature-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-redhorse-gold to-redhorse-red rounded-full flex items-center justify-center font-bold text-black">
                    3-3
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Équilibre Parfait</h4>
                    <p className="text-sm text-zinc-400">Attaque et défense</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Équilibre défense-attaque</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Simple à comprendre</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">❌</span>
                    <span className="text-zinc-300">Demande joueurs polyvalents</span>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400">
                  💡 <strong>Idéale pour :</strong> Équipes débutantes, formation de base
                </div>
              </div>

              <div className="feature-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-redhorse-gold to-redhorse-red rounded-full flex items-center justify-center font-bold text-black">
                    4-2
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Béton Défensif</h4>
                    <p className="text-sm text-zinc-400">Solidité maximale</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Défense ultra solide</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-zinc-300">Sécurité maximale</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">❌</span>
                    <span className="text-zinc-300">Très peu d'options offensives</span>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400">
                  💡 <strong>Idéale pour :</strong> Préserver un résultat, fin de match
                </div>
              </div>

            </div>
          </div>

          {/* Conseils tactiques */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🎯</span>
              Conseils Tactiques SRH
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="glass-effect-gold rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">🔥</div>
                <h4 className="font-bold text-redhorse-gold mb-2">Pressing Haut</h4>
                <p className="text-zinc-300 text-sm">
                  Récupération rapide du ballon dans le camp adverse pour créer des occasions
                </p>
              </div>
              <div className="glass-effect-gold rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-bold text-redhorse-gold mb-2">Transitions</h4>
                <p className="text-zinc-300 text-sm">
                  Passes rapides et courses en profondeur dès la récupération du ballon
                </p>
              </div>
              <div className="glass-effect-gold rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">🤝</div>
                <h4 className="font-bold text-redhorse-gold mb-2">Communication</h4>
                <p className="text-zinc-300 text-sm">
                  Échanges constants entre joueurs pour coordonner les mouvements
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}

