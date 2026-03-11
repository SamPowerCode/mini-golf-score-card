import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

export default function TeamSetup() {
  const navigate = useNavigate()
  const { setTeamId } = useSession()
  const [name, setName] = useState('')
  const [players, setPlayers] = useState('')
  const [holes, setHoles] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isReady = name.trim() !== '' && players !== '' && holes !== ''

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const p = parseInt(players, 10)
    const h = parseInt(holes, 10)
    if (p < 1 || p > 20) { setError('Number of players must be between 1 and 20'); return }
    if (h < 1 || h > 36) { setError('Number of holes must be between 1 and 36'); return }

    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('teams')
      .insert({ name: name.trim(), num_holes: h })
      .select()
      .single()

    if (dbError) { setError('Failed to create team. Try again.'); setLoading(false); return }

    setTeamId(data.id)
    // Store player count for PlayerNames screen
    sessionStorage.setItem('numPlayers', String(p))
    navigate('/players')
  }

  return (
    <div className="screen">
      <h1>Mini-Golf Scorecard</h1>
      <form onSubmit={handleSubmit} noValidate className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="teamName">Team name</label>
          <input
            id="teamName"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. The Eagles"
          />
        </div>
        <div>
          <label htmlFor="numPlayers">Number of players</label>
          <input
            id="numPlayers"
            type="number"
            min={1}
            max={20}
            value={players}
            onChange={e => setPlayers(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="numHoles">Number of holes</label>
          <input
            id="numHoles"
            type="number"
            min={1}
            max={36}
            value={holes}
            onChange={e => setHoles(e.target.value)}
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={!isReady || loading}>
          {loading ? 'Creating…' : 'Next →'}
        </button>
      </form>
    </div>
  )
}
