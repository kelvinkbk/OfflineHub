/**
 * Network Manager - Handles multiple connection types
 * Supports: WiFi, Bluetooth, Ethernet, LTE/5G
 */

export class NetworkManager {
  constructor() {
    this.connectionType = null
    this.isOnline = navigator.onLine
    this.peers = new Map() // Store discovered peers
    this.listeners = []
    this.messageQueue = [] // Queue for offline messages
    this.initNetworkDetection()
  }

  /**
   * Initialize network detection
   */
  initNetworkDetection() {
    // Online/Offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // Connection type detection
    if ('connection' in navigator) {
      const conn = navigator.connection
      this.detectConnectionType(conn)
      conn.addEventListener('change', () => this.detectConnectionType(conn))
    }
  }

  /**
   * Detect connection type
   */
  detectConnectionType(conn) {
    const type = conn.type || conn.effectiveType
    this.connectionType = this.mapConnectionType(type)
    this.notifyListeners('connection-type-changed', this.connectionType)
  }

  /**
   * Map connection types
   */
  mapConnectionType(type) {
    const typeMap = {
      'wifi': 'WiFi',
      '4g': 'LTE',
      '5g': '5G',
      'ethernet': 'Ethernet',
      'bluetooth': 'Bluetooth',
      'cellular': 'Cellular',
      'wimax': 'WiMax',
      '3g': '3G',
      '2g': '2G',
      'slow-2g': 'Slow 2G',
      'none': 'Offline',
      'unknown': 'Unknown',
      '4g': 'LTE',
      '3g': '3G',
      'fast-4g': 'LTE',
      'slow-2g': '2G'
    }
    return typeMap[type] || type || 'Unknown'
  }

  /**
   * Handle going online
   */
  handleOnline() {
    this.isOnline = true
    this.notifyListeners('online')
    this.processPendingMessages()
  }

  /**
   * Handle going offline
   */
  handleOffline() {
    this.isOnline = false
    this.notifyListeners('offline')
  }

  /**
   * Get network status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      peersCount: this.peers.size,
      queuedMessages: this.messageQueue.length
    }
  }

  /**
   * Get connection speed (if available)
   */
  getConnectionSpeed() {
    if ('connection' in navigator) {
      return navigator.connection.downlink || null // Mbps
    }
    return null
  }

  /**
   * Queue message for offline sync
   */
  queueMessage(message) {
    const queuedMsg = {
      ...message,
      queuedAt: new Date().toISOString(),
      synced: false
    }
    this.messageQueue.push(queuedMsg)
    this.notifyListeners('message-queued', queuedMsg)
    
    // Store in IndexedDB for persistence
    this.storePendingMessage(queuedMsg)
    
    return queuedMsg
  }

  /**
   * Store pending message in IndexedDB
   */
  storePendingMessage(message) {
    if ('indexedDB' in window) {
      const db = indexedDB.open('OfflineHub', 1)
      db.onsuccess = (e) => {
        const transaction = e.target.result.transaction(['pending-messages'], 'readwrite')
        transaction.objectStore('pending-messages').add(message)
      }
    }
  }

  /**
   * Process pending messages when back online
   */
  processPendingMessages() {
    if (this.messageQueue.length === 0) return

    const messages = [...this.messageQueue]
    messages.forEach(msg => {
      this.notifyListeners('sync-message', msg)
    })
    this.messageQueue = []
  }

  /**
   * Discover peers on network
   */
  async discoverPeers(protocol = 'mdns') {
    try {
      const discovered = []
      
      switch (protocol) {
        case 'mdns':
          discovered.push(...await this.discoverViaMDNS())
          break
        case 'bluetooth':
          discovered.push(...await this.discoverViaBluetooth())
          break
        case 'local-network':
          discovered.push(...await this.discoverViaLocalNetwork())
          break
      }

      discovered.forEach(peer => {
        this.peers.set(peer.id, peer)
      })

      this.notifyListeners('peers-discovered', discovered)
      return discovered
    } catch (error) {
      console.error('Peer discovery failed:', error)
      return []
    }
  }

  /**
   * Discover via mDNS (Multicast DNS)
   */
  async discoverViaMDNS() {
    // In a real implementation, this would use mDNS library
    // For now, return placeholder
    return []
  }

  /**
   * Discover via Bluetooth
   */
  async discoverViaBluetooth() {
    if (!('bluetooth' in navigator)) {
      console.warn('Bluetooth API not available')
      return []
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['offlinehub-service'] }]
      })
      return [{
        id: device.id,
        name: device.name,
        protocol: 'bluetooth',
        rssi: null
      }]
    } catch (error) {
      console.error('Bluetooth discovery error:', error)
      return []
    }
  }

  /**
   * Discover via local network
   */
  async discoverViaLocalNetwork() {
    if (!('bluetooth' in navigator)) {
      return []
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'OfflineHub' }]
      })
      return [{
        id: device.id,
        name: device.name,
        protocol: 'bluetooth',
        rssi: null
      }]
    } catch (error) {
      console.error('Local network discovery error:', error)
      return []
    }
  }

  /**
   * Get peers list
   */
  getPeers() {
    return Array.from(this.peers.values())
  }

  /**
   * Add listener for network events
   */
  addListener(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  /**
   * Check if WiFi is available
   */
  isWiFiAvailable() {
    return this.connectionType === 'WiFi' && this.isOnline
  }

  /**
   * Check if Bluetooth is available
   */
  isBluetoothAvailable() {
    return 'bluetooth' in navigator
  }

  /**
   * Check if device supports local network
   */
  isLocalNetworkAvailable() {
    return this.connectionType === 'WiFi' || this.connectionType === 'Ethernet'
  }

  /**
   * Get recommended protocol
   */
  getRecommendedProtocol() {
    if (this.isWiFiAvailable()) return 'wifi'
    if (this.isBluetoothAvailable()) return 'bluetooth'
    if (this.isOnline) return 'cloud'
    return 'offline'
  }
}

export default new NetworkManager()
