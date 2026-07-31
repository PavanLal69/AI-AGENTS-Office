<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Algorand-TestNet-000000?style=for-the-badge&logo=algorand&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

# 🏢 Pixel Office AI Agents

> **10 specialized AI agents working together in a virtual pixel office to collaboratively build software in real time.**

A full-stack multi-agent collaborative software engineering system where each AI agent has a unique role, sits in a dedicated cubicle, and physically moves across the office as they work. Built with Node.js, Python FastAPI, HTML5 Canvas, WebSocket, and Algorand blockchain settlement.

🌐 **Live Demo**: [pixel-office-ai-agents.vercel.app](https://pixel-office-ai-agents.vercel.app)

---

## ✨ Features

- **🏢 2D Pixel Art Office** — Interactive HTML5 Canvas with 24×16 tile grid, cubicles, furniture, and animated agent sprites
- **🤖 10 Specialized AI Agents** — Each powered by a different LLM (Claude, GPT-4o, Gemini, DeepSeek, Nemotron, Llama)
- **🧠 Ruflo Swarm DAG Router** — Queen Router creates a Directed Acyclic Graph of tasks; worker agents execute in parallel
- **💳 X402 HTTP Payment Protocol** — Transparent per-token billing with itemized USD invoices for every build
- **⛓️ Algorand Blockchain Settlement** — QR-based Pera Wallet login and AlgoKit smart contract deployment on TestNet
- **🔑 Multi-Key Vault** — Round-robin load balancing across multiple OpenRouter API keys
- **🔌 Real-Time WebSocket** — Live agent movement, status updates, and build progress via Socket.IO
- **🐍 Dual Backend** — Node.js (Express) + Python (FastAPI) running in parallel
- **🐳 Docker Ready** — One-command deployment with `docker-compose up`
- **✅ Fully Tested** — 13/13 integration tests passing (Node.js + Python)

---

## 🤖 Meet the Agents

| # | Agent | Role | API Model (OpenRouter) | Task Category |
|---|-------|------|------------------------|---------------|
| 1 | **Alex Vance** | Lead System Architect (Queen) | NVIDIA Nemotron 3 Ultra 550B | Thinking & Planning |
| 2 | **Maya Lin** | Frontend Pixel Specialist | Recraft V4.1 Vector | Image Gen & Graphics |
| 3 | **Devon Miller** | Backend Core Engineer | Cohere North Mini Code | Coding & Implementation |
| 4 | **Sam Carter** | QA & Security Auditor | Ling 3.0 Flash | Researching & Analysis |
| 5 | **Riley Davis** | DevOps & Cloud Specialist | Recraft V4.1 Vector | Image Gen & Graphics |
| 6 | **Marcus Vance** | Data Systems Specialist | Cohere North Mini Code | Coding & Implementation |
| 7 | **Elena Rostova** | Cyber Security Sentinel | NVIDIA Nemotron 3 Ultra 550B | Thinking & Planning |
| 8 | **Viktor Krum** | Machine Learning Engineer | Recraft V4.1 Vector | Image Gen & Graphics |
| 9 | **Zara Chen** | Site Reliability Engineer | Ling 3.0 Flash | Researching & Analysis |
| 10 | **Kai Tanaka** | Product & UX Architect | Recraft V4.1 Vector | Image Gen & Graphics |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│               BROWSER (Frontend)                    │
│  HTML5 Canvas Pixel Office + WebSocket Client       │
├─────────────────────────────────────────────────────┤
│              NODE.JS SERVER (:3000)                 │
│  Express + Socket.IO + Agent Router + X402 Billing  │
├──────────────┬──────────────────────────────────────┤
│  Key Vault   │     Ruflo Swarm DAG Router           │
│  (Multi-Key) │  Queen → Workers → Consensus → Gen  │
├──────────────┴──────────────────────────────────────┤
│           PYTHON FASTAPI BACKEND (:8000)            │
│  Mirror Agents + LLM Clients + Memory Store         │
├─────────────────────────────────────────────────────┤
│           OPENROUTER LLM APIs                       │
│  Claude · GPT-4o · Gemini · DeepSeek · Nemotron    │
└─────────────────────────────────────────────────────┘
```

### Ruflo Swarm DAG Pipeline

1. **Queen DAG Generation** — Alex (Queen) analyzes the prompt and creates a task graph
2. **Security Audit** — Elena validates zero-trust privacy and key isolation
3. **Worker Mesh Execution** — 8 workers execute in parallel (QA, SRE, Data, Backend, UI, UX, ML, DevOps)
4. **Consensus Voting** — 3-node vote (Queen + QA + Security) with confidence scores
5. **X402 Billing** — Per-agent token costs calculated, USD invoice generated
6. **Code Synthesis** — Full HTML/CSS/JS application generated and served on port 3005

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.10+
- **OpenRouter API Key** ([openrouter.ai](https://openrouter.ai))

### Installation

```bash
# Clone the repository
git clone https://github.com/PavanLal69/AI-AGENTS-Office.git
cd AI-AGENTS-Office

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r python_backend/requirements.txt
```

### Environment Setup

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Running Locally

```bash
# Start the main Node.js server (port 3000)
npm start

# Start the Python FastAPI backend (port 8000)
npm run py-start

# Start the Ctrl/Cubicles daemon (port 3001)
npm run daemon
```

Then open **http://localhost:3000** in your browser.

### Docker

```bash
docker-compose up
```

This starts all services on ports **3000**, **3005**, and **8000**.

---

## 💳 X402 Billing Protocol

Every AI build generates a transparent, itemized invoice:

| Model | Prompt Rate (/1K tokens) | Completion Rate (/1K tokens) |
|-------|--------------------------|------------------------------|
| NVIDIA Nemotron 550B | $0.0008 | $0.0024 |
| Cohere Mini | $0.0003 | $0.0010 |
| Ling 3.0 Flash | $0.00015 | $0.0006 |
| Recraft V4.1 Vector | $0.0004 | $0.0015 |

- HTTP 402 headers: `X-402-Cost-USD`, `X-402-Token-Count`
- Settlement via **Algorand Pera Wallet** QR scan
- Persistent billing ledger in `x402_billing_ledger.json`

---

## ⛓️ Algorand & Web3

- **Pera Wallet QR Login** — Scan to connect your Algorand wallet
- **AlgoKit Smart Contracts** — PyTeal contracts compiled and deployed to TestNet
- **TestNet Dispenser** — Free ALGO tokens for development
- **Deployed App ID**: `#768265132` on Algorand TestNet

---

## 📁 Project Structure

```
AI-AGENTS-Office/
├── public/                    # Frontend assets
│   ├── index.html             # Main pixel office UI
│   ├── css/styles.css         # Glassmorphic design system
│   └── js/main.js             # Canvas renderer + WebSocket client
├── server/
│   ├── server.js              # Express + Socket.IO entry point
│   ├── data/
│   │   └── office_layout.json # 10-agent office layout & cubicle map
│   └── src/
│       ├── agent_manager.js   # Agent lifecycle & movement
│       ├── agent_router.js    # Ruflo Swarm DAG pipeline
│       ├── llm_clients.js     # OpenRouter multi-model API client
│       ├── key_vault.js       # Multi-key vault with load balancing
│       ├── key_balancer.js    # Round-robin key rotation
│       ├── x402_billing.js    # X402 payment protocol engine
│       ├── web_generator.js   # Full-stack app code synthesizer
│       ├── memory_bank.js     # AgentDB shared memory
│       ├── memory_store.js    # Persistent memory indexing
│       ├── vibekit.js         # VibeKit theming engine
│       ├── ctrl_daemon_bridge.js  # Daemon WebSocket bridge
│       ├── git_service.js     # Git operations handler
│       ├── workspace_tools.js # File system workspace tools
│       └── build_output_server.js # Generated app preview (:3005)
├── python_backend/
│   ├── main.py                # FastAPI entry point
│   ├── agent_manager.py       # Python mirror agents
│   ├── llm_clients.py         # Python OpenRouter client
│   ├── key_vault.py           # Python key management
│   ├── memory_store.py        # Python memory store
│   ├── workspace_tools.py     # Python workspace utilities
│   ├── git_service.py         # Python git operations
│   ├── test_backend.py        # Python integration tests
│   └── requirements.txt       # Python dependencies
├── my-first-algorand-app/     # AlgoKit smart contract project
│   ├── smart_contracts/
│   │   └── hello_world.py     # PyTeal smart contract
│   └── deploy.js              # TestNet deployment script
├── tests/
│   └── backend.test.js        # Node.js integration tests
├── Dockerfile                 # Production container config
├── docker-compose.yml         # Multi-service orchestration
├── vercel.json                # Vercel deployment config
├── package.json               # Node.js project manifest
├── memory_bank.json           # AgentDB persistent memory
└── x402_billing_ledger.json   # X402 billing history
```

---

## 🧪 Testing

```bash
# Run all tests (Node.js + Python)
npm test

# Node.js tests only
node tests/backend.test.js

# Python tests only
python python_backend/test_backend.py
```

**Results**: ✅ 7/7 Node.js tests + ✅ 6/6 Python tests = **13/13 passing**

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm run deploy:office
```

### Docker

```bash
docker-compose up -d
```

### LAN Access

All servers bind to `0.0.0.0`, making them accessible on your local network:

| Service | URL |
|---------|-----|
| Main Dashboard | `http://<your-ip>:3000` |
| Generated Preview | `http://<your-ip>:3005` |
| FastAPI Gateway | `http://<your-ip>:8000` |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <strong>Pavan Lal</strong>
</p>
