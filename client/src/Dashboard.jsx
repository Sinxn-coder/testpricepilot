import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { appPath } from "./paths";
import "./dashboard-layout.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState("panel-pricing");
  const [apiKey, setApiKey] = useState("");
  const [analyticsData, setAnalyticsData] = useState({ summary: {}, recent_activity: [], time_series: [] });
  const [taxRates, setTaxRates] = useState([]);
  const [calcInputs, setCalcInputs] = useState({ basePrice: 10.00, currency: "USD", country: "IN", margin: 15 });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://testpricepilot.onrender.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        window.location.href = appPath("auth");
      }
    });

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'pricing') setActivePanel('panel-pricing');
      if (hash === 'analytics') setActivePanel('panel-analytics');
      if (hash === 'market') setActivePanel('panel-market');
      if (hash === 'settings') setActivePanel('panel-settings');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    window.lucide?.createIcons();
    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    window.lucide?.createIcons();
    if (activePanel === "panel-analytics") fetchAnalytics();
    if (activePanel === "panel-market") fetchTaxRates();
  }, [activePanel]);

  const callApi = async (method, path, body) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return { ok: false, error: "Not authenticated" };

    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("pricepilot.firebaseIdToken");
    window.location.href = appPath();
  };

  const fetchAnalytics = async () => {
    const res = await callApi("GET", "/analytics?days=7");
    if (res.ok) setAnalyticsData(res.data);
  };

  const fetchTaxRates = async () => {
    const res = await callApi("GET", "/tax-rates");
    if (res.ok) setTaxRates(res.data.tax_rates || []);
  };

  const handleCalculate = async () => {
    setCalcLoading(true);
    const res = await callApi("POST", "/calculate-price", {
      base_price: Number(calcInputs.basePrice),
      country: calcInputs.country,
      currency: calcInputs.currency,
      min_margin: Number(calcInputs.margin)
    });
    setCalcLoading(false);
    if (res.ok) setCalcResult(res.data);
  };

  const handleGenerateKey = async (email) => {
    setGenLoading(true);
    setError("");
    const res = await callApi("POST", "/auth/signup", { email });
    setGenLoading(false);
    if (res.ok) {
      setApiKey(res.data.api_key);
      setStatus("Key generated successfully!");
    } else {
      setError(res.data.error || "Failed to generate key");
    }
  };

  if (loading) return <div className="dash-loader-full" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff' }}>Loading PricePilot...</div>;

  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="compass" style={{ color: "var(--accent)" }}></i>
          <span>PricePilot</span>
        </div>
        <nav className="nav-group">
           <button className={`nav-item ${activePanel === 'panel-pricing' ? 'active' : ''}`} onClick={() => { setActivePanel('panel-pricing'); window.location.hash = 'pricing'; }}>
             <i data-lucide="cpu"></i><span>API Preview</span>
           </button>
           <button className={`nav-item ${activePanel === 'panel-analytics' ? 'active' : ''}`} onClick={() => { setActivePanel('panel-analytics'); window.location.hash = 'analytics'; }}>
             <i data-lucide="bar-chart-3"></i><span>Analytics</span>
           </button>
           <button className={`nav-item ${activePanel === 'panel-market' ? 'active' : ''}`} onClick={() => { setActivePanel('panel-market'); window.location.hash = 'market'; }}>
             <i data-lucide="globe"></i><span>Market Data</span>
           </button>
           <button className={`nav-item ${activePanel === 'panel-settings' ? 'active' : ''}`} onClick={() => { setActivePanel('panel-settings'); window.location.hash = 'settings'; }}>
             <i data-lucide="settings"></i><span>Access</span>
           </button>
        </nav>
        <div className="sidebar-footer">
          <div className="acc-card">
            <div className="avatar">{user?.email?.[0].toUpperCase() || "U"}</div>
            <div className="acc-info">
              <div className="acc-name">Developer</div>
              <div className="acc-plan">{analyticsData.summary?.plan || "Free"} plan</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
             <i data-lucide="log-out"></i><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="top-bar">
          <div className="page-heading">
            <h1>{activePanel === 'panel-pricing' ? 'API Preview' : activePanel === 'panel-analytics' ? 'Analytics' : activePanel === 'panel-market' ? 'Market Data' : 'Access'}</h1>
          </div>
        </header>

        <div className="content">
          {activePanel === 'panel-pricing' && (
            <section className="panel">
              <div className="playground-wrapper">
                <div className="params-card">
                  <div className="card-header"><h3>REQUEST PARAMETERS</h3></div>
                  <div className="card-body">
                    <div className="params-grid">
                      <div className="field"><label>Base Price</label><input type="number" value={calcInputs.basePrice} onChange={e => setCalcInputs({...calcInputs, basePrice: e.target.value})} /></div>
                      <div className="field"><label>Currency</label><input type="text" value={calcInputs.currency} onChange={e => setCalcInputs({...calcInputs, currency: e.target.value})} /></div>
                      <div className="field"><label>Country</label>
                        <select value={calcInputs.country} onChange={e => setCalcInputs({...calcInputs, country: e.target.value})}>
                          <option value="US">USA</option><option value="IN">India</option><option value="GB">UK</option><option value="DE">Germany</option>
                        </select>
                      </div>
                      <div className="field"><label>Margin (%)</label><input type="number" value={calcInputs.margin} onChange={e => setCalcInputs({...calcInputs, margin: e.target.value})} /></div>
                    </div>
                    <button className="play-button" onClick={handleCalculate} disabled={calcLoading}>
                      <i data-lucide={calcLoading ? "loader" : "play"}></i><span>{calcLoading ? "Executing..." : "Execute Request"}</span>
                    </button>
                  </div>
                </div>

                {calcResult && (
                  <div className="response-card" style={{ marginTop: 24 }}>
                    <div className="response-header"><span className="status-indicator status-success">200 OK</span></div>
                    <div className="card-body"><pre className="json-viewer">{JSON.stringify(calcResult, null, 2)}</pre></div>
                    <div className="response-footer">
                      <div className="metric-item"><span className="metric-label">Tax</span><span className="metric-value">${calcResult.tax_amount}</span></div>
                      <div className="metric-item"><span className="metric-label">Optimized</span><span className="metric-value success">${calcResult.optimized_final_price}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activePanel === 'panel-analytics' && (
            <section className="panel">
              <div className="stats-grid">
                 <div className="stat-card"><h3>Requests</h3><div className="value">{analyticsData.summary?.total_requests || 0}</div></div>
                 <div className="stat-card"><h3>Lift</h3><div className="value green">{analyticsData.summary?.revenue_lift || "0%"}</div></div>
              </div>
              <div className="workbench-card" style={{ marginTop: 24 }}>
                <h3>Recent Activity</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Country</th><th>Base</th><th>Optimized</th><th>Status</th></tr></thead>
                    <tbody>
                      {analyticsData.recent_activity?.map((log, i) => (
                        <tr key={i}><td>{log.country}</td><td>${log.base_price}</td><td className="accent">${log.optimized_final_price}</td><td>{log.converted ? "✅" : "⏳"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activePanel === 'panel-market' && (
            <section className="panel">
              <div className="workbench-card">
                <h3>Global Tax Benchmarks</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Region</th><th>Tax Rate</th></tr></thead>
                    <tbody>
                      {taxRates.map((rate, i) => (
                        <tr key={i}><td>{rate.country_name || rate.country}</td><td className="green">{rate.tax_percentage}%</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
          
          {activePanel === 'panel-settings' && (
             <section className="panel">
                <div className="workbench-card">
                  <h3>Generate API Key</h3>
                  <p>Use this key in your storefront plugin.</p>
                  <div className="field" style={{ marginTop: 16 }}>
                    <label>Environment Owner</label>
                    <input type="email" value={user?.email || ""} disabled />
                  </div>
                  <button className="btn btn-glow" onClick={() => handleGenerateKey(user.email)} disabled={genLoading}>
                    <i data-lucide="zap"></i><span>{genLoading ? "Generating..." : "Generate Key"}</span>
                  </button>
                  {apiKey && (
                    <div className="key-display-master" style={{ marginTop: 24 }}>
                      <div className="key-inner"><code>{apiKey}</code></div>
                    </div>
                  )}
                  {error && <p className="error" style={{ color: 'var(--red)', marginTop: 12 }}>{error}</p>}
                </div>
             </section>
          )}
        </div>
      </main>
    </div>
  );
}
