# OfflineHub - Multi-Protocol Connectivity Guide

## Overview

OfflineHub now supports multiple connection protocols and works seamlessly offline and online. Users can communicate via WiFi, Bluetooth, Ethernet, and Cellular connections.

## Supported Protocols

### 1. **WiFi / Local Network (LAN)**
- **Best for:** Range, throughput, multiple devices
- **Features:**
  - High speed (typical 50-1000 Mbps)
  - Works through local network discovery (mDNS)
  - Can traverse WiFi routers
  - Battery efficient with WiFi 6 devices

### 2. **Bluetooth Low Energy (BLE)**
- **Best for:** Power efficiency, close range
- **Features:**
  - Extremely low power consumption
  - Direct peer-to-peer connection
  - Works through GATT services
  - Typical range: 50-100 meters (open space)

### 3. **Ethernet (Wired)**
- **Best for:** Stability, reliability
- **Features:**
  - Zero wireless interference
  - Consistent performance
  - Lower latency
  - Ideal for stationary devices

### 4. **Cellular (LTE/5G)**
- **Best for:** Mobile users, fallback
- **Features:**
  - Works anywhere with signal
  - Server relay for peer discovery
  - Data-friendly sync

### 5. **Cloud Relay (Hybrid)**
- **Best for:** Heterogeneous networks
- **Features:**
  - Bridges different protocols
  - Enables messaging across network boundaries
  - Queues messages for offline sync

## Architecture

### Network Manager
```
NetworkManager
├── Connection Detection
│   ├── Online/Offline status
│   ├── Connection type detection
│   ├── Speed measurement
│   └── Signal strength
├── Peer Discovery
│   ├── mDNS/Bonjour
│   ├── Bluetooth scanning
│   ├── Local network detection
│   └── Presence broadcasting
└── Message Queuing
    ├── IndexedDB storage
    ├── Auto-sync on reconnect
    └── Conflict resolution
```

### Peer Discovery Service
```
PeerDiscoveryService
├── Broadcasting
│   ├── Presence advertisement
│   ├── Capability advertisement
│   └── Status updates
├── Discovery Protocols
│   ├── mDNS/Bluetooth
│   ├── Local network scan
│   └── Cloud registry lookup
└── Connection Management
    ├── Protocol selection
    ├── Fallback logic
    └── Connection pooling
```

### Offline Sync Service
```
OfflineSyncService
├── Local Storage (IndexedDB)
│   ├── Messages
│   ├── Files
│   ├── Contacts
│   └── Pending actions
├── Sync Strategy
│   ├── Full sync on reconnect
│   ├── Incremental sync
│   ├── Conflict detection
│   └── Retry logic
└── Data Management
    ├── Cleanup old data
    ├── Compression
    └── Encryption
```

## Usage Examples

### Detecting Network Status

```javascript
import NetworkManager from './services/NetworkManager'

// Get current status
const status = NetworkManager.getStatus()
// Returns: { isOnline, connectionType, peersCount, queuedMessages }

// Listen for changes
NetworkManager.addListener((event, data) => {
  if (event === 'connection-type-changed') {
    console.log(`Switched to: ${data}`)
  }
  if (event === 'online') {
    console.log('Back online - syncing...')
  }
})
```

### Discovering Peers

```javascript
import PeerDiscoveryService from './services/PeerDiscovery'

// Auto-discover peers
PeerDiscoveryService.init(NetworkManager)

// Connect to specific peer
const connection = await PeerDiscoveryService.connectToPeer(
  'peer-id',
  'auto' // Protocol: 'wifi', 'bluetooth', 'cloud', or 'auto'
)

// Send message
await PeerDiscoveryService.sendToPeer(peerId, {
  type: 'message',
  content: 'Hello!'
})
```

### Offline Sync

```javascript
import OfflineSyncService from './services/OfflineSync'

// Initialize
await OfflineSyncService.init()

// Save message offline
await OfflineSyncService.saveMessage({
  id: 'msg-123',
  from: 'user-1',
  to: 'user-2',
  content: 'Hello offline!',
  timestamp: new Date()
})

// Sync when online
if (navigator.onLine) {
  await OfflineSyncService.syncAllPending(serverAPI)
}

// Check sync status
const status = await OfflineSyncService.getSyncStatus()
// Returns: { lastSyncTime, unsyncedMessages, unsyncedFiles, syncInProgress }
```

## Connection Priority

OfflineHub automatically selects the best available protocol:

1. **WiFi** (if available & online)
   - Best for speed and range
   - Works through routers

2. **Bluetooth** (if available & nearby peer)
   - Backup for WiFi
   - Ultra-low power

3. **Ethernet** (if available)
   - Wired connection
   - Maximum stability

4. **Cloud Relay** (if online)
   - Server-based relay
   - Works across networks

5. **Local Offline Queue**
   - IndexedDB storage
   - Auto-sync when reconnected

## Features by Protocol

| Feature | WiFi | BLE | Ethernet | Cloud | Offline |
|---------|------|-----|----------|-------|---------|
| Chat | ✅ | ✅ | ✅ | ✅ | ✅ Queue |
| Files | ✅ | ⚠️ Small only | ✅ | ✅ | ✅ Queue |
| Voice | ✅ | ⚠️ Low quality | ✅ | ✅ | ❌ |
| Video | ✅ | ❌ | ✅ | ✅ | ❌ |
| Range | 50m-∞ | 50-100m | 0m (wired) | ∞ | N/A |
| Power | Medium | Low | High | Medium | Low |
| Latency | 10-50ms | 20-100ms | <5ms | 100-500ms | N/A |

## Event System

### Network Events

```javascript
// online - Back online
// offline - Lost connection
// connection-type-changed - Network changed (WiFi -> LTE)
// peers-discovered - New peers found
// peer-connected - Connected to peer
// peer-disconnected - Lost peer connection
// sync-message - Message synced to server
// message-queued - Message queued offline
```

### Example

```javascript
NetworkManager.addListener((event, data) => {
  switch(event) {
    case 'online':
      console.log('Connected! Syncing data...')
      break
    case 'offline':
      console.log('Offline - using local cache')
      break
    case 'peers-discovered':
      console.log(`Found ${data.length} peers`)
      break
  }
})
```

## Troubleshooting

### No peers discovered
- Ensure both devices are on same network (for WiFi)
- Check Bluetooth permissions
- Verify service advertising is enabled
- Check firewall settings

### Slow connection
- Switch to WiFi if on Bluetooth
- Move closer to access point
- Reduce message size
- Check network congestion

### Messages not syncing
- Ensure internet connection
- Check server connectivity
- Review sync logs
- Clear old data to free space

## Best Practices

### 1. **Progressive Enhancement**
Start with most reliable protocol, fallback gracefully:
```javascript
// Use WiFi first, then Bluetooth, then cloud
const connection = await PeerDiscoveryService.connectToPeer(peerId, 'auto')
```

### 2. **Offline-First Design**
Always assume network might go down:
```javascript
// Always queue messages locally first
await OfflineSyncService.saveMessage(message)
// Then try to send immediately
```

### 3. **Adaptive UI**
Show user what's happening:
```javascript
// Show sync status, connection type, peers available
<div className="network-status">
  {isOnline ? '🟢 Online' : '🔴 Offline'}
  {connectionType} • {peersCount} peers
</div>
```

### 4. **Battery Awareness**
Use low-power protocols when battery is low:
```javascript
if (navigator.getBattery?.level < 0.2) {
  // Switch to Bluetooth Low Energy
  useBluetoothLE()
}
```

## Security Considerations

1. **Encryption in Transit**
   - All peer-to-peer connections use TLS
   - Bluetooth uses AES encryption
   - Cloud relay uses HTTPS/WSS

2. **End-to-End Encryption**
   - Messages encrypted with recipient's public key
   - Only recipient can decrypt

3. **Authentication**
   - Peer identity verification
   - JWT tokens for cloud relay
   - Certificate pinning for HTTPS

4. **Local Storage Security**
   - IndexedDB data encrypted
   - Sensitive data never cached
   - Automatic cache expiration

## Performance Metrics

### Network Performance
- WiFi: 100-1000 Mbps
- Bluetooth: 1-2 Mbps (LE)
- Ethernet: 100-10000 Mbps
- LTE: 10-100 Mbps
- Cloud Relay: 10-50 Mbps

### Latency
- WiFi (LAN): 10-50ms
- Bluetooth: 20-100ms
- Ethernet: <5ms
- LTE: 50-150ms
- Cloud Relay: 100-500ms

### Power Consumption
- WiFi: 50-100 mW
- Bluetooth: 1-20 mW
- Ethernet: 100-500 mW
- LTE: 200-500 mW
- Local (no TX): <1 mW

## Future Enhancements

- [ ] WiFi Direct support
- [ ] NFC for peer exchange
- [ ] LoRaWAN for long range
- [ ] Mesh networking
- [ ] Protocol bridging
- [ ] QoS optimization
- [ ] Network coding
- [ ] Smart routing
