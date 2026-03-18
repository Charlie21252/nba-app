import { useState, useEffect } from 'react'
import { calcPayout } from '../utils/oddsUtils'

const KEY = 'nba_bets'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(bets) {
  localStorage.setItem(KEY, JSON.stringify(bets))
}

export function useBets() {
  const [bets, setBets] = useState(load)

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === KEY) setBets(JSON.parse(e.newValue || '[]'))
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  function persist(updated) {
    setBets(updated)
    save(updated)
  }

  function addBet(data) {
    const bet = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      settledAt: null,
      gameDate: data.gameDate || new Date().toISOString().slice(0, 10),
      homeTeam: data.homeTeam || '',
      awayTeam: data.awayTeam || '',
      betType: data.betType || 'moneyline',
      pick: data.pick || '',
      bookmaker: data.bookmaker || '',
      odds: Number(data.odds),
      stake: Number(data.stake),
      potentialPayout: calcPayout(Number(data.stake), Number(data.odds)),
      status: 'pending',
      actualReturn: null,
      profitLoss: null,
      fromRecommendation: data.fromRecommendation || false,
      notes: data.notes || '',
      schemaVersion: 1,
    }
    persist([bet, ...bets])
    return bet
  }

  function settleBet(id, outcome) {
    // outcome: 'won' | 'lost' | 'push'
    persist(bets.map(b => {
      if (b.id !== id) return b
      const actualReturn = outcome === 'won' ? calcPayout(b.stake, b.odds)
        : outcome === 'push' ? b.stake : 0
      return {
        ...b,
        status: outcome,
        settledAt: new Date().toISOString(),
        actualReturn,
        profitLoss: actualReturn - b.stake,
      }
    }))
  }

  function deleteBet(id) {
    persist(bets.filter(b => b.id !== id))
  }

  function updateNotes(id, notes) {
    persist(bets.map(b => b.id === id ? { ...b, notes } : b))
  }

  // Derived stats
  const settled = bets.filter(b => b.status !== 'pending')
  const wins = settled.filter(b => b.status === 'won').length
  const losses = settled.filter(b => b.status === 'lost').length
  const totalStaked = settled.reduce((s, b) => s + b.stake, 0)
  const totalReturn = settled.reduce((s, b) => s + (b.actualReturn ?? 0), 0)
  const netPL = totalReturn - totalStaked
  const winRate = settled.length ? (wins / settled.length * 100).toFixed(1) : null
  const roi = totalStaked ? ((netPL / totalStaked) * 100).toFixed(1) : null

  const chartData = [...settled]
    .sort((a, b) => new Date(a.settledAt) - new Date(b.settledAt))
    .reduce((acc, bet) => {
      const prev = acc.length ? acc[acc.length - 1].cumulative : 0
      return [...acc, { date: bet.settledAt?.slice(0, 10), cumulative: +(prev + (bet.profitLoss ?? 0)).toFixed(2) }]
    }, [])

  return {
    bets,
    addBet,
    settleBet,
    deleteBet,
    updateNotes,
    stats: { wins, losses, settled: settled.length, totalStaked, netPL, winRate, roi },
    chartData,
  }
}
