import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 9000 })

export const searchPlayers = (q) => api.get(`/players/search?q=${encodeURIComponent(q)}`)
export const getPlayerInfo = (id) => api.get(`/players/${id}/info`)
export const getPlayerCareer = (id) => api.get(`/players/${id}/career`)
export const getPlayerGameLog = (id, season = '2024-25') =>
  api.get(`/players/${id}/gamelog?season=${season}`)

export const getScoreboard = (date) =>
  api.get(`/games/scoreboard${date ? `?game_date=${date}` : ''}`)

export const getPlayersByCollege = (college) => api.get(`/players/college?name=${encodeURIComponent(college)}`)
export const getPlayersByDraftYear = (year) => api.get(`/players/draft?year=${year}`)

export const getOdds = (markets = 'h2h,spreads,totals', sport = 'basketball_nba') =>
  api.get(`/betting/odds?markets=${markets}&sport=${sport}`)
export const getEventOdds = (eventId, markets = 'h2h,spreads,totals') =>
  api.get(`/betting/odds/${eventId}?markets=${markets}`)
export const getRecommendations = () => api.get('/betting/recommendations')

export const getPlayerAdvanced = (id) => api.get(`/players/${id}/advanced`)
export const getPlayerPercentiles = (id) => api.get(`/players/${id}/percentiles`)
