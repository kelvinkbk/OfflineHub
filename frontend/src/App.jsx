import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
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
    const peerInterval = setInterval(discoverPeers, 10000); // Every 10 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(peerInterval);
    };
  }, []);

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
      timestamp: new Date().toLocaleTimeString(),
      sender: "You",
      synced: isOnline,
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");

    // TODO: Send to backend or WebRTC peer
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>OfflineHub 📱</h1>
        <div className="header-right">
          <div className={`status ${isOnline ? "online" : "offline"}`}>
            {isOnline ? "🟢 Online" : "🔴 Offline"}
          </div>
          <div className="connection-info">
            <span>{connectionType}</span>
            {connectionSpeed && <span className="speed">{connectionSpeed} Mbps</span>}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="messages-container">
          <div className="container-header">
            <h2>💬 Messages</h2>
            <button 
              className="btn-peers"
              onClick={() => setShowPeers(!showPeers)}
              title="Show nearby peers"
            >
              👥 {peers.length}
            </button>
          </div>
          <div className="messages-list">
            {messages.length === 0 ? (
              <p className="empty-state">No messages yet. Start chatting!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="message">
                  <strong>{msg.sender}</strong>
                  <p>{msg.text}</p>
                  <small>
                    {msg.timestamp}
                    {msg.synced ? " ✓" : " (pending sync)"}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>

        {showPeers && (
          <div className="peers-container">
            <h2>👥 Nearby Peers</h2>
            {peers.length === 0 ? (
              <p className="empty-state">No peers discovered</p>
            ) : (
              <div className="peers-list">
                {peers.map((peer) => (
                  <div key={peer.id} className="peer-card">
                    <div className="peer-header">
                      <h3>{peer.name}</h3>
                      <span className={`status-badge ${peer.status}`}>
                        {peer.status === "online" ? "🟢" : "🟡"}
                      </span>
                    </div>
                    <div className="peer-info">
                      <p><strong>Protocol:</strong> {peer.protocol}</p>
                      <p><strong>Signal:</strong> {peer.signal} dBm</p>
                      <p><strong>Status:</strong> {peer.status}</p>
                    </div>
                    <button className="btn-connect">Connect</button>
                  </div>
                ))}
              </div>
            )}
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
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!isOnline && messages.length === 0}
          />
          <button type="submit">Send</button>
        </form>
      </footer>
    </div>
  );
}

export default App;
