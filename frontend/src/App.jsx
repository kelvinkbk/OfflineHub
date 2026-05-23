import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messageInput, setMessageInput] = useState("");
  const [connectionType, setConnectionType] = useState("Unknown");
  const [peers, setPeers] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [showPeers, setShowPeers] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [pendingMessages, setPendingMessages] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [inCallWith, setInCallWith] = useState(null);
  const [isInCall, setIsInCall] = useState(false);

  const socketRef = useRef(null);
  const dbRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    // Initialize user ID
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      const newUserId = `user-${Date.now()}`;
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    } else {
      setUserId(storedUserId);
    }

    // Initialize IndexedDB
    initializeDB();

    // Connect to WebSocket server
    connectToSocket();

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingMessages();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Detect connection type and speed
    if ("connection" in navigator) {
      const conn = navigator.connection;
      const updateConnectionInfo = () => {
        const type = conn.type || conn.effectiveType || "Unknown";
        setConnectionType(mapConnectionType(type));
        setConnectionSpeed(conn.downlink || null);
      };
      updateConnectionInfo();
      conn.addEventListener("change", updateConnectionInfo);
    }

    // Register service worker for offline support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("Service worker registered"))
        .catch((err) =>
          console.log("Service worker registration failed:", err),
        );
    }

    // Discover peers
    discoverPeers();
    const peerInterval = setInterval(discoverPeers, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(peerInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeDB = async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open("OfflineHub", 1);
      request.onerror = () => console.error("DB error:", request.error);
      request.onsuccess = () => {
        dbRef.current = request.result;
        loadMessagesFromDB();
        resolve();
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("messages")) {
          const store = db.createObjectStore("messages", { keyPath: "id" });
          store.createIndex("timestamp", "timestamp");
          store.createIndex("synced", "synced");
        }
        if (!db.objectStoreNames.contains("files")) {
          const store = db.createObjectStore("files", { keyPath: "id" });
          store.createIndex("uploaded", "uploaded");
        }
      };
    });
  };

  const loadMessagesFromDB = () => {
    if (!dbRef.current) return;
    const tx = dbRef.current.transaction(["messages"], "readonly");
    const store = tx.objectStore("messages");
    const request = store.getAll();
    request.onsuccess = () => {
      setMessages(request.result.sort((a, b) => a.timestamp - b.timestamp));
      const unsynced = request.result.filter((m) => !m.synced).length;
      setPendingMessages(unsynced);
    };
  };

  const saveMessageToDB = (message) => {
    if (!dbRef.current) return;
    const tx = dbRef.current.transaction(["messages"], "readwrite");
    const store = tx.objectStore("messages");
    store.put(message);
  };

  const connectToSocket = () => {
    socketRef.current = io("http://localhost:5000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to backend");
      setIsSocketConnected(true);
      // Get userId from localStorage to ensure it's available
      const userIdForSocket =
        localStorage.getItem("userId") || `user-${Date.now()}`;
      socketRef.current.emit("user_connected", {
        userId: userIdForSocket,
        username: `User-${userIdForSocket.slice(-4)}`,
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from backend");
      setIsSocketConnected(false);
    });

    socketRef.current.on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on("file_shared", (file) => {
      setSharedFiles((prev) => [...prev, file]);
    });

    socketRef.current.on("user_typing", (data) => {
      console.log(`${data.username} is typing...`);
      setTypingUsers((prev) => new Set([...prev, data.userId]));
    });

    socketRef.current.on("user_stopped_typing", (data) => {
      setTypingUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    socketRef.current.on("peer_connected", (peer) => {
      console.log(`Peer connected: ${peer.name}`);
    });

    socketRef.current.on("voice_call_incoming", (data) => {
      console.log(`Incoming voice call from ${data.fromUserId}`);
      setInCallWith(data.fromUserId);
    });

    socketRef.current.on("voice_call_answered", (data) => {
      console.log(`Call answered by ${data.userId}`);
      setIsInCall(true);
    });

    socketRef.current.on("voice_call_ended", () => {
      console.log("Call ended");
      setIsInCall(false);
      setInCallWith(null);
    });
  };

  const syncPendingMessages = async () => {
    if (!dbRef.current || !socketRef.current) return;
    const tx = dbRef.current.transaction(["messages"], "readwrite");
    const store = tx.objectStore("messages");
    const index = store.index("synced");
    const request = index.getAll(false);

    request.onsuccess = () => {
      const unsyncedMsgs = request.result;
      unsyncedMsgs.forEach((msg) => {
        socketRef.current.emit("send_message", msg);
        msg.synced = true;
        store.put(msg);
      });
      setPendingMessages(0);
    };
  };

  const mapConnectionType = (type) => {
    const typeMap = {
      wifi: "📶 WiFi",
      "4g": "📱 LTE",
      "5g": "🚀 5G",
      ethernet: "🔌 Ethernet",
      bluetooth: "🔵 Bluetooth",
      cellular: "📡 Cellular",
      unknown: "❓ Unknown",
    };
    return typeMap[type] || type || "Unknown";
  };

  const discoverPeers = async () => {
    // Simulate peer discovery (in production, use actual peer discovery)
    const simulatedPeers = [
      {
        id: "peer-001",
        name: "Alice",
        protocol: "WiFi",
        signal: -50,
        status: "online",
      },
      {
        id: "peer-002",
        name: "Bob",
        protocol: "Bluetooth",
        signal: -70,
        status: "online",
      },
      {
        id: "peer-003",
        name: "Charlie",
        protocol: "WiFi",
        signal: -60,
        status: "idle",
      },
    ];

    if (Math.random() > 0.7) {
      // 30% chance to show peers
      setPeers(simulatedPeers);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: messageInput,
      timestamp: new Date().getTime(),
      sender: `User-${userId?.slice(-4) || "?"}`,
      senderId: userId,
      synced: isSocketConnected && isOnline,
      type: "text",
    };

    // Save to local DB immediately
    saveMessageToDB(newMessage);
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");

    // Send to backend if connected
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit("send_message", newMessage);
      console.log("Message sent to backend");
    } else {
      console.log("Message saved locally (will sync when online)");
      setPendingMessages((p) => p + 1);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleFileShare(file);
    }
  };

  const handleFileShare = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        data: e.target.result,
        timestamp: new Date().getTime(),
        sender: `User-${userId?.slice(-4) || "?"}`,
      };

      // Save file to IndexedDB
      if (dbRef.current) {
        const tx = dbRef.current.transaction(["files"], "readwrite");
        const store = tx.objectStore("files");
        store.put(fileData);
      }

      // Share via socket if connected
      if (socketRef.current && isSocketConnected) {
        socketRef.current.emit("share_file", {
          id: fileData.id,
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          timestamp: fileData.timestamp,
          sender: fileData.sender,
        });
      }

      setSharedFiles((prev) => [...prev, fileData]);
      setSelectedFile(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.data], { type: file.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTyping = () => {
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit("typing", {
        userId,
        username: `User-${userId?.slice(-4) || "?"}`,
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to emit stopped typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stopped_typing", { userId });
      }, 1000);
    }
  };

  const initiateVoiceCall = (peerId) => {
    console.log(`Initiating voice call with ${peerId}`);
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit("voice_call_request", {
        fromUserId: userId,
        toUserId: peerId,
      });
      setInCallWith(peerId);
    }
  };

  const answerVoiceCall = () => {
    console.log(`Answering voice call from ${inCallWith}`);
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit("voice_call_answer", {
        userId,
        toUserId: inCallWith,
      });
      setIsInCall(true);
    }
  };

  const endVoiceCall = () => {
    console.log("Ending voice call");
    if (socketRef.current && isSocketConnected) {
      socketRef.current.emit("voice_call_end", {
        userId,
        toUserId: inCallWith,
      });
      setIsInCall(false);
      setInCallWith(null);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>OfflineHub 📱</h1>
        <div className="header-right">
          <div className={`status ${isOnline ? "online" : "offline"}`}>
            {isOnline ? "🟢 Online" : "🔴 Offline"}
          </div>
          {isSocketConnected && (
            <div className="socket-status" title="Connected to server">
              ⚡ Connected
            </div>
          )}
          {pendingMessages > 0 && (
            <div className="pending-badge" title="Messages waiting to sync">
              ⏱️ {pendingMessages}
            </div>
          )}
          <div className="connection-info">
            <span>{connectionType}</span>
            {connectionSpeed && (
              <span className="speed">{connectionSpeed} Mbps</span>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="messages-container">
          <div className="container-header">
            <h2>💬 Messages {messages.length > 0 && `(${messages.length})`}</h2>
            <div className="header-controls">
              <button
                className="btn-peers"
                onClick={() => setShowPeers(!showPeers)}
                title="Show nearby peers"
              >
                👥 {peers.length}
              </button>
              {sharedFiles.length > 0 && (
                <span className="file-count" title="Shared files">
                  📁 {sharedFiles.length}
                </span>
              )}
            </div>
          </div>
          <div className="messages-list">
            {messages.length === 0 ? (
              <p className="empty-state">No messages yet. Start chatting!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.senderId === userId ? "sent" : "received"
                  }`}
                >
                  <div className="message-header">
                    <strong>{msg.sender}</strong>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="message-text">{msg.text}</p>
                  <div className="message-footer">
                    {msg.synced ? (
                      <span className="synced" title="Synced to server">
                        ✓✓
                      </span>
                    ) : (
                      <span className="pending" title="Pending sync (offline)">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showPeers && (
          <div className="peers-container">
            <div className="peers-header">
              <h2>👥 Nearby Peers ({peers.length})</h2>
              <button className="btn-close" onClick={() => setShowPeers(false)}>
                ✕
              </button>
            </div>
            {peers.length === 0 ? (
              <p className="empty-state">No peers discovered</p>
            ) : (
              <div className="peers-list">
                {peers.map((peer) => (
                  <div key={peer.id} className="peer-card">
                    <div className="peer-header">
                      <h3>{peer.name}</h3>
                      <span className={`status-badge ${peer.status}`}>
                        {peer.status === "online" ? "🟢 Online" : "🟡 Idle"}
                      </span>
                    </div>
                    <div className="peer-info">
                      <p>
                        <strong>Protocol:</strong> {peer.protocol}
                      </p>
                      <p>
                        <strong>Signal:</strong> {peer.signal} dBm
                      </p>
                      <p>
                        <strong>Status:</strong> {peer.status}
                      </p>
                    </div>
                    <div className="peer-actions">
                      <button className="btn-connect">Connect</button>
                      <button className="btn-info">Info</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sharedFiles.length > 0 && (
          <div className="files-container">
            <div className="files-header">
              <h2>📁 Shared Files ({sharedFiles.length})</h2>
              <button className="btn-close" onClick={() => setSharedFiles([])}>
                ✕
              </button>
            </div>
            <div className="files-list">
              {sharedFiles.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <div className="file-details">
                      <p className="file-name">{file.name}</p>
                      <p className="file-meta">
                        {(file.size / 1024).toFixed(2)} KB •{" "}
                        {new Date(file.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn-download"
                    onClick={() => downloadFile(file)}
                  >
                    ⬇️ Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="features">
          <h2>🔧 Connection Protocols</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <span>📶</span>
              <p>WiFi / LAN</p>
              <small>Best for range</small>
            </div>
            <div className="feature-card">
              <span>🔵</span>
              <p>Bluetooth</p>
              <small>Low power</small>
            </div>
            <div className="feature-card">
              <span>📡</span>
              <p>Direct P2P</p>
              <small>No router</small>
            </div>
            <div className="feature-card">
              <span>☁️</span>
              <p>Cloud Sync</p>
              <small>Offline queue</small>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            {Array.from(typingUsers).join(", ")}{" "}
            {typingUsers.size === 1 ? "is" : "are"} typing...
          </div>
        )}
        {isInCall && (
          <div className="voice-call-active">
            🎤 In call with User-{inCallWith?.slice(-4)}
            <button
              className="btn-end-call"
              onClick={endVoiceCall}
              title="End call"
            >
              End Call
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="message-input"
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn-file"
            onClick={() => fileInputRef.current?.click()}
            title="Share file"
          >
            📎
          </button>
          <button type="submit" className="btn-send">
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;
