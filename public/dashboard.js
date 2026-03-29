let analyticsChart;

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebar-overlay");
const menuToggle = document.getElementById("menu-toggle");
const keyToggle = document.getElementById("key-toggle");
const keyOverlay = document.getElementById("key-overlay");
const closeKey = document.getElementById("close-key");
const apiDesktop = document.getElementById("apiKey");
const apiMobile = document.getElementById("api-key-mobile");

// --- API CONFIGURATION ---
// IMPORTANT: Replace this with your actual Render URL (e.g., https://your-app.onrender.com)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'https://testpricepilot.onrender.com'; // TODO: User should replace this if different

const pageTitle = document.getElementById("page-title");

const pageSubtitle = document.getElementById("page-subtitle");
const calcResponseColumn = document.getElementById("calc-response-column");
const calcSnippetEl = document.getElementById("calc-request-snippet");
const optSnippetEl = document.getElementById("opt-request-snippet");
const calcLangTag = document.getElementById("calc-lang-tag");
const optLangTag = document.getElementById("opt-lang-tag");

let currentCalcLang = "curl";
let currentOptLang = "curl";


function refreshIcons() {
  lucide.createIcons();
}

function toggleSidebar(open) {
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle("open", open);
  overlay.classList.toggle("active", open);
}

function toggleKeyPanel(open) {
  if (!keyOverlay) return;
  keyOverlay.classList.toggle("active", open);
}

function setActivePanel(targetId, navItem) {
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== targetId);
  });

  document.querySelectorAll(".nav-item[data-target]").forEach((item) => {
    item.classList.toggle("active", item === navItem);
  });

  if (pageTitle && navItem?.dataset.title) pageTitle.textContent = navItem.dataset.title;
  if (pageSubtitle && navItem?.dataset.subtitle) pageSubtitle.textContent = navItem.dataset.subtitle;

  if (targetId === "panel-analytics-hub") {
    fetchAnalytics();
  }

  const hashMap = {
    "panel-pricing": "pricing",
    "panel-analytics-hub": "analytics",
    "panel-market": "tax",
    "panel-settings": "settings"
  };
  const nextHash = hashMap[targetId];
  if (nextHash) {
    history.replaceState(null, "", `#${nextHash}`);
  }

  toggleSidebar(false);
  refreshIcons();
}

function setEndpointTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  document.querySelectorAll(".endpoint-view").forEach((view) => {
    view.classList.toggle("hidden", view.id !== `tab-${tabName}`);
  });

  if (calcResponseColumn) {
    calcResponseColumn.classList.toggle("hidden", tabName !== "calculate");
  }
}

function syncAndToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggle.setAttribute("data-lucide", showing ? "eye" : "eye-off");
    refreshIcons();
  });
}

if (menuToggle) menuToggle.addEventListener("click", () => toggleSidebar(true));
if (overlay) overlay.addEventListener("click", () => toggleSidebar(false));
if (keyToggle) keyToggle.addEventListener("click", () => toggleKeyPanel(true));
if (closeKey) closeKey.addEventListener("click", () => toggleKeyPanel(false));

document.querySelectorAll(".nav-item[data-target]").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    setActivePanel(item.dataset.target, item);
  });
});

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => setEndpointTab(button.dataset.tab));
});

syncAndToggle("apiKey", "toggleKey");
syncAndToggle("api-key-mobile", "toggle-key-mobile");

if (apiDesktop && apiMobile) {
  if (apiMobile.value && !apiDesktop.value) apiDesktop.value = apiMobile.value;
  if (apiDesktop.value && !apiMobile.value) apiMobile.value = apiDesktop.value;

  apiDesktop.addEventListener("input", () => {
    apiMobile.value = apiDesktop.value;
  });

  apiMobile.addEventListener("input", () => {
    apiDesktop.value = apiMobile.value;
  });
}

async function callApi(method, path, body) {
  const key = apiDesktop ? apiDesktop.value.trim() : "";
  const headers = { "Content-Type": "application/json" };

  if (!key) {
    return {
      ok: false,
      status: 401,
      data: { error: "API key is missing. Enter it in the top bar or mobile key panel." }
    };
  }

  headers.Authorization = `Bearer ${key}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, opts);
    const data = await res.json().catch(() => ({ error: "Invalid server response" }));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err.message } };
  }
}

// --- Playground Logic ---

function getSnippet(lang, method, path, body) {
  const fullUrl = `${API_BASE_URL || window.location.origin}${path}`;
  const jsonBody = JSON.stringify(body, null, 2);


  if (lang === "curl") {
    return `<span class="sh-keyword">curl</span> -X <span class="sh-string">${method}</span> <span class="sh-string">"${fullUrl}"</span> \\
  -H <span class="sh-string">"Authorization: Bearer YOUR_API_KEY"</span> \\
  -H <span class="sh-string">"Content-Type: application/json"</span> \\
  -d <span class="sh-string">'${JSON.stringify(body)}'</span>`;
  }

  if (lang === "js") {
    return `<span class="sh-keyword">const</span> <span class="sh-param">response</span> = <span class="sh-keyword">await</span> <span class="sh-function">fetch</span>(<span class="sh-string">"${fullUrl}"</span>, {
  <span class="sh-param">method</span>: <span class="sh-string">"${method}"</span>,
  <span class="sh-param">headers</span>: {
    <span class="sh-string">"Authorization"</span>: <span class="sh-string">"Bearer YOUR_API_KEY"</span>,
    <span class="sh-string">"Content-Type"</span>: <span class="sh-string">"application/json"</span>
  },
  <span class="sh-param">body</span>: <span class="sh-function">JSON.stringify</span>(${jsonBody})
});

<span class="sh-keyword">const</span> <span class="sh-param">data</span> = <span class="sh-keyword">await</span> <span class="sh-param">response</span>.<span class="sh-function">json</span>();`;
  }

  if (lang === "python") {
    return `<span class="sh-keyword">import</span> requests

<span class="sh-param">url</span> = <span class="sh-string">"${fullUrl}"</span>
<span class="sh-param">headers</span> = {
    <span class="sh-string">"Authorization"</span>: <span class="sh-string">"Bearer YOUR_API_KEY"</span>,
    <span class="sh-string">"Content-Type"</span>: <span class="sh-string">"application/json"</span>
}
<span class="sh-param">data</span> = ${JSON.stringify(body, null, 4).replace(/true/g, "True").replace(/false/g, "False")}

<span class="sh-param">response</span> = requests.<span class="sh-function">post</span>(<span class="sh-param">url</span>, <span class="sh-param">headers</span>=headers, <span class="sh-param">json</span>=<span class="sh-param">data</span>)
<span class="sh-param">print</span>(<span class="sh-param">response</span>.<span class="sh-function">json</span>())`;
  }
  return "";
}

function updatePlaygroundSnippets() {
  // Calculate endpoint
  const calcBody = {
    base_price: Number(document.getElementById("c-basePrice")?.value || 0),
    country: document.getElementById("c-country")?.value || "US",
    currency: document.getElementById("c-currency")?.value || "USD",
    min_margin: Number(document.getElementById("c-margin")?.value || 0)
  };
  if (calcSnippetEl) {
    calcSnippetEl.innerHTML = getSnippet(currentCalcLang, "POST", "/calculate-price", calcBody);
    if (calcLangTag) calcLangTag.textContent = currentCalcLang;
  }

  // Optimize endpoint
  const optBody = {
    base_price: Number(document.getElementById("o-basePrice")?.value || 0),
    country: document.getElementById("o-country")?.value || "US",
    currency: "USD",
    source: document.getElementById("o-source")?.value || "direct"
  };
  if (optSnippetEl) {
    optSnippetEl.innerHTML = getSnippet(currentOptLang, "POST", "/optimize-price", optBody);
    if (optLangTag) optLangTag.textContent = currentOptLang;
  }
}

function setupPlayground() {
  const inputs = document.querySelectorAll(".params-card input, .params-card select");
  inputs.forEach(input => {
    input.addEventListener("input", updatePlaygroundSnippets);
  });

  document.querySelectorAll("#calc-code-tabs .code-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#calc-code-tabs .code-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentCalcLang = tab.dataset.lang;
      updatePlaygroundSnippets();
    });
  });

  document.querySelectorAll("#opt-code-tabs .code-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#opt-code-tabs .code-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentOptLang = tab.dataset.lang;
      updatePlaygroundSnippets();
    });
  });

  const copyCalc = document.getElementById("copy-calc-snippet");
  if (copyCalc) {
    copyCalc.addEventListener("click", () => {
      const text = calcSnippetEl.textContent;
      navigator.clipboard.writeText(text);
      const icon = copyCalc.querySelector("i");
      icon.setAttribute("data-lucide", "check");
      refreshIcons();
      setTimeout(() => {
        icon.setAttribute("data-lucide", "copy");
        refreshIcons();
      }, 2000);
    });
  }

  const copyOpt = document.getElementById("copy-opt-snippet");
  if (copyOpt) {
    copyOpt.addEventListener("click", () => {
      const text = optSnippetEl.textContent;
      navigator.clipboard.writeText(text);
      const icon = copyOpt.querySelector("i");
      icon.setAttribute("data-lucide", "check");
      refreshIcons();
      setTimeout(() => {
        icon.setAttribute("data-lucide", "copy");
        refreshIcons();
      }, 2000);
    });
  }

  updatePlaygroundSnippets();
}


async function callApiNoAuth(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, opts);
    const data = await res.json().catch(() => ({ error: "Invalid server response" }));
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { error: err.message } };
  }
}


function highlightJson(json) {
  return JSON.stringify(json, null, 2)
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g, ': <span class="json-str">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-num">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>');
}

function setStatus(el, ok, code) {
  if (!el) return;
  el.className = `status-chip ${ok ? "status-ok" : "status-err"}`;
  el.textContent = `${code}${ok ? " OK" : " ERROR"}`;
}

const calcBtn = document.getElementById("calcBtn");
if (calcBtn) {
  calcBtn.addEventListener("click", async () => {
    const payload = {
      base_price: Number(document.getElementById("c-basePrice").value),
      country: document.getElementById("c-country").value,
      currency: document.getElementById("c-currency").value,
      min_margin: Number(document.getElementById("c-margin").value)
    };

    const response = await callApi("POST", "/calculate-price", payload);
    const jsonEl = document.getElementById("calcJson");
    if (jsonEl) jsonEl.innerHTML = highlightJson(response.data);

    const statusWrap = document.getElementById("calc-status-indicator");
    const statusText = document.getElementById("calc-status");
    if (statusWrap && statusText) {
      statusWrap.className = `status-indicator ${response.ok ? "status-success" : "status-error"}`;
      statusText.textContent = `${response.status} ${response.ok ? "OK" : "ERROR"}`;
    }

    const resultsWrap = document.getElementById("calc-results-wrap");

    if (resultsWrap) resultsWrap.classList.remove("hidden");

    if (response.ok && response.data.tax_amount !== undefined) {
      document.getElementById("rc-tax").textContent = `$${Number(response.data.tax_amount).toFixed(2)}`;
      document.getElementById("rc-taxed").textContent = `$${Number(response.data.original_final_price).toFixed(2)}`;
      document.getElementById("rc-optimized").textContent = `$${Number(response.data.optimized_final_price).toFixed(2)}`;
    }
  });
}

const optimizeBtn = document.getElementById("optimizeBtn");
if (optimizeBtn) {
  optimizeBtn.addEventListener("click", async () => {
    const payload = {
      base_price: Number(document.getElementById("o-basePrice").value),
      country: document.getElementById("o-country").value,
      currency: "USD",
      source: document.getElementById("o-source").value
    };

    const response = await callApi("POST", "/optimize-price", payload);
    const jsonEl = document.getElementById("optimizeJson");
    const placeholder = document.getElementById("optimizeJsonPlaceholder");
    if (jsonEl) jsonEl.innerHTML = highlightJson(response.data);
    if (placeholder) placeholder.classList.add("hidden");
    document.getElementById("opt-results-wrap")?.classList.remove("hidden");
  });
}

const ratesBtn = document.getElementById("ratesBtn");
if (ratesBtn) {
  ratesBtn.addEventListener("click", async () => {
    const response = await callApi("GET", "/tax-rates");
    const jsonEl = document.getElementById("ratesJson");
    if (jsonEl) jsonEl.innerHTML = highlightJson(response.data);
    setStatus(document.getElementById("rates-status"), response.ok, response.status);
    document.getElementById("rates-results-wrap")?.classList.remove("hidden");

    if (response.ok && response.data.tax_rates) {
      const tbody = document.getElementById("ratesBody");
      if (tbody) {
        tbody.innerHTML = "";
        response.data.tax_rates.forEach((row) => {
          const tr = document.createElement("tr");
          const dateValue = row.updated_at ? new Date(row.updated_at) : new Date();
          tr.innerHTML = `
            <td><strong>${row.country_name || row.country || "Unknown"}</strong> <span style="color: var(--text-muted);">(${row.country_code || row.country})</span></td>
            <td style="color: var(--green); font-weight: 700;">${row.tax_percentage}%</td>
            <td style="color: var(--text-muted);">${dateValue.toLocaleDateString()}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
  });
}

function updateChart(data) {
  const chartEl = document.getElementById("analyticsChart");
  if (!chartEl) return;
  const ctx = chartEl.getContext("2d");

  if (analyticsChart) {
    analyticsChart.destroy();
  }

  analyticsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((point) => point.label),
      datasets: [
        {
          label: "API Requests",
          data: data.map((point) => point.requests),
          borderColor: "#6c63ff",
          backgroundColor: "rgba(108, 99, 255, 0.14)",
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: "#6c63ff"
        }
      ]
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
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#97a4c2", font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#97a4c2", font: { size: 10 } }
        }
      }
    }
  });
}

async function fetchAnalytics() {
  const response = await callApi("GET", "/analytics");
  if (!response.ok) {
    console.warn("Analytics unavailable:", response.data.error);
    return;
  }

  const { summary, recent_activity, time_series } = response.data;

  if (summary) {
    const requestsEl = document.getElementById("stat-requests");
    const conversionEl = document.getElementById("stat-conv");
    const liftEl = document.getElementById("stat-lift");

    if (requestsEl) requestsEl.textContent = Number(summary.total_requests || 0).toLocaleString();
    if (conversionEl) conversionEl.textContent = summary.conversion_rate || "-";
    if (liftEl) liftEl.textContent = summary.revenue_lift || "-";
  }

  if (Array.isArray(time_series)) {
    updateChart(time_series);
  }

  const tbody = document.getElementById("analyticsBody");
  if (tbody) {
    tbody.innerHTML = "";

    if (!recent_activity || recent_activity.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No activity logged yet.</td></tr>';
    } else {
      recent_activity.forEach((log) => {
        const tr = document.createElement("tr");
        const date = new Date(log.created_at).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        tr.innerHTML = `
          <td style="color: var(--text-muted);">${date}</td>
          <td><strong>${log.country}</strong></td>
          <td>$${Number(log.base_price).toFixed(2)}</td>
          <td style="color: var(--accent); font-weight: 700;">$${Number(log.optimized_final_price).toFixed(2)}</td>
          <td><span class="badge ${log.converted ? "badge-success" : "badge-neutral"}">${log.converted ? "Converted" : "Pending"}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
}

const trackBtn = document.getElementById("trackBtn");
if (trackBtn) {
  trackBtn.addEventListener("click", async () => {
    const payload = {
      price_shown: Number(document.getElementById("t-price").value),
      converted: document.getElementById("t-converted").value === "true",
      country: document.getElementById("t-country").value,
      source: "dashboard-test"
    };

    const response = await callApi("POST", "/track-conversion", payload);
    const jsonEl = document.getElementById("trackJson");
    if (jsonEl) {
      jsonEl.innerHTML = highlightJson(response.data);
      jsonEl.classList.remove("hidden");
    }
    setStatus(document.getElementById("track-status"), response.ok, response.status);
    fetchAnalytics();
  });
}

const signupBtn = document.getElementById("signup-btn");
const finishSignup = document.getElementById("finish-signup");
const copyApiKeyBtn = document.getElementById("copy-api-key");

if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const email = document.getElementById("signup-email").value.trim();
    if (!email) {
      alert("Email is required");
      return;
    }

    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i data-lucide="loader" class="spin"></i><span>Generating Credentials...</span>';
    refreshIcons();

    const response = await callApiNoAuth("POST", "/auth/signup", { email });

    signupBtn.disabled = false;
    signupBtn.innerHTML = '<i data-lucide="zap"></i><span>Generate New API Key</span>';
    refreshIcons();

    if (!response.ok) {
      alert(response.data.error || "Signup failed");
      return;
    }

    document.getElementById("signup-form-body")?.classList.add("hidden");
    document.getElementById("signup-result-body")?.classList.remove("hidden");
    document.getElementById("new-api-key").textContent = response.data.api_key;

    if (apiDesktop) apiDesktop.value = response.data.api_key;
    if (apiMobile) apiMobile.value = response.data.api_key;
    refreshIcons();
  });
}

if (finishSignup) {
  finishSignup.addEventListener("click", () => {
    document.getElementById("signup-result-body")?.classList.add("hidden");
    document.getElementById("signup-form-body")?.classList.remove("hidden");
    document.getElementById("signup-email").value = "";
  });
}

if (copyApiKeyBtn) {
  copyApiKeyBtn.addEventListener("click", async () => {
    const value = document.getElementById("new-api-key")?.textContent || "";
    if (!value) return;
    await navigator.clipboard.writeText(value);
  });
}

function initializePanelFromHash() {
  const hash = window.location.hash.replace("#", "");
  const targetMap = {
    pricing: "panel-pricing",
    analytics: "panel-analytics-hub",
    tax: "panel-market",
    settings: "panel-settings"
  };
  const targetId = targetMap[hash];
  if (!targetId) return;

  const navItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
  if (navItem) {
    setActivePanel(targetId, navItem);
  }
}

window.addEventListener("hashchange", initializePanelFromHash);

setEndpointTab("calculate");
setupPlayground();
initializePanelFromHash();
refreshIcons();
