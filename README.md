# Xiaoxia Financial Companion Agent

An AI financial companion designed for young adults. It explains personal-finance concepts, highlights risk, breaks goals into practical steps, supports users through emotional decisions, and encourages regular reflection.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Add your `LLM_API_KEY` to `.env`
4. Start the app: `npm start`
5. Open `http://localhost:3000`

If an LLM endpoint is unavailable, enable demo mode in `.env`.

## Security

`.env`, `node_modules`, and the runtime-generated `data/store.json` are excluded from Git. Never commit API keys or real users' conversations and financial information to a public repository.

This project is for financial education and risk awareness only. It does not provide personalized investment advice.
