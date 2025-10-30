
// src/hooks/use-custom-session.ts
'use client'
import { useEffect, useState } from 'react'

export function useCustomSession() {
  const [data, setData] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (!res.ok) throw new Error('Unauthenticated')

        const json = await res.json()
        if (!json?.user?.id) throw new Error('Invalid session')

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

