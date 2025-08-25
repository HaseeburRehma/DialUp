// src/components/dialer/VapiWidget.tsx
"use client"

import { useEffect } from "react"
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vapi-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "assistant-id": string
        "public-key": string
      }
    }
  }
}

export default function VapiWidget() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
    script.async = true
    script.type = "text/javascript"
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999, // keep on top of dialer
      }}
    >
      <vapi-widget
        assistant-id="174378f6-eecb-4192-9f0d-395f45759a17"
        public-key="01b8ad6c-2288-42fc-ac40-566dc3165f19"
      ></vapi-widget>
    </div>
  )
}
