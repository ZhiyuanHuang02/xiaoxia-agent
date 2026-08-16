async function updateBehindThinkingPanel() {
  try {
    const res = await fetch("/api/store");
    if (!res.ok) return;
    const store = await res.json();

    const profile = store.profile || {};
    const memory = store.memory || {};
    const status = store.agentStatus || {};
    const moneybitRoot = store.moneybit || {};
    const type = profile.moneybitType || moneybitRoot.currentType || status.moneybitType || "Steady Saver";
    const moneybit = (moneybitRoot.types && moneybitRoot.types[type]) || {};

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set(
      "behindProfile",
      `${profile.name || "Alex"}, age ${profile.age || "22"}, ${profile.identity || "student / early-career professional"}, able to save ¥${profile.monthlySaving || "800"} per month, ${profile.experience || "new to personal finance"}.`
    );

    set(
      "behindMoneybit",
      `${type} — ${moneybit.subtitle || "a disciplined long-term planner"}. ${moneybit.trait || ""}`
    );

    const learned = Array.isArray(memory.learnedConcepts) ? memory.learnedConcepts.join(", ") : "No entries yet";
    set(
      "behindRecord",
      `Learned: ${learned}; recent state: ${memory.lastEmotion || "no emotional notes"}; behavior change: ${memory.lastBehavior || "no behavior notes"}.`
    );

    set("behindScene", status.intent || "Waiting for a question");
    set("behindEmotion", status.emotion || "To be assessed");
    set("behindRisk", status.riskBehavior || "To be assessed");
    set("behindAction", status.action || "Waiting for input");
    set("behindFocus", status.companionFocus || "Understand the situation before offering guidance");

    let next = "Explain, reassure, remind, plan, or review";
    if ((status.intent || "").includes("Market volatility")) next = "Calm the emotion first, then review the goal and time horizon";
    if ((status.intent || "").includes("Performance chasing")) next = "Explain the risk first, then review position sizing and discipline";
    if ((status.intent || "").includes("Growth review")) next = "Summarize changes and turn them into actions for next month";
    if ((status.intent || "").includes("Goal")) next = "Break the goal into practical steps";
    set("behindNext", next);
  } catch (error) {
    console.warn("Failed to update the Xiaoxia reasoning panel:", error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  updateBehindThinkingPanel();
  setInterval(updateBehindThinkingPanel, 1200);
});
