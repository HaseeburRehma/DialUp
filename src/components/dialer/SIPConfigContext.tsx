// src/components/dialer/SIPConfigContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from "react"

export interface SIPConfig {
  domain: string
  websocketUrl: string
  username: string
  password: string
  displayName: string
}

const SIPConfigContext = createContext<{
  config: SIPConfig | null
  setConfig: (c: SIPConfig) => void
}>({
  config: null,
  setConfig: () => {}
})

export const useSIPConfig = () => useContext(SIPConfigContext)

export const SIPConfigProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [config, setConfig] = useState<SIPConfig | null>(null)

  useEffect(() => {
  const loadConfig = async () => {
    const res = await fetch("/api/sip/config");
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.domain && cfg.websocketUrl && cfg.username && cfg.password) {
        setConfig(cfg);
      }
    }
  };
  loadConfig();
}, []);

  return (
    <SIPConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </SIPConfigContext.Provider>
  )
}
