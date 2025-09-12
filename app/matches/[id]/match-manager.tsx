"use client"
import { useAuth } from '@/lib/auth-context'
import { createMatchSheet, getLineupsForMatch, getMatches, getMatchSheet, getPlayers } from '@/lib/store'
import type { Match, MatchSheet, Player, SavedLineup } from '@/lib/types'
import { useEffect, useState } from 'react'

export default function MatchManager({ matchId }: { matchId: string }) {
  const { isAuthenticated, isCaptain, currentPlayer } = useAuth()
  const [lineups, setLineups] = useState<SavedLineup[]>([])
  const [matchSheet, setMatchSheet] = useState<MatchSheet | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedLineup, setSelectedLineup] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [match, setMatch] = useState<Match | null>(null)

  useEffect(() => {
    async function loadData() {
      const [matchLineups, sheet, allPlayers, matches] = await Promise.all([
        getLineupsForMatch(matchId),
        getMatchSheet(matchId),
        getPlayers(),
        getMatches()
      ])
      
      setLineups(matchLineups)
      setMatchSheet(sheet)
      setPlayers(allPlayers)
      setMatch(matches.find(m => m.id === matchId) || null)
    }
    
    loadData()
  }, [matchId])

  const handleCreateMatchSheet = async () => {
    if (!selectedLineup || !currentPlayer) return
    
    const lineup = lineups.find(l => l.id === selectedLineup)
    if (!lineup) return
    
    setLoading(true)
    try {
      const starters = Object.values(lineup.lineup).filter(Boolean) as string[]
      const subs = lineup.subs || []
      const actualPlayers = [...starters, ...subs]
      const absentPlayers = lineup.absentPlayers || []
      const startersBySlot = lineup.lineup
      const formationAtValidation = lineup.formation
      
      const result = await createMatchSheet({
        matchId,
        lineup,
        actualPlayers,
        absentPlayers,
        startersBySlot,
        formationAtValidation,
        subs,
        createdBy: currentPlayer.id
      })
      
      const newSheet: MatchSheet = {
        id: result.id,
        matchId,
        lineup,
        actualPlayers,
        absentPlayers,
        startersBySlot,
        formationAtValidation,
        subs,
        createdAt: new Date().toISOString(),
        createdBy: currentPlayer.id
      }
      
      setMatchSheet(newSheet)
    } catch (error) {
      console.error('Erreur lors de la création de la feuille de match:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player ? player.name : 'Joueur inconnu'
  }


  // Vérifier si le match est passé ou aujourd'hui
  const isPastOrToday = match ? new Date(match.date) <= new Date() : false

  return (
    <div className="space-y-6">
      {matchSheet ? (
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📋 Feuille de match
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                ✓ Validée
              </span>
              {isAuthenticated && (
                <a
                  href={`/matches/${matchId}/ratings`}
                  className="btn-primary rounded-lg px-4 py-2 text-white font-semibold"
                >
                  Noter les joueurs
                </a>
              )}
              {isPastOrToday && isCaptain && (
                <a
                  href={`/matches/${matchId}/stats`}
                  className="btn-primary rounded-lg px-4 py-2 text-white font-semibold"
                >
                  📈 Entrer les stats
                </a>
              )}
            </div>
          </div>
          
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-redhorse-gold mb-3">
                ⚽ Titulaires
              </h4>
              <div className="space-y-2 mb-4">
                {Object.values(matchSheet.startersBySlot || {}).filter(Boolean).map(playerId => {
                  const isPresent = matchSheet.actualPlayers.includes(playerId as string)
                  return (
                    <div 
                      key={playerId} 
                      className={`flex items-center gap-2 text-sm ${!isPresent ? 'opacity-50 line-through' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {getPlayerName(playerId as string)}
                    </div>
                  )
                })}
              </div>
              
              {matchSheet.subs && matchSheet.subs.length > 0 && (
                <>
                  <h4 className="font-semibold text-blue-400 mb-3 mt-4">
                    🔄 Remplaçants
                  </h4>
                  <div className="space-y-2">
                    {matchSheet.subs.map(playerId => {
                      const isPresent = matchSheet.actualPlayers.includes(playerId)
                      return (
                        <div 
                          key={playerId} 
                          className={`flex items-center gap-2 text-sm ${!isPresent ? 'opacity-50 line-through' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          {getPlayerName(playerId)}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
            
            {(matchSheet.absentPlayers.length > 0) && (
              <div>
                <h4 className="font-semibold text-red-400 mb-3">
                  🔴 Joueurs absents ({matchSheet.absentPlayers.length})
                </h4>
                <div className="space-y-2">
                  {matchSheet.absentPlayers.map(playerId => (
                    <div 
                      key={playerId} 
                      className={`flex items-center gap-2 text-sm opacity-60`}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {getPlayerName(playerId)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-effect rounded-2xl p-6 border-2 border-dashed border-zinc-600">
          <div className="text-center space-y-4">
            <div className="text-4xl">📋</div>
            <h3 className="text-xl font-bold text-white">Créer la feuille de match</h3>
            <p className="text-zinc-400">
              {isCaptain 
                ? "Sélectionnez une composition enregistrée pour créer la feuille de match officielle"
                : "Seuls les capitaines peuvent créer et valider les feuilles de match"
              }
            </p>
            
            {!isCaptain && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  👑 Vous devez être capitaine pour valider une feuille de match.
                </p>
                {!isAuthenticated && (
                  <p className="text-sm text-zinc-400 mt-2">
                    <a href="/login" className="text-redhorse-gold hover:underline">Connectez-vous</a> si vous êtes capitaine.
                  </p>
                )}
              </div>
            )}
            
            {isCaptain && lineups.length > 0 && (
              <div className="max-w-md mx-auto space-y-4">
                <select
                  value={selectedLineup}
                  onChange={e => setSelectedLineup(e.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-white focus:border-redhorse-gold focus:outline-none"
                >
                  <option value="">Choisir une composition...</option>
                  {lineups.map(lineup => (
                    <option key={lineup.id} value={lineup.id}>
                      {lineup.name} ({lineup.formation})
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleCreateMatchSheet}
                  disabled={!selectedLineup || loading}
                  className="btn-primary rounded-lg px-6 py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création...' : '👑 Valider la feuille de match'}
                </button>
              </div>
            )}
            
            {isCaptain && lineups.length === 0 && (
              <div className="text-zinc-500">
                <p>Aucune composition n'a été enregistrée pour ce match.</p>
                <p className="text-sm mt-2">Créez une composition ci-dessous pour pouvoir générer la feuille de match.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isAuthenticated && matchSheet && (
        <div className="glass-effect rounded-2xl p-4 border border-redhorse-gold/20 bg-redhorse-gold/5">
          <div className="text-center">
            <p className="text-redhorse-gold font-medium">
              🔑 Connectez-vous pour noter les joueurs après le match
            </p>
            <a href="/login" className="text-sm text-zinc-400 hover:text-redhorse-gold transition-colors">
              Aller à la page de connexion →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}