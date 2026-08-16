(() => {
  const state = {
    asset: "broad",
    period: "1M",
    metric: "nav"
  };

  const periodLength = {
    "1M": 22,
    "3M": 66,
    "6M": 132,
    "1Y": 252
  };

  const assetProfiles = {
    broad: {
      name: "Broad-Market ETF Sample",
      code: "SAMPLE-BROAD",
      base: 4.12,
      dailyDrift: 0.00072,
      amp: 0.035,
      volumeBase: 12.4,
      brief: "The broad-market sample is a beginner-friendly way to observe market movement. It does not represent a real fund, but it helps explain the relationship among NAV, benchmarks, drawdown, and volatility."
    },
    tech: {
      name: "Technology ETF Sample",
      code: "SAMPLE-TECH",
      base: 1.36,
      dailyDrift: 0.0009,
      amp: 0.075,
      volumeBase: 18.7,
      brief: "The technology sample is more volatile and may encourage performance chasing. Xiaoxia will emphasize position discipline, risk tolerance, and holding period."
    },
    cash: {
      name: "Cash Management Sample",
      code: "SAMPLE-CASH",
      base: 1.000,
      dailyDrift: 0.00008,
      amp: 0.002,
      volumeBase: 5.8,
      brief: "The cash-management sample has very low volatility. It is useful for explaining emergency funds, liquidity, and short-term cash management—not for chasing high returns."
    }
  };

  function genSeries(assetKey) {
    const p = assetProfiles[assetKey];
    const n = 260;
    const nav = [];
    const benchmark = [];
    const peer = [];
    const volume = [];
    const labels = [];

    let navVal = p.base;
    let benchVal = p.base * 0.985;
    let peerVal = p.base * 0.992;

    const start = new Date(2025, 2, 3);

    for (let i = 0; i < n; i++) {
      const wave = Math.sin(i / 8) * p.amp + Math.cos(i / 17) * p.amp * 0.55;
      const shock = Math.sin(i / 31) * p.amp * 0.35;
      const micro = Math.sin(i * 1.7) * p.amp * 0.08;

      const daily = p.dailyDrift + (wave - (Math.sin((i - 1) / 8) * p.amp)) * 0.09 + micro * 0.015;
      const benchDaily = p.dailyDrift * 0.88 + shock * 0.014 + Math.sin(i / 11) * p.amp * 0.006;
      const peerDaily = p.dailyDrift * 0.74 + wave * 0.006 + Math.cos(i / 13) * p.amp * 0.006;

      navVal = navVal * (1 + daily);
      benchVal = benchVal * (1 + benchDaily);
      peerVal = peerVal * (1 + peerDaily);

      nav.push(Number(navVal.toFixed(4)));
      benchmark.push(Number(benchVal.toFixed(4)));
      peer.push(Number(peerVal.toFixed(4)));

      const vol = p.volumeBase * (1 + Math.abs(Math.sin(i / 9)) * 0.8 + Math.abs(wave) * 5);
      volume.push(Number(vol.toFixed(2)));

      const d = new Date(start);
      d.setDate(start.getDate() + i);
      labels.push(String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0"));
    }

    return { nav, benchmark, peer, volume, labels };
  }

  const allData = {
    broad: genSeries("broad"),
    tech: genSeries("tech"),
    cash: genSeries("cash")
  };

  function sliceForPeriod(arr) {
    return arr.slice(-periodLength[state.period]);
  }

  function pctChange(values) {
    return ((values[values.length - 1] - values[0]) / values[0]) * 100;
  }

  function dailyReturns(values) {
    const out = [];
    for (let i = 1; i < values.length; i++) {
      out.push((values[i] - values[i - 1]) / values[i - 1]);
    }
    return out;
  }

  function drawdowns(values) {
    let peak = values[0];
    return values.map(v => {
      peak = Math.max(peak, v);
      return ((v - peak) / peak) * 100;
    });
  }

  function maxDrawdown(values) {
    return Math.min(...drawdowns(values));
  }

  function cumulativeReturn(values) {
    const first = values[0];
    return values.map(v => ((v - first) / first) * 100);
  }

  function rollingVol(values) {
    const rets = [0, ...dailyReturns(values).map(v => v * 100)];
    return rets.map((_, i) => {
      const start = Math.max(0, i - 19);
      const sub = rets.slice(start, i + 1);
      const mean = sub.reduce((a, b) => a + b, 0) / sub.length;
      const variance = sub.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sub.length;
      return Math.sqrt(variance) * Math.sqrt(252);
    });
  }

  function annualVol(values) {
    const rets = dailyReturns(values);
    if (!rets.length) return 0;
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rets.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100;
  }

  function sharpe(values) {
    const rets = dailyReturns(values);
    if (!rets.length) return 0;
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const vol = annualVol(values) / 100;
    return vol ? (mean * 252) / vol : 0;
  }

  function trackingError(values, bench) {
    const r1 = dailyReturns(values);
    const r2 = dailyReturns(bench);
    const diffs = r1.map((v, i) => v - (r2[i] || 0));
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const variance = diffs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / diffs.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100;
  }

  function fmtPct(v) {
    const sign = v > 0 ? "+" : "";
    return sign + v.toFixed(2) + "%";
  }

  function cls(v) {
    if (v > 0) return "positive";
    if (v < 0) return "negative";
    return "neutral";
  }

  function setText(id, value, className) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    if (className !== undefined) el.className = className;
  }

  function prepareMetric(data) {
    const nav = sliceForPeriod(data.nav);
    const benchmark = sliceForPeriod(data.benchmark);
    const peer = sliceForPeriod(data.peer);
    const labels = sliceForPeriod(data.labels);
    const volume = sliceForPeriod(data.volume);

    if (state.metric === "return") {
      return {
        primary: cumulativeReturn(nav),
        benchmark: cumulativeReturn(benchmark),
        peer: cumulativeReturn(peer),
        labels,
        volume,
        formatter: v => v.toFixed(1) + "%",
        caption: "Cumulative return shows the total change since the beginning of the selected period and is best viewed alongside the benchmark and peer average."
      };
    }

    if (state.metric === "drawdown") {
      return {
        primary: drawdowns(nav),
        benchmark: drawdowns(benchmark),
        peer: drawdowns(peer),
        labels,
        volume,
        formatter: v => v.toFixed(1) + "%",
        caption: "Maximum drawdown shows the decline from a period high and helps users understand the most difficult part of the holding experience."
      };
    }

    if (state.metric === "volatility") {
      return {
        primary: rollingVol(nav),
        benchmark: rollingVol(benchmark),
        peer: rollingVol(peer),
        labels,
        volume,
        formatter: v => v.toFixed(1) + "%",
        caption: "Volatility is not the same as loss, but larger swings can make anxiety or greed more likely to drive poor decisions."
      };
    }

    return {
      primary: nav,
      benchmark,
      peer,
      labels,
      volume,
      formatter: v => v.toFixed(3),
      caption: "NAV history is the basic starting point on a fund page. Adding a benchmark and peer average helps users distinguish market movement from product-specific performance."
    };
  }

  function buildPoints(values, width, height, pad) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map((v, i) => {
      const x = pad.l + i * ((width - pad.l - pad.r) / (values.length - 1));
      const y = pad.t + (1 - (v - min) / range) * (height - pad.t - pad.b);
      return [x, y];
    });
  }

  function pathFrom(points) {
    return points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  }

  function drawDashboardChart(payload) {
    const svg = document.getElementById("dashboardChart");
    if (!svg) return;

    const width = 980;
    const height = 430;
    const pad = { l: 58, r: 24, t: 26, b: 72 };

    const allValues = [...payload.primary, ...payload.benchmark, ...payload.peer];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;

    function pts(values) {
      return values.map((v, i) => {
        const x = pad.l + i * ((width - pad.l - pad.r) / (values.length - 1));
        const y = pad.t + (1 - (v - min) / range) * (height - pad.t - pad.b);
        return [x, y];
      });
    }

    const p1 = pts(payload.primary);
    const p2 = pts(payload.benchmark);
    const p3 = pts(payload.peer);

    const yTicks = [0, .25, .5, .75, 1].map(t => max - t * range);
    const yEls = yTicks.map(v => {
      const y = pad.t + (1 - (v - min) / range) * (height - pad.t - pad.b);
      return `
        <line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="rgba(130,118,110,.16)" />
        <text x="12" y="${y + 4}" fill="#7a706c" font-size="12">${payload.formatter(v)}</text>
      `;
    }).join("");

    const xIdx = [0, Math.floor(payload.labels.length / 4), Math.floor(payload.labels.length / 2), Math.floor(payload.labels.length * 3 / 4), payload.labels.length - 1];
    const xEls = xIdx.map(i => {
      const x = p1[i][0];
      return `<text x="${x}" y="${height - 14}" text-anchor="middle" fill="#7a706c" font-size="12">${payload.labels[i]}</text>`;
    }).join("");

    const volMax = Math.max(...payload.volume);
    const barWidth = Math.max(3, Math.min(14, (width - pad.l - pad.r) / payload.volume.length * .62));
    const bars = payload.volume.map((v, i) => {
      const x = p1[i][0] - barWidth / 2;
      const h = (v / volMax) * 56;
      const y = height - pad.b - h;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="3" fill="rgba(179,38,64,.13)" />`;
    }).join("");

    const area = pathFrom(p1) + ` L ${p1[p1.length - 1][0]} ${height - pad.b} L ${p1[0][0]} ${height - pad.b} Z`;

    const lastLabel = (points, values, color, dx = -8) => {
      const last = points[points.length - 1];
      const value = values[values.length - 1];
      return `
        <circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="${color}" />
        <text x="${last[0] + dx}" y="${last[1] + 4}" fill="${color}" font-size="12" font-weight="800">${payload.formatter(value)}</text>
      `;
    };

    svg.innerHTML = `
      <defs>
        <linearGradient id="terminalArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(179,38,64,.18)" />
          <stop offset="100%" stop-color="rgba(179,38,64,.02)" />
        </linearGradient>
      </defs>
      ${yEls}
      ${bars}
      <path d="${area}" fill="url(#terminalArea)"></path>
      <path d="${pathFrom(p2)}" fill="none" stroke="#2563eb" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".82"></path>
      <path d="${pathFrom(p3)}" fill="none" stroke="#8a6f3d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".78" stroke-dasharray="7 6"></path>
      <path d="${pathFrom(p1)}" fill="none" stroke="#B32640" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"></path>
      ${lastLabel(p1, payload.primary, "#B32640")}
      ${lastLabel(p2, payload.benchmark, "#2563eb")}
      ${lastLabel(p3, payload.peer, "#8a6f3d")}
      <text x="${width - 168}" y="24" fill="#7a706c" font-size="12">Historical sample · demo</text>
      <text x="${pad.l}" y="${height - 48}" fill="#7a706c" font-size="12">Sample volume</text>
      ${xEls}
    `;
  }

  function periodMetrics(assetKey, len) {
    const data = allData[assetKey];
    const nav = data.nav.slice(-len);
    return {
      ret: pctChange(nav),
      dd: maxDrawdown(nav),
      vol: annualVol(nav)
    };
  }

  function renderMetricTable(assetKey) {
    const periods = [
      ["1M", 22],
      ["3M", 66],
      ["6M", 132],
      ["1Y", 252]
    ];

    const returns = periods.map(([_, len]) => periodMetrics(assetKey, len).ret);
    const dds = periods.map(([_, len]) => periodMetrics(assetKey, len).dd);
    const vols = periods.map(([_, len]) => periodMetrics(assetKey, len).vol);

    function fill(rowId, values, formatter) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const cells = row.querySelectorAll("span");
      values.forEach((v, idx) => {
        const cell = cells[idx + 1];
        if (!cell) return;
        cell.textContent = formatter(v);
        cell.className = cls(v);
      });
    }

    fill("returnRow", returns, fmtPct);
    fill("drawdownRow", dds, fmtPct);
    fill("volRow", vols, v => v.toFixed(2) + "%");
  }

  function renderDashboard() {
    const profile = assetProfiles[state.asset];
    const data = allData[state.asset];
    const nav = sliceForPeriod(data.nav);
    const benchmark = sliceForPeriod(data.benchmark);
    const latest = nav[nav.length - 1];
    const previous = nav[nav.length - 2];
    const dailyChange = ((latest - previous) / previous) * 100;
    const ret = pctChange(nav);
    const dd = maxDrawdown(nav);
    const vol = annualVol(nav);
    const sh = sharpe(nav);
    const te = trackingError(nav, sliceForPeriod(data.benchmark));
    const volAmt = sliceForPeriod(data.volume).at(-1);

    setText("instrumentName", profile.name);
    setText("instrumentCode", profile.code);
    setText("dashLatestPrice", latest.toFixed(state.asset === "cash" ? 4 : 3));
    setText("dashDailyChange", fmtPct(dailyChange), cls(dailyChange));
    setText("dashPeriodReturn", fmtPct(ret), cls(ret));
    setText("dashMaxDrawdown", fmtPct(dd), cls(dd));
    setText("dashVolatility", vol.toFixed(2) + "%", "neutral");
    setText("dashSharpe", sh.toFixed(2), sh >= 0 ? "positive" : "negative");
    setText("dashTrackingError", te.toFixed(2) + "%", "neutral");
    setText("dashVolume", volAmt.toFixed(1) + " hundred million*", "neutral");

    const payload = prepareMetric(data);
    drawDashboardChart(payload);
    setText("dashboardCaption", payload.caption + " Current period: " + state.period + ". All values are adapted from historical samples.");

    renderMetricTable(state.asset);
  }

  async function readStore() {
    try {
      const res = await fetch("/api/store");
      return res.ok ? await res.json() : {};
    } catch {
      return {};
    }
  }

  function renderWatchList(store) {
    const profile = store.profile || {};
    const moneybitRoot = store.moneybit || {};
    const type = profile.moneybitType || moneybitRoot.currentType || "Steady Saver";

    const rows = [
      { name: "Broad-Market ETF Sample", code: "SAMPLE-BROAD", change: pctChange(allData.broad.nav.slice(-22)), risk: "Medium" },
      { name: "Technology ETF Sample", code: "SAMPLE-TECH", change: pctChange(allData.tech.nav.slice(-22)), risk: "High" },
      { name: "Cash Management Sample", code: "SAMPLE-CASH", change: pctChange(allData.cash.nav.slice(-22)), risk: "Low" },
      { name: "Emergency Fund Goal", code: "GOAL-CASH", change: 40, risk: "Plan" }
    ];

    const el = document.getElementById("watchListRows");
    if (!el) return;

    el.innerHTML = rows.map(r => {
      const isGoal = r.code === "GOAL-CASH";
      const value = isGoal ? r.change.toFixed(0) + "% complete" : fmtPct(r.change);
      return `
        <div class="watch-row">
          <div>
            <strong>${r.name}</strong>
            <span>${r.code} · Risk: ${r.risk}</span>
            <small>${isGoal ? "From the financial journal" : "Historical sample observation"}</small>
          </div>
          <em class="${isGoal ? "positive" : cls(r.change)}">${value}</em>
        </div>
      `;
    }).join("");

    const brief = document.getElementById("xiaoxiaBrief");
    if (brief) {
      const profileText = assetProfiles[state.asset].brief;
      const personaTip = type === "Lottery Dreamer"
        ? "Your persona is more easily drawn to popular themes, so Xiaoxia will emphasize position discipline and the risk of performance chasing."
        : type === "Cash Guardian"
          ? "You value security, so Xiaoxia will prioritize emergency funds, liquidity, and low-volatility tools."
          : type === "Market Surfer"
            ? "You are willing to observe volatility, but the goal is to turn observations into disciplined review rather than frequent trading."
            : "You are better suited to steady progress, using market movement as learning material rather than a reason to trade every day.";

      brief.innerHTML =
        '<div class="brief-section"><strong>Market observation</strong><p>' + profileText + '</p></div>' +
        '<div class="brief-section"><strong>Why it matters to you</strong><p>' + personaTip + '</p></div>' +
        '<div class="brief-section"><strong>Today\'s guidance</strong><p>Review drawdown and volatility before deciding whether your plan needs adjustment. Do not chase an asset solely because of a short-term rise.</p></div>';
    }
  }

  function renderFinanceLog(store) {
    const goals = store.goals || {};
    const memory = store.memory || {};
    const target = Number(goals.targetAmount || 6000);
    const current = Number(goals.currentAmount || 2400);
    const rate = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 40;
    const learned = Array.isArray(memory.learnedConcepts) ? memory.learnedConcepts : ["Money market funds", "Maximum drawdown", "Index funds"];

    setText("logSaving", "¥" + current + "/" + target, "positive");
    setText("logGoalRate", rate + "%", "positive");
    setText("logEmotion", memory.lastEmotion || "Slightly anxious", "neutral");
    setText("logLearned", learned.length + " items", "positive");
    setText("progressText", rate + "%");
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = rate + "%";
  }

  async function renderSide() {
    const store = await readStore();
    renderWatchList(store);
    renderFinanceLog(store);
  }

  function syncButtons() {
    document.querySelectorAll('[data-group="asset"] button').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.asset === state.asset);
    });
    document.querySelectorAll('[data-group="period"] button').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.period === state.period);
    });
    document.querySelectorAll('[data-group="metric"] button').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.metric === state.metric);
    });
  }

  async function renderAll() {
    syncButtons();
    renderDashboard();
    await renderSide();
  }

  function bindEvents() {
    document.querySelectorAll('[data-group="asset"] button').forEach(btn => {
      btn.addEventListener("click", async () => {
        state.asset = btn.dataset.asset;
        await renderAll();
      });
    });

    document.querySelectorAll('[data-group="period"] button').forEach(btn => {
      btn.addEventListener("click", async () => {
        state.period = btn.dataset.period;
        await renderAll();
      });
    });

    document.querySelectorAll('[data-group="metric"] button').forEach(btn => {
      btn.addEventListener("click", async () => {
        state.metric = btn.dataset.metric;
        await renderAll();
      });
    });

    const ask = (message) => {
      const chatNav = [...document.querySelectorAll(".nav-item")].find(btn => btn.dataset.page === "chat");
      if (chatNav) chatNav.click();
      setTimeout(() => {
        const input = document.getElementById("userInput");
        const send = document.getElementById("sendBtn");
        if (input) input.value = message;
        if (send) send.click();
      }, 160);
    };

    const adviceBtn = document.getElementById("dashboardAdviceBtn");
    if (adviceBtn) {
      adviceBtn.addEventListener("click", () => {
        ask("Use the historical-sample market dashboard, my watchlist, and my financial journal to create today's financial-companion guidance. Clearly state that this is historical sample data for demonstration only and does not represent live markets or investment advice.");
      });
    }

    const explainBtn = document.getElementById("askFromDashboardBtn");
    if (explainBtn) {
      explainBtn.addEventListener("click", () => {
        ask("Explain the fund dashboard in beginner-friendly language: how should I interpret NAV history, cumulative return, maximum drawdown, volatility, the benchmark index, and the peer average?");
      });
    }
  }

  window.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await renderAll();
    setInterval(renderAll, 8000);
  });
})();
