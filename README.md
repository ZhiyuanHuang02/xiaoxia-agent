# Xiaoxia Financial Companion Agent

[**Live Demo**](https://zhiyuanhuang02.github.io/xiaoxia-agent/)

Xiaoxia is an AI financial companion designed for young adults. It explains
personal-finance concepts, highlights risk, breaks goals into practical steps,
supports users through emotional decisions, and encourages regular reflection.

## Features

- Interactive growth dashboard built with historical sample data
- Four MoneyBit personas that shape tone, risk reminders, and suggested actions
- Context-aware companion chat for education, planning, and reflection
- Editable user profile, companion preferences, and financial goals
- Financial journal for learned concepts, behavior changes, and monthly progress
- Explicit safety guardrails against return promises, market predictions, and
  specific buy-or-sell instructions
- Automatic mock fallback when a live language-model endpoint is unavailable

## Live Demo

The public GitHub Pages deployment runs in browser-only demo mode. It uses
sample data and locally generated educational responses; it does not call
DeepSeek or expose an API key. Each visitor's edits are stored only in that
browser.

For local development, the Node.js server can optionally connect to a compatible
language-model endpoint such as DeepSeek through environment variables.

## Run Locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Add your `LLM_API_KEY` and verify the endpoint and model settings
4. Start the app: `npm start`
5. Open `http://localhost:3000`

To run without a live language model, set `DEMO_MODE=true` in `.env`.

## Project Structure

```text
.
├── public/
│   ├── assets/moneybit/       # MoneyBit persona artwork
│   ├── index.html             # Main application interface
│   ├── app.js                 # Profile, goals, journal, and chat interactions
│   ├── market-dashboard-v26.js # Historical sample market dashboard
│   ├── logic-panel.js         # Companion reasoning panel
│   └── styles.css             # Application styling
├── data/.gitkeep              # Runtime data directory placeholder
├── server.js                  # Express API and optional LLM integration
├── .env.example               # Environment-variable template
├── package.json               # Node.js scripts and dependencies
└── README.md
```

The public site is deployed from the `gh-pages` branch. The `main` branch keeps
the full local Node.js application.

## Security

`.env`, `node_modules`, and the runtime-generated `data/store.json` are excluded
from Git. Never commit API keys, real conversations, or personal financial
information to a public repository. Do not place a DeepSeek API key in frontend
JavaScript because every visitor would be able to read it.

## Disclaimer

Xiaoxia is an educational prototype for financial literacy, risk awareness,
goal planning, and behavioral reflection. It does not provide personalized
investment, legal, tax, or accounting advice. The dashboard uses historical or
simulated sample data rather than live market data. Nothing in this project is a
recommendation to buy, sell, or hold a financial product, and no result or return
is promised.
