const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

app.use(express.json({ limit: "3mb" }));
app.use(express.static(path.join(__dirname, "public")));

const MONEYBIT_TYPES = {
  "Cash Guardian": {
    subtitle: "A safety-first saving companion",
    risk: "Low risk",
    fund: "Smaller asset base",
    trait: "Dislikes losses, values security, and benefits from building an emergency fund and using low-volatility cash-management tools first.",
    strategy: "Build confidence first, then explain core concepts; avoid high-risk products and unnecessary jargon.",
    image: "/assets/moneybit/moneybit-guard.jpg"
  },
  "Steady Saver": {
    subtitle: "A disciplined long-term planner",
    risk: "Low to moderately low risk",
    fund: "Established savings habit",
    trait: "Saves consistently, values principal protection, and wants to improve cash efficiency within controlled risk.",
    strategy: "Emphasize goal breakdown, time-horizon alignment, and a steady path with clear execution steps.",
    image: "/assets/moneybit/moneybit-saver.png"
  },
  "Lottery Dreamer": {
    subtitle: "An adventurous opportunity seeker",
    risk: "High-risk impulses",
    fund: "Smaller asset base",
    trait: "Can be drawn to high-return screenshots and popular themes, fears missing out, and may chase recent performance.",
    strategy: "Focus on behavioral guardrails, position sizing, volatility, and discipline without encouraging trend chasing.",
    image: "/assets/moneybit/moneybit-dreamer.png"
  },
  "Market Surfer": {
    subtitle: "An active planner who can ride volatility",
    risk: "Moderately high risk",
    fund: "Larger asset base",
    trait: "Has some investing experience, values data and logic, and benefits from tools, discipline, and structured review.",
    strategy: "Provide frameworks, data perspectives, and review tools while discouraging overtrading and intuition-only decisions.",
    image: "/assets/moneybit/moneybit-surfer.png"
  }
};

function defaultStore() {
  return {
    profile: {
      name: "Alex",
      age: "22",
      identity: "Student / early-career professional",
      monthlySaving: "800",
      goal: "Build an emergency fund within six months",
      horizon: "6 months",
      riskLevel: "Low",
      experience: "Beginner",
      moneybitType: "Steady Saver"
    },
    preferences: {
      companionStyle: "Warm and encouraging",
      detailLevel: "Standard",
      reminderFrequency: "Once a month",
      marketVolatilityStyle: "Reassure me first",
      learningStyle: "Action checklist"
    },
    moneybit: {
      currentType: "Steady Saver",
      types: MONEYBIT_TYPES
    },
    goals: {
      primaryGoal: "Build an emergency fund within six months",
      targetAmount: 6000,
      currentAmount: 2400,
      monthlyPlan: 800,
      deadline: "6 months",
      monthlyAdvice: [
        "Save ¥600 first each month to build a consistent cash-flow habit",
        "Keep ¥200 as a flexible buffer so an overly strict plan does not break down",
        "Avoid making high-volatility products a core holding until the emergency-fund goal is complete"
      ]
    },
    memory: {
      learnedConcepts: ["Money market funds", "Maximum drawdown"],
      lastEmotion: "Anxious during a market decline",
      lastBehavior: "Did not redeem impulsively",
      savingProgress: "Completed 75% of this month's savings plan and built an emergency fund of ¥2,400",
      monthlyGrowth: [
        "Started evaluating financial choices by goals and time horizon instead of return alone",
        "Learned that maximum drawdown reflects the difficulty of the holding experience",
        "Avoided redeeming immediately during a market decline and began developing a review habit"
      ],
      nextMonthSuggestions: [
        "Continue prioritizing the emergency fund",
        "Learn one personal-finance concept each week",
        "When markets move, review the goal and time horizon before deciding whether to act"
      ]
    },
    agentStatus: {
      mode: "Not used yet",
      intent: "Waiting for a question",
      action: "Waiting for input",
      moneybitType: "Steady Saver",
      emotion: "To be assessed",
      riskBehavior: "To be assessed",
      companionFocus: "Understand the situation before offering guidance",
      lastUpdated: ""
    },
    chatHistory: []
  };
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore(), null, 2), "utf-8");
  }
}

function normalizeStore(store) {
  store.profile = store.profile || {};
  store.profile.moneybitType = store.profile.moneybitType || store.moneybit?.currentType || "Steady Saver";
  store.preferences = store.preferences || defaultStore().preferences;
  store.goals = store.goals || defaultStore().goals;
  store.memory = store.memory || defaultStore().memory;
  store.moneybit = store.moneybit || {};
  store.moneybit.currentType = store.moneybit.currentType || store.profile.moneybitType || "Steady Saver";
  store.moneybit.types = { ...MONEYBIT_TYPES, ...(store.moneybit.types || {}) };
  store.agentStatus = store.agentStatus || {};
  store.agentStatus.moneybitType = store.agentStatus.moneybitType || store.moneybit.currentType;
  store.agentStatus.emotion = store.agentStatus.emotion || "To be assessed";
  store.agentStatus.riskBehavior = store.agentStatus.riskBehavior || "To be assessed";
  store.agentStatus.companionFocus = store.agentStatus.companionFocus || "Understand the situation before offering guidance";
  return store;
}

function readStore() {
  ensureStore();
  const store = normalizeStore(JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")));
  writeStore(store);
  return store;
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(normalizeStore(store), null, 2), "utf-8");
}

function nowText() {
  return new Date().toISOString();
}

function updateSection(section, data) {
  const store = readStore();
  store[section] = { ...(store[section] || {}), ...(data || {}) };
  if (section === "profile" && data.moneybitType) {
    store.moneybit.currentType = data.moneybitType;
  }
  writeStore(store);
  return store[section];
}

function getCurrentMoneybit(store, overrideType) {
  const type = overrideType || store.profile?.moneybitType || store.moneybit?.currentType || "Steady Saver";
  return { type, ...(store.moneybit?.types?.[type] || MONEYBIT_TYPES[type] || MONEYBIT_TYPES["Steady Saver"]) };
}

function classifyIntent(message) {
  const text = String(message || "");
  if (/(drop|down|loss|lose|redeem|sell|anxious|panic|drawdown|crash)/i.test(text)) {
    return {
      key: "market_anxiety",
      label: "Market volatility",
      action: "Calm the emotion first, then review the goal and time horizon",
      emotion: "Somewhat anxious",
      riskBehavior: "May sell or redeem impulsively",
      focus: "Reduce anxiety and avoid rushed decisions during volatility",
      tags: ["Market volatility", "Emotional support", "Risk review"]
    };
  }
  if (/(popular|hot|rally|chase|all[- ]?in|full position|AI theme|buy now|high return|viral)/i.test(text)) {
    return {
      key: "hot_chasing",
      label: "Performance-chasing impulse",
      action: "Explain the risk first, then review position sizing and discipline",
      emotion: "Fear of missing out",
      riskBehavior: "May chase performance or take an oversized position",
      focus: "Slow the impulse and review position size and risk capacity",
      tags: ["Performance chasing", "Risk reminder", "Behavioral guardrails"]
    };
  }
  if (/(start|beginner|new to|do not understand|don't understand|first time|personal finance|investing basics)/i.test(text)) {
    return {
      key: "beginner_start",
      label: "Beginner starting point",
      action: "Explain the basics, then suggest a first practical step",
      emotion: "Somewhat uncertain",
      riskBehavior: "May feel overwhelmed by information",
      focus: "Start with an emergency fund and core concepts rather than rushing to choose a product",
      tags: ["Beginner", "Core concepts", "Practical actions"]
    };
  }
  if (/(review|recap|summarize|growth|this month|monthly|progress|next month)/i.test(text)) {
    return {
      key: "monthly_review",
      label: "Growth review",
      action: "Summarize changes and create an action plan for next month",
      emotion: "Wants reassurance about progress",
      riskBehavior: "Needs to turn experience into a repeatable habit",
      focus: "Turn individual decisions into long-term financial habits",
      tags: ["Monthly review", "Growth feedback", "Practical actions"]
    };
  }
  if (/(goal|emergency fund|save|saving|plan|budget)/i.test(text)) {
    return {
      key: "goal_planning",
      label: "Goal planning",
      action: "Break down the goal into a practical plan",
      emotion: "Wants a clearer path",
      riskBehavior: "May create an overly strict plan or struggle to maintain it",
      focus: "Break the goal into manageable monthly steps",
      tags: ["Goal planning", "Savings plan", "Practical actions"]
    };
  }
  return {
    key: "general_question",
    label: "General question",
    action: "Explain the issue and clarify the risk boundary",
    emotion: "Needs more information",
    riskBehavior: "To be assessed",
    focus: "Clarify the question, then offer practical guidance",
    tags: ["General question", "Concept explanation", "Companion guidance"]
  };
}

function buildSystemPrompt() {
  return `You are Xiaoxia Financial Companion, an AI personal-finance companion designed for young adults.

The user sees a supportive growth product, not a technical dashboard. Use friendly language and avoid developer terminology.

Your support process:
1. Understand the user's profile, goals, risk tolerance, and MoneyBit persona.
2. Review the user's financial journal, including past emotions, behavior changes, and learned concepts.
3. Identify the current need: anxiety, uncertainty, performance chasing, goal planning, or reflection.
4. Choose an appropriate approach: explain, reassure, remind, plan, or review.
5. Stay within safety guardrails and never make a specific investment decision for the user.

MoneyBit personas:
- Cash Guardian: values security; explain core concepts first and do not encourage extra risk.
- Steady Saver: values planning and certainty; emphasize goal breakdown, a steady path, and discipline.
- Lottery Dreamer: may experience FOMO and chase trends; emphasize position sizing, volatility, and discipline without stimulating impulsive action.
- Market Surfer: has some experience; offer frameworks, data perspectives, review tools, and strategic discipline.

Safety guardrails:
- Do not promise returns.
- Do not predict short-term market direction.
- Do not recommend a specific fund, stock, or entry or exit point.
- Do not encourage trading.
- You may provide financial education, risk explanations, goal breakdowns, emotional support, and review guidance.
- End every answer with a user-friendly reminder that it does not constitute personalized investment advice.

Style requirements:
- Be warm, measured, and trustworthy, never sales-like.
- Prioritize the user's profile, MoneyBit persona, preferences, financial goals, and past journal entries.
- Use language that young adults can understand and minimize jargon.
- Structure the answer clearly without sounding like an audit report.`;
}

function buildUserPrompt({ message, profile, preferences, goals, memory, intent, moneybit }) {
  return `Current user question:
${message}

User profile:
${JSON.stringify(profile, null, 2)}

MoneyBit persona:
${JSON.stringify(moneybit, null, 2)}

Companion preferences:
${JSON.stringify(preferences, null, 2)}

Financial goals:
${JSON.stringify(goals, null, 2)}

Financial journal:
${JSON.stringify(memory, null, 2)}

Xiaoxia's current assessment:
${JSON.stringify({
  currentScene: intent.label,
  emotion: intent.emotion,
  riskBehavior: intent.riskBehavior,
  companionAction: intent.action,
  companionFocus: intent.focus
}, null, 2)}

Use this response structure:
1. Respond naturally to the user's current emotion or question.
2. Explain why Xiaoxia reached this assessment, using the MoneyBit persona, goal, time horizon, or risk tolerance.
3. Give two or three small actions the user can take immediately.
4. End with a user-friendly safety reminder. Do not use internal phrases such as "compliance check."`;
}

function resolveChatUrl() {
  const raw = (process.env.LLM_BASE_URL || "").trim();
  if (!raw) return "";
  if (raw.endsWith("/chat/completions")) return raw;
  if (raw.endsWith("/v1/chat/completions")) return raw;
  return raw.replace(/\/+$/, "") + "/chat/completions";
}

function mockReply({ profile, goals, memory, intent, moneybit }) {
  const name = profile.name || "there";
  if (intent.key === "hot_chasing" || moneybit.type === "Lottery Dreamer") {
    return `${name}, it is understandable to feel excited when a popular theme is rising. Your current MoneyBit persona is “${moneybit.type},” which can be drawn to a sense of opportunity and worry about missing out.

Why Xiaoxia reached this assessment:
1. Your current goal is “${goals.primaryGoal || profile.goal},” not a short-term gamble.
2. ${moneybit.trait}
3. The more popular a theme becomes, the more important it is to review position size and volatility instead of following return screenshots.

Three small steps you can take now:
1. Avoid an all-in decision and write down the maximum loss you could tolerate.
2. Divide your reasons for buying into two columns: “evidence” and “emotional impulse.”
3. Review the idea again after 24 hours rather than deciding while excitement is high.

Xiaoxia's reminder: this response is meant to help you understand risk and organize your next steps. It does not make a specific investment decision for you and does not constitute personalized investment advice.`;
  }

  if (intent.key === "market_anxiety") {
    return `${name}, do not rush to decide solely because of a short-term decline. Feeling anxious is normal, but the strongest emotions are a signal to review your goal and time horizon before acting.

Why Xiaoxia reached this assessment:
1. Your goal is “${goals.primaryGoal || profile.goal},” with a time horizon of ${profile.horizon || goals.deadline}.
2. Your MoneyBit persona is “${moneybit.type}.” ${moneybit.trait}
3. You previously managed to “${memory.lastBehavior || "avoid an impulsive action"},” which is meaningful progress.

Three steps you can take now:
1. Pause and avoid buying or selling at the peak of anxiety.
2. Determine whether this money will be needed in the short term.
3. Record how this decline feels so you can use it in your next review.

Xiaoxia's reminder: this response is meant to help you understand risk and organize your next steps. It does not make a specific investment decision for you and does not constitute personalized investment advice.`;
  }

  if (intent.key === "monthly_review") {
    return `${name}, you made progress this month. The improvement is not only about returns—your financial behavior is becoming more stable.

Why Xiaoxia reached this assessment:
1. You learned: ${(memory.learnedConcepts || []).join(", ")}.
2. You felt anxious during market volatility but did not redeem impulsively.
3. Your current MoneyBit persona is “${moneybit.type}.” A useful focus for next month is: ${moneybit.strategy}

Three actions for next month:
1. Continue working toward “${goals.primaryGoal || profile.goal}.”
2. Learn one personal-finance concept each week instead of becoming overwhelmed by information.
3. When markets move, review the goal and your risk tolerance before considering action.

Xiaoxia's reminder: this response is meant to help you understand risk and organize your next steps. It does not make a specific investment decision for you and does not constitute personalized investment advice.`;
  }

  return `${name}, the most important step is not choosing a product immediately. First clarify your goal, time horizon, and risk tolerance.

Why Xiaoxia reached this assessment:
1. Your MoneyBit persona is “${moneybit.type}.” ${moneybit.trait}
2. Your goal is “${goals.primaryGoal || profile.goal}.”
3. You currently need a steady, practical path that you can review over time.

Start with these three steps:
1. Decide whether this money is an emergency fund, money for a short-term goal, or long-term investment capital.
2. Learn the broad risk differences among product types.
3. Set your next action using this approach: “${moneybit.strategy}”

Xiaoxia's reminder: this response is meant to help you understand risk and organize your next steps. It does not make a specific investment decision for you and does not constitute personalized investment advice.`;
}

async function callLLM(payload) {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "deepseek-chat";
  const url = resolveChatUrl();

  if (process.env.DEMO_MODE === "true" || !apiKey || !url) {
    return { reply: mockReply(payload), mode: "Mock Mode" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(payload) }
      ],
      temperature: 0.6
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${errorText.slice(0, 180)}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content || "";
  return { reply: reply || mockReply(payload), mode: "Generated by the live model" };
}

app.get("/api/store", (req, res) => res.json(readStore()));

app.get("/api/profile", (req, res) => res.json(readStore().profile));
app.post("/api/profile", (req, res) => res.json(updateSection("profile", req.body)));

app.get("/api/preferences", (req, res) => res.json(readStore().preferences));
app.post("/api/preferences", (req, res) => res.json(updateSection("preferences", req.body)));

app.get("/api/goals", (req, res) => res.json(readStore().goals));
app.post("/api/goals", (req, res) => res.json(updateSection("goals", req.body)));

app.get("/api/memory", (req, res) => res.json(readStore().memory));
app.post("/api/memory", (req, res) => res.json(updateSection("memory", req.body)));

app.get("/api/moneybit", (req, res) => res.json(readStore().moneybit));
app.post("/api/moneybit", (req, res) => {
  const store = readStore();
  const type = req.body.currentType || req.body.type || store.moneybit.currentType || "Steady Saver";
  store.moneybit.currentType = type;
  store.profile.moneybitType = type;
  store.agentStatus.moneybitType = type;
  writeStore(store);
  res.json(store.moneybit);
});

app.get("/api/agent/status", (req, res) => res.json(readStore().agentStatus));

app.post("/api/agent/update", (req, res) => {
  const store = readStore();
  const moneybit = getCurrentMoneybit(store);
  store.agentStatus = {
    ...(store.agentStatus || {}),
    moneybitType: moneybit.type,
    intent: "Updated",
    action: "Update companion guidance using the latest profile, goals, and financial journal",
    emotion: "To be assessed",
    riskBehavior: "To be assessed",
    companionFocus: `${moneybit.type}: ${moneybit.strategy}`,
    mode: store.agentStatus?.mode || "Not used yet",
    lastUpdated: nowText()
  };
  writeStore(store);
  res.json(store.agentStatus);
});

app.post("/api/agent", async (req, res) => {
  const store = readStore();
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ error: "message cannot be empty" });

  const profile = { ...store.profile, ...(req.body.profile || {}) };
  const preferences = { ...store.preferences, ...(req.body.preferences || {}) };
  const goals = { ...store.goals, ...(req.body.goals || {}) };
  const memory = { ...store.memory, ...(req.body.memory || {}) };
  const moneybit = getCurrentMoneybit(store, profile.moneybitType);
  const intent = classifyIntent(message);
  const payload = { message, profile, preferences, goals, memory, intent, moneybit };

  let result;
  try {
    result = await callLLM(payload);
  } catch (error) {
    result = {
      reply: mockReply(payload) + `\n\n[System notice] The live model request failed, so Xiaoxia switched to a fallback response. Error summary: ${error.message}`,
      mode: "Fallback Mock Mode"
    };
  }

  const nextStore = readStore();
  nextStore.agentStatus = {
    mode: result.mode,
    intent: intent.label,
    action: intent.action,
    moneybitType: moneybit.type,
    emotion: intent.emotion,
    riskBehavior: intent.riskBehavior,
    companionFocus: intent.focus,
    lastUpdated: nowText()
  };
  nextStore.chatHistory = nextStore.chatHistory || [];
  nextStore.chatHistory.push({ role: "user", content: message, time: nowText() });
  nextStore.chatHistory.push({
    role: "assistant",
    content: result.reply,
    intent: intent.label,
    action: intent.action,
    moneybitType: moneybit.type,
    mode: result.mode,
    time: nowText()
  });
  nextStore.chatHistory = nextStore.chatHistory.slice(-50);
  writeStore(nextStore);

  res.json({
    reply: result.reply,
    mode: result.mode,
    intent: intent.key,
    intentLabel: intent.label,
    action: intent.action,
    emotion: intent.emotion,
    riskBehavior: intent.riskBehavior,
    companionFocus: intent.focus,
    tags: [...intent.tags, moneybit.type],
    moneybit,
    safety: {
      title: "Safety boundaries for this guidance",
      items: [
        "No specific fund recommendation",
        "No promise of returns",
        "No short-term market prediction",
        "No encouragement to trade",
        "Focus on understanding risk and organizing practical actions"
      ]
    }
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

ensureStore();
app.listen(PORT, () => {
  console.log(`Xiaoxia Financial Companion Agent v2.2 is running at http://localhost:${PORT}`);
  console.log(`Current mode: ${process.env.DEMO_MODE === "true" ? "Mock Mode" : "LLM API Mode"}`);
});
