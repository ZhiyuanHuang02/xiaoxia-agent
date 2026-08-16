(function installBrowserDemoApi() {
  "use strict";

  const STORAGE_KEY = "xiaoxia-financial-companion-demo-v1";
  const realFetch = window.fetch.bind(window);

  const MONEYBIT_TYPES = {
    "Cash Guardian": {
      subtitle: "A safety-first saving companion",
      risk: "Low risk",
      fund: "Smaller asset base",
      trait:
        "Dislikes losses, values security, and benefits from building an emergency fund and using low-volatility cash-management tools first.",
      strategy:
        "Build confidence first, then explain core concepts; avoid high-risk products and unnecessary jargon.",
      image: "./assets/moneybit/moneybit-guard.jpg"
    },
    "Steady Saver": {
      subtitle: "A disciplined long-term planner",
      risk: "Low to moderately low risk",
      fund: "Established savings habit",
      trait:
        "Saves consistently, values principal protection, and wants to improve cash efficiency within controlled risk.",
      strategy:
        "Emphasize goal breakdown, time-horizon alignment, and a steady path with clear execution steps.",
      image: "./assets/moneybit/moneybit-saver.png"
    },
    "Lottery Dreamer": {
      subtitle: "An adventurous opportunity seeker",
      risk: "High-risk impulses",
      fund: "Smaller asset base",
      trait:
        "Can be drawn to high-return screenshots and popular themes, fears missing out, and may chase recent performance.",
      strategy:
        "Focus on behavioral guardrails, position sizing, volatility, and discipline without encouraging trend chasing.",
      image: "./assets/moneybit/moneybit-dreamer.png"
    },
    "Market Surfer": {
      subtitle: "An active planner who can ride volatility",
      risk: "Moderately high risk",
      fund: "Larger asset base",
      trait:
        "Has some investing experience, values data and logic, and benefits from tools, discipline, and structured review.",
      strategy:
        "Provide frameworks, data perspectives, and review tools while discouraging overtrading and intuition-only decisions.",
      image: "./assets/moneybit/moneybit-surfer.png"
    }
  };

  function createDefaultStore() {
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
        savingProgress:
          "Completed 75% of this month's savings plan and built an emergency fund of ¥2,400",
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
        mode: "Interactive Demo",
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

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  let memoryStore = createDefaultStore();

  function normalizeStore(value) {
    const defaults = createDefaultStore();
    const next = value && typeof value === "object" ? value : defaults;
    next.profile = { ...defaults.profile, ...(next.profile || {}) };
    next.preferences = { ...defaults.preferences, ...(next.preferences || {}) };
    next.goals = { ...defaults.goals, ...(next.goals || {}) };
    next.memory = { ...defaults.memory, ...(next.memory || {}) };
    next.moneybit = { ...defaults.moneybit, ...(next.moneybit || {}) };
    next.moneybit.types = { ...MONEYBIT_TYPES, ...(next.moneybit.types || {}) };
    next.moneybit.currentType =
      next.profile.moneybitType || next.moneybit.currentType || "Steady Saver";
    next.profile.moneybitType = next.moneybit.currentType;
    next.agentStatus = { ...defaults.agentStatus, ...(next.agentStatus || {}) };
    next.agentStatus.moneybitType = next.moneybit.currentType;
    next.chatHistory = Array.isArray(next.chatHistory) ? next.chatHistory : [];
    return next;
  }

  function readStore() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      memoryStore = normalizeStore(saved ? JSON.parse(saved) : memoryStore);
    } catch {
      memoryStore = normalizeStore(memoryStore);
    }
    return clone(memoryStore);
  }

  function writeStore(value) {
    memoryStore = normalizeStore(clone(value));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch {
      // The demo still works for this tab if browser storage is unavailable.
    }
    return clone(memoryStore);
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
    if (/(start|beginner|new to|do not understand|don't understand|first time|basics)/i.test(text)) {
      return {
        key: "beginner_start",
        label: "Beginner starting point",
        action: "Explain the basics, then suggest a first practical step",
        emotion: "Somewhat uncertain",
        riskBehavior: "May feel overwhelmed by information",
        focus: "Start with an emergency fund and core concepts",
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
        riskBehavior: "May create an overly strict plan",
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

  function getMoneybit(store) {
    const type = store.profile.moneybitType || store.moneybit.currentType;
    return { type, ...(store.moneybit.types[type] || MONEYBIT_TYPES["Steady Saver"]) };
  }

  function mockReply({ profile, goals, memory, intent, moneybit }) {
    const name = profile.name || "there";
    const goal = goals.primaryGoal || profile.goal || "your current goal";
    const safety =
      "This is educational guidance to help you understand risk and organize your next steps. It is not personalized investment advice.";

    if (intent.key === "market_anxiety") {
      return `${name}, it is completely understandable to feel unsettled by a decline. Try not to make a decision at the peak of that emotion.\n\nWhy Xiaoxia reached this assessment:\n1. Your current goal is “${goal},” with a time horizon of ${profile.horizon || goals.deadline}.\n2. Your MoneyBit persona is “${moneybit.type}.” ${moneybit.trait}\n3. You previously ${String(memory.lastBehavior || "paused before acting").toLowerCase()}, which is meaningful progress.\n\nThree small steps:\n1. Pause before buying or selling.\n2. Check whether this money is needed soon and whether the product matches that time horizon.\n3. Record what the decline feels like so you can calibrate your risk tolerance later.\n\n${safety}`;
    }

    if (intent.key === "hot_chasing") {
      return `${name}, excitement around a popular theme is normal, but a rising price can make urgency feel stronger than the evidence.\n\nWhy Xiaoxia reached this assessment:\n1. Your goal is “${goal},” not a short-term gamble.\n2. Your MoneyBit persona is “${moneybit.type}.” ${moneybit.trait}\n3. Popularity makes position size and downside risk more important, not less.\n\nThree small steps:\n1. Write down the maximum loss you could tolerate.\n2. Separate your reasons into “evidence” and “emotional impulse.”\n3. Revisit the idea after 24 hours instead of deciding while excitement is high.\n\n${safety}`;
    }

    if (intent.key === "monthly_review") {
      return `${name}, you made useful progress this month. The improvement is not only about returns; your financial behavior is becoming more deliberate.\n\nWhat changed:\n1. You learned ${(memory.learnedConcepts || []).join(" and ") || "new personal-finance concepts"}.\n2. You continued working toward “${goal}.”\n3. Your “${moneybit.type}” persona benefits from this focus: ${moneybit.strategy}\n\nThree actions for next month:\n1. Keep the emergency-fund contribution automatic.\n2. Learn one concept each week.\n3. Review your goal and risk tolerance before acting on market news.\n\n${safety}`;
    }

    if (intent.key === "goal_planning") {
      const target = Number(goals.targetAmount || 0);
      const current = Number(goals.currentAmount || 0);
      const remaining = Math.max(0, target - current);
      return `${name}, your goal becomes easier to manage when it is converted into a small monthly system.\n\nYour current picture:\n- Goal: ${goal}\n- Progress: ¥${current.toLocaleString()} of ¥${target.toLocaleString()}\n- Remaining: ¥${remaining.toLocaleString()}\n\nThree small steps:\n1. Automate the planned ¥${Number(goals.monthlyPlan || 0).toLocaleString()} contribution near payday.\n2. Keep a modest flexible buffer so the plan remains sustainable.\n3. Review progress once a month instead of reacting to it every day.\n\n${safety}`;
    }

    return `${name}, the strongest first step is to clarify the goal, time horizon, and amount of uncertainty you can comfortably handle.\n\nWhy Xiaoxia reached this assessment:\n1. Your MoneyBit persona is “${moneybit.type}.” ${moneybit.trait}\n2. Your current goal is “${goal}.”\n3. A steady process is usually more useful than choosing a product immediately.\n\nThree small steps:\n1. Label the money as emergency savings, a short-term goal, or long-term capital.\n2. Compare broad risk categories before comparing returns.\n3. Use this approach: ${moneybit.strategy}\n\n${safety}`;
  }

  function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  async function readBody(init) {
    if (!init || !init.body) return {};
    if (typeof init.body === "string") return JSON.parse(init.body || "{}");
    return {};
  }

  async function handleApi(path, method, body) {
    let store = readStore();

    if (method === "GET" && path === "/api/store") return jsonResponse(store);
    if (method === "GET" && path === "/api/profile") return jsonResponse(store.profile);
    if (method === "GET" && path === "/api/preferences") return jsonResponse(store.preferences);
    if (method === "GET" && path === "/api/goals") return jsonResponse(store.goals);
    if (method === "GET" && path === "/api/memory") return jsonResponse(store.memory);
    if (method === "GET" && path === "/api/moneybit") return jsonResponse(store.moneybit);
    if (method === "GET" && path === "/api/agent/status") return jsonResponse(store.agentStatus);

    const sectionRoutes = {
      "/api/profile": "profile",
      "/api/preferences": "preferences",
      "/api/goals": "goals",
      "/api/memory": "memory"
    };
    if (method === "POST" && sectionRoutes[path]) {
      const section = sectionRoutes[path];
      store[section] = { ...(store[section] || {}), ...(body || {}) };
      if (section === "profile" && body.moneybitType) {
        store.moneybit.currentType = body.moneybitType;
        store.agentStatus.moneybitType = body.moneybitType;
      }
      store = writeStore(store);
      return jsonResponse(store[section]);
    }

    if (method === "POST" && path === "/api/moneybit") {
      const type = body.currentType || body.type || store.moneybit.currentType;
      if (store.moneybit.types[type]) {
        store.moneybit.currentType = type;
        store.profile.moneybitType = type;
        store.agentStatus.moneybitType = type;
      }
      store = writeStore(store);
      return jsonResponse(store.moneybit);
    }

    if (method === "POST" && path === "/api/agent/update") {
      const moneybit = getMoneybit(store);
      store.agentStatus = {
        ...store.agentStatus,
        mode: "Interactive Demo",
        intent: "Updated",
        action: "Update guidance using the latest profile, goals, and financial journal",
        moneybitType: moneybit.type,
        emotion: "To be assessed",
        riskBehavior: "To be assessed",
        companionFocus: `${moneybit.type}: ${moneybit.strategy}`,
        lastUpdated: new Date().toISOString()
      };
      store = writeStore(store);
      return jsonResponse(store.agentStatus);
    }

    if (method === "POST" && path === "/api/agent") {
      const message = String(body.message || "").trim();
      if (!message) return jsonResponse({ error: "message cannot be empty" }, 400);

      const profile = { ...store.profile, ...(body.profile || {}) };
      const goals = { ...store.goals, ...(body.goals || {}) };
      const memory = { ...store.memory, ...(body.memory || {}) };
      const moneybit = getMoneybit({ ...store, profile });
      const intent = classifyIntent(message);
      const reply = mockReply({ profile, goals, memory, intent, moneybit });
      const time = new Date().toISOString();

      store.agentStatus = {
        mode: "Interactive Demo",
        intent: intent.label,
        action: intent.action,
        moneybitType: moneybit.type,
        emotion: intent.emotion,
        riskBehavior: intent.riskBehavior,
        companionFocus: intent.focus,
        lastUpdated: time
      };
      store.chatHistory = [
        ...(store.chatHistory || []),
        { role: "user", content: message, time },
        {
          role: "assistant",
          content: reply,
          intent: intent.label,
          action: intent.action,
          moneybitType: moneybit.type,
          mode: "Interactive Demo",
          time
        }
      ].slice(-50);
      writeStore(store);

      return jsonResponse({
        reply,
        mode: "Interactive Demo",
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
    }

    return jsonResponse({ error: "Demo endpoint not found" }, 404);
  }

  window.fetch = async function demoAwareFetch(input, init) {
    const rawUrl = typeof input === "string" ? input : input && input.url;
    const url = new URL(rawUrl || "", window.location.href);
    if (!url.pathname.startsWith("/api/")) return realFetch(input, init);

    const method = String((init && init.method) || "GET").toUpperCase();
    try {
      return await handleApi(url.pathname, method, await readBody(init));
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Unexpected demo error" },
        500
      );
    }
  };
})();
