import { useQuery } from '@tanstack/react-query'
import { getOdds } from '../api/nba'

export function useOdds(markets = 'h2h,spreads,totals', sport = 'basketball_nba') {
  return useQuery({
    queryKey: ['betting', 'odds', sport, markets],
    queryFn: () => getOdds(markets, sport).then(r => r.data),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  })
}
