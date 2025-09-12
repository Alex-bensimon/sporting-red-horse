import CaptainStatsClient from './stats-client'

export default function MatchStatsPage({ params }: { params: { id: string } }){
  return <CaptainStatsClient matchId={params.id} />
}

