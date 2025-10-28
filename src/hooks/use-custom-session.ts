// src/hooks/use-custom-session.ts

import { useEffect, useState } from 'react'

interface SessionData {
  user?: { sub: string; name: string; email?: string; role?: string }
}

export function useCustomSession() {
  const [data, setData] = useState<SessionData | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (!res.ok) throw new Error('Unauthenticated')
        const json = await res.json()
        setData(json)
        setStatus('authenticated')
      } catch {
        setData(null)
        setStatus('unauthenticated')
      }
    }
    fetchSession()
  }, [])

  return { data, status }
}
