import { useState, useEffect, useMemo } from 'react';

interface Recording {
  id: string;
  url: string;
  blob?: Blob;
}

export function useRecordings(audioUrls?: string[]) {
  // ✅ Memoize so the array reference is stable unless contents change
  const urls = useMemo(() => audioUrls ?? [], [audioUrls]);

  // Seed state from URLs
  const [recordings, setRecordings] = useState<Recording[]>(() =>
    urls.map((u) => ({ id: u, url: u }))
  );

  // ✅ Now dependency array can just be [urls]
  useEffect(() => {
    setRecordings(urls.map((u) => ({ id: u, url: u })));
  }, [urls]);

  const cleanupResource = (r: Recording) => {
    if (r.blob) URL.revokeObjectURL(r.url);
  };

  const addRecording = (r: Recording) => setRecordings((prev) => [r, ...prev]);

  const removeRecording = (r: Recording) => {
    setRecordings((prev) => prev.filter((x) => x.id !== r.id));
    cleanupResource(r);
  };

  const resetRecordings = () => {
    recordings.forEach(cleanupResource);
    setRecordings(urls.map((u) => ({ id: u, url: u })));
  };

  return { recordings, addRecording, removeRecording, resetRecordings };
}
