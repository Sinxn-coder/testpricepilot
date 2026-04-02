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
const calcLangTag = document.getElementById("calc-lang-tag");

let currentCalcLang = "curl";



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
  // Tabs removed from UI, but keeping function for potential future use or simple no-op
}


function syncAndToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggleWrapper = document.getElementById(toggleId);
  if (!input || !toggleWrapper) return;

  toggleWrapper.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    
    // Replace the icon inside the wrapper
    toggleWrapper.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" style="width: 14px; color: var(--text-muted);"></i>`;
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

// syncAndToggle moved to bottom to ensure icons are stable


if (apiDesktop && apiMobile) {
  let apiDebounce;
  const onKeyInput = () => {

    apiMobile.value = apiDesktop.value;
    clearTimeout(apiDebounce);
    apiDebounce = setTimeout(() => {
      if (document.getElementById("panel-analytics-hub") && !document.getElementById("panel-analytics-hub").classList.contains("hidden")) {
        fetchAnalytics();
      }
    }, 800);
  };

  apiDesktop.addEventListener("input", onKeyInput);
  apiMobile.addEventListener("input", () => {
    apiDesktop.value = apiMobile.value;
    onKeyInput();
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

/* Legacy optimizeBtn handler removed */


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
  const shell = document.querySelector(".chart-shell");
  if (shell) {
    // Ensure canvas exists (it might have been removed by loading/error overlays)
    if (!document.getElementById("analyticsChart")) {
      shell.innerHTML = '<canvas id="analyticsChart"></canvas>';
    }
  }

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

function showChartError(msg) {
  const shell = document.querySelector(".chart-shell");
  if (!shell) return;
  shell.innerHTML = `
    <div class="chart-error-overlay">
      <i data-lucide="alert-circle"></i>
      <span>${msg}</span>
    </div>
  `;
  refreshIcons();
}

function showChartLoading() {
  const shell = document.querySelector(".chart-shell");
  if (!shell) return;
  shell.innerHTML = `
    <div class="chart-loader-overlay">
      <div class="dash-loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
      </div>
    </div>
  `;
}

async function fetchAnalytics(days = 7) {
  const chartWrapper = document.querySelector(".chart-shell");
  const tableWrapper = document.getElementById("analyticsBody");
  
  // Show loading state
  showChartLoading();
  if (tableWrapper) tableWrapper.innerHTML = '<tr><td colspan="5" class="loading-shimmer loading-shimmer-table"></td></tr>';

  const response = await callApi("GET", `/analytics?days=${days}`);
  
  if (!response.ok) {
    const errorMsg = response.data.error || 'Server error';
    showChartError(`Failed to load trends: ${errorMsg}`);
    if (tableWrapper) tableWrapper.innerHTML = `<tr><td colspan="5" class="empty-row">Error fetching activity: ${errorMsg}</td></tr>`;
    return;
  }

  // Clear loading state for chart (will be replaced by canvas in updateChart)
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


/* Legacy track conversion code removed as requested */


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

    const errorAlert = document.getElementById("signup-error-alert");
    const errorText = document.getElementById("signup-error-text");

    if (errorAlert) errorAlert.classList.add("hidden");

    const response = await callApiNoAuth("POST", "/auth/signup", { email });

    signupBtn.disabled = false;
    signupBtn.innerHTML = '<i data-lucide="zap"></i><span>Generate New API Key</span>';
    refreshIcons();

    if (!response.ok) {
      if (errorAlert && errorText) {
        errorText.textContent = response.data.error || "Signup failed";
        errorAlert.classList.remove("hidden");
      } else {
        alert(response.data.error || "Signup failed");
      }
      return;
    }

    document.getElementById("signup-form-body")?.classList.add("hidden");
    document.getElementById("signup-result-body")?.classList.remove("hidden");
    
    const keyDisplay = document.getElementById("new-api-key");
    if (keyDisplay) {
      keyDisplay.textContent = response.data.api_key;
      keyDisplay.style.color = "#fff"; // Ensure visibility
    }

    if (apiDesktop) {
      apiDesktop.value = response.data.api_key;
      apiDesktop.type = "text"; // Show the key immediately in header too
    }
    if (apiMobile) {
      apiMobile.value = response.data.api_key;
      apiMobile.type = "text";
    }
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

// --- Plan Management & Upsells ---
function showUpgradeModal() {
  const modal = document.getElementById("upgrade-modal");
  if (modal) modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent scroll
}

function closeUpgradeModal() {
  const modal = document.getElementById("upgrade-modal");
  if (modal) modal.classList.remove("active");
  document.body.style.overflow = ""; // Restore scroll
}

function checkUserPlan() {
  const plan = localStorage.getItem("userPlan") || "Free";
  const displayPlanEl = document.getElementById("display-plan");
  const upgradeBtn = document.getElementById("sidebar-upgrade-btn");
  const analyticsUpsell = document.getElementById("analytics-upsell");
  const resultHeader = document.getElementById("result-header");

  if (displayPlanEl) displayPlanEl.innerText = `${plan} plan`;

  // Handle Watermark for Free Plan
  if (plan === "Free" && resultHeader) {
    if (!document.getElementById("free-watermark-note")) {
      const note = document.createElement("div");
      note.id = "free-watermark-note";
      note.style.fontSize = "0.7rem";
      note.style.color = "var(--accent)";
      note.style.marginTop = "4px";
      note.innerText = "● Response includes PricePilot Watermark";
      resultHeader.parentNode.appendChild(note);
    }
  }

  // Set up Upgrade Button logic
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", (e) => {
      if (plan === "Free") {
        e.preventDefault();
        showUpgradeModal();
      }
    });

    // If on Free plan, show upsells
    if (plan === "Free") {
      upgradeBtn.classList.remove("hidden");
      if (analyticsUpsell) analyticsUpsell.classList.remove("hidden");
    } else {
      // Hide specialized upsells for paid plans
      upgradeBtn.classList.add("hidden");
      if (analyticsUpsell) analyticsUpsell.classList.add("hidden");
      
      // Update upgrade button for lower paid plans (Starter/Growth)
      if (plan !== "Pro") {
        upgradeBtn.classList.remove("hidden");
        upgradeBtn.innerHTML = '<i data-lucide="zap"></i><span>Upgrade to Pro</span>';
        upgradeBtn.href = "plans.html"; // Direct to plans for paid tiers
        lucide.createIcons();
      }
    }
  }

  // Close modal via backdrop
  const modal = document.getElementById("upgrade-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUpgradeModal();
    });
    
    const closeBtn = document.getElementById("close-upgrade");
    if (closeBtn) closeBtn.onclick = closeUpgradeModal;
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  checkUserPlan();
  setEndpointTab("calculate");
  setupPlayground();
  initializePanelFromHash();
  refreshIcons();
});

window.addEventListener("hashchange", initializePanelFromHash);

// Trend range listeners
document.querySelectorAll("#trend-range .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#trend-range .tab-btn").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    const days = btn.dataset.days;
    fetchAnalytics(days);
  });
});

// --- Final Auth Helpers ---
const resetBtn = document.getElementById("reset-key-btn");
if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    const email = document.getElementById("signup-email").value.trim();
    if (!email) {
      alert("Email is required for reset");
      return;
    }

    resetBtn.disabled = true;
    const oldText = resetBtn.textContent;
    resetBtn.textContent = "Resetting...";

    const response = await callApiNoAuth("POST", "/auth/reset-key", { email });

    resetBtn.disabled = false;
    resetBtn.textContent = oldText;

    if (!response.ok) {
      alert(response.data.error || "Reset failed");
      return;
    }

    // Reuse the success display
    document.getElementById("signup-error-alert")?.classList.add("hidden");
    document.getElementById("signup-form-body")?.classList.add("hidden");
    const resultBody = document.getElementById("signup-result-body");
    if (resultBody) {
      resultBody.classList.remove("hidden");
      // Scroll to result
      resultBody.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Update labels for reset context
    const banner = document.querySelector(".success-banner-modern strong");
    if (banner) banner.textContent = "Key Rotated Successfully";
    
    const keyDisplay = document.getElementById("new-api-key");
    if (keyDisplay) {
      keyDisplay.textContent = response.data.api_key;
      keyDisplay.style.color = "#fff"; 
    }

    // Sync to global inputs
    if (apiDesktop) {
      apiDesktop.value = response.data.api_key;
      apiDesktop.type = "text";
    }
    if (apiMobile) {
      apiMobile.value = response.data.api_key;
      apiMobile.type = "text";
    }
    refreshIcons();
  });
}

// Final Stable Toggle Initialization
syncAndToggle("apiKey", "toggleKey");
syncAndToggle("api-key-mobile", "toggle-key-mobile");
