// src/components/Providers.tsx
'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: ReactNode }) {
  return (
    // 1 single child for SessionProvider:
    <SessionProvider>
      {/* 1 single child for ThemeProvider: */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {/* only one wrapper DIV under ThemeProvider */}
        <div id="app-container">{children}</div>
      </ThemeProvider>
    </SessionProvider>
  );
}
