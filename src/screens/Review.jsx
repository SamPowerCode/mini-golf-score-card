import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import ScorecardGrid from '../components/ScorecardGrid'
import NavBar from '../components/NavBar'

export default function Review() {
  const navigate = useNavigate()
  const { teamId } = useSession()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!teamId) { navigate('/setup'); return }
    loadData()
  }, [teamId])

  async function loadData() {
    const [{ data: teamData }, { data: playerData }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('players').select('*').eq('team_id', teamId),
    ])
    setTeam(teamData)
    setPlayers(playerData ?? [])
    const playerIds = (playerData ?? []).map(p => p.id)
    if (playerIds.length > 0) {
      const { data: scoreData } = await supabase.from('scores').select('*').in('player_id', playerIds)
      setScores(buildScoresMap(scoreData ?? []))
    }
    setLoading(false)
  }

  function buildScoresMap(rows) {
    const map = {}
    for (const row of rows) {
      if (!map[row.player_id]) map[row.player_id] = {}
      map[row.player_id][row.hole_number] = row.strokes
    }
    return map
  }

  function teamTotal() {
    return players.reduce((sum, p) =>
      sum + Object.values(scores[p.id] ?? {}).reduce((s, v) => s + v, 0), 0)
  }

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    const { error: dbError } = await supabase
      .from('teams')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', teamId)
    if (dbError) { setError('Submit failed. Try again.'); setSubmitting(false); return }
    navigate('/leaderboards')
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>

  return (
    <div className="screen">
      <NavBar showLeaderboards />
      <h2>Review Scores — {team?.name}</h2>
      <ScorecardGrid
        players={players}
        numHoles={team?.num_holes ?? 0}
        scores={scores}
        onScoreChange={() => {}}
        readOnly={true}
      />
      <div className="card" style={{ textAlign: 'center' }}>
        <p className="hint">Team total</p>
        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{teamTotal()}</p>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit Scores ✓'}
      </button>
    </div>
  )
}
