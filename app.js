const $ = (id) => document.getElementById(id);
const qsa = (sel) => [...document.querySelectorAll(sel)];

let store = {};
let currentPage = "home";

const pageNames = {
  home: "Growth Dashboard",
  chat: "Chat with Xiaoxia",
  moneybit: "MoneyBit Persona",
  profile: "My Profile",
  preferences: "Companion Preferences",
  goals: "My Goals",
  review: "My Financial Journal"
};

function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request to ${url} failed`);
  return res.json();
}

async function apiPost(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Request to ${url} failed: ${await res.text()}`);
  return res.json();
}

function setValue(id, value) {
  const el = $(id);
  if (el) el.value = value ?? "";
}
function getValue(id) {
  return ($(id)?.value || "").trim();
}

async function loadStore() {
  store = await apiGet("/api/store");
  hydrateAll();
}

function hydrateAll() {
  hydrateMoneybit();
  hydrateProfile();
  hydratePreferences();
  hydrateGoals();
  hydrateMemory();
  hydrateAgentStatus();
  hydrateHome();
  updateContext();
}

function currentMoneybitType() {
  return store.profile?.moneybitType || store.moneybit?.currentType || "Steady Saver";
}
function currentMoneybitData() {
  const type = currentMoneybitType();
  return { type, ...(store.moneybit?.types?.[type] || {}) };
}

function hydrateHome() {
  const p = store.profile || {};
  const g = store.goals || {};
  const m = store.memory || {};
  const s = store.agentStatus || {};
  const mb = currentMoneybitData();

  $("homeGreeting").textContent = `How can Xiaoxia support ${p.name || "you"} today?`;
  $("homeMoneybit").textContent = mb.type || "Steady Saver";
  $("homeMoneybitSub").textContent = mb.subtitle || "";
  $("homeGoal").textContent = g.primaryGoal || p.goal || "No goal yet";
  $("homeGoalProgress").textContent = `¥${g.currentAmount || 0} / ¥${g.targetAmount || 0}`;
  $("homeRecord").textContent = m.lastBehavior || "No entry yet";
  $("homeFocus").textContent = s.companionFocus || "Understand your situation before offering guidance";
  $("homeAction").textContent = s.action || "Waiting for your next question";

  $("understandProfile").textContent = `${p.identity || "Identity not provided"} / Monthly savings capacity ¥${p.monthlySaving || 0} / ${p.experience || "Experience not provided"}`;
  $("understandMoneybit").textContent = `${mb.type || "Steady Saver"}: ${mb.subtitle || ""}`;
  $("understandGoal").textContent = `Goal: ${g.primaryGoal || p.goal || "No goal yet"}`;

  $("judgeScene").textContent = `Current situation: ${s.intent || "Waiting for a question"}`;
  $("judgeEmotion").textContent = `Emotional state: ${s.emotion || "To be assessed"}`;
  $("judgeRisk").textContent = `Risk behavior: ${s.riskBehavior || "To be assessed"}`;
  $("actMethod").textContent = `Support approach: ${s.action || "Waiting for input"}`;
}

function hydrateMoneybit() {
  const grid = $("moneybitGrid");
  if (!grid || !store.moneybit?.types) return;
  grid.innerHTML = "";
  const current = currentMoneybitType();

  Object.entries(store.moneybit.types).forEach(([type, info]) => {
    const card = document.createElement("article");
    card.className = `moneybit-card ${type === current ? "active" : ""}`;
    card.innerHTML = `
      <img src="${info.image}" alt="${type} persona illustration">
      <div class="moneybit-body">
        <h3>${type}</h3>
        <p>${info.subtitle}</p>
        <div class="moneybit-tags">
          <span>${info.risk}</span>
          <span>${info.fund}</span>
        </div>
        <p>${info.trait}</p>
        <button type="button">Use this persona</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => selectMoneybit(type));
    grid.appendChild(card);
  });

  const info = currentMoneybitData();
  $("sideMoneybit").textContent = current;
  $("moneybitPill").textContent = current;
  $("contextMoneybit").textContent = current;
  $("currentCowName").textContent = current;
  $("currentCowSubtitle").textContent = info.subtitle || "";
  $("currentCowImage").src = info.image || "./assets/moneybit/moneybit-saver.png";
  $("currentCowImage").alt = current;
  $("moneybitStrategyText").textContent = `${current}: ${info.strategy || "Adjust the response strategy to the user's persona."} This shapes Xiaoxia's tone, risk reminders, and action suggestions.`;
}

async function selectMoneybit(type) {
  store.moneybit = await apiPost("/api/moneybit", { currentType: type });
  store.profile = await apiGet("/api/profile");
  hydrateMoneybit();
  hydrateProfile();
  hydrateAgentStatus();
  hydrateHome();
  toast(`Persona changed to ${type}`);
}

function hydrateProfile() {
  const p = store.profile || {};
  setValue("profile-name", p.name);
  setValue("profile-age", p.age);
  setValue("profile-identity", p.identity);
  setValue("profile-monthlySaving", p.monthlySaving);
  setValue("profile-goal", p.goal);
  setValue("profile-horizon", p.horizon);
  setValue("profile-riskLevel", p.riskLevel);
  setValue("profile-experience", p.experience);
  setValue("profile-moneybitType", p.moneybitType || currentMoneybitType());
  $("welcomeTitle").textContent = `Good evening, ${p.name || "Alex"} 👋`;
}

function hydratePreferences() {
  const p = store.preferences || {};
  setValue("pref-companionStyle", p.companionStyle);
  setValue("pref-detailLevel", p.detailLevel);
  setValue("pref-reminderFrequency", p.reminderFrequency);
  setValue("pref-marketVolatilityStyle", p.marketVolatilityStyle);
  setValue("pref-learningStyle", p.learningStyle);
}

function hydrateGoals() {
  const g = store.goals || {};
  setValue("goal-primaryGoal", g.primaryGoal);
  setValue("goal-targetAmount", g.targetAmount);
  setValue("goal-currentAmount", g.currentAmount);
  setValue("goal-monthlyPlan", g.monthlyPlan);
  setValue("goal-deadline", g.deadline);

  $("goal-currentAmount-view").textContent = g.currentAmount ?? 0;
  $("goal-targetAmount-view").textContent = g.targetAmount ?? 0;

  const target = Number(g.targetAmount || 0);
  const current = Number(g.currentAmount || 0);
  const pct = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;
  $("goal-progress-bar").style.width = `${pct}%`;
  $("goal-progress-text").textContent = `${pct}% complete`;

  const list = $("monthlyAdviceList");
  list.innerHTML = "";
  (g.monthlyAdvice || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function hydrateMemory() {
  const m = store.memory || {};
  $("learnedConceptsView").textContent = (m.learnedConcepts || []).join(", ") || "None yet";
  $("lastBehaviorView").textContent = m.lastBehavior || "None yet";
  $("savingProgressView").textContent = m.savingProgress || "None yet";

  const growth = $("growthList");
  growth.innerHTML = "";
  (m.monthlyGrowth || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    growth.appendChild(li);
  });

  const next = $("nextMonthList");
  next.innerHTML = "";
  (m.nextMonthSuggestions || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    next.appendChild(li);
  });
}

function hydrateAgentStatus() {
  const s = store.agentStatus || {};
  $("sideMode").textContent = s.mode || "Not used yet";
  $("modePill").textContent = s.mode || "Demo Mode";
  $("contextIntent").textContent = s.intent || "Waiting for a question";
  $("contextAction").textContent = s.action || "Waiting for input";
}

function updateContext() {
  $("pageTitle").textContent = pageNames[currentPage];
  $("contextPage").textContent = pageNames[currentPage];
}

function switchPage(page) {
  currentPage = page;
  qsa(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  qsa(".page").forEach(el => el.classList.remove("active"));
  $(`page-${page}`).classList.add("active");
  updateContext();
}

function collectProfile() {
  return {
    name: getValue("profile-name"),
    age: getValue("profile-age"),
    identity: getValue("profile-identity"),
    monthlySaving: getValue("profile-monthlySaving"),
    goal: getValue("profile-goal"),
    horizon: getValue("profile-horizon"),
    riskLevel: getValue("profile-riskLevel"),
    experience: getValue("profile-experience"),
    moneybitType: getValue("profile-moneybitType")
  };
}

function collectPreferences() {
  return {
    companionStyle: getValue("pref-companionStyle"),
    detailLevel: getValue("pref-detailLevel"),
    reminderFrequency: getValue("pref-reminderFrequency"),
    marketVolatilityStyle: getValue("pref-marketVolatilityStyle"),
    learningStyle: getValue("pref-learningStyle")
  };
}

function collectGoals() {
  return {
    primaryGoal: getValue("goal-primaryGoal"),
    targetAmount: Number(getValue("goal-targetAmount") || 0),
    currentAmount: Number(getValue("goal-currentAmount") || 0),
    monthlyPlan: Number(getValue("goal-monthlyPlan") || 0),
    deadline: getValue("goal-deadline")
  };
}

function addMessage(role, content, safety) {
  const wrap = document.createElement("article");
  wrap.className = `message ${role}`;

  const icon = document.createElement("div");
  icon.className = "msg-icon";
  icon.textContent = role === "user" ? "Me" : "X";

  const card = document.createElement("div");
  card.className = "msg-card";

  if (role === "assistant") {
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    meta.textContent = "Xiaoxia · Financial Companion";
    card.appendChild(meta);
  }

  const p = document.createElement("p");
  p.textContent = content;
  card.appendChild(p);

  if (role === "assistant" && safety) {
    const safe = document.createElement("div");
    safe.className = "safety-card";
    safe.innerHTML = `<strong>${safety.title}</strong><ul>${(safety.items || []).map(item => `<li>${item}</li>`).join("")}</ul>`;
    card.appendChild(safe);
  }

  wrap.appendChild(icon);
  wrap.appendChild(card);
  $("messages").appendChild(wrap);
  $("messages").scrollTop = $("messages").scrollHeight;
}

function updateSceneStrip(tags = []) {
  const strip = $("sceneStrip");
  strip.innerHTML = "";
  (tags.length ? tags : ["Waiting for a question", "Companion mode", "Safety guardrails on"]).forEach(t => {
    const span = document.createElement("span");
    span.textContent = t;
    strip.appendChild(span);
  });
}

async function sendMessage(messageFromChip) {
  const input = $("userInput");
  const message = (messageFromChip || input.value).trim();
  if (!message) return;

  input.value = "";
  addMessage("user", message);
  $("sendBtn").disabled = true;
  $("sendBtn").textContent = "Generating...";

  try {
    const data = await apiPost("/api/agent", { message });
    addMessage("assistant", data.reply, data.safety);
    updateSceneStrip(data.tags || []);

    store.agentStatus = {
      mode: data.mode,
      intent: data.intentLabel,
      action: data.action,
      moneybitType: data.moneybit?.type,
      emotion: data.emotion,
      riskBehavior: data.riskBehavior,
      companionFocus: data.companionFocus
    };

    hydrateAgentStatus();
    hydrateHome();
    if (data.moneybit) {
      $("contextMoneybit").textContent = data.moneybit.type;
      $("moneybitPill").textContent = data.moneybit.type;
    }
    toast("Xiaoxia has generated a response");
  } catch (error) {
    addMessage("assistant", `API request failed: ${error.message}`);
    toast("API request failed");
  } finally {
    $("sendBtn").disabled = false;
    $("sendBtn").textContent = "Send";
  }
}

function bindEvents() {
  qsa(".nav-item").forEach(btn => btn.addEventListener("click", () => switchPage(btn.dataset.page)));
  qsa(".chips button").forEach(btn => btn.addEventListener("click", () => sendMessage(btn.dataset.message)));
  $("sendBtn").addEventListener("click", () => sendMessage());
  $("userInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  $("updateMeBtn").addEventListener("click", async () => {
    store.agentStatus = await apiPost("/api/agent/update", {});
    hydrateAgentStatus();
    hydrateHome();
    toast("Guidance updated using your latest information");
  });

  $("saveProfileBtn").addEventListener("click", async () => {
    store.profile = await apiPost("/api/profile", collectProfile());
    store.moneybit = await apiGet("/api/moneybit");
    hydrateProfile();
    hydrateMoneybit();
    hydrateHome();
    toast("Profile saved");
  });

  $("savePreferencesBtn").addEventListener("click", async () => {
    store.preferences = await apiPost("/api/preferences", collectPreferences());
    hydratePreferences();
    toast("Companion preferences saved");
  });

  $("saveGoalsBtn").addEventListener("click", async () => {
    store.goals = await apiPost("/api/goals", collectGoals());
    hydrateGoals();
    hydrateHome();
    toast("Goals saved");
  });

  $("reviewToChatBtn").addEventListener("click", () => {
    switchPage("chat");
    sendMessage("Please summarize my financial progress this month and suggest practical actions for next month.");
  });
}

bindEvents();
loadStore().catch(error => {
  console.error(error);
  toast("Initialization failed. Please check that the server is running.");
});
