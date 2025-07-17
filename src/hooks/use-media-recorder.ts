'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface MediaRecorderState {
  isRecording: boolean;
  recordingDuration: number;
  audioData: Uint8Array | null;
  updateTrigger: number;
}

const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a',
    'audio/mp4',
    'audio/mpeg',
  ];
  return types.find(type => MediaRecorder.isTypeSupported(type)) ?? 'audio/webm';
};

export function useMediaRecorder() {
  const [state, setState] = useState<MediaRecorderState>({
    isRecording: false,
    recordingDuration: 0,
    audioData: null,
    updateTrigger: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioBufferRef = useRef<Uint8Array | null>(null);

  const drawLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = audioBufferRef.current;
    if (!analyser || !buffer) return;

    analyser.getByteTimeDomainData(buffer);
    setState(s => ({ ...s, updateTrigger: s.updateTrigger + 1 }));
    rafRef.current = requestAnimationFrame(drawLoop);
  }, []);

  useEffect(() => {
    if (state.isRecording) {
      rafRef.current = requestAnimationFrame(drawLoop);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [state.isRecording, drawLoop]);

  const startRecording = useCallback(async () => {
    try {
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const dest = audioCtx.createMediaStreamDestination();
      destinationRef.current = dest;

      let sysStream: MediaStream | null = null;
      try {
        sysStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        sysStream.getVideoTracks().forEach(t => t.stop());
      } catch (err) {
        console.warn('System audio capture failed or denied', err);
      }

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });

      const micSrc = audioCtx.createMediaStreamSource(micStream);
      micSrc.connect(dest);
      micSrc.connect(analyser);

      if (sysStream) {
        const sysSrc = audioCtx.createMediaStreamSource(sysStream);
        sysSrc.connect(dest);
        sysSrc.connect(analyser);
      }

      const mime = getSupportedMimeType();
      const mr = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: 64_000 });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e: BlobEvent) => {
        audioChunksRef.current.push(e.data);
      };

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      audioBufferRef.current = buffer;

      setState({ isRecording: true, recordingDuration: 0, audioData: buffer, updateTrigger: 0 });
      timerRef.current = window.setInterval(() => {
        setState(s => ({ ...s, recordingDuration: s.recordingDuration + 1 }));
      }, 1000);

      mr.start(250);
    } catch (err) {
      console.error('Start recording failed', err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise(resolve => {
      const mr = mediaRecorderRef.current;
      if (!mr) return resolve(new Blob());

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        audioChunksRef.current = [];

        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        audioContextRef.current?.close();

        setState({ isRecording: false, recordingDuration: 0, audioData: null, updateTrigger: 0 });
        audioBufferRef.current = null;

        resolve(blob);
      };

      mr.stop();
    });
  }, []);

  // Expose audio chunks for external use
  const getAudioChunks = useCallback(() => audioChunksRef.current, []);

  return {
    state,
    startRecording,
    stopRecording,
    getAudioChunks, // New method to access chunks
  };
}