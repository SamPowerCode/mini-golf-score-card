import { useState } from 'react'

const KEY = 'teamId'

export function useSession() {
  const [teamId, setTeamIdState] = useState(() => localStorage.getItem(KEY))

  function setTeamId(id) {
    localStorage.setItem(KEY, id)
    setTeamIdState(id)
  }

  function clearSession() {
    localStorage.removeItem(KEY)
    setTeamIdState(null)
  }

  return { teamId, setTeamId, clearSession }
}
