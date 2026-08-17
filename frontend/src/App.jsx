import React, { useState, useEffect } from 'react';
import './App.css';
import { SHORTENER_URL, STATS_URL, QR_URL } from './config';

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [result, setResult] = useState(null); // { shortCode, longUrl, shortUrl }
  const [qrBlobUrl, setQrBlobUrl] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [stats, setStats] = useState(null); // { clickCount, lastClicked }
  const [error, setError] = useState('');
  const [copyText, setCopyText] = useState('Copy');
  const [loading, setLoading] = useState(false);

  // Microservices online/offline connection state tracking
  const [health, setHealth] = useState({
    shortener: 'offline',
    stats: 'offline',
    qr: 'offline'
  });

  // Shorten history list loaded from localStorage
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('orange_history') || '[]');
    } catch {
      return [];
    }
  });

  // Query health check endpoints on mount and periodically
  useEffect(() => {
    let isMounted = true;
    const checkServiceHealth = async () => {
      const statuses = { shortener: 'offline', stats: 'offline', qr: 'offline' };
      
      try {
        const res = await fetch(`${SHORTENER_URL}/api/shortener/health/`, { headers: { 'Accept': 'application/json' } });
        if (res.ok && isMounted) statuses.shortener = 'online';
      } catch (err) {
        // Ignore connection errors during health polling
      }

      try {
        const res = await fetch(`${STATS_URL}/api/stats/health/`, { headers: { 'Accept': 'application/json' } });
        if (res.ok && isMounted) statuses.stats = 'online';
      } catch (err) {
        // Ignore connection errors during health polling
      }

      try {
        const res = await fetch(`${QR_URL}/api/qr/health/`, { headers: { 'Accept': 'application/json' } });
        if (res.ok && isMounted) statuses.qr = 'online';
      } catch (err) {
        // Ignore connection errors during health polling
      }

      if (isMounted) {
        setHealth(statuses);
      }
    };

    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Revoke object URL to prevent memory leaks when the QR code changes or component unmounts
  useEffect(() => {
    return () => {
      if (qrBlobUrl) {
        URL.revokeObjectURL(qrBlobUrl);
      }
    };
  }, [qrBlobUrl]);

  // Update history in state and localStorage
  const saveToHistory = (newEntry) => {
    const updated = [newEntry, ...history.filter(item => item.shortCode !== newEntry.shortCode)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('orange_history', JSON.stringify(updated));
  };

  // Calls shortener-service to shorten the URL
  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setStats(null);
    setShowQr(false);
    setQrBlobUrl('');
    setCopyText('Copy');

    if (!longUrl) {
      setError('Please enter a destination URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SHORTENER_URL}/api/shorten/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ long_url: longUrl }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.long_url) {
          throw new Error(`Invalid URL: ${errData.long_url.join(', ')}`);
        }
        throw new Error(errData.error || 'Failed to shorten URL');
      }

      const data = await response.json();
      const newResult = {
        shortCode: data.short_code,
        longUrl: data.long_url,
        shortUrl: data.short_url,
      };

      setResult(newResult);
      saveToHistory(newResult);
      // Fetch initial click logs
      await fetchStats(data.short_code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Queries stats-service for click counts
  const fetchStats = async (code) => {
    try {
      const response = await fetch(`${STATS_URL}/api/stats/${code}/`);
      if (!response.ok) {
        throw new Error('Failed to retrieve click statistics');
      }
      const data = await response.json();
      setStats({
        clickCount: data.click_count,
        lastClicked: data.last_clicked,
      });
    } catch (err) {
      setError(`Stats error: ${err.message}`);
    }
  };

  // Fetches QR PNG image from qr-service as a blob
  const toggleQr = async () => {
    if (showQr) {
      setShowQr(false);
      return;
    }

    if (qrBlobUrl) {
      setShowQr(true);
      return;
    }

    setError('');
    try {
      const response = await fetch(`${QR_URL}/api/qr/${result.shortCode}/`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Short code not found');
        }
        throw new Error('Failed to generate QR code');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setQrBlobUrl(blobUrl);
      setShowQr(true);
    } catch (err) {
      setError(`QR error: ${err.message}`);
    }
  };

  // Load a result card from history click
  const loadHistoryItem = (item) => {
    setResult(item);
    setQrBlobUrl('');
    setShowQr(false);
    setStats(null);
    fetchStats(item.shortCode);
  };

  // Clear history list
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('orange_history');
  };

  // Copies short URL to clipboard
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.shortUrl);
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy'), 2000);
    }
  };

  return (
    <div className="board-layout">
      {/* Column 1: Control Column */}
      <div className="board-column column-left">
        {/* Navigation Header */}
        <nav className="nav-header" id="nav-header">
          <div className="brutalist-logo">
            <span className="logo-block-num">21</span>
            <span className="logo-block-text">ORANGE</span>
          </div>
          <div className="status-indicator-group" id="health-dashboard">
            <span className={`status-badge ${health.shortener}`} id="health-shortener">
              Shortener: {health.shortener}
            </span>
            <span className={`status-badge ${health.stats}`} id="health-stats">
              Analytics: {health.stats}
            </span>
            <span className={`status-badge ${health.qr}`} id="health-qr-service">
              QR Gen: {health.qr}
            </span>
            <span className="version-badge" id="health-qr">
              version: 1.1.0
            </span>
          </div>
        </nav>

        {/* System error alerts */}
        {error && <div className="error-banner" id="error-alert">⚡ {error}</div>}

        {/* Main Shortening Input Card */}
        <main className="card" id="shorten-form-card">
          <h2 className="card-title">Create Short Link</h2>
          <form onSubmit={handleShorten}>
            <div className="form-group">
              <input
                id="long-url-input"
                type="url"
                placeholder="Paste destination URL here..."
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit" id="btn-shorten" disabled={loading}>
                {loading ? 'Shortening...' : 'Shorten'}
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Column 2: Active Workspace Column */}
      <div className="board-column column-middle">
        {!result ? (
          <div className="empty-card" id="empty-state-card">
            <div className="empty-icon">📥</div>
            <h3 className="empty-title">Awaiting Input</h3>
            <p className="empty-text">
              Submit a target link in the left panel to initialize dynamic link mapping and load analytics details.
            </p>
          </div>
        ) : (
          <section className="card" id="result-display-panel">
            <h2 className="card-title">Short Link Active</h2>
            
            <div className="result-box">
              <a href={result.shortUrl} target="_blank" rel="noopener noreferrer" className="short-url-link" id="short-url-link">
                {result.shortUrl} ↗️
              </a>
              <div className="original-url-text">Original URL: {result.longUrl}</div>
            </div>

            <div className="action-buttons">
              <button className={`btn ${copyText === 'Copied!' ? 'btn-success' : ''}`} onClick={handleCopy} id="btn-copy">
                {copyText === 'Copied!' ? '✓ Copied' : 'Copy'}
              </button>
              <button className="btn btn-primary" onClick={toggleQr} id="btn-qr">
                {showQr ? 'Hide QR' : 'Show QR'}
              </button>
              <button className="btn" onClick={() => fetchStats(result.shortCode)} id="btn-refresh">
                Refresh Stats
              </button>
            </div>

            {/* Sub-panels stack for QR Code and statistics */}
            {(showQr || stats) && (
              <div className="detail-stack" id="result-details-panel">
                {showQr && (
                  <div className="qr-section" id="qr-container-box">
                    {qrBlobUrl ? (
                      <>
                        <img src={qrBlobUrl} alt="QR Code" className="qr-image" />
                        <div className="qr-label">Scan Link</div>
                      </>
                    ) : (
                      <div className="qr-label">Generating...</div>
                    )}
                  </div>
                )}

                {stats && (
                  <div className="analytics-section" id="stats-dashboard">
                    <div className="metric-group">
                      <span className="metric-label">Redirect Count</span>
                      <span className="metric-value">{stats.clickCount}</span>
                    </div>
                    <div className="metric-group">
                      <span className="metric-label">Last Click Date</span>
                      <span className="timestamp-value">
                        {stats.lastClicked ? new Date(stats.lastClicked).toLocaleString() : 'NEVER'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Column 3: History Buffer Column */}
      <div className="board-column column-right">
        <section className="card" id="history-panel" style={{ gap: '1rem' }}>
          <div className="history-header">
            <h3>Recent Links</h3>
            {history.length > 0 && (
              <button className="btn-clear" onClick={clearHistory} id="btn-clear-history">Clear</button>
            )}
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#666666', padding: '1rem 0' }}>
                No previously shortened links recorded.
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.shortCode} 
                  className={`history-item ${result?.shortCode === item.shortCode ? 'selected' : ''}`}
                  onClick={() => loadHistoryItem(item)}
                  id={`history-item-${item.shortCode}`}
                >
                  <div className="history-item-left">
                    <span className="history-item-code">/{item.shortCode}</span>
                    <span className="history-item-url">{item.longUrl}</span>
                  </div>
                  <span className="history-item-arrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
