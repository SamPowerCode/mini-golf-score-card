import { useState } from 'react'

const KEY = 'appUnlocked'

export function useAppAccess() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(KEY) === 'true')

  function unlock() {
    localStorage.setItem(KEY, 'true')
    setUnlocked(true)
  }

  return { unlocked, unlock }
}
