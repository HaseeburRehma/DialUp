// src/globals.d.ts

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  onend: null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((ev: any) => any) | null;
  start(): void;
  stop(): void;
}

interface Window {
  webkitSpeechRecognition: { new (): SpeechRecognition };
  SpeechRecognition: { new (): SpeechRecognition };
}
