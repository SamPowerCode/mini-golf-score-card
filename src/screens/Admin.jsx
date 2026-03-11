import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const pin = import.meta.env.VITE_ADMIN_PIN?.trim()
  const [unlocked, setUnlocked] = useState(false)

  if (!pin) {
    return (
      <div className="screen" style={{ justifyContent: 'center' }}>
        <div className="card">
          <p className="error-msg">Admin panel not configured</p>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return <PinGate correctPin={pin} onUnlock={() => setUnlocked(true)} />
  }

  return <Dashboard />
}

function PinGate({ correctPin, onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (value === correctPin) {
      onUnlock()
    } else {
      setError('Incorrect PIN')
      setValue('')
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div className="card">
        <h2>Admin</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              autoComplete="off"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary">Unlock</button>
        </form>
      </div>
    </div>
  )
}

function Dashboard() {
  const [teams, setTeams] = useState([])
  const [playerCounts, setPlayerCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  async function loadData() {
    setLoading(true)
    setLoadError('')
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .not('id', 'is', null)

    if (teamError) { setLoadError('Failed to load teams.'); setLoading(false); return }

    const teamIds = (teamData ?? []).map(t => t.id)
    const { data: playerData, error: playerError } = teamIds.length
      ? await supabase.from('players').select('*').in('team_id', teamIds)
      : { data: [], error: null }

    if (playerError) { setLoadError('Failed to load players.'); setLoading(false); return }

    const counts = {}
    for (const p of playerData ?? []) {
      counts[p.team_id] = (counts[p.team_id] ?? 0) + 1
    }

    setTeams(teamData ?? [])
    setPlayerCounts(counts)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleDelete(teamId) {
    if (!window.confirm('Delete this team and all their scores?')) return
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) {
      setDeleteError('Delete failed. Try again.')
    } else {
      await loadData()
    }
    setDeleting(false)
  }

  async function handleReset() {
    if (!window.confirm('Delete ALL teams and scores? This cannot be undone.')) return
    setDeleting(true)
    setDeleteError('')
    setResetSuccess(false)
    const { error } = await supabase.from('teams').delete().not('id', 'is', null)
    if (error) {
      setDeleteError('Reset failed. Try again.')
    } else {
      setResetSuccess(true)
      await loadData()
    }
    setDeleting(false)
  }

  if (loading) return <div className="screen"><p className="hint">Loading…</p></div>
  if (loadError) return (
    <div className="screen">
      <p className="error-msg">{loadError}</p>
      <button className="btn btn-secondary" onClick={loadData}>Retry</button>
    </div>
  )

  return (
    <div className="screen">
      <h2>Admin — All Teams</h2>
      {deleteError && <p className="error-msg">{deleteError}</p>}
      {resetSuccess && <p style={{ color: 'var(--success)' }}>All teams deleted.</p>}
      {teams.length === 0 ? (
        <p className="hint">No teams yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {['Team', 'Holes', 'Players', 'Submitted', 'Created', ''].map(h => (
                  <th key={h} style={th()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
                  <td style={td()}>{team.name}</td>
                  <td style={td()}>{team.num_holes}</td>
                  <td style={td()}>{playerCounts[team.id] ?? 0}</td>
                  <td style={td()}>
                    {team.submitted_at ? `✓ ${new Date(team.submitted_at).toLocaleString()}` : '—'}
                  </td>
                  <td style={td()}>{new Date(team.created_at).toLocaleString()}</td>
                  <td style={td()}>
                    <button
                      className="btn btn-secondary"
                      style={{ width: 'auto', display: 'inline-block' }}
                      disabled={deleting}
                      onClick={() => handleDelete(team.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        className="btn btn-secondary"
        disabled={deleting || teams.length === 0}
        onClick={handleReset}
      >
        Reset Event
      </button>
    </div>
  )
}

function th() {
  return { padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }
}
function td() {
  return { padding: '8px 6px', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }
}
