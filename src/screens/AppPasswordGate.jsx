import { useState, useRef, useEffect } from 'react'

export default function AppPasswordGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (value === import.meta.env.VITE_APP_PASSWORD) {
      onUnlock()
    } else {
      setError('Incorrect password')
      setValue('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div className="card">
        <h1>⛳ Mini-Golf Scorecard</h1>
        <p className="hint">Enter the event password to continue</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              ref={inputRef}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary">Enter</button>
        </form>
      </div>
    </div>
  )
}
