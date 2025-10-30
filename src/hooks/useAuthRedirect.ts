// src/hooks/useAuthRedirect.ts
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuthRedirect(apiPath: string) {
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch(apiPath, { credentials: 'include' })
        if (res.status === 401) {
          router.push('/auth/signin')
        }
      } catch (err) {
        console.error('Auth check failed', err)
        router.push('/auth/signin')
      }
    }
    verifyAuth()
  }, [apiPath, router])
}
