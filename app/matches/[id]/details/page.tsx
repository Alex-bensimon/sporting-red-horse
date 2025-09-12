import MatchDetailsClient from './match-details-client'

export default function MatchDetailsPage({ params }: { params: { id: string } }) {
  return <MatchDetailsClient matchId={params.id} />
}