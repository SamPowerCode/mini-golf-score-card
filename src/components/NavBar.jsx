import { Link } from 'react-router-dom'

export default function NavBar({ showLeaderboards = false }) {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #334155',
    }}>
      <span style={{ fontWeight: 700, fontSize: '1rem' }}>⛳ Scorecard</span>
      {showLeaderboards && (
        <Link
          to="/leaderboards"
          style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}
        >
          Leaderboards →
        </Link>
      )}
    </nav>
  )
}
