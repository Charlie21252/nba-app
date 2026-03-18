import { useQuery } from '@tanstack/react-query'
import { getRecommendations } from '../api/nba'

export function useRecommendations() {
  return useQuery({
    queryKey: ['betting', 'recommendations'],
    queryFn: () => getRecommendations().then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
