"use client"

import { useEffect } from "react"

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
    script.src =
      "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
    script.async = true
    script.type = "text/javascript"
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Function to dial a number through Vapi
  const startCall = (phoneNumber: string) => {
    const widget = document.querySelector("vapi-widget") as any
    if (widget) {
      widget.startCall({ phoneNumber }) // 🔑 Vapi API
      console.log("📞 Starting call to:", phoneNumber)
    }
  }

  const endCall = () => {
    const widget = document.querySelector("vapi-widget") as any
    if (widget) {
      widget.endCall()
      console.log("📴 Call ended")
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
      }}
    >
      <vapi-widget
        assistant-id="174378f6-eecb-4192-9f0d-395f45759a17"
        public-key="01b8ad6c-2288-42fc-ac40-566dc3165f19"
      ></vapi-widget>

      {/* Custom buttons to control Vapi */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={() => startCall("+15551234567")}>Start Call</button>
        <button onClick={endCall}>End Call</button>
      </div>
    </div>
  )
}
