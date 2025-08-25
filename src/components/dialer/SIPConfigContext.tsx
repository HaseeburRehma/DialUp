// src/components/dialer/SIPConfigContext.tsx
'use client'

import { createContext, useContext, useState } from "react"

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
  return (
    <SIPConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </SIPConfigContext.Provider>
  )
}
