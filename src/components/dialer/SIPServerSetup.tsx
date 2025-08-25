// src/components/dialer/SIPServerSetup.tsx

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Server, Settings, Globe } from 'lucide-react'

interface SIPConfig {
  domain: string
  websocketUrl: string
  username: string
  password: string
  displayName: string
}

export function SIPServerSetup() {
  const [config, setConfig] = useState<SIPConfig>({
    domain: '',
    websocketUrl: '',
    username: '',
    password: '',
    displayName: ''
  })
  
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  const handleConnect = async () => {
    setIsConnecting(true)
    
    // Simulate connection attempt
    setTimeout(() => {
      setIsConnected(true)
      setIsConnecting(false)
    }, 2000)
  }

  const popularProviders = [
    {
      name: 'FreeSWITCH',
      domain: 'your-freeswitch.com',
      websocket: 'wss://your-freeswitch.com:7443',
      description: 'Open source telephony platform'
    },
    {
      name: 'Asterisk',
      domain: 'your-asterisk.com', 
      websocket: 'wss://your-asterisk.com:8089/ws',
      description: 'Popular open source PBX'
    },
    {
      name: 'Kamailio',
      domain: 'your-kamailio.com',
      websocket: 'wss://your-kamailio.com:443/ws',
      description: 'High-performance SIP server'
    },
    {
      name: 'OpenSIPS',
      domain: 'your-opensips.com',
      websocket: 'wss://your-opensips.com:443/ws', 
      description: 'Multi-functional SIP server'
    }
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 to-blue-900 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Server className="h-5 w-5" />
            <span>SIP Server Configuration</span>
          </CardTitle>
          <p className="text-white/70">
            Configure your SIP server settings to enable custom dialing
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-white">SIP Domain</Label>
              <Input
                id="domain"
                placeholder="sip.yourdomain.com"
                value={config.domain}
                onChange={(e) => setConfig({...config, domain: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websocket" className="text-white">WebSocket URL</Label>
              <Input
                id="websocket"
                placeholder="wss://sip.yourdomain.com:443/ws"
                value={config.websocketUrl}
                onChange={(e) => setConfig({...config, websocketUrl: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                placeholder="Your SIP username"
                value={config.username}
                onChange={(e) => setConfig({...config, username: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your SIP password"
                value={config.password}
                onChange={(e) => setConfig({...config, password: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !config.domain || !config.websocketUrl}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Connect to SIP Server
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popular SIP Providers */}
      <Card className="bg-gradient-to-br from-slate-800 to-purple-900 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Popular SIP Server Solutions</CardTitle>
          <p className="text-white/70">
            Choose from these open-source SIP server solutions to get started
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularProviders.map((provider) => (
              <div
                key={provider.name}
                className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setConfig({
                  ...config,
                  domain: provider.domain,
                  websocketUrl: provider.websocket
                })}
              >
                <h3 className="text-white font-semibold mb-1">{provider.name}</h3>
                <p className="text-white/60 text-sm mb-2">{provider.description}</p>
                <div className="text-xs text-blue-300">
                  <div>Domain: {provider.domain}</div>
                  <div>WebSocket: {provider.websocket}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="bg-gradient-to-br from-slate-800 to-gray-900 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-white/80 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <p>Choose and install a SIP server solution (FreeSWITCH, Asterisk, etc.)</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <p>Configure WebSocket support on your SIP server</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <p>Create SIP accounts for each user using their phone numbers</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <p>Configure trunk connections to PSTN providers for outbound calling</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
              <p>Enter your SIP server details above and connect</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}