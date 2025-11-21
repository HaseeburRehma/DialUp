// src/lib/retellClient.ts
import Retell from 'retell-sdk';

if (!process.env.RETELL_API_KEY) {
  throw new Error('RETELL_API_KEY is not set. Put it in .env.local');
}

export const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY!,
});
