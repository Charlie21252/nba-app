import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const searchPlayers = (q) => api.get(`/players/search?q=${encodeURIComponent(q)}`)
export const getPlayerInfo = (id) => api.get(`/players/${id}/info`)
export const getPlayerCareer = (id) => api.get(`/players/${id}/career`)
export const getPlayerGameLog = (id, season = '2024-25') =>
  api.get(`/players/${id}/gamelog?season=${season}`)

export const getTeams = () => api.get('/teams/')
export const getTeamRoster = (id, season = '2024-25') =>
  api.get(`/teams/${id}/roster?season=${season}`)
export const getTeamHistory = (id) => api.get(`/teams/${id}/history`)
export const getTeamGames = (id, season = '2024-25', last_n = 10) =>
  api.get(`/teams/${id}/games?season=${season}&last_n=${last_n}`)

export const getLeaders = (stat = 'PTS', season = '2024-25', top = 10) =>
  api.get(`/leaders/?stat=${stat}&season=${season}&top=${top}`)

export const getScoreboard = (date) =>
  api.get(`/games/scoreboard${date ? `?game_date=${date}` : ''}`)

export const getPlayersByCollege = (college) => api.get(`/players/college?name=${encodeURIComponent(college)}`)
export const getPlayersByDraftYear = (year) => api.get(`/players/draft?year=${year}`)
