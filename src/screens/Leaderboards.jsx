import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NavBar from '../components/NavBar'

export default function Leaderboards() {
  const [teamBoard, setTeamBoard] = useState([])
  const [playerBoard, setPlayerBoard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    // Load only submitted teams
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .not('submitted_at', 'is', null)

    if (!teams?.length) { setLoading(false); return }

    const teamIds = teams.map(t => t.id)
    const { data: players } = await supabase.from('players').select('*').in('team_id', teamIds)
    const playerIds = (players ?? []).map(p => p.id)
    const { data: scores } = playerIds.length
      ? await supabase.from('scores').select('*').in('player_id', playerIds)
      : { data: [] }

    // Build player totals
    const playerTotals = {}
    for (const s of scores ?? []) {
      playerTotals[s.player_id] = (playerTotals[s.player_id] ?? 0) + s.strokes
    }

    // Build team totals
    const teamTotals = {}
    for (const p of players ?? []) {
      teamTotals[p.team_id] = (teamTotals[p.team_id] ?? 0) + (playerTotals[p.id] ?? 0)
    }

    const sortedTeams = teams
      .map(t => ({ ...t, total: teamTotals[t.id] ?? 0 }))
      .sort((a, b) => a.total - b.total)

    const sortedPlayers = (players ?? [])
      .map(p => ({
        ...p,
        total: playerTotals[p.id] ?? 0,
        teamName: teams.find(t => t.id === p.team_id)?.name ?? '',
      }))
      .sort((a, b) => a.total - b.total)

    setTeamBoard(sortedTeams)
    setPlayerBoard(sortedPlayers)
    setLoading(false)
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>

  return (
    <div className="screen">
      <NavBar />
      <h2>Team Leaderboard</h2>
      <LeaderTable rows={teamBoard} cols={['Team', 'Total']} getValue={r => [r.name, r.total]} />

      <h2 style={{ marginTop: 8 }}>Player Leaderboard</h2>
      <LeaderTable rows={playerBoard} cols={['Player', 'Team', 'Total']} getValue={r => [r.name, r.teamName, r.total]} />

      {teamBoard.length === 0 && (
        <p className="hint">No teams have submitted yet. Check back soon!</p>
      )}
    </div>
  )
}

function LeaderTable({ rows, cols, getValue }) {
  if (!rows.length) return null
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
      <thead>
        <tr>
          <th style={th()}>#</th>
          {cols.map(c => <th key={c} style={th()}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const vals = getValue(row)
          return (
            <tr key={row.id} style={i === 0 ? { background: '#1e293b' } : {}}>
              <td style={td()}>{i + 1}</td>
              {vals.map((v, j) => <td key={j} style={td(j === vals.length - 1)}>{v}</td>)}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function th() {
  return { padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: 600 }
}
function td(bold = false) {
  return { padding: '8px 6px', borderBottom: '1px solid #1e293b', fontWeight: bold ? 700 : 400 }
}
