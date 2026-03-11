import { useState } from 'react'
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

// Placeholder — implemented in Task 3
function Dashboard() {
  return <div className="screen"><p className="hint">Loading…</p></div>
}
