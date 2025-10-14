# Custom WebRTC Dialer Implementation

This custom dialer solution allows users to make international calls using their registered phone numbers without requiring premium Twilio or Vapi accounts.

## Features

✅ **WebRTC-based calling** - Browser-to-browser and browser-to-phone calls  
✅ **SIP.js integration** - Industry standard SIP protocol support  
✅ **User phone numbers** - Each user calls from their registered number  
✅ **Real-time transcription** - Built-in speech recognition  
✅ **Call recording** - WebRTC-based audio recording  
✅ **DTMF support** - Send touch tones during calls  
✅ **Call hold/resume** - Full call control features  
✅ **Connection quality monitoring** - Real-time quality indicators  
✅ **Call analytics** - Comprehensive call statistics  

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │◄──►│   SIP Server    │◄──►│ PSTN Provider   │
│                 │    │                 │    │                 │
│ - React App     │    │ - FreeSWITCH    │    │ - Trunk Lines   │
│ - SIP.js        │    │ - Asterisk      │    │ - International │
│ - WebRTC        │    │ - Kamailio      │    │   Routing       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Choose Your SIP Server

**Option A: FreeSWITCH (Recommended)**
```bash
# Install FreeSWITCH
sudo apt-get install freeswitch freeswitch-mod-websocket

# Enable WebSocket module
echo "load mod_websocket" >> /etc/freeswitch/autoload_configs/modules.conf.xml
```

**Option B: Asterisk**
```bash
# Install Asterisk with WebRTC
sudo apt-get install asterisk asterisk-modules

# Configure WebSocket in http.conf
echo "enabled=yes" >> /etc/asterisk/http.conf
echo "bindaddr=0.0.0.0" >> /etc/asterisk/http.conf
```

### 2. Configure SIP Server

**FreeSWITCH Example Configuration:**

```xml
<!-- /etc/freeswitch/sip_profiles/internal.xml -->
<profile name="internal">
  <settings>
    <param name="ws-binding" value=":7443"/>
    <param name="wss-binding" value=":7443 ssl"/>
    <param name="auth-calls" value="true"/>
  </settings>
</profile>
```

**User Directory Example:**
```xml
<!-- /etc/freeswitch/directory/default/1001.xml -->
<user id="1001">
  <params>
    <param name="password" value="secure_password"/>
    <param name="vm-password" value="1001"/>
  </params>
  <variables>
    <variable name="toll_allow" value="domestic,international"/>
    <variable name="caller_id_name" value="+1234567890"/>
    <variable name="caller_id_number" value="+1234567890"/>
  </variables>
</user>
```

### 3. Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# Your SIP server details
NEXT_PUBLIC_SIP_WEBSOCKET_URL=wss://your-server.com:7443
NEXT_PUBLIC_SIP_DOMAIN=your-server.com
SIP_PASSWORD=your_secure_password
```

### 4. PSTN Connectivity

**For International Calls:**

1. **VoIP.ms** - Affordable international rates
2. **Twilio SIP Trunking** - Use without Voice SDK premium
3. **Bandwidth.com** - Wholesale SIP trunking
4. **Flowroute** - Competitive international pricing

**Example FreeSWITCH Gateway:**
```xml
<!-- /etc/freeswitch/sip_profiles/external/voipms.xml -->
<gateway name="voipms">
  <param name="username" value="your_username"/>
  <param name="password" value="your_password"/>
  <param name="realm" value="seattle.voip.ms"/>
  <param name="proxy" value="seattle.voip.ms"/>
  <param name="register" value="true"/>
</gateway>
```

## Usage

### 1. Access Custom Dialer
Navigate to `/dialer/custom` in your application.

### 2. Setup SIP Configuration
Visit `/dialer/setup` to configure your SIP server connection.

### 3. Making Calls
- Enter any international number (e.g., +44207123456)
- Click "Call" to initiate WebRTC connection
- Use built-in controls for mute, hold, recording, etc.

### 4. Receiving Calls
- Incoming calls automatically trigger the modal interface
- Accept/reject calls with visual feedback
- All calls are logged and can include notes

## Cost Benefits

| Solution | International Call Cost | Setup Complexity |
|----------|------------------------|------------------|
| Twilio Voice SDK Premium | $0.10-0.50/min | Low |
| Vapi Premium | $0.15-0.60/min | Low |
| **Custom Dialer** | **$0.01-0.08/min** | **Medium** |

## Technical Components

### Frontend
- **SIP.js**: SIP protocol handling
- **WebRTC**: Real-time audio/video
- **React Context**: State management
- **Speech Recognition API**: Live transcription

### Backend  
- **Next.js API Routes**: User management
- **MongoDB**: Call history storage
- **NextAuth**: User authentication

### Infrastructure
- **SIP Server**: Call routing (FreeSWITCH/Asterisk)
- **PSTN Gateway**: International connectivity
- **WebSocket**: Real-time signaling

## Security Considerations

1. **TLS/WSS**: All connections encrypted
2. **SIP Authentication**: Digest authentication
3. **Firewall Rules**: Restrict SIP server access
4. **Rate Limiting**: Prevent call abuse
5. **Credential Storage**: Encrypted password storage

## Troubleshooting

### Common Issues

**"Device not ready"**
- Check SIP server connectivity
- Verify WebSocket URL format
- Ensure proper authentication

**"No audio during call"**  
- Check browser microphone permissions
- Verify STUN/TURN server configuration
- Test with different browsers

**"International calls failing"**
- Verify PSTN trunk configuration
- Check gateway registration status
- Review call routing dialplan

### Debug Tools

Enable debug logging:
```javascript
// In CustomDialerProvider.tsx
const userAgent = new UA({
  ...configuration,
  logLevel: 'debug' // Add this for detailed logs
})
```

## Next Steps

1. **Deploy SIP Server**: Set up FreeSWITCH on cloud server
2. **Configure PSTN**: Add international trunk provider  
3. **Test Calls**: Verify end-to-end functionality
4. **Production Deployment**: Scale and secure for users

This implementation provides a cost-effective alternative to premium voice services while maintaining professional features and international calling capabilities.