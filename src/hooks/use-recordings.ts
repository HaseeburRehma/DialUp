// src/hooks/use-recordings.ts
import { useState, useEffect } from 'react'

interface Recording { id: string; url: string; blob?: Blob }

export function useRecordings(audioUrls?: string[]) {
  const urls = audioUrls ?? []

  // Seed once from the actual contents
  const [recordings, setRecordings] = useState<Recording[]>(() =>
    urls.map(u => ({ id: u, url: u }))
  )

  // Re‐seed only when the contents of the array change
  useEffect(() => {
    setRecordings(urls.map(u => ({ id: u, url: u })))
  }, [JSON.stringify(urls)])

  const cleanupResource = (r: Recording) => {
    if (r.blob) URL.revokeObjectURL(r.url)
  }

  const addRecording = (r: Recording) => setRecordings(prev => [r, ...prev])

  const removeRecording = (r: Recording) => {
    setRecordings(prev => prev.filter(x => x.id !== r.id))
    cleanupResource(r)
  }

  const resetRecordings = () => {
    recordings.forEach(cleanupResource)
    setRecordings(urls.map(u => ({ id: u, url: u })))
  }

  return { recordings, addRecording, removeRecording, resetRecordings }
}
