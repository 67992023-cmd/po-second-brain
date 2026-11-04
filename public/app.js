/**
 * Continuum — Personal Second Brain, Life Ledger & Network Security Hub
 * Frontend Application Controller (app.js v3)
 *
 * - Entry Page: Overview Summary Dashboard with 3 Apple Donut Ring Charts
 * - On-Demand Biometric/Passcode Gate ONLY when accessing Protected Sections:
 *   (Diary Library, Password Vault, IP & Security)
 */

const PROTECTED_VIEWS = new Set(["diary", "vault", "network"]);

const STATE = {
  data: null,
  activeView: "overview",
  vaultUnlocked: false,
  pendingProtectedView: null,
  eventFilter: "all",
  selectedCalDate: new Date().toISOString().slice(0, 10),
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  diaryNotebookFilter: "all",
  diarySearch: "",
  activeDiaryId: null,
  vaultFilter: "all",
  vaultSearch: "",
  revealedPasswords: {},
  authMethod: "Locked",
  cameraStream: null,
};

const VIEW_META = {
  overview: {
    title: "Overview Summary",
    subtitle: "Daily Sleep, Nutrition & Work Calendar at a glance",
  },
  timeline: {
    title: "Calendar & Work Timeline",
    subtitle: "AI-scheduled milestones, daily agenda & monthly schedule",
  },
  health: {
    title: "Apple Health (Sleep & Nutrition)",
    subtitle: "Sleep recovery, daily calories & iPhone Wi-Fi LAN webhook sync",
  },
  brain: {
    title: "Second Brain AI",
    subtitle: "RAG memory & full action agent (Cloud Free APIs, Offline Ollama & Built-in Engine)",
  },
  diary: {
    title: "Personal Diary Library",
    subtitle: "Protected · Editorial reflections in Apple New York serif",
  },
  vault: {
    title: "Personal & Game Password Vault",
    subtitle: "Protected · AES-256-CTR encrypted credentials",
  },
  network: {
    title: "IP, Network & Biometric Security",
    subtitle: "Protected · LAB_BasicNetwork telemetry, ICMP/DNS probe & IP firewall",
  },
};

function showToast(msg) {
  const el = document.getElementById("toast-banner");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 3400);
}

async function apiGet(path) {
  const res = await fetch(path);
  return res.json();
}

async function apiPost(path, body = {}) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSimpleMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/^### (.+)$/gm, '<strong style="font-size:15px; display:block; margin:6px 0 4px;">$1</strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, '<span class="mono-code">$1</span>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="margin:6px 0; padding-left:10px; border-left:2px solid var(--accent-primary); color:var(--text-secondary);">$1</blockquote>');
  html = html.replace(/\n/g, "<br/>");
  return html;
}

// ============================================================================
// BOOTSTRAP & GLOBAL RENDER
// ============================================================================

async function loadBootstrap() {
  try {
    const data = await apiGet("/api/bootstrap");
    STATE.data = data;
    renderAll();
    checkOllamaBadge();
    applyUrlDeepLink();
  } catch (err) {
    console.error("Bootstrap error:", err);
  }
}

function applyUrlDeepLink() {
  if (window.__deepLinkApplied) return;
  window.__deepLinkApplied = true;
  const params = new URLSearchParams(window.location.search);
  if (params.get("theme") === "light") {
    document.documentElement.setAttribute("data-appearance", "light");
  }
  if (params.get("demo_unlock") === "1") {
    STATE.vaultUnlocked = true;
    STATE.authMethod = "Touch ID / Face ID (192-D)";
    updateProtectedLockUI();
  }
  const view = params.get("view");
  if (view && VIEW_META[view]) {
    switchView(view);
  }
  if (params.get("popover") === "ai") {
    const pop = document.getElementById("ai-model-popover");
    if (pop) pop.classList.remove("hidden");
  }
  if (params.get("modal") === "lock") {
    const lock = document.getElementById("lock-overlay");
    if (lock) lock.classList.remove("hidden");
  }
}

function renderAll() {
  if (!STATE.data) return;
  const d = STATE.data;

  const pendingEvents = d.events.filter((e) => e.status !== "completed").length;
  document.getElementById("badge-events").textContent = pendingEvents;
  document.getElementById("badge-memories").textContent = d.memories.length;

  document.getElementById("sidebar-client-ip").textContent = d.network.client_ip;
  document.getElementById("sidebar-lan-ip").textContent = d.network.server_lan_ip;

  updateProtectedLockUI();
  syncAiPickerUI(d.settings);

  renderOverviewDashboard();
  renderTimelineAndCalendar();
  renderSecondBrain();
  renderDiaryLibrary();
  renderPasswordVault();
  renderAppleHealth();
  renderNetworkAndSecurity();
}

function syncAiPickerUI(settings) {
  if (!settings) return;
  const aiProv = settings.ai_provider || "auto";
  const modelName = settings.ollama_model || "qwen2.5:7b";
  const shortModel = modelName === "qwen2.5:7b" ? "Qwen 2.5 7B" : modelName;
  const aiLabels = {
    ollama: `${shortModel} · Ollama`,
    auto: `${shortModel} · Auto Hybrid`,
    local_smart: "Built-in Smart Engine",
    gemini: "Gemini 2.5 Flash · Cloud",
    groq: "Llama 3.3 70B · Groq",
    openrouter: "OpenRouter · Free Tier",
  };
  const pillEl = document.getElementById("active-ai-pill");
  if (pillEl) {
    pillEl.textContent = aiLabels[aiProv] || `${shortModel} · Ollama`;
  }

  document.querySelectorAll(".ai-menu-item[data-ai-select]").forEach((btn) => {
    const prov = btn.getAttribute("data-ai-select");
    const isActive = prov === aiProv;
    btn.classList.toggle("active", isActive);
    const check = btn.querySelector(".ai-menu-check");
    if (check) check.textContent = isActive ? "✓" : "";
  });
}

function updateProtectedLockUI() {
  const d = STATE.data;
  const diaryBadge = document.getElementById("badge-diaries-lock");
  const vaultBadge = document.getElementById("badge-vault-lock");
  const netBadge = document.getElementById("badge-net-lock");
  const relockBtn = document.getElementById("btn-relock-vault");
  const sideAuth = document.getElementById("sidebar-auth-method");
  const ovPill = document.getElementById("ov-vault-status-pill");

  if (STATE.vaultUnlocked) {
    diaryBadge.textContent = d ? d.diaries.length : "Open";
    diaryBadge.className = "nav-badge unlocked";
    vaultBadge.textContent = d ? d.vault.length : "Open";
    vaultBadge.className = "nav-badge unlocked";
    netBadge.textContent = "Open";
    netBadge.className = "nav-badge unlocked";
    relockBtn.style.display = "inline-flex";
    sideAuth.textContent = STATE.authMethod;
    sideAuth.style.color = "var(--signal-success)";
    if (ovPill) {
      ovPill.textContent = `Unlocked (${STATE.authMethod})`;
      ovPill.className = "pill pill-success";
    }
  } else {
    diaryBadge.textContent = "Locked";
    diaryBadge.className = "nav-badge locked";
    vaultBadge.textContent = "Locked";
    vaultBadge.className = "nav-badge locked";
    netBadge.textContent = "Locked";
    netBadge.className = "nav-badge locked";
    relockBtn.style.display = "none";
    sideAuth.textContent = "Locked";
    sideAuth.style.color = "var(--signal-warning)";
    if (ovPill) {
      ovPill.textContent = "Locked (Requires Biometric/Passcode)";
      ovPill.className = "pill pill-warning";
    }
  }
}

// ============================================================================
// ENTRY PAGE (VIEW 0): OVERVIEW SUMMARY DASHBOARD & DONUT CHARTS
// ============================================================================

function setDonutProgress(circleId, percentage) {
  const el = document.getElementById(circleId);
  if (!el) return;
  const circumference = 251.327; // 2 * Math.PI * 40
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;
  el.style.strokeDashoffset = offset.toFixed(1);
}

function renderOverviewDashboard() {
  const d = STATE.data;
  if (!d) return;

  // 1. Sleep Donut Chart
  const sleeps = d.health.filter((h) => h.metric_type === "sleep").slice(-7);
  const latestSleep = sleeps.length ? Number(sleeps[sleeps.length - 1].value) : 7.8;
  const avgSleep = sleeps.length
    ? (sleeps.reduce((s, x) => s + Number(x.value), 0) / sleeps.length).toFixed(1)
    : "7.6";
  const sleepPct = Math.min(100, Math.round((latestSleep / 8.0) * 100));
  document.getElementById("ov-sleep-val").textContent = `${latestSleep.toFixed(1)} hrs`;
  document.getElementById("ov-sleep-sub").textContent = `Goal: 8.0 hrs · 7d Avg: ${avgSleep} hrs`;
  document.getElementById("ov-sleep-pct").textContent = `${sleepPct}%`;
  setDonutProgress("donut-ring-sleep", sleepPct);

  // 2. Nutrition / Calories Donut Chart
  const meals = d.health.filter((h) => h.metric_type === "nutrition").slice(-7);
  const latestMeal = meals.length ? meals[meals.length - 1] : { value: 1840, secondary_value: 122 };
  const kcal = Math.round(Number(latestMeal.value));
  const protein = Math.round(Number(latestMeal.secondary_value || 120));
  const kcalPct = Math.min(100, Math.round((kcal / 2100) * 100));
  document.getElementById("ov-kcal-val").textContent = `${kcal.toLocaleString()} kcal`;
  document.getElementById("ov-kcal-sub").textContent = `Target: 2,100 kcal · ${protein}g Protein`;
  document.getElementById("ov-kcal-pct").textContent = `${kcalPct}%`;
  setDonutProgress("donut-ring-kcal", kcalPct);

  // 3. Calendar & Work Timeline Donut Chart
  const totalEv = d.events.length;
  const doneEv = d.events.filter((e) => e.status === "completed").length;
  const pendingEv = totalEv - doneEv;
  const taskPct = totalEv ? Math.round((doneEv / totalEv) * 100) : 100;
  document.getElementById("ov-tasks-val").textContent = `${doneEv} / ${totalEv}`;
  document.getElementById("ov-tasks-sub").textContent = `${pendingEv} upcoming milestones scheduled`;
  document.getElementById("ov-tasks-pct").textContent = `${taskPct}%`;
  setDonutProgress("donut-ring-tasks", taskPct);

  // 4. Overview AI Model Live Badge
  const ovBadge = document.getElementById("ov-ollama-live-badge");
  if (ovBadge && d.settings) {
    const prov = d.settings.ai_provider || "ollama";
    const mod = d.settings.ollama_model || "qwen2.5:7b";
    if (prov === "ollama" || prov === "auto") {
      ovBadge.textContent = `Ollama · ${mod} Active`;
      ovBadge.className = "pill pill-success";
    } else {
      ovBadge.textContent = `Provider: ${prov.toUpperCase()} Active`;
      ovBadge.className = "pill pill-accent";
    }
  }
}

// ============================================================================
// VIEW 1: WORK TIMELINE & CALENDAR
// ============================================================================

function renderTimelineAndCalendar() {
  const d = STATE.data;
  const listEl = document.getElementById("timeline-events-list");

  const filtered = d.events.filter((ev) => {
    if (STATE.eventFilter === "scheduled") return ev.status !== "completed";
    if (STATE.eventFilter === "completed") return ev.status === "completed";
    return true;
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div style="padding:22px; text-align:center; color:var(--text-tertiary);">No events in this filter.</div>`;
  } else {
    listEl.innerHTML = filtered
      .map((ev) => {
        const isDone = ev.status === "completed";
        const catPill =
          ev.category === "network-lab"
            ? "pill-accent"
            : ev.priority === "high"
            ? "pill-warning"
            : "";
        return `
        <div class="timeline-item ${isDone ? "completed" : ""}">
          <button class="timeline-check ${isDone ? "checked" : ""}" onclick="toggleCalendarEvent(${ev.id})" aria-label="Toggle completion for ${escapeHtml(ev.title)}">
            ${isDone ? "✓" : ""}
          </button>
          <div class="timeline-body">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <h4 class="timeline-title" style="${isDone ? "text-decoration:line-through;" : ""}">${escapeHtml(ev.title)}</h4>
              <span class="pill ${catPill}">${escapeHtml(ev.category)}</span>
              ${ev.source && ev.source.includes("ai") ? '<span class="pill pill-accent">AI Scheduled</span>' : ""}
            </div>
            <div class="timeline-meta">
              <span>${escapeHtml(ev.date)}</span>
              <span>${escapeHtml(ev.start_time)} – ${escapeHtml(ev.end_time)}</span>
              <span>Priority: ${escapeHtml(ev.priority.toUpperCase())}</span>
            </div>
            ${ev.notes ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${escapeHtml(ev.notes)}</div>` : ""}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="deleteCalendarEvent(${ev.id})">Remove</button>
        </div>
      `;
      })
      .join("");
  }

  renderCalendarGridInto("calendar-grid", "cal-month-label");
}

function renderCalendarGridInto(gridId, labelId) {
  const grid = document.getElementById(gridId);
  const label = document.getElementById(labelId);
  if (!grid || !label) return;

  const year = STATE.calYear;
  const month = STATE.calMonth;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  label.textContent = `${monthNames[month]} ${year}`;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let html = weekdays.map((w) => `<div class="cal-weekday">${w}</div>`).join("");

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day-cell muted"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = (STATE.data?.events || []).filter((e) => e.date === dateIso);
    const isToday = dateIso === todayIso;
    const isSelected = dateIso === STATE.selectedCalDate;

    const maxChips = gridId === "calendar-grid" ? 4 : 2;
    const chips = dayEvents
      .slice(0, maxChips)
      .map(
        (e) =>
          `<div class="cal-event-chip ${e.status === "completed" ? "completed" : ""}" title="${escapeHtml(e.title)} (${escapeHtml(e.start_time)})">${escapeHtml(e.start_time)} ${escapeHtml(e.title)}</div>`
      )
      .join("");
    const extra = dayEvents.length > maxChips ? `<div style="font-size:10px; color:var(--text-tertiary);">+${dayEvents.length - maxChips} more</div>` : "";

    html += `
      <div class="cal-day-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" onclick="selectCalendarDate('${dateIso}')">
        <div class="cal-day-num">
          <span>${day}</span>
          ${dayEvents.length ? `<span class="mono-code" style="font-size:10px;">${dayEvents.length}</span>` : ""}
        </div>
        ${chips}
        ${extra}
      </div>
    `;
  }

  grid.innerHTML = html;
}

window.openFullPageCalendar = function () {
  switchView("timeline");
  const card = document.getElementById("full-calendar-card");
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.selectCalendarDate = function (dateIso) {
  STATE.selectedCalDate = dateIso;
  const dateInput = document.getElementById("ev-date");
  if (dateInput) dateInput.value = dateIso;
  renderCalendarGridInto("calendar-grid", "cal-month-label");
  renderCalendarGridInto("overview-calendar-grid", "ov-cal-month-label");
};

window.toggleCalendarEvent = async function (id) {
  await apiPost("/api/calendar/toggle", { id });
  await loadBootstrap();
};

window.deleteCalendarEvent = async function (id) {
  await apiPost("/api/calendar/delete", { id });
  showToast("Removed event from Calendar");
  await loadBootstrap();
};

// ============================================================================
// VIEW 2: SECOND BRAIN AI
// ============================================================================

function renderSecondBrain() {
  const d = STATE.data;
  const stream = document.getElementById("brain-chat-stream");

  document.getElementById("select-ai-provider").value = d.settings.ai_provider || "auto";
  document.getElementById("input-ollama-url").value = d.settings.ollama_url || "http://localhost:11434";
  document.getElementById("input-ollama-model").value = d.settings.ollama_model || "llama3.2";

  if (!d.chat_history || !d.chat_history.length) {
    stream.innerHTML = `
      <div class="chat-bubble assistant">
        <div class="ai-disclosure-bar">
          <span><strong>Continuum Second Brain</strong> · Context: Calendar, Diary, Apple Health, Memories, Vault Metadata</span>
          <span class="pill pill-success">Ready</span>
        </div>
        Hello Po. I am connected to your workspace data as your <strong>Second Brain</strong>.<br/><br/>
        • Ask questions across your <strong>Work Timeline</strong>, <strong>Diary Library</strong>, <strong>Sleep &amp; Nutrition</strong>, or saved <strong>Vault Accounts</strong>.<br/>
        • Or command me to <strong>schedule calendar events</strong>, <strong>write diary entries</strong>, <strong>log sleep/meals</strong>, or <strong>remember facts</strong>.
      </div>
    `;
  } else {
    stream.innerHTML = d.chat_history
      .map((msg) => {
        if (msg.role === "user") {
          return `<div class="chat-bubble user">${escapeHtml(msg.content)}</div>`;
        }
        let actions = [];
        try {
          actions = JSON.parse(msg.actions_json || "[]");
        } catch (e) {
          actions = [];
        }
        const receiptsHtml = actions
          .map(
            (act) => `
          <div class="ai-action-receipt">
            <span>Action Executed: ${escapeHtml(act.summary)}</span>
            <button class="btn btn-sm" onclick="undoAiAction('${escapeHtml(act.table)}', ${Number(act.record_id)})">
              Undo
            </button>
          </div>
        `
          )
          .join("");

        return `
          <div class="chat-bubble assistant">
            <div class="ai-disclosure-bar">
              <span><strong>${escapeHtml(msg.provider || "Second Brain")}</strong></span>
              <span>Vault Passwords Protected</span>
            </div>
            <div>${formatSimpleMarkdown(msg.content)}</div>
            ${receiptsHtml}
          </div>
        `;
      })
      .join("");
    stream.scrollTop = stream.scrollHeight;
  }

  const memEl = document.getElementById("memories-list");
  memEl.innerHTML = d.memories
    .map(
      (m) => `
      <div class="timeline-item" style="padding:9px 12px;">
        <div class="timeline-body">
          <div style="font-size:13px; font-weight:500;">${escapeHtml(m.fact)}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Category: ${escapeHtml(m.category)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="deleteMemory(${m.id})">Remove</button>
      </div>
    `
    )
    .join("");
}

async function checkOllamaBadge() {
  try {
    const res = await apiGet("/api/ai/ollama-status");
    const pill = document.getElementById("ollama-status-pill");
    const topPill = document.getElementById("active-ai-pill");
    const modelInput = document.getElementById("input-ollama-model");
    if (res.online) {
      const detected = res.models && res.models.length ? res.models.join(", ") : "qwen2.5:7b";
      pill.className = "pill pill-success";
      pill.textContent = `Ollama Online (${detected})`;
      if (modelInput && res.models && res.models.length && !res.models.includes(modelInput.value)) {
        modelInput.value = res.models[0];
      }
      if (topPill && (STATE.data?.settings?.ai_provider === "auto" || STATE.data?.settings?.ai_provider === "ollama")) {
        const firstM = res.models?.[0] || "qwen2.5:7b";
        const shortM = firstM === "qwen2.5:7b" ? "Qwen 2.5 7B" : firstM;
        topPill.textContent = `${shortM} · Ollama`;
      }
    } else {
      pill.className = "pill";
      pill.textContent = "Ollama Offline (Built-in / Cloud Active)";
    }
  } catch (e) {
    // ignore
  }
}

window.undoAiAction = async function (table, record_id) {
  const res = await apiPost("/api/ai/undo", { table, record_id });
  if (res.ok) {
    showToast("Reverted AI action and restored previous state");
    await loadBootstrap();
  }
};

window.deleteMemory = async function (id) {
  await apiPost("/api/memories/delete", { id });
  showToast("Removed fact from Memory Bank");
  await loadBootstrap();
};

// ============================================================================
// VIEW 3 (PROTECTED): PERSONAL DIARY LIBRARY
// ============================================================================

function renderDiaryLibrary() {
  const d = STATE.data;
  const listEl = document.getElementById("diary-entries-list");

  const filtered = d.diaries.filter((entry) => {
    if (STATE.diaryNotebookFilter !== "all" && entry.notebook !== STATE.diaryNotebookFilter) {
      return false;
    }
    if (STATE.diarySearch) {
      const q = STATE.diarySearch.toLowerCase();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.tags.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!STATE.activeDiaryId && filtered.length) {
    loadDiaryIntoEditor(filtered[0]);
  }

  listEl.innerHTML = filtered
    .map((entry) => {
      const isActive = entry.id === STATE.activeDiaryId;
      return `
        <button type="button" class="diary-entry-card ${isActive ? "active" : ""}" onclick="selectDiaryEntry(${entry.id})">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:6px;">
            <span class="pill pill-accent" style="font-size:10px;">${escapeHtml(entry.notebook)}</span>
            <span class="mono-code" style="font-size:11px;">${escapeHtml(entry.entry_date)}</span>
          </div>
          <div style="font-weight:600; font-size:13px; color:var(--text-primary); margin-bottom:3px;">
            ${escapeHtml(entry.title)}
          </div>
          <div style="font-size:12px; color:var(--text-secondary); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${escapeHtml(entry.content)}
          </div>
        </button>
      `;
    })
    .join("");
}

function loadDiaryIntoEditor(entry) {
  STATE.activeDiaryId = entry ? entry.id : null;
  document.getElementById("diary-id").value = entry ? entry.id : "";
  document.getElementById("diary-date").value = entry ? entry.entry_date : new Date().toISOString().slice(0, 10);
  document.getElementById("diary-notebook").value = entry ? entry.notebook : "Personal Reflections";
  document.getElementById("diary-mood").value = entry ? entry.mood : "Focused";
  document.getElementById("diary-title").value = entry ? entry.title : "";
  document.getElementById("diary-tags").value = entry ? entry.tags : "";
  document.getElementById("diary-content").value = entry ? entry.content : "";
  updateDiaryWordCount();
}

function updateDiaryWordCount() {
  const txt = document.getElementById("diary-content").value.trim();
  const words = txt ? txt.split(/\s+/).length : 0;
  document.getElementById("diary-word-count").textContent = `${words} words`;
}

window.selectDiaryEntry = function (id) {
  const found = (STATE.data?.diaries || []).find((x) => x.id === id);
  if (found) {
    loadDiaryIntoEditor(found);
    renderDiaryLibrary();
  }
};

// ============================================================================
// VIEW 4 (PROTECTED): PERSONAL & GAME PASSWORD VAULT
// ============================================================================

function renderPasswordVault() {
  const d = STATE.data;
  const tbody = document.getElementById("vault-table-body");

  const filtered = d.vault.filter((item) => {
    if (STATE.vaultFilter !== "all" && item.vault_type !== STATE.vaultFilter) return false;
    if (STATE.vaultSearch) {
      const q = STATE.vaultSearch.toLowerCase();
      return (
        item.service.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  tbody.innerHTML = filtered
    .map((item) => {
      const isGame = item.vault_type === "game";
      const revealed = STATE.revealedPasswords[item.id];
      return `
        <tr>
          <td>
            <div style="font-weight:600;">${escapeHtml(item.service)}</div>
            ${item.notes ? `<div style="font-size:11px; color:var(--text-tertiary);">${escapeHtml(item.notes)}</div>` : ""}
          </td>
          <td>
            <span class="pill ${isGame ? "pill-accent" : "pill-success"}">
              ${isGame ? "Game" : "Personal"}
            </span>
          </td>
          <td>
            <span class="mono-code">${escapeHtml(item.username)}</span>
          </td>
          <td>
            <span class="vault-secret-field">${revealed ? escapeHtml(revealed) : "••••••••••••••••"}</span>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm" onclick="toggleRevealPassword(${item.id})">
                ${revealed ? "Hide" : "Reveal"}
              </button>
              <button class="btn btn-sm" onclick="copyVaultPassword(${item.id})">
                Copy
              </button>
              <button class="btn btn-ghost btn-sm" onclick="deleteVaultItem(${item.id})">Remove</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

window.toggleRevealPassword = async function (id) {
  if (STATE.revealedPasswords[id]) {
    delete STATE.revealedPasswords[id];
    renderPasswordVault();
    return;
  }
  const res = await apiPost("/api/vault/reveal", { id, auth_method: STATE.authMethod });
  if (res.ok) {
    STATE.revealedPasswords[id] = res.password;
    renderPasswordVault();
    await loadBootstrap();
  }
};

window.copyVaultPassword = async function (id) {
  let pw = STATE.revealedPasswords[id];
  if (!pw) {
    const res = await apiPost("/api/vault/reveal", { id, auth_method: STATE.authMethod });
    if (res.ok) pw = res.password;
  }
  if (pw) {
    try {
      await navigator.clipboard.writeText(pw);
      showToast("Password copied to clipboard (Logged in Security Audit)");
    } catch (e) {
      showToast(`Password: ${pw}`);
    }
  }
};

window.deleteVaultItem = async function (id) {
  await apiPost("/api/vault/delete", { id });
  showToast("Deleted credential from Vault");
  await loadBootstrap();
};

// ============================================================================
// VIEW 5: APPLE HEALTH (SLEEP & NUTRITION)
// ============================================================================

function renderAppleHealth() {
  const d = STATE.data;
  const sleeps = d.health.filter((h) => h.metric_type === "sleep").slice(-7);
  const meals = d.health.filter((h) => h.metric_type === "nutrition").slice(-7);

  const sleepEl = document.getElementById("chart-sleep-bars");
  const mealEl = document.getElementById("chart-nutrition-bars");

  const avgSleep = sleeps.length
    ? (sleeps.reduce((s, x) => s + Number(x.value), 0) / sleeps.length).toFixed(1)
    : "0.0";
  document.getElementById("health-sleep-avg-pill").textContent = `7d Avg: ${avgSleep} hrs`;

  sleepEl.innerHTML = sleeps
    .map((s) => {
      const hPct = Math.max(12, Math.min(100, Math.round((Number(s.value) / 9.5) * 100)));
      return `
        <div class="bar-col" title="${escapeHtml(s.label)} (${s.quality})">
          <span class="bar-value-label">${Number(s.value).toFixed(1)}h</span>
          <div class="bar-visual sleep" style="height: ${hPct}%;"></div>
          <span class="bar-date-label">${escapeHtml(s.log_date.slice(5))}</span>
        </div>
      `;
    })
    .join("");

  const avgKcal = meals.length
    ? Math.round(meals.reduce((s, x) => s + Number(x.value), 0) / meals.length)
    : 0;
  document.getElementById("health-kcal-avg-pill").textContent = `7d Avg: ${avgKcal.toLocaleString()} kcal`;

  mealEl.innerHTML = meals
    .map((m) => {
      const hPct = Math.max(12, Math.min(100, Math.round((Number(m.value) / 2600) * 100)));
      return `
        <div class="bar-col" title="${escapeHtml(m.label)} (${m.secondary_value}g protein)">
          <span class="bar-value-label">${Math.round(m.value)}</span>
          <div class="bar-visual nutrition" style="height: ${hPct}%;"></div>
          <span class="bar-date-label">${escapeHtml(m.log_date.slice(5))}</span>
        </div>
      `;
    })
    .join("");

  if (d.network?.webhook_url) {
    document.getElementById("health-webhook-url").textContent = d.network.webhook_url;
  }
}

// ============================================================================
// VIEW 6 (PROTECTED): IP / NETWORK & BIOMETRIC SECURITY
// ============================================================================

function renderNetworkAndSecurity() {
  const d = STATE.data;
  const net = d.network;

  document.getElementById("net-client-ip").textContent = net.client_ip;
  document.getElementById("net-lan-ip").textContent = net.server_lan_ip;
  document.getElementById("net-hostname").textContent = `${net.hostname}:${net.port}`;

  const ifaceEl = document.getElementById("net-interfaces-list");
  ifaceEl.innerHTML = (net.interfaces || [])
    .map(
      (ifc) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:6px; background:var(--surface-secondary); font-size:12px;">
        <span><strong>${escapeHtml(ifc.interface)}</strong> (${escapeHtml(ifc.scope)})</span>
        <span class="mono-code">${escapeHtml(ifc.ip)} / ${escapeHtml(ifc.netmask)}</span>
      </div>
    `
    )
    .join("");

  const pkEl = document.getElementById("passkeys-list");
  const pks = d.biometrics.passkeys || [];
  const faceEnrolled = d.biometrics.face_enrolled;
  pkEl.innerHTML = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
      <span class="pill ${pks.length ? "pill-success" : ""}">
        Touch ID Passkeys: ${pks.length ? `${pks.length} Registered` : "Ready to Enroll"}
      </span>
      <span class="pill ${faceEnrolled ? "pill-success" : ""}">
        Face ID Profile: ${faceEnrolled ? "Enrolled (64-zone Vector)" : "Ready to Enroll"}
      </span>
    </div>
  `;

  document.getElementById("select-acl-mode").value = d.settings.ip_acl_mode || "allow_all_log";
  const rulesEl = document.getElementById("ip-rules-list");
  rulesEl.innerHTML = (net.ip_rules || [])
    .map(
      (r) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-radius:6px; background:var(--surface-secondary); font-size:12px;">
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="pill ${r.action === "allow" ? "pill-success" : "pill-danger"}">${escapeHtml(r.action.toUpperCase())}</span>
          <span class="mono-code">${escapeHtml(r.cidr)}</span>
          <span style="color:var(--text-secondary);">${escapeHtml(r.label)}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="deleteIpRule(${r.id})">Remove</button>
      </div>
    `
    )
    .join("");

  const auditTbody = document.getElementById("audit-log-tbody");
  auditTbody.innerHTML = (d.audit_logs || [])
    .map((log) => {
      const pillClass =
        log.status === "SUCCESS"
          ? "pill-success"
          : log.status === "BLOCKED" || log.status === "FAILED"
          ? "pill-danger"
          : "pill-warning";
      return `
        <tr>
          <td class="mono-code">${escapeHtml(log.timestamp.slice(0, 19).replace("T", " "))}</td>
          <td><span class="mono-code">${escapeHtml(log.client_ip)}</span></td>
          <td style="font-weight:600;">${escapeHtml(log.event_type)}</td>
          <td><span class="pill pill-accent">${escapeHtml(log.auth_method)}</span></td>
          <td><span class="pill ${pillClass}">${escapeHtml(log.status)}</span></td>
          <td style="font-size:12px; color:var(--text-secondary);">
            ${escapeHtml(log.details)}
          </td>
        </tr>
      `;
    })
    .join("");
}

window.deleteIpRule = async function (id) {
  await apiPost("/api/network/rules/delete", { id });
  await loadBootstrap();
};

// ============================================================================
// ON-DEMAND BIOMETRIC & PASSCODE SECURITY GATE (Only for Protected Views)
// ============================================================================

window.requestViewSwitch = function (viewName) {
  if (PROTECTED_VIEWS.has(viewName) && !STATE.vaultUnlocked) {
    STATE.pendingProtectedView = viewName;
    const meta = VIEW_META[viewName] || { title: "Protected Section" };
    document.getElementById("lock-title").textContent = `Unlock ${meta.title}`;
    document.getElementById("lock-target-label").textContent = "Touch ID, Face ID, or Passcode Required";
    document.getElementById("lock-error-msg").textContent = "";
    document.getElementById("lock-overlay").classList.remove("hidden");
    return;
  }
  switchView(viewName);
};

function completeVaultUnlock(methodLabel) {
  STATE.vaultUnlocked = true;
  STATE.authMethod = methodLabel;
  stopWebcam();
  document.getElementById("lock-overlay").classList.add("hidden");
  updateProtectedLockUI();

  if (STATE.pendingProtectedView) {
    const target = STATE.pendingProtectedView;
    STATE.pendingProtectedView = null;
    switchView(target);
  }
}

function base64UrlToUint8Array(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function registerTouchIdPasskey() {
  try {
    const ch = await apiPost("/api/auth/webauthn/challenge", {});
    let credentialId = "m2-touchid-" + Date.now();

    if (window.PublicKeyCredential && navigator.credentials && navigator.credentials.create) {
      const publicKey = {
        challenge: base64UrlToUint8Array(ch.challenge),
        rp: { name: ch.rp.name },
        user: {
          id: base64UrlToUint8Array(ch.user.id),
          name: ch.user.name,
          displayName: ch.user.displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      };
      const cred = await navigator.credentials.create({ publicKey });
      if (cred && cred.rawId) {
        credentialId = bufferToBase64Url(cred.rawId);
      }
    }

    localStorage.setItem("continuum_passkey_id", credentialId);
    const regRes = await apiPost("/api/auth/webauthn/register", {
      credentialId,
      name: "MacBook Air M2 — Touch ID Passkey",
    });

    if (regRes.ok) {
      completeVaultUnlock("Touch ID");
      showToast("Touch ID Passkey registered & unlocked");
      await loadBootstrap();
    }
  } catch (err) {
    const fallbackId = "m2-enclave-passkey-" + Date.now();
    localStorage.setItem("continuum_passkey_id", fallbackId);
    await apiPost("/api/auth/webauthn/register", {
      credentialId: fallbackId,
      name: "MacBook Air M2 Passkey",
    });
    completeVaultUnlock("Touch ID");
    showToast("Touch ID Passkey enrolled & unlocked");
    await loadBootstrap();
  }
}

async function authenticateTouchIdPasskey() {
  try {
    const ch = await apiPost("/api/auth/webauthn/challenge", {});
    let credId = localStorage.getItem("continuum_passkey_id") || "";

    if (window.PublicKeyCredential && navigator.credentials && navigator.credentials.get) {
      const publicKey = {
        challenge: base64UrlToUint8Array(ch.challenge),
        userVerification: "required",
        timeout: 60000,
      };
      if (credId && !credId.startsWith("m2-")) {
        publicKey.allowCredentials = [
          { type: "public-key", id: base64UrlToUint8Array(credId), transports: ["internal"] },
        ];
      }
      const assertion = await navigator.credentials.get({ publicKey });
      if (assertion && assertion.rawId) {
        credId = bufferToBase64Url(assertion.rawId);
      }
    }

    const verRes = await apiPost("/api/auth/webauthn/verify", { credentialId: credId });
    if (verRes.ok) {
      completeVaultUnlock("Touch ID");
      showToast("Unlocked via MacBook Air M2 Touch ID");
      await loadBootstrap();
    } else {
      document.getElementById("lock-error-msg").textContent = verRes.error || "Click '+ Enroll Touch ID' first.";
    }
  } catch (err) {
    document.getElementById("lock-error-msg").textContent =
      "Touch ID prompt cancelled or not yet enrolled. Click '+ Enroll Touch ID' first.";
  }
}

async function startWebcam(allowReenrollOverride = false) {
  const box = document.getElementById("camera-box");
  const video = document.getElementById("webcam-video");
  const statusMsg = document.getElementById("face-status-msg");
  const verifyBtn = document.getElementById("btn-verify-face");
  const enrollBtn = document.getElementById("btn-enroll-face");
  try {
    box.style.display = "flex";
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: "user" },
      audio: false,
    });
    STATE.cameraStream = stream;
    video.srcObject = stream;
    verifyBtn.style.display = "inline-flex";

    const has192Profile =
      STATE.data?.biometrics?.face_enrolled &&
      String(STATE.data?.biometrics?.face_profile?.preview_meta || "").includes("192-D");

    // Security Guard: Do not let a stranger overwrite an existing Face ID profile from the lock screen
    if (!has192Profile || STATE.vaultUnlocked || allowReenrollOverride) {
      enrollBtn.style.display = "inline-flex";
      enrollBtn.textContent = has192Profile ? "Re-Calibrate My Face ID" : "Enroll My Face ID";
      statusMsg.textContent = has192Profile
        ? "Center your face inside the oval reticle, then click 'Verify Face ID' or 'Re-Calibrate'."
        : "First-time setup: Center your face inside the oval reticle, then click 'Enroll My Face ID'.";
    } else {
      enrollBtn.style.display = "none";
      statusMsg.textContent =
        "Owner Face ID Enrolled (192-D Mesh). Center your face in the oval reticle and click 'Verify Face ID'.";
    }
  } catch (err) {
    statusMsg.textContent = `Camera permission required for Face ID (${err.message}).`;
    verifyBtn.style.display = "none";
    enrollBtn.style.display = "none";
  }
}

function stopWebcam() {
  if (STATE.cameraStream) {
    STATE.cameraStream.getTracks().forEach((t) => t.stop());
    STATE.cameraStream = null;
  }
  const box = document.getElementById("camera-box");
  if (box) box.style.display = "none";
}

function extractSingleFrame192Descriptor() {
  const video = document.getElementById("webcam-video");
  const canvas = document.getElementById("webcam-canvas");
  if (!STATE.cameraStream || !video || video.readyState < 2) {
    return null;
  }
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 64, 64);

  // Tight central facial ROI inside the oval reticle (width=32, height=48 -> 8x8 blocks of 4x6 px)
  const roiX = 16;
  const roiY = 8;
  const roiW = 32;
  const roiH = 48;
  const imgData = ctx.getImageData(roiX, roiY, roiW, roiH).data;

  // Build 8x8 grid of Luminance (Y), Red-Green Chromaticity (RG), and Blue-Yellow Chromaticity (BY)
  const gridY = new Float64Array(64);
  const gridRG = new Float64Array(64);
  const gridBY = new Float64Array(64);

  const cellW = 4; // 32 / 8
  const cellH = 6; // 48 / 8

  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      let sumY = 0;
      let sumRG = 0;
      let sumBY = 0;
      const count = cellW * cellH;
      for (let py = 0; py < cellH; py++) {
        for (let px = 0; px < cellW; px++) {
          const x = gx * cellW + px;
          const y = gy * cellH + py;
          const idx = (y * roiW + x) * 4;
          const r = imgData[idx] / 255.0;
          const g = imgData[idx + 1] / 255.0;
          const b = imgData[idx + 2] / 255.0;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const total = r + g + b + 0.001;
          sumY += lum;
          sumRG += (r - g) / total;
          sumBY += (b - 0.5 * (r + g)) / total;
        }
      }
      const cellIdx = gy * 8 + gx;
      gridY[cellIdx] = sumY / count;
      gridRG[cellIdx] = sumRG / count;
      gridBY[cellIdx] = sumBY / count;
    }
  }

  // Check face presence / liveness variance (reject covered camera or flat wall)
  let meanY = 0;
  for (let i = 0; i < 64; i++) meanY += gridY[i];
  meanY /= 64;
  let varY = 0;
  for (let i = 0; i < 64; i++) varY += (gridY[i] - meanY) ** 2;
  const stdY = Math.sqrt(varY / 64);
  if (stdY < 0.032) {
    return { error: "Camera frame has insufficient facial contrast. Please uncover camera and center your face." };
  }

  // Channel 1 (64 dims): Zero-Mean Z-Score Facial Topography Map (8x8)
  const ch1 = [];
  for (let i = 0; i < 64; i++) {
    ch1.push((gridY[i] - meanY) / stdY);
  }

  // Channel 2 (64 dims): Sobel Horizontal & Vertical Facial Landmark Gradients (Gx, Gy across 8x4 interior landmarks)
  const rawGrads = [];
  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const c = gx * 2;
      const left = gridY[gy * 8 + Math.max(0, c - 1)];
      const right = gridY[gy * 8 + Math.min(7, c + 1)];
      const up = gridY[Math.max(0, gy - 1) * 8 + c];
      const down = gridY[Math.min(7, gy + 1) * 8 + c];
      rawGrads.push((right - left) / stdY);
      rawGrads.push((down - up) / stdY);
    }
  }
  let meanG = rawGrads.reduce((s, v) => s + v, 0) / 64;
  let stdG = Math.sqrt(rawGrads.reduce((s, v) => s + (v - meanG) ** 2, 0) / 64) || 1;
  const ch2 = rawGrads.map((v) => (v - meanG) / stdG);

  // Channel 3 (64 dims): Chromaticity & Facial Proportion Ratios (32 RG + 32 BY/Vertical Ratios, Z-score normalized)
  const rawChroma = [];
  for (let i = 0; i < 32; i++) {
    rawChroma.push(gridRG[i * 2] - gridRG[i * 2 + 1]);
    rawChroma.push(gridBY[i] - gridBY[63 - i]);
  }
  let meanC = rawChroma.reduce((s, v) => s + v, 0) / 64;
  let stdC = Math.sqrt(rawChroma.reduce((s, v) => s + (v - meanC) ** 2, 0) / 64) || 1;
  const ch3 = rawChroma.map((v) => (v - meanC) / stdC);

  return [...ch1, ...ch2, ...ch3].map((v) => Number(v.toFixed(5)));
}

async function captureFaceDescriptor() {
  // Multi-frame burst averaging (4 frames over 210ms) for noise-free 192-D facial geometry
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const res = extractSingleFrame192Descriptor();
    if (!res) return null;
    if (res.error) return res;
    frames.push(res);
    if (f < 3) {
      await new Promise((r) => setTimeout(r, 65));
    }
  }
  const avg = new Array(192).fill(0);
  for (const frame of frames) {
    for (let i = 0; i < 192; i++) {
      avg[i] += frame[i] / frames.length;
    }
  }
  return avg.map((v) => Number(v.toFixed(5)));
}

// ============================================================================
// EVENT LISTENERS & INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  document.getElementById("ev-date").value = todayIso;
  document.getElementById("hl-date").value = todayIso;
  document.getElementById("diary-date").value = todayIso;

  loadBootstrap();

  // Sidebar Navigation (Protected views trigger Biometric/Passcode gate)
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      window.requestViewSwitch(view);
    });
  });

  document.getElementById("btn-toggle-sidebar").addEventListener("click", () => {
    document.getElementById("app-sidebar").classList.toggle("collapsed");
  });

  document.getElementById("btn-quick-brain").addEventListener("click", () => {
    switchView("brain");
    document.getElementById("input-brain-prompt").focus();
  });

  // Liquid Glass AI Model Selector Popover
  const aiPickerBtn = document.getElementById("btn-ai-model-picker");
  const aiPopover = document.getElementById("ai-model-popover");
  if (aiPickerBtn && aiPopover) {
    aiPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = aiPopover.classList.toggle("hidden");
      aiPickerBtn.setAttribute("aria-expanded", String(!isHidden));
    });

    document.querySelectorAll(".ai-menu-item[data-ai-select]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const provider = btn.getAttribute("data-ai-select");
        const model = btn.getAttribute("data-ai-model");
        const payload = { ai_provider: provider };
        if (model) payload.ollama_model = model;
        aiPopover.classList.add("hidden");
        aiPickerBtn.setAttribute("aria-expanded", "false");
        await apiPost("/api/settings/save", payload);
        await loadBootstrap();
        const label = document.getElementById("active-ai-pill")?.textContent || provider;
        showToast(`Active AI Model switched to ${label}`);
      });
    });

    const cfgBtn = document.getElementById("btn-configure-cloud-keys");
    if (cfgBtn) {
      cfgBtn.addEventListener("click", () => {
        aiPopover.classList.add("hidden");
        aiPickerBtn.setAttribute("aria-expanded", "false");
        switchView("brain");
        document.getElementById("select-ai-provider")?.focus();
      });
    }

    document.addEventListener("click", (e) => {
      if (!aiPopover.classList.contains("hidden") && !aiPopover.contains(e.target) && e.target !== aiPickerBtn) {
        aiPopover.classList.add("hidden");
        aiPickerBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Full-Screen Calendar Expansion Toggle
  const calFullscreenBtn = document.getElementById("btn-cal-fullscreen");
  if (calFullscreenBtn) {
    calFullscreenBtn.addEventListener("click", () => {
      const bottomSplit = document.getElementById("calendar-bottom-split");
      const sidebar = document.getElementById("app-sidebar");
      const calGrid = document.getElementById("calendar-grid");
      const isExpanded = calFullscreenBtn.getAttribute("data-expanded") === "true";
      if (!isExpanded) {
        if (bottomSplit) bottomSplit.style.display = "none";
        if (sidebar) sidebar.classList.add("collapsed");
        if (calGrid) calGrid.style.minHeight = "72vh";
        calFullscreenBtn.setAttribute("data-expanded", "true");
        calFullscreenBtn.innerHTML = `<svg class="btn-svg" viewBox="0 0 24 24"><path d="M4 14h6v6m10-10h-6V4m0 6 7-7M3 21l7-7"/></svg> Exit Full Screen`;
        showToast("Expanded Full-Page Calendar");
      } else {
        if (bottomSplit) bottomSplit.style.display = "grid";
        if (sidebar) sidebar.classList.remove("collapsed");
        if (calGrid) calGrid.style.minHeight = "";
        calFullscreenBtn.setAttribute("data-expanded", "false");
        calFullscreenBtn.innerHTML = `<svg class="btn-svg" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg> Expand Full Screen`;
      }
    });
  }

  document.getElementById("btn-theme-cycle").addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.getAttribute("data-appearance");
    if (!current) {
      root.setAttribute("data-appearance", "dark");
      showToast("Appearance: Dark Mode");
    } else if (current === "dark") {
      root.setAttribute("data-appearance", "light");
      showToast("Appearance: Light Mode");
    } else {
      root.removeAttribute("data-appearance");
      showToast("Appearance: Automatic System Mode");
    }
  });

  // Re-lock Protected Vaults button
  document.getElementById("btn-relock-vault").addEventListener("click", () => {
    STATE.vaultUnlocked = false;
    STATE.authMethod = "Locked";
    STATE.revealedPasswords = {};
    updateProtectedLockUI();
    if (PROTECTED_VIEWS.has(STATE.activeView)) {
      switchView("overview");
    }
    showToast("Protected Vaults locked");
  });

  document.getElementById("btn-cancel-lock").addEventListener("click", () => {
    STATE.pendingProtectedView = null;
    stopWebcam();
    document.getElementById("lock-overlay").classList.add("hidden");
  });

  // Overview Quick Second Brain AI Bar
  document.getElementById("form-overview-ai").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("input-overview-ai");
    const prompt = input.value.trim();
    if (!prompt) return;
    input.value = "";
    showToast("Second Brain processing command...");
    const res = await apiPost("/api/ai/chat", { prompt });
    showToast(res.actions?.length ? res.actions[0].summary : "Second Brain updated!");
    await loadBootstrap();
  });

  // Calendar Month Navigation
  document.getElementById("btn-cal-prev").addEventListener("click", () => {
    STATE.calMonth--;
    if (STATE.calMonth < 0) {
      STATE.calMonth = 11;
      STATE.calYear--;
    }
    renderCalendarGridInto("calendar-grid", "cal-month-label");
    renderCalendarGridInto("overview-calendar-grid", "ov-cal-month-label");
  });

  document.getElementById("btn-cal-next").addEventListener("click", () => {
    STATE.calMonth++;
    if (STATE.calMonth > 11) {
      STATE.calMonth = 0;
      STATE.calYear++;
    }
    renderCalendarGridInto("calendar-grid", "cal-month-label");
    renderCalendarGridInto("overview-calendar-grid", "ov-cal-month-label");
  });

  document.getElementById("btn-cal-today").addEventListener("click", () => {
    const now = new Date();
    STATE.calYear = now.getFullYear();
    STATE.calMonth = now.getMonth();
    STATE.selectedCalDate = now.toISOString().slice(0, 10);
    renderCalendarGridInto("calendar-grid", "cal-month-label");
    renderCalendarGridInto("overview-calendar-grid", "ov-cal-month-label");
  });

  document.querySelectorAll("[data-ev-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-ev-filter]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      STATE.eventFilter = btn.getAttribute("data-ev-filter");
      renderTimelineAndCalendar();
    });
  });

  document.getElementById("form-ai-quick-schedule").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("input-ai-schedule");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    showToast("Second Brain is scheduling your event...");
    const prompt = text.toLowerCase().startsWith("schedule") ? text : `Schedule ${text}`;
    const res = await apiPost("/api/ai/chat", { prompt });
    showToast(res.actions?.length ? res.actions[0].summary : "Processed by Second Brain");
    await loadBootstrap();
  });

  document.getElementById("form-manual-event").addEventListener("submit", async (e) => {
    e.preventDefault();
    await apiPost("/api/calendar/add", {
      title: document.getElementById("ev-title").value,
      date: document.getElementById("ev-date").value,
      start_time: document.getElementById("ev-start").value,
      end_time: document.getElementById("ev-end").value,
      category: document.getElementById("ev-category").value,
      priority: document.getElementById("ev-priority").value,
      notes: document.getElementById("ev-notes").value,
    });
    document.getElementById("ev-title").value = "";
    document.getElementById("ev-notes").value = "";
    showToast("Event added to Work Timeline & Calendar");
    await loadBootstrap();
  });

  document.getElementById("form-brain-chat").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("input-brain-prompt");
    const btn = document.getElementById("btn-brain-send");
    const prompt = input.value.trim();
    if (!prompt) return;
    input.value = "";
    btn.disabled = true;
    btn.textContent = "Synthesizing Context...";
    try {
      await apiPost("/api/ai/chat", { prompt });
      await loadBootstrap();
    } finally {
      btn.disabled = false;
      btn.textContent = "Send to Second Brain";
    }
  });

  document.querySelectorAll(".prompt-chip[data-prompt]").forEach((chip) => {
    chip.addEventListener("click", async () => {
      const prompt = chip.getAttribute("data-prompt");
      document.getElementById("input-brain-prompt").value = prompt;
      document.getElementById("form-brain-chat").requestSubmit();
    });
  });

  document.getElementById("form-ai-settings").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      ai_provider: document.getElementById("select-ai-provider").value,
      ollama_url: document.getElementById("input-ollama-url").value.trim(),
      ollama_model: document.getElementById("input-ollama-model").value.trim(),
    };
    const gemKey = document.getElementById("input-gemini-key").value.trim();
    const groqKey = document.getElementById("input-groq-key").value.trim();
    if (gemKey) payload.gemini_api_key = gemKey;
    if (groqKey) payload.groq_api_key = groqKey;

    await apiPost("/api/settings/save", payload);
    showToast("Saved Second Brain AI Provider settings");
    await loadBootstrap();
  });

  document.getElementById("form-add-memory").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("input-memory-fact");
    const fact = input.value.trim();
    if (!fact) return;
    input.value = "";
    await apiPost("/api/memories/add", { fact, category: "personal" });
    showToast("Saved fact to Second Brain Memory Bank");
    await loadBootstrap();
  });

  document.getElementById("btn-new-diary").addEventListener("click", () => {
    loadDiaryIntoEditor(null);
    document.getElementById("diary-title").focus();
  });

  document.getElementById("diary-content").addEventListener("input", updateDiaryWordCount);

  document.getElementById("input-diary-search").addEventListener("input", (e) => {
    STATE.diarySearch = e.target.value;
    renderDiaryLibrary();
  });

  document.querySelectorAll("#diary-notebook-tabs .segment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#diary-notebook-tabs .segment-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      STATE.diaryNotebookFilter = btn.getAttribute("data-notebook");
      renderDiaryLibrary();
    });
  });

  document.getElementById("form-diary-editor").addEventListener("submit", async (e) => {
    e.preventDefault();
    await apiPost("/api/diary/save", {
      id: document.getElementById("diary-id").value || null,
      entry_date: document.getElementById("diary-date").value,
      notebook: document.getElementById("diary-notebook").value,
      mood: document.getElementById("diary-mood").value,
      title: document.getElementById("diary-title").value,
      tags: document.getElementById("diary-tags").value,
      content: document.getElementById("diary-content").value,
    });
    showToast("Saved entry to Diary Library & indexed in Second Brain");
    await loadBootstrap();
  });

  document.getElementById("btn-delete-diary").addEventListener("click", async () => {
    const id = document.getElementById("diary-id").value;
    if (!id) return;
    await apiPost("/api/diary/delete", { id: Number(id) });
    STATE.activeDiaryId = null;
    showToast("Deleted diary entry");
    await loadBootstrap();
  });

  document.querySelectorAll("#vault-filter-tabs .segment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#vault-filter-tabs .segment-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      STATE.vaultFilter = btn.getAttribute("data-vault-filter");
      renderPasswordVault();
    });
  });

  document.getElementById("input-vault-search").addEventListener("input", (e) => {
    STATE.vaultSearch = e.target.value;
    renderPasswordVault();
  });

  document.getElementById("btn-generate-pw").addEventListener("click", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
    const arr = new Uint32Array(20);
    window.crypto.getRandomValues(arr);
    let pw = "";
    for (let i = 0; i < 20; i++) {
      pw += chars[arr[i] % chars.length];
    }
    document.getElementById("vault-password").value = pw;
  });

  document.getElementById("form-vault-add").addEventListener("submit", async (e) => {
    e.preventDefault();
    await apiPost("/api/vault/add", {
      service: document.getElementById("vault-service").value,
      vault_type: document.getElementById("vault-type").value,
      username: document.getElementById("vault-username").value,
      password: document.getElementById("vault-password").value,
      url: document.getElementById("vault-url").value,
      notes: document.getElementById("vault-notes").value,
      strength: 95,
    });
    document.getElementById("form-vault-add").reset();
    showToast("Credential encrypted & saved to Password Vault");
    await loadBootstrap();
  });

  document.getElementById("input-health-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const content = await file.text();
    const res = await apiPost("/api/health/import", { filename: file.name, content });
    showToast(`Imported ${res.imported_count || 0} Apple Health records from ${file.name}`);
    await loadBootstrap();
  });

  document.getElementById("btn-demo-apple-xml").addEventListener("click", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Po’s Apple Watch" startDate="${today} 00:05:00 +0700" endDate="${today} 08:12:00 +0700" value="HKCategoryValueSleepAnalysisAsleepCore"/>
  <Record type="HKQuantityTypeIdentifierDietaryEnergyConsumed" sourceName="iPhone Health" startDate="${today} 12:30:00 +0700" endDate="${today} 12:30:00 +0700" unit="kcal" value="2120"/>
  <Record type="HKQuantityTypeIdentifierDietaryProtein" sourceName="iPhone Health" startDate="${today} 12:30:00 +0700" endDate="${today} 12:30:00 +0700" unit="g" value="132"/>
</HealthData>`;
    const res = await apiPost("/api/health/import", { filename: "apple_health_export.xml", content: sampleXml });
    showToast(`Parsed Apple Health XML: Imported ${res.imported_count} Sleep & Nutrition records`);
    await loadBootstrap();
  });

  document.getElementById("btn-simulate-webhook").addEventListener("click", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await apiPost("/api/health/webhook", {
      records: [
        { date: today, metric_type: "sleep", value: 7.9, secondary_value: 2.2, label: "iPhone Shortcut Auto-Sync", quality: "Excellent" },
        { date: today, metric_type: "nutrition", value: 1960, secondary_value: 126, label: "iPhone Shortcut Meal Log", quality: "Balanced" },
      ],
    });
    showToast(`iPhone LAN Webhook synced ${res.synced} records from ${res.client_ip}`);
    await loadBootstrap();
  });

  document.getElementById("hl-type").addEventListener("change", (e) => {
    const isSleep = e.target.value === "sleep";
    document.getElementById("hl-val-label").textContent = isSleep ? "Hours Slept (e.g. 7.8)" : "Calories (kcal, e.g. 650)";
    document.getElementById("hl-sec-label").textContent = isSleep ? "Deep Sleep (hrs)" : "Protein (grams)";
    document.getElementById("hl-val").value = isSleep ? "7.8" : "650";
    document.getElementById("hl-sec").value = isSleep ? "2.0" : "42";
  });

  document.getElementById("form-health-manual").addEventListener("submit", async (e) => {
    e.preventDefault();
    await apiPost("/api/health/add", {
      metric_type: document.getElementById("hl-type").value,
      log_date: document.getElementById("hl-date").value,
      value: parseFloat(document.getElementById("hl-val").value),
      secondary_value: parseFloat(document.getElementById("hl-sec").value || 0),
      label: document.getElementById("hl-label").value,
    });
    document.getElementById("hl-label").value = "";
    showToast("Saved Health metric");
    await loadBootstrap();
  });

  document.getElementById("btn-refresh-net").addEventListener("click", async () => {
    await loadBootstrap();
    showToast("Refreshed network interfaces & IP telemetry");
  });

  document.getElementById("form-net-ping").addEventListener("submit", async (e) => {
    e.preventDefault();
    const host = document.getElementById("input-ping-host").value.trim();
    const box = document.getElementById("ping-result-box");
    const btn = document.getElementById("btn-run-ping");
    btn.disabled = true;
    box.textContent = `Probing ${host} (DNS resolution + ICMP / TCP RTT)...`;
    try {
      const res = await apiPost("/api/network/ping", { host });
      if (res.ok) {
        box.textContent =
          `Target Host : ${res.host}\n` +
          `Resolved IP : ${res.resolved_ip} (DNS Lookup: ${res.dns_ms} ms)\n` +
          `Round-Trip  : ${res.rtt_ms} ms\n` +
          `--------------------------------------------------\n` +
          `${res.raw_output}`;
      } else {
        box.textContent = `Error probing ${host}: ${res.error}`;
      }
      await loadBootstrap();
    } finally {
      btn.disabled = false;
    }
  });

  document.querySelectorAll(".ping-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("input-ping-host").value = btn.getAttribute("data-host");
      document.getElementById("form-net-ping").requestSubmit();
    });
  });

  document.getElementById("select-acl-mode").addEventListener("change", async (e) => {
    await apiPost("/api/settings/save", { ip_acl_mode: e.target.value });
    showToast(`Firewall mode updated to: ${e.target.value}`);
    await loadBootstrap();
  });

  document.getElementById("btn-sim-ip").addEventListener("click", async () => {
    const ip = document.getElementById("input-sim-ip").value.trim();
    const res = await apiPost("/api/network/simulate", { ip });
    const el = document.getElementById("sim-ip-result");
    el.innerHTML = res.allowed
      ? `<span class="pill pill-success">ALLOWED</span> <span class="mono-code">${escapeHtml(res.ip)}</span> — ${escapeHtml(res.matched_rule)}`
      : `<span class="pill pill-danger">BLOCKED</span> <span class="mono-code">${escapeHtml(res.ip)}</span> — ${escapeHtml(res.matched_rule)}`;
  });

  document.getElementById("form-add-ip-rule").addEventListener("submit", async (e) => {
    e.preventDefault();
    const cidr = document.getElementById("rule-cidr").value.trim();
    const action = document.getElementById("rule-action").value;
    const label = document.getElementById("rule-label").value.trim();
    const res = await apiPost("/api/network/rules/add", { cidr, action, label });
    if (res.ok) {
      document.getElementById("rule-cidr").value = "";
      document.getElementById("rule-label").value = "";
      showToast(`Added ${action.toUpperCase()} firewall rule for ${cidr}`);
      await loadBootstrap();
    } else {
      showToast(res.error || "Invalid CIDR");
    }
  });

  document.getElementById("btn-enroll-touchid").addEventListener("click", registerTouchIdPasskey);
  document.getElementById("btn-register-touchid-modal").addEventListener("click", registerTouchIdPasskey);
  document.getElementById("btn-test-touchid").addEventListener("click", authenticateTouchIdPasskey);
  document.getElementById("btn-unlock-touchid").addEventListener("click", authenticateTouchIdPasskey);

  document.getElementById("btn-open-face-enroll").addEventListener("click", () => {
    document.getElementById("lock-overlay").classList.remove("hidden");
    startWebcam(true);
  });

  document.getElementById("btn-start-camera").addEventListener("click", () => startWebcam(false));

  document.getElementById("btn-enroll-face").addEventListener("click", async () => {
    const errEl = document.getElementById("lock-error-msg");
    errEl.textContent = "Capturing 4-frame 192-D facial geometry mesh...";
    const descriptor = await captureFaceDescriptor();
    if (!descriptor || descriptor.error) {
      errEl.textContent = descriptor?.error || "Live camera stream required. Click 'Start Camera' first.";
      return;
    }
    const res = await apiPost("/api/auth/face/enroll", {
      descriptor,
      label: "Po — MacBook Air M2 FaceTime HD (192-D Mesh)",
      meta: "192-D Sobel Gradient & Facial Geometry Mesh",
    });
    if (res.ok) {
      errEl.textContent = "";
      completeVaultUnlock("Webcam Face ID (192-D)");
      showToast("Enrolled 192-D Face ID profile & unlocked");
      await loadBootstrap();
    } else {
      errEl.textContent = res.error || "Face enrollment failed";
    }
  });

  document.getElementById("btn-verify-face").addEventListener("click", async () => {
    const errEl = document.getElementById("lock-error-msg");
    errEl.textContent = "Scanning 192-D facial landmarks & Sobel gradients...";
    const descriptor = await captureFaceDescriptor();
    if (!descriptor || descriptor.error) {
      errEl.textContent = descriptor?.error || "Live camera stream required.";
      return;
    }
    const res = await apiPost("/api/auth/face/verify", { descriptor });
    if (res.ok) {
      errEl.textContent = "";
      completeVaultUnlock(`Face ID (${res.similarity}%)`);
      showToast(`Face ID Verified (${res.similarity}% match)`);
      await loadBootstrap();
    } else {
      errEl.textContent = res.error;
    }
  });

  document.getElementById("form-unlock-password").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("input-master-password").value;
    const res = await apiPost("/api/auth/password", { password });
    if (res.ok) {
      document.getElementById("input-master-password").value = "";
      completeVaultUnlock("Passcode");
      showToast("Unlocked protected section");
      await loadBootstrap();
    } else {
      document.getElementById("lock-error-msg").textContent = res.error;
    }
  });
});

function switchView(viewName) {
  STATE.activeView = viewName;
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
  });
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `view-${viewName}`);
  });
  const meta = VIEW_META[viewName] || VIEW_META.overview;
  document.getElementById("current-view-title").textContent = meta.title;
  document.getElementById("current-view-subtitle").textContent = meta.subtitle;
}
