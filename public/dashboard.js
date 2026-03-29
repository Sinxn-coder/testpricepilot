lucide.createIcons();

// --- Sidebar Toggle (Mobile) ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');

function toggleSidebar(open) {
  if (open) {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
}

if (menuToggle) menuToggle.addEventListener('click', () => toggleSidebar(true));
if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));

// --- Mobile Key Overlay ---
const keyToggle = document.getElementById('key-toggle');
const keyOverlay = document.getElementById('key-overlay');
const closeKey = document.getElementById('close-key');

if (keyToggle) {
  keyToggle.addEventListener('click', () => {
    keyOverlay.classList.toggle('active');
    lucide.createIcons();
  });
}
if (closeKey) {
  closeKey.addEventListener('click', () => {
    keyOverlay.classList.remove('active');
  });
}

// --- Navigation Logic ---
document.querySelectorAll('.nav-item[data-target]').forEach(item => {
  item.addEventListener('click', () => {
    const targetId = item.dataset.target;
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    // Update active panel
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) targetPanel.classList.remove('hidden');

    // Update header title
    const titleSpan = item.querySelector('span');
    if (titleSpan) document.getElementById('page-title').textContent = titleSpan.textContent;

    // Trigger specific logic for merged hubs
    if (targetId === 'panel-analytics-hub') {
      fetchAnalytics();
    }
    
    if (targetId === 'panel-settings') {
      lucide.createIcons();
    }

    // Close sidebar on mobile after clicking
    toggleSidebar(false);
  });
});

// --- API Key Visibility & Sync ---
const apiDesktop = document.getElementById('apiKey');
const apiMobile = document.getElementById('api-key-mobile');

function syncAndToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  toggle.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      toggle.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      toggle.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
  });
}

// Init sync and visibility toggle
syncAndToggle('apiKey', 'toggleKey');
syncAndToggle('api-key-mobile', 'toggle-key-mobile');

if (apiDesktop && apiMobile) {
  // Sync on load
  if (apiMobile.value && !apiDesktop.value) apiDesktop.value = apiMobile.value;
  if (apiDesktop.value && !apiMobile.value) apiMobile.value = apiDesktop.value;

  apiDesktop.addEventListener('input', () => apiMobile.value = apiDesktop.value);
  apiMobile.addEventListener('input', () => apiDesktop.value = apiMobile.value);
}

// --- Core API Helpers ---
async function callApi(method, path, body) {
  const keyInput = document.getElementById('apiKey');
  const key = keyInput ? keyInput.value.trim() : '';
  const headers = { 'Content-Type': 'application/json' };

  if (!key) {
    return { 
      ok: false, 
      status: 401, 
      data: { error: 'API Key is missing. Enter your key in the top-right field or mobile modal.' } 
    };
  }

  headers['Authorization'] = 'Bearer ' + key;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(path, opts);
    const data = await res.json().catch(() => ({ error: 'Invalid server response' }));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err.message } };
  }
}

function highlightJson(json) {
  return JSON.stringify(json, null, 2)
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g, ': <span class="json-str">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-num">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>');
}

function setStatus(el, ok, code) {
  if (!el) return;
  el.className = 'status-chip ' + (ok ? 'status-ok' : 'status-err');
  el.textContent = code + (ok ? ' OK' : ' ERROR');
}

// --- Handlers ---

// 1. Calculate
const calcBtn = document.getElementById('calcBtn');
if (calcBtn) {
  calcBtn.addEventListener('click', async () => {
    const payload = {
      base_price: Number(document.getElementById('c-basePrice').value),
      country: document.getElementById('c-country').value,
      currency: document.getElementById('c-currency').value,
      min_margin: Number(document.getElementById('c-margin').value)
    };
    const r = await callApi('POST', '/calculate-price', payload);
    const jsonEl = document.getElementById('calcJson');
    if (jsonEl) jsonEl.innerHTML = highlightJson(r.data);
    setStatus(document.getElementById('calc-status'), r.ok, r.status);
    const resultsWrap = document.getElementById('calc-results-wrap');
    if (resultsWrap) resultsWrap.classList.remove('hidden');

    if (r.ok && r.data.tax_amount !== undefined) {
      document.getElementById('rc-tax').textContent = `$${r.data.tax_amount.toFixed(2)}`;
      document.getElementById('rc-taxed').textContent = `$${r.data.original_final_price}`;
      document.getElementById('rc-optimized').textContent = `$${r.data.optimized_final_price}`;
    }
  });
}

// 2. Optimize
const optimizeBtn = document.getElementById('optimizeBtn');
if (optimizeBtn) {
  optimizeBtn.addEventListener('click', async () => {
    const payload = {
      base_price: Number(document.getElementById('o-basePrice').value),
      country: document.getElementById('o-country').value,
      currency: 'USD',
      source: document.getElementById('o-source').value
    };
    const r = await callApi('POST', '/optimize-price', payload);
    const jsonEl = document.getElementById('optimizeJson');
    if (jsonEl) jsonEl.innerHTML = highlightJson(r.data);
    const resultsWrap = document.getElementById('opt-results-wrap');
    if (resultsWrap) resultsWrap.classList.remove('hidden');
  });
}

// 3. Track
const trackBtn = document.getElementById('trackBtn');
if (trackBtn) {
  trackBtn.addEventListener('click', async () => {
    const payload = {
      price_shown: Number(document.getElementById('t-price').value),
      converted: document.getElementById('t-converted').value === 'true',
      country: document.getElementById('t-country').value,
      source: 'dashboard-test'
    };
    const r = await callApi('POST', '/track-conversion', payload);
    const jsonEl = document.getElementById('trackJson');
    if (jsonEl) {
       jsonEl.innerHTML = highlightJson(r.data);
       jsonEl.classList.remove('hidden');
    }
    setStatus(document.getElementById('track-status'), r.ok, r.status);
    
    // Refresh stats if on the hub context
    fetchAnalytics();
  });
}

// 4. Rates
const ratesBtn = document.getElementById('ratesBtn');
if (ratesBtn) {
  ratesBtn.addEventListener('click', async () => {
    const r = await callApi('GET', '/tax-rates');
    const jsonEl = document.getElementById('ratesJson');
    if (jsonEl) jsonEl.innerHTML = highlightJson(r.data);
    setStatus(document.getElementById('rates-status'), r.ok, r.status);
    const resultsWrap = document.getElementById('rates-results-wrap');
    if (resultsWrap) resultsWrap.classList.remove('hidden');

    if (r.ok && r.data.tax_rates) {
      const tbody = document.getElementById('ratesBody');
      if (tbody) {
        tbody.innerHTML = '';
        r.data.tax_rates.forEach(row => {
          const tr = document.createElement('tr');
          const dateStr = row.updated_at ? new Date(row.updated_at).toLocaleDateString() : new Date().toLocaleDateString();
          tr.innerHTML = `
            <td style="font-weight: 600;">
              ${row.country_name} <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: 4px;">(${row.country_code})</span>
            </td>
            <td style="color: var(--green); font-weight: 700;">${row.tax_percentage}%</td>
            <td style="color: var(--text-muted); font-size: 0.75rem;">${dateStr}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
  });
}

function updateChart(data) {
  const chartEl = document.getElementById('analyticsChart');
  if (!chartEl) return;
  const ctx = chartEl.getContext('2d');
  
  if (analyticsChart) {
    analyticsChart.destroy();
  }

  const labels = data.map(d => d.label);
  const requests = data.map(d => d.requests);

  analyticsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'API Requests',
        data: requests,
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6c63ff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#8e9bb3', font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#8e9bb3', font: { size: 10 } }
        }
      }
    }
  });
}

async function fetchAnalytics() {
    const r = await callApi('GET', '/analytics');
    if (!r.ok) {
      console.warn('Analytics Hub: Backend unavailable or not configured:', r.data.error);
      return;
    }

    const { summary, recent_activity, time_series } = r.data;

    // Update stats cards
    const reqEl = document.getElementById('stat-requests');
    const convEl = document.getElementById('stat-conv');
    const liftEl = document.getElementById('stat-lift');
    
    if (reqEl) reqEl.textContent = summary.total_requests.toLocaleString();
    if (convEl) convEl.textContent = summary.conversion_rate;
    if (liftEl) liftEl.textContent = summary.revenue_lift;

    // Update Chart
    if (time_series) updateChart(time_series);

    // Update recent activity table
    const tbody = document.getElementById('analyticsBody');
    if (tbody) {
      tbody.innerHTML = '';
      if (!recent_activity || recent_activity.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No activity logged yet.</td></tr>';
      } else {
        recent_activity.forEach(log => {
          const tr = document.createElement('tr');
          const date = new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const statusClass = log.converted ? 'badge-success' : 'badge-neutral';
          const statusText = log.converted ? 'Converted' : 'Pending';

          tr.innerHTML = `
            <td style="font-size: 0.75rem; color: var(--text-muted);">${date}</td>
            <td style="font-weight: 600; font-size: 0.8rem;">${log.country}</td>
            <td style="font-size: 0.8rem;">$${Number(log.base_price).toFixed(2)}</td>
            <td style="font-weight: 700; font-size: 0.8rem; color: var(--accent);">$${Number(log.optimized_final_price).toFixed(2)}</td>
            <td><span class="badge ${statusClass}" style="padding: 2px 8px; font-size: 0.65rem;">${statusText}</span></td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
    lucide.createIcons();
}

// --- Signup Logic (Integrated in Settings Hub) ---
const signupBtn = document.getElementById('signup-btn');
const finishSignup = document.getElementById('finish-signup');

if (signupBtn) {
  signupBtn.addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value.trim();
    if (!email) return alert('Email is required');

    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> <span>Generating Credentials...</span>';
    lucide.createIcons();

    const r = await callApiNoAuth('POST', '/auth/signup', { email });
    
    signupBtn.disabled = false;
    signupBtn.innerHTML = '<i data-lucide="key"></i> <span>Generate New API Key</span>';
    lucide.createIcons();

    if (r.ok) {
      document.getElementById('signup-form-body').classList.add('hidden');
      document.getElementById('signup-result-body').classList.remove('hidden');
      document.getElementById('new-api-key').textContent = r.data.api_key;
      
      // Auto-apply key to session
      if (apiDesktop) apiDesktop.value = r.data.api_key;
      if (apiMobile) apiMobile.value = r.data.api_key;
      
      lucide.createIcons();
    } else {
      alert(r.data.error || 'Signup failed');
    }
  });
}

if (finishSignup) {
  finishSignup.addEventListener('click', () => {
    // Just refresh or show success state transition
    document.getElementById('signup-result-body').classList.add('hidden');
    document.getElementById('signup-form-body').classList.remove('hidden');
    document.getElementById('signup-email').value = '';
  });
}

// Special wrapper for signup (no auth header needed)
async function callApiNoAuth(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(path, opts);
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { error: err.message } };
  }
}
