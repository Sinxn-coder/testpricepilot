import React, { useEffect, useState, useRef } from 'react';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { appPath } from "./paths";
import "./dashboard-layout.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem("pricepilot.apiKey") || "");
  const [activePanel, setActivePanel] = useState("panel-pricing");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({ summary: {}, recent_activity: [], time_series: [] });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://testpricepilot.onrender.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    window.lucide?.createIcons();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [activePanel]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("pricepilot.firebaseIdToken");
    window.location.href = appPath();
  };

  if (loading) return <div className="dash-loader-full" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff' }}>Loading Dashboard...</div>;

  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="compass" style={{ color: "var(--accent)" }}></i>
          <span>PricePilot</span>
        </div>
        <nav className="nav-group">
           <button className={`nav-item ${activePanel === 'panel-pricing' ? 'active' : ''}`} onClick={() => setActivePanel('panel-pricing')}>
             <i data-lucide="cpu"></i><span>API Preview</span>
           </button>
           <button className={`nav-item ${activePanel === 'panel-analytics' ? 'active' : ''}`} onClick={() => setActivePanel('panel-analytics')}>
             <i data-lucide="bar-chart-3"></i><span>Analytics</span>
           </button>
           <button className={`nav-item ${activePanel === 'panel-settings' ? 'active' : ''}`} onClick={() => setActivePanel('panel-settings')}>
             <i data-lucide="settings"></i><span>Access</span>
           </button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
             <i data-lucide="log-out"></i><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="top-bar">
          <div className="page-heading">
            <h1>{activePanel === 'panel-pricing' ? 'API Preview' : activePanel === 'panel-analytics' ? 'Analytics' : 'Access'}</h1>
          </div>
        </header>

        <div className="content">
          {activePanel === 'panel-pricing' && (
            <section className="panel">
              <div className="playground-wrapper">
                <div className="card">
                  <h3>Calculate Price</h3>
                  <p>Test your pricing rules live in the cloud.</p>
                  <div style={{ marginTop: 24, padding: 20, border: '1px dashed var(--border)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Pricing Simulation Tools Loading...
                  </div>
                </div>
              </div>
            </section>
          )}

          {activePanel === 'panel-analytics' && (
            <section className="panel">
              <div className="stats-grid">
                 <div className="stat-card"><h3>Requests</h3><div className="value">1,240</div></div>
                 <div className="stat-card"><h3>Lift</h3><div className="value green">+14%</div></div>
              </div>
            </section>
          )}
          
          {activePanel === 'panel-settings' && (
             <section className="panel">
                <div className="workbench-card">
                  <h3>Your API Keys</h3>
                  <p>Keep these secret. Do not share them in frontend code.</p>
                  <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent)' }}>
                    pp_live_********************************
                  </div>
                </div>
             </section>
          )}
        </div>
      </main>
    </div>
  );
}
