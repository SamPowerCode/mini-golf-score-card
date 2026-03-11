import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { useAppAccess } from './hooks/useAppAccess'
import AppPasswordGate from './screens/AppPasswordGate'
import TeamSetup from './screens/TeamSetup'
import PlayerNames from './screens/PlayerNames'
import Scorecard from './screens/Scorecard'
import Review from './screens/Review'
import Leaderboards from './screens/Leaderboards'
import Admin from './screens/Admin'

function SessionRouter() {
  const { teamId } = useSession()
  return <Navigate to={teamId ? '/scorecard' : '/setup'} replace />
}

export default function App() {
  const { unlocked, unlock } = useAppAccess()
  const password = import.meta.env.VITE_APP_PASSWORD

  if (password && !unlocked) {
    return <AppPasswordGate onUnlock={unlock} />
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SessionRouter />} />
        <Route path="/setup" element={<TeamSetup />} />
        <Route path="/players" element={<PlayerNames />} />
        <Route path="/scorecard" element={<Scorecard />} />
        <Route path="/review" element={<Review />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
