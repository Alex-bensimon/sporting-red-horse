import RatingsClient from './ratings-client'

export default function RatingsPage({ params }: { params: { id: string } }) {
  return <RatingsClient matchId={params.id} />
}