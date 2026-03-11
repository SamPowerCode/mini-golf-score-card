import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

export default function PlayerNames() {
  const navigate = useNavigate()
  const { teamId } = useSession()
  const numPlayersRaw = sessionStorage.getItem('numPlayers')
  const numPlayers = parseInt(numPlayersRaw || '1', 10)

  useEffect(() => {
    if (!teamId || !numPlayersRaw) navigate('/setup')
  }, [teamId, numPlayersRaw, navigate])
  const [names, setNames] = useState(() => Array(numPlayers).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const allFilled = names.every(n => n.trim().length > 0)

  function updateName(i, value) {
    setNames(prev => prev.map((n, idx) => idx === i ? value : n))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const rows = names.map(name => ({ team_id: teamId, name: name.trim() }))
    const { error: dbError } = await supabase.from('players').insert(rows)
    if (dbError) { setError('Failed to save players. Try again.'); setLoading(false); return }
    navigate('/scorecard')
  }

  return (
    <div className="screen">
      <h1>Player Names</h1>
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {names.map((name, i) => (
          <div key={i}>
            <label htmlFor={`player-${i}`}>Player {i + 1}</label>
            <input
              id={`player-${i}`}
              type="text"
              value={name}
              onChange={e => updateName(i, e.target.value)}
              placeholder={`Player ${i + 1} name`}
            />
          </div>
        ))}
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={!allFilled || loading}>
          {loading ? 'Saving…' : 'Start Scoring →'}
        </button>
      </form>
    </div>
  )
}
