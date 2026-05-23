/**
 * Peer Discovery Service
 * Handles discovery and connection of peers via multiple protocols
 */

import { generateId } from '../../../shared/src/utils.js'

export class PeerDiscoveryService {
  constructor() {
    this.myId = generateId()
    this.peers = new Map()
    this.connections = new Map()
    this.broadcastInterval = null
  }

  /**
   * Initialize peer discovery
   */
  init(networkManager) {
    this.networkManager = networkManager
    this.startBroadcasting()
  }

  /**
   * Start broadcasting presence
   */
  startBroadcasting() {
    this.broadcastInterval = setInterval(() => {
      this.broadcastPresence()
    }, 5000) // Every 5 seconds
  }

  /**
   * Broadcast presence to local network
   */
  broadcastPresence() {
    const presence = {
      id: this.myId,
      name: localStorage.getItem('userName') || 'Anonymous',
      avatar: localStorage.getItem('userAvatar') || null,
      status: 'online',
      timestamp: new Date().toISOString(),
      capabilities: {
        chat: true,
        fileSharing: true,
        voiceCall: true,
        videoCall: false
      }
    }

    // Broadcast via WebSocket if connected
    if (this.socket) {
      this.socket.emit('broadcast-presence', presence)
    }

    // Broadcast via Bluetooth if available
    if (this.networkManager?.isBluetoothAvailable()) {
      this.broadcastViaBluetooth(presence)
    }
  }

  /**
   * Connect to peer
   */
  async connectToPeer(peerId, protocol = 'auto') {
    try {
      // Auto-select protocol if not specified
      if (protocol === 'auto') {
        protocol = this.networkManager?.getRecommendedProtocol() || 'wifi'
      }

      let connection = null

      switch (protocol) {
        case 'bluetooth':
          connection = await this.connectViaBluetooth(peerId)
          break
        case 'wifi':
          connection = await this.connectViaWiFi(peerId)
          break
        case 'cloud':
          connection = await this.connectViaCloud(peerId)
          break
      }

      if (connection) {
        this.connections.set(peerId, connection)
        return connection
      }
    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error)
    }

    return null
  }

  /**
   * Connect via Bluetooth
   */
  async connectViaBluetooth(peerId) {
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth not available')
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['offlinehub-service'] }]
      })

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('offlinehub-service')
      const characteristic = await service.getCharacteristic('offlinehub-char')

      return {
        id: peerId,
        protocol: 'bluetooth',
        device,
        characteristic,
        connected: true
      }
    } catch (error) {
      console.error('Bluetooth connection error:', error)
      return null
    }
  }

  /**
   * Connect via WiFi (mDNS + WebSocket)
   */
  async connectViaWiFi(peerId) {
    // In production, use mDNS to discover local IP
    // For now, try common local IPs
    const localIPs = [
      'offlinehub.local',
      `peer-${peerId}.local`
    ]

    for (const ip of localIPs) {
      try {
        const response = await fetch(`http://${ip}:5000/api/health`, {
          timeout: 2000
        })
        
        if (response.ok) {
          return {
            id: peerId,
            protocol: 'wifi',
            url: `ws://${ip}:5000`,
            connected: true
          }
        }
      } catch (error) {
        console.debug(`Failed to connect to ${ip}`)
      }
    }

    return null
  }

  /**
   * Connect via Cloud
   */
  async connectViaCloud(peerId) {
    // Server-based connection through cloud
    return {
      id: peerId,
      protocol: 'cloud',
      url: `wss://api.offlinehub.app:443`,
      connected: true
    }
  }

  /**
   * Broadcast via Bluetooth
   */
  async broadcastViaBluetooth(presence) {
    // Bluetooth LE advertisement setup
    // This requires GATT server implementation
  }

  /**
   * Send message to peer
   */
  async sendToPeer(peerId, message) {
    const connection = this.connections.get(peerId)
    
    if (!connection) {
      throw new Error(`Not connected to peer ${peerId}`)
    }

    switch (connection.protocol) {
      case 'bluetooth':
        return await this.sendViaBluetooth(connection, message)
      case 'wifi':
        return await this.sendViaWiFi(connection, message)
      case 'cloud':
        return await this.sendViaCloud(connection, message)
    }
  }

  /**
   * Send via Bluetooth
   */
  async sendViaBluetooth(connection, message) {
    const data = new TextEncoder().encode(JSON.stringify(message))
    await connection.characteristic.writeValue(data)
  }

  /**
   * Send via WiFi
   */
  async sendViaWiFi(connection, message) {
    const response = await fetch(`${connection.url}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
    return await response.json()
  }

  /**
   * Send via Cloud
   */
  async sendViaCloud(connection, message) {
    // Send through cloud relay
    return await fetch(`${connection.url}/api/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPeerId: message.targetPeerId,
        payload: message
      })
    })
  }

  /**
   * Get connected peers
   */
  getConnectedPeers() {
    return Array.from(this.connections.values())
  }

  /**
   * Disconnect from peer
   */
  async disconnectFromPeer(peerId) {
    const connection = this.connections.get(peerId)
    
    if (connection?.protocol === 'bluetooth' && connection.device) {
      await connection.device.gatt.disconnect()
    }

    this.connections.delete(peerId)
  }

  /**
   * Stop broadcasting
   */
  stop() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval)
    }
  }
}

export default new PeerDiscoveryService()
