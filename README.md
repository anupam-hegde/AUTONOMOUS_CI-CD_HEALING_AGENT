# 🔧 Autonomous CI/CD Healing Agent

> **RIFT 2026 Hackathon — AI/ML • DevOps Automation • Agentic Systems Track**

An autonomous DevOps agent that detects, fixes, and verifies code issues in GitHub repositories, with a React dashboard for monitoring.

## 📁 Project Structure

```
├── frontend/          # React + Vite Dashboard
│   ├── src/
│   │   ├── components/    # Dashboard panels (Input, Summary, Fixes, Timeline, Score)
│   │   ├── App.jsx        # Main application
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── backend/           # Healing Agent API & Workers
│   ├── src/
│   │   ├── agents/        # Multi-agent system (Analyzer, Fixer, Committer, Verifier)
│   │   ├── integrations/  # GitHub API, CI/CD monitoring
│   │   ├── services/      # Queue, database, utilities
│   │   ├── utils/         # Helpers
│   │   └── index.js       # Express server entry point
│   └── package.json
│
├── database/          # Prisma schema & migrations
│   └── schema.prisma
│
├── worker/            # (Legacy) Original compliance worker
└── web/               # (Legacy) Original compliance dashboard
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Redis (for BullMQ job queue)
- Docker (for sandboxed code execution)
- PostgreSQL (Supabase recommended)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Database Setup
```bash
cd database
npx prisma generate
npx prisma db push
```

## 🏗️ Architecture

```
User Input (Dashboard)
      │
      ▼
  Express API ──► BullMQ Queue
                      │
                      ▼
              ┌─────────────────┐
              │  Orchestrator   │
              │     Agent       │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Analyzer │ │  Fixer   │ │ Committer│
    │  Agent   │ │  Agent   │ │  Agent   │
    └──────────┘ └──────────┘ └──────────┘
          │            │            │
          └────────────┼────────────┘
                       ▼
                ┌──────────┐
                │ Verifier │
                │  Agent   │
                └──────────┘
                       │
                       ▼
              CI/CD Pass? ──► Loop or Done
```

## 🔧 Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | React + Vite |
| Backend | Express.js + Node.js |
| Agent Framework | TBD (LangGraph / CrewAI / AutoGen) |
| AI | Google Gemini |
| Database | Prisma + Supabase (PostgreSQL) |
| Queue | BullMQ + Redis |
| Sandboxing | Docker |

## 👥 Team
- **Team Name**: _TBD_
- **Team Leader**: _TBD_

## 📝 License
MIT
