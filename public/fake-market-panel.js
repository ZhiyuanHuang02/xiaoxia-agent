const fakeSeries = {
  hot: {
    heat: {
      values: [62, 66, 70, 76, 82, 79, 86],
      caption: "The simulated popularity index is rising, but popularity is not a buy signal. Xiaoxia will remind you to check your risk tolerance and position size first."
    },
    volatility: {
      values: [18, 22, 20, 28, 34, 30, 37],
      caption: "Simulated volatility is increasing. Use it to review whether you can tolerate short-term price swings."
    },
    drawdown: {
      values: [0, -1, -2, -5, -4, -7, -6],
      caption: "The simulated maximum drawdown is widening. Drawdown reflects how difficult the holding experience can feel, not just the final return."
    }
  },
  watch: {
    goal: {
      values: [10, 16, 22, 27, 33, 37, 40],
      caption: "The emergency-fund goal is about 40% complete, so continuing to build a cash safety net may be more appropriate."
    },
    topic: {
      values: [45, 48, 52, 58, 63, 67, 66],
      caption: "Interest in the simulated theme is increasing. Watching is not the same as buying—understand the risk and time horizon first."
    },
    risk: {
      values: [30, 32, 38, 46, 50, 54, 58],
      caption: "The simulated risk alert is elevated, suggesting extra discipline around trends and impulsive decisions."
    }
  },
  log: {
    saving: {
      values: [8, 14, 20, 26, 31, 36, 40],
      caption: "Savings progress is steady this month. Advancing the goal matters more than short-term market moves."
    },
    emotion: {
      values: [22, 26, 45, 40, 34, 28, 24],
      caption: "Simulated emotional pattern: anxiety rose during a market decline and then gradually eased."
    },
    learning: {
      values: [1, 1, 2, 2, 3, 3, 4],
      caption: "The simulated learning record is growing, with concepts such as money market funds and maximum drawdown now understood."
    }
  }
};

function drawFakeChart(svgId, values) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const width = 320;
  const height = 150;
  const padX = 18;
  const padY = 20;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padX + i * ((width - padX * 2) / (values.length - 1));
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return [x, y];
  });

  const line = points.map(p => p.join(",")).join(" ");
  const area = [[padX, height - padY], ...points, [width - padX, height - padY]]
    .map(p => p.join(","))
    .join(" ");

  svg.innerHTML = `
    <polygon points="${area}" fill="rgba(179,38,64,0.10)"></polygon>
    <polyline points="${line}" fill="none" stroke="#B32640" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#B32640"></circle>`).join("")}
    <text x="18" y="18" fill="#746B67" font-size="11">Faked data</text>
  `;
}

function setFakeMetric(group, metric) {
  const data = fakeSeries[group][metric];
  if (!data) return;

  const chartId = group + "Chart";
  const captionId = group + "Caption";

  drawFakeChart(chartId, data.values);

  const caption = document.getElementById(captionId);
  if (caption) caption.textContent = data.caption;

  document.querySelectorAll(`[data-chart-group="${group}"] button`).forEach(btn => {
    btn.classList.toggle("active", btn.dataset.metric === metric);
  });
}

function bindFakeTabs() {
  document.querySelectorAll(".fake-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".fake-tabs").dataset.chartGroup;
      setFakeMetric(group, btn.dataset.metric);
    });
  });

  const dailyBtn = document.getElementById("fakeDailyAdviceBtn");
  if (dailyBtn) {
    dailyBtn.addEventListener("click", () => {
      const chatNav = [...document.querySelectorAll(".nav-item")].find(btn => btn.dataset.page === "chat");
      if (chatNav) chatNav.click();

      setTimeout(() => {
        const input = document.getElementById("userInput");
        const send = document.getElementById("sendBtn");
        if (input) {
          input.value = "Use the simulated trends, my watchlist, and my financial journal on the dashboard to create today's financial-companion guidance. Clearly state that the data is for demonstration only and does not represent live markets.";
        }
        if (send) send.click();
      }, 150);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setFakeMetric("hot", "heat");
  setFakeMetric("watch", "goal");
  setFakeMetric("log", "saving");
  bindFakeTabs();
});
