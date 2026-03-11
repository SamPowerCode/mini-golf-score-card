import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import TeamSetup from './screens/TeamSetup'
import PlayerNames from './screens/PlayerNames'
import Scorecard from './screens/Scorecard'
import Review from './screens/Review'
import Leaderboards from './screens/Leaderboards'

function SessionRouter() {
  const { teamId } = useSession()
  // Default route: if no session go to setup, otherwise session screens handle their own redirect
  return <Navigate to={teamId ? '/scorecard' : '/setup'} replace />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SessionRouter />} />
        <Route path="/setup" element={<TeamSetup />} />
        <Route path="/players" element={<PlayerNames />} />
        <Route path="/scorecard" element={<Scorecard />} />
        <Route path="/review" element={<Review />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
