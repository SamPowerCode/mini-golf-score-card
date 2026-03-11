import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'
import ScorecardGrid from '../components/ScorecardGrid'
import NavBar from '../components/NavBar'

export default function Scorecard() {
  const navigate = useNavigate()
  const { teamId } = useSession()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  // scores shape: { [playerId]: { [hole]: strokes } }
  const [scores, setScores] = useState({})
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const [{ data: teamData, error: teamError }, { data: playerData, error: playerError }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('players').select('*').eq('team_id', teamId),
    ])
    if (teamError || playerError) { setLoadError('Failed to load game data. Please refresh.'); setLoading(false); return }
    if (!teamData) { navigate('/setup'); return }
    if (teamData.submitted_at) { navigate('/leaderboards'); return }
    setTeam(teamData)
    setPlayers(playerData ?? [])

    const playerIds = (playerData ?? []).map(p => p.id)
    if (playerIds.length > 0) {
      const { data: scoreData, error: scoreError } = await supabase.from('scores').select('*').in('player_id', playerIds)
      if (scoreError) { setLoadError('Failed to load scores. Please refresh.'); setLoading(false); return }
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

  useEffect(() => {
    if (!teamId) { navigate('/setup'); return }
    loadData()
  }, [teamId])

  const handleScoreChange = useCallback(async (playerId, hole, strokes) => {
    setSaveError('')
    // Save previous value for rollback
    let previousValue
    setScores(prev => {
      previousValue = prev[playerId]?.[hole] ?? null
      return {
        ...prev,
        [playerId]: { ...(prev[playerId] ?? {}), [hole]: strokes }
      }
    })
    const { error } = await supabase.from('scores').upsert(
      { player_id: playerId, hole_number: hole, strokes },
      { onConflict: 'player_id,hole_number' }
    )
    if (error) {
      // Revert the optimistic update
      setScores(prev => {
        const updated = { ...(prev[playerId] ?? {}) }
        if (previousValue === null) {
          delete updated[hole]
        } else {
          updated[hole] = previousValue
        }
        return { ...prev, [playerId]: updated }
      })
      setSaveError('Save failed — tap the cell again to retry')
    }
  }, [])

  function allScoresFilled() {
    if (!team || players.length === 0) return false
    return players.every(p =>
      Array.from({ length: team.num_holes }, (_, i) => i + 1)
        .every(h => (scores[p.id]?.[h] ?? 0) >= 1)
    )
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>
  if (loadError) return <div className="screen"><p className="error-msg">{loadError}</p></div>

  return (
    <div className="screen">
      <NavBar showLeaderboards />
      <h2>{team?.name}</h2>
      <ScorecardGrid
        players={players}
        numHoles={team?.num_holes ?? 0}
        scores={scores}
        onScoreChange={handleScoreChange}
        readOnly={false}
      />
      {!allScoresFilled() && (
        <p className="hint" style={{ fontSize: '0.8rem' }}>Fill all scores to continue</p>
      )}
      {saveError && <p className="error-msg">{saveError}</p>}
      <button
        className="btn btn-primary"
        disabled={!allScoresFilled()}
        onClick={() => navigate('/review')}
      >
        Finish &amp; Review →
      </button>
    </div>
  )
}
