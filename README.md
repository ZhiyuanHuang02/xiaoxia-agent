# 小夏理财伙伴 Agent

面向年轻人的 AI 理财陪伴 Agent，提供理财知识解释、风险提示、目标拆解、情绪陪伴与复盘建议。

## 本地运行

1. 安装依赖：`npm install`
2. 复制环境变量模板：将 `.env.example` 复制为 `.env`
3. 在 `.env` 中填写 `LLM_API_KEY`
4. 启动：`npm start`
5. 打开 `http://localhost:3000`

如果没有可用的大模型接口，可以在 `.env` 中启用演示模式。

## 安全说明

`.env`、`node_modules` 和运行时生成的 `data/store.json` 不会提交到 GitHub。请勿把 API Key 或真实用户的聊天、财务信息提交到公开仓库。

本项目仅用于理财教育和风险提示，不构成具体投资建议。
