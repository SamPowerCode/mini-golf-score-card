// scores shape: { [playerId]: { [holeNumber]: strokes } }

export default function ScorecardGrid({ players, numHoles, scores, onScoreChange, readOnly }) {
  const holes = Array.from({ length: numHoles }, (_, i) => i + 1)

  function getScore(playerId, hole) {
    return scores[playerId]?.[hole] ?? null
  }

  function playerTotal(playerId) {
    return holes.reduce((sum, h) => sum + (scores[playerId]?.[h] ?? 0), 0)
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={th({ sticky: true })}>Player</th>
            {holes.map(h => <th key={h} style={th()}>{h}</th>)}
            <th style={th()}>Total</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td style={td({ sticky: true, bold: true })}>{player.name}</td>
              {holes.map(h => {
                const val = getScore(player.id, h)
                return (
                  <td key={h} style={td()}>
                    {readOnly ? (
                      <span>{val ?? '—'}</span>
                    ) : (
                      <ScoreCell
                        value={val}
                        onChange={newVal => onScoreChange(player.id, h, newVal)}
                      />
                    )}
                  </td>
                )
              })}
              <td style={td({ bold: true })}>{playerTotal(player.id) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScoreCell({ value, onChange }) {
  if (value === null) {
    return (
      <button
        style={cellBtn('#334155')}
        onClick={() => onChange(0)}
        aria-label="set score"
      >
        —
      </button>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
      <button style={cellBtn('#1e293b')} onClick={() => onChange(Math.max(0, value - 1))} aria-label="-">−</button>
      <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 600 }}>{value}</span>
      <button style={cellBtn('#1e293b')} onClick={() => onChange(value + 1)} aria-label="+">+</button>
    </div>
  )
}

function th({ sticky } = {}) {
  return {
    padding: '8px 6px',
    textAlign: 'center',
    borderBottom: '1px solid #334155',
    color: '#94a3b8',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    ...(sticky ? { position: 'sticky', left: 0, background: '#0f172a', zIndex: 1, textAlign: 'left' } : {}),
  }
}

function td({ sticky, bold } = {}) {
  return {
    padding: '6px 4px',
    textAlign: 'center',
    borderBottom: '1px solid #1e293b',
    whiteSpace: 'nowrap',
    ...(sticky ? { position: 'sticky', left: 0, background: '#0f172a', zIndex: 1, textAlign: 'left', fontWeight: 600 } : {}),
    ...(bold ? { fontWeight: 700 } : {}),
  }
}

function cellBtn(bg) {
  return {
    background: bg,
    border: 'none',
    color: 'white',
    width: 26,
    height: 26,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.9rem',
    lineHeight: 1,
  }
}
