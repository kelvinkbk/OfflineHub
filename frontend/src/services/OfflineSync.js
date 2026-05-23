/**
 * Offline Sync Service
 * Manages synchronization of data when connection is restored
 */

export class OfflineSyncService {
  constructor() {
    this.db = null
    this.syncInProgress = false
    this.lastSyncTime = null
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OfflineHub', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (e) => {
        const db = e.target.result

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' })
          messagesStore.createIndex('timestamp', 'timestamp')
          messagesStore.createIndex('synced', 'synced')
        }

        // Files store
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' })
          filesStore.createIndex('uploaded', 'uploaded')
        }

        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          db.createObjectStore('contacts', { keyPath: 'id' })
        }

        // Pending actions store
        if (!db.objectStoreNames.contains('pending-actions')) {
          const actionsStore = db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true })
          actionsStore.createIndex('actionType', 'actionType')
          actionsStore.createIndex('synced', 'synced')
        }
      }
    })
  }

  /**
   * Save message for offline
   */
  async saveMessage(message) {
    const tx = this.db.transaction(['messages'], 'readwrite')
    const store = tx.objectStore('messages')

    const offlineMsg = {
      ...message,
      synced: false,
      savedAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const request = store.add(offlineMsg)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save file for offline
   */
  async saveFile(file, metadata) {
    const tx = this.db.transaction(['files'], 'readwrite')
    const store = tx.objectStore('files')

    const reader = new FileReader()
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const fileData = {
          ...metadata,
          data: reader.result,
          uploaded: false,
          savedAt: new Date().toISOString()
        }

        const request = store.add(fileData)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Get unsyned messages
   */
  async getUnsyncedMessages() {
    const tx = this.db.transaction(['messages'], 'readonly')
    const store = tx.objectStore('messages')
    const index = store.index('synced')

    return new Promise((resolve, reject) => {
      const request = index.getAll(false)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get unsynced files
   */
  async getUnsyncedFiles() {
    const tx = this.db.transaction(['files'], 'readonly')
    const store = tx.objectStore('files')
    const index = store.index('uploaded')

    return new Promise((resolve, reject) => {
      const request = index.getAll(false)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Mark message as synced
   */
  async markMessageSynced(messageId) {
    const tx = this.db.transaction(['messages'], 'readwrite')
    const store = tx.objectStore('messages')

    return new Promise((resolve, reject) => {
      const getRequest = store.get(messageId)
      
      getRequest.onsuccess = () => {
        const message = getRequest.result
        if (message) {
          message.synced = true
          message.syncedAt = new Date().toISOString()
          const updateRequest = store.put(message)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Sync all pending data
   */
  async syncAllPending(serverAPI) {
    if (this.syncInProgress) return

    this.syncInProgress = true

    try {
      // Sync messages
      const messages = await this.getUnsyncedMessages()
      for (const message of messages) {
        try {
          await serverAPI.uploadMessage(message)
          await this.markMessageSynced(message.id)
        } catch (error) {
          console.error('Failed to sync message:', error)
        }
      }

      // Sync files
      const files = await this.getUnsyncedFiles()
      for (const file of files) {
        try {
          await serverAPI.uploadFile(file)
          await this.markFileSynced(file.id)
        } catch (error) {
          console.error('Failed to sync file:', error)
        }
      }

      this.lastSyncTime = new Date().toISOString()
      return true
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Mark file as synced
   */
  async markFileSynced(fileId) {
    const tx = this.db.transaction(['files'], 'readwrite')
    const store = tx.objectStore('files')

    return new Promise((resolve, reject) => {
      const getRequest = store.get(fileId)
      
      getRequest.onsuccess = () => {
        const file = getRequest.result
        if (file) {
          file.uploaded = true
          file.uploadedAt = new Date().toISOString()
          const updateRequest = store.put(file)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Clear old synced data
   */
  async clearOldData(daysOld = 30) {
    const tx = this.db.transaction(['messages', 'files'], 'readwrite')
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Clear old messages
    const messagesStore = tx.objectStore('messages')
    const messageIndex = messagesStore.index('timestamp')
    const messageRange = IDBKeyRange.upperBound(cutoffDate.toISOString())
    messageIndex.openCursor(messageRange).onsuccess = (e) => {
      const cursor = e.target.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve()
    })
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const unsynced = await this.getUnsyncedMessages()
    const unsyncedFiles = await this.getUnsyncedFiles()

    return {
      lastSyncTime: this.lastSyncTime,
      unsyncedMessages: unsynced.length,
      unsyncedFiles: unsyncedFiles.length,
      syncInProgress: this.syncInProgress
    }
  }
}

export default new OfflineSyncService()
