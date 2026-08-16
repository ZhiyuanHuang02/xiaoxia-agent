(() => {
  const marketSamples = {
    "1M": {
      price: [585.2, 587.6, 589.1, 592.8, 595.7, 594.3, 598.9, 601.5, 603.2, 606.8, 610.4, 608.9, 612.6, 615.4, 618.7, 620.3, 622.1, 619.4, 624.8, 628.6],
      volume: [72, 74, 76, 81, 88, 84, 83, 89, 92, 95, 98, 91, 96, 100, 104, 108, 110, 103, 112, 118],
      labels: ["06/03","06/05","06/07","06/10","06/12","06/14","06/17","06/19","06/21","06/24","06/26","06/28","07/01","07/03","07/05","07/08","07/10","07/12","07/15","07/17"]
    },
    "3M": {
      price: [548.4, 551.2, 556.7, 562.4, 559.5, 565.8, 571.9, 577.1, 574.2, 580.3, 584.9, 589.7, 594.1, 590.8, 596.4, 603.6, 609.2, 614.7, 621.5, 628.6],
      volume: [68, 70, 74, 79, 84, 88, 86, 90, 92, 95, 97, 102, 98, 100, 104, 108, 110, 112, 114, 118],
      labels: ["04/18","04/25","05/02","05/09","05/16","05/23","05/30","06/06","06/13","06/20","06/27","07/04","07/11","07/18","07/25","08/01","08/08","08/15","08/22","08/29"]
    },
    "6M": {
      price: [512.8, 518.5, 524.2, 529.4, 535.7, 541.8, 547.2, 543.6, 550.8, 557.9, 562.4, 568.3, 573.7, 579.8, 584.6, 590.5, 596.4, 604.1, 615.2, 628.6],
      volume: [60, 62, 65, 70, 72, 76, 79, 74, 78, 82, 85, 88, 90, 92, 95, 98, 101, 106, 110, 118],
      labels: ["02/01","02/15","03/01","03/15","04/01","04/15","05/01","05/15","06/01","06/15","07/01","07/15","08/01","08/15","09/01","09/15","10/01","10/15","11/01","11/15"]
    },
    "1Y": {
      price: [448.2, 456.7, 463.1, 470.5, 478.8, 489.3, 501.6, 494.2, 508.7, 520.1, 531.4, 543.8, 556.2, 547.1, 562.6, 575.3, 588.4, 601.7, 615.9, 628.6],
      volume: [52, 55, 58, 62, 64, 69, 72, 74, 76, 80, 84, 88, 91, 90, 94, 98, 101, 106, 111, 118],
      labels: ["08/23","09/23","10/23","11/23","12/23","01/24","02/24","03/24","04/24","05/24","06/24","07/24","08/24","09/24","10/24","11/24","12/24","01/25","02/25","03/25"]
    }
  };

  const state = {
    period: "1M",
    marketMetric: "price",
    watchMetric: "goal",
    logMetric: "saving"
  };

  function percentChange(values) {
    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  }

  function drawdowns(values) {
    let peak = values[0];
    return values.map(v => {
      peak = Math.max(peak, v);
      return ((v - peak) / peak) * 100;
    });
  }

  function returns(values) {
    const first = values[0];
    return values.map(v => ((v - first) / first) * 100);
  }

  function volSeries(values) {
    const diffs = [0];
    for (let i = 1; i < values.length; i++) {
      const pct = Math.abs((values[i] - values[i - 1]) / values[i - 1]) * 100;
      diffs.push(pct);
    }
    return diffs.map((v, i, arr) => {
      const start = Math.max(0, i - 2);
      const sub = arr.slice(start, i + 1);
      return sub.reduce((a, b) => a + b, 0) / sub.length;
    });
  }

  function maxDrawdown(values) {
    return Math.min(...drawdowns(values));
  }

  function realizedVol(values) {
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(Math.abs((values[i] - values[i - 1]) / values[i - 1]) * 100);
    }
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  function fmtNumber(v) {
    return Number(v).toFixed(2);
  }

  function fmtPct(v) {
    const sign = v > 0 ? "+" : "";
    return sign + Number(v).toFixed(2) + "%";
  }

  function classifyValue(v) {
    if (v > 0) return "positive";
    if (v < 0) return "negative";
    return "neutral";
  }

  function linePath(points) {
    return points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + " " + p[1]).join(" ");
  }

  function buildPoints(values, width, height, padL, padR, padT, padB) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;
    return values.map((v, i) => {
      const x = padL + i * ((width - padL - padR) / (values.length - 1));
      const y = padT + (1 - (v - min) / range) * (height - padT - padB);
      return [x, y];
    });
  }

  function drawChart(svgId, values, labels, options = {}) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const width = svgId === "marketChart" ? 760 : 520;
    const height = svgId === "marketChart" ? 300 : 220;
    const padL = 48, padR = 18, padT = 18, padB = 36;
    const points = buildPoints(values, width, height, padL, padR, padT, padB);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => max - t * range);
    const tickEls = yTicks.map((v) => {
      const y = padT + (1 - (v - min) / range) * (height - padT - padB);
      return `
        <line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="rgba(160,140,130,.18)" stroke-width="1" />
        <text x="8" y="${y + 4}" fill="#8a807b" font-size="11">${options.yFormatter ? options.yFormatter(v) : v.toFixed(0)}</text>
      `;
    }).join("");

    const xIndex = [0, Math.floor(labels.length/4), Math.floor(labels.length/2), Math.floor(labels.length*3/4), labels.length-1];
    const xEls = xIndex.map(i => {
      const x = points[i][0];
      return `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="#8a807b" font-size="11">${labels[i]}</text>`;
    }).join("");

    const areaPath = linePath(points) + ` L ${points[points.length-1][0]} ${height - padB} L ${points[0][0]} ${height - padB} Z`;
    const mainLine = linePath(points);

    let bars = "";
    if (options.bars && options.bars.length) {
      const barMax = Math.max(...options.bars);
      bars = options.bars.map((v, i) => {
        const x = points[i][0] - 8;
        const h = (v / barMax) * 48;
        const y = height - padB - h;
        return `<rect x="${x}" y="${y}" width="16" height="${h}" rx="4" fill="rgba(179,38,64,.12)" />`;
      }).join("");
    }

    const markerCircles = points.map((p, idx) => {
      const r = idx === points.length - 1 ? 4.5 : 3;
      return `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="#B32640" />`;
    }).join("");

    svg.innerHTML = `
      <defs>
        <linearGradient id="${svgId}Area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(179,38,64,.18)" />
          <stop offset="100%" stop-color="rgba(179,38,64,.04)" />
        </linearGradient>
      </defs>
      ${tickEls}
      ${bars}
      <path d="${areaPath}" fill="url(#${svgId}Area)"></path>
      <path d="${mainLine}" fill="none" stroke="#B32640" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      ${markerCircles}
      <text x="${width - 122}" y="20" fill="#8a807b" font-size="11">Sample history</text>
      ${xEls}
    `;
  }

  function renderMarketCard() {
    const sample = marketSamples[state.period];
    const prices = sample.price;
    let values = prices;
    let yFormatter = (v) => v.toFixed(0);
    let caption = "This demonstration line chart is adapted from historical samples to explain returns, drawdown, and volatility.";

    if (state.marketMetric === "return") {
      values = returns(prices);
      yFormatter = (v) => v.toFixed(1) + "%";
      caption = "Cumulative return shows the total change since the start of the period, but a high return does not guarantee a comfortable holding experience.";
    } else if (state.marketMetric === "drawdown") {
      values = drawdowns(prices);
      yFormatter = (v) => v.toFixed(1) + "%";
      caption = "Maximum drawdown measures the decline from a period high and explains the difficulty of the holding experience, not just the final return.";
    } else if (state.marketMetric === "volatility") {
      values = volSeries(prices);
      yFormatter = (v) => v.toFixed(1) + "%";
      caption = "Volatility is not the same as loss, but larger swings can make emotion-driven decisions more likely.";
    } else {
      caption = "NAV history resembles the basic view on a real fund or ETF page and is a useful first step for understanding market movement.";
    }

    drawChart("marketChart", values, sample.labels, {
      yFormatter,
      bars: sample.volume
    });

    const latest = prices[prices.length - 1];
    const ret = percentChange(prices);
    const dd = maxDrawdown(prices);
    const vol = realizedVol(prices);

    const pEl = document.getElementById("marketStatPrice");
    const rEl = document.getElementById("marketStatReturn");
    const dEl = document.getElementById("marketStatDrawdown");
    const vEl = document.getElementById("marketStatVol");

    if (pEl) {
      pEl.textContent = "$" + fmtNumber(latest);
      pEl.className = "";
    }
    if (rEl) {
      rEl.textContent = fmtPct(ret);
      rEl.className = classifyValue(ret);
    }
    if (dEl) {
      dEl.textContent = fmtPct(dd);
      dEl.className = classifyValue(dd);
    }
    if (vEl) {
      vEl.textContent = fmtNumber(vol) + "%";
      vEl.className = "neutral";
    }

    const captionEl = document.getElementById("marketCaption");
    if (captionEl) {
      captionEl.textContent = caption + " Current period: " + state.period + ".";
    }
  }

  function getStoreSafe() {
    return fetch("/api/store")
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({}));
  }

  function renderWatchCard(store) {
    const profile = store.profile || {};
    const goals = store.goals || {};
    const moneybitRoot = store.moneybit || {};
    const type = profile.moneybitType || moneybitRoot.currentType || "Steady Saver";

    const target = Number(goals.targetAmount || 6000);
    const current = Number(goals.currentAmount || 2400);
    const goalPct = target > 0 ? Math.round(current / target * 100) : 40;

    const topicHeatMap = {
      "Steady Saver": 48,
      "Cash Guardian": 42,
      "Lottery Dreamer": 88,
      "Market Surfer": 67
    };

    const riskTempMap = {
      "Steady Saver": 32,
      "Cash Guardian": 28,
      "Lottery Dreamer": 81,
      "Market Surfer": 58
    };

    const topicHeat = topicHeatMap[type] || 52;
    const riskTemp = riskTempMap[type] || 46;

    const goalSeries = [8, 12, 18, 23, 29, 34, 37, goalPct];
    const topicSeries = [32, 38, 44, 55, 61, 67, 72, topicHeat];
    const riskSeries = [22, 24, 27, 34, 39, 43, 49, riskTemp];

    let values = goalSeries;
    let caption = "Prioritizing your emergency-fund goal is currently more appropriate than focusing only on short-term market moves.";
    let yFormatter = (v) => v.toFixed(0) + "%";

    if (state.watchMetric === "topic") {
      values = topicSeries;
      caption = "Interest in a theme is not a buy signal. First understand why it has your attention, then decide whether action is appropriate.";
    } else if (state.watchMetric === "risk") {
      values = riskSeries;
      caption = "A higher risk temperature calls for stronger discipline, position sizing, and emotional management."
    }

    drawChart("watchChart", values, ["Week 1","Week 2","Week 3","Week 4","Week 5","Week 6","Week 7","Today"], {
      yFormatter
    });

    const gEl = document.getElementById("watchStatGoal");
    const tEl = document.getElementById("watchStatTopic");
    const rEl = document.getElementById("watchStatRisk");

    if (gEl) {
      gEl.textContent = goalPct + "%";
      gEl.className = "positive";
    }
    if (tEl) {
      tEl.textContent = topicHeat + "/100";
      tEl.className = "neutral";
    }
    if (rEl) {
      rEl.textContent = riskTemp + "/100";
      rEl.className = riskTemp >= 60 ? "negative" : "neutral";
    }

    const captionEl = document.getElementById("watchCaption");
    if (captionEl) captionEl.textContent = caption + " Current MoneyBit persona: " + type + ".";
  }

  function renderLogCard(store) {
    const goals = store.goals || {};
    const memory = store.memory || {};

    const target = Number(goals.targetAmount || 6000);
    const current = Number(goals.currentAmount || 2400);
    const learned = Array.isArray(memory.learnedConcepts) ? memory.learnedConcepts : ["Money market funds", "Maximum drawdown", "Index funds"];
    const lastEmotion = memory.lastEmotion || "Slightly anxious";
    const lastBehavior = memory.lastBehavior || "Did not redeem impulsively";

    const savingSeries = [600, 980, 1200, 1560, 1820, 2050, 2240, current];
    const emotionSeries = [26, 34, 52, 48, 41, 35, 31, 28];
    const learningSeries = [1, 1, 2, 2, 3, 4, 4, learned.length];

    let values = savingSeries;
    let caption = "A savings trajectory shows whether a beginner is building real financial habits more clearly than short-term market movement does.";
    let yFormatter = (v) => "¥" + Number(v).toFixed(0);

    if (state.logMetric === "emotion") {
      values = emotionSeries;
      caption = "An emotional trend is not a financial metric, but it matters for supporting young users: anxiety calls for clearer explanations and reassurance.";
      yFormatter = (v) => Number(v).toFixed(0);
    } else if (state.logMetric === "learning") {
      values = learningSeries;
      caption = "Learning progress helps Xiaoxia understand what you already know and avoid repeating basic concepts.";
      yFormatter = (v) => Number(v).toFixed(0) + " items";
    }

    drawChart("logChart", values, ["Week 1","Week 2","Week 3","Week 4","Week 5","Week 6","Week 7","Today"], {
      yFormatter
    });

    const sEl = document.getElementById("logStatSaving");
    const eEl = document.getElementById("logStatEmotion");
    const lEl = document.getElementById("logStatLearning");

    if (sEl) {
      sEl.textContent = "¥" + current + "/" + target;
      sEl.className = "positive";
    }
    if (eEl) {
      eEl.textContent = lastEmotion;
      eEl.className = "neutral";
    }
    if (lEl) {
      lEl.textContent = learned.length + " items";
      lEl.className = "positive";
    }

    const captionEl = document.getElementById("logCaption");
    if (captionEl) {
      captionEl.textContent = caption + " Latest behavior note: " + lastBehavior + ".";
    }
  }

  function syncSegmentedButtons() {
    document.querySelectorAll('[data-group="period"] button').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.period === state.period);
    });
    document.querySelectorAll('[data-group="marketMetric"] button').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.marketMetric === state.marketMetric);
    });
    document.querySelectorAll('[data-group="watchMetric"] button').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.watchMetric === state.watchMetric);
    });
    document.querySelectorAll('[data-group="logMetric"] button').forEach(btn => {
      btn.classList.toggle("active", btn.dataset.logMetric === state.logMetric);
    });
  }

  async function renderAll() {
    syncSegmentedButtons();
    renderMarketCard();
    const store = await getStoreSafe();
    renderWatchCard(store);
    renderLogCard(store);
  }

  function bindButtons() {
    document.querySelectorAll('[data-group="period"] button').forEach(btn => {
      btn.addEventListener("click", async () => {
        state.period = btn.dataset.period;
        await renderAll();
      });
    });

    document.querySelectorAll('[data-group="marketMetric"] button').forEach(btn => {
      btn.addEventListener("click", async () => {
        state.marketMetric = btn.dataset.marketMetric;
        await renderAll();
      });
    });

    document.querySelectorAll('[data-group="watchMetric"] button').forEach(btn => {
      btn.addEventListener("click", async () => {
        state.watchMetric = btn.dataset.watchMetric;
        await renderAll();
      });
    });

    document.querySelectorAll('[data-group="logMetric"] button').forEach(btn => {
      btn.addEventListener("click", async () => {
        state.logMetric = btn.dataset.logMetric;
        await renderAll();
      });
    });

    const adviceBtn = document.getElementById("sampleAdviceBtn");
    if (adviceBtn) {
      adviceBtn.addEventListener("click", () => {
        const chatNav = [...document.querySelectorAll(".nav-item")].find(btn => btn.dataset.page === "chat");
        if (chatNav) chatNav.click();

        setTimeout(() => {
          const input = document.getElementById("userInput");
          const send = document.getElementById("sendBtn");
          if (input) {
            input.value = "Use the historical sample market data, my watchlist, and my financial journal on the dashboard to create today's financial-companion guidance. Clearly state that this is historical sample data for demonstration only and does not represent live markets or investment advice.";
          }
          if (send) send.click();
        }, 160);
      });
    }
  }

  window.addEventListener("DOMContentLoaded", async () => {
    bindButtons();
    await renderAll();
    setInterval(async () => {
      await renderAll();
    }, 6000);
  });
})();
