// src/lib/retellClient.ts
import Retell from 'retell-sdk';

// Lazy initialization - only validate when actually used, not during build
let _retellClient: Retell | null = null;

function getRetellClient(): Retell {
  if (!_retellClient) {
    if (!process.env.RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is not set. Put it in .env');
    }
    _retellClient = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });
  }
  return _retellClient;
}

export const retellClient = new Proxy({} as Retell, {
  get: (target, prop) => {
    const client = getRetellClient();
    const value = client[prop as keyof Retell];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
