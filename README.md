# Hyper-Local AI Business Advisor System (`sih-v2`)

[![Vercel Frontend](https://img.shields.io/badge/Frontend-Vercel%20PWA-0A2540?logo=vercel)](https://vercel.com)
[![Render Backend](https://img.shields.io/badge/Backend-Render%20FastAPI-46E3B7?logo=render)](https://render.com)
[![Design System](https://img.shields.io/badge/Theme-Antigravity%20Design%20System-D96B27)](./antigravity_theme_specification.md)
[![License](https://img.shields.io/badge/License-MIT-87A96B)]()

An industry-ready, grounded AI decision-making and business lifecycle companion for rural and semi-urban Indian entrepreneurs (Smart India Hackathon).

> **Architectural Golden Rule:**
> *"The LLM explains; the system verifies and calculates."*
> All financial arithmetic (EMIs, project costs, break-even), government schemes, and census populations come from deterministic formulas and official circulars—zero LLM hallucinations.

---

## 🎨 Visual Design: Antigravity Theme Specification

The interface is strictly styled according to [`antigravity_theme_specification.md`](./antigravity_theme_specification.md):
- **Canvas (60%):** Warm Cream (`#FDFBF7`) for eye-comfort in bright outdoor rural settings.
- **Structure (30%):** Deep Navy Blue (`#0A2540`) & Dark Charcoal (`#2B1C03`) for high-contrast, commanding hierarchy.
- **Accents (10%):** Burnt Orange (`#D96B27`) for key CTAs & Earthy Sage Green (`#87A96B`) for success states and badges.
- **Typography Pairing:**
  - **Headings & Display:** `Lora` (Google Font — Serif)
  - **Body, UI & Numbers:** `Montserrat` (Google Font — Sans-Serif)
  - **Accessibility:** High-contrast WCAG AAA compliance (16.1:1 body contrast ratio).

---

## 📁 Repository Structure

```text
SIH/
├── .gitignore
├── README.md
├── render.yaml                                    # Render Infrastructure-as-Code
├── Hyper_Local_AI_Business_Advisor_System_Design.md # Core 2,166-line System Design
├── antigravity_theme_specification.md             # Visual & Typography Specification
│
├── frontend/                                      # Next.js PWA (Deployable on Vercel)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts                         # Antigravity design tokens
│   ├── postcss.config.mjs
│   ├── public/
│   │   └── manifest.json                          # PWA manifest for offline install
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css                        # Lora + Montserrat font imports
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                           # Interactive Advisor Dashboard
│   │   ├── lib/
│   │   │   ├── api.ts                             # Typed backend API client
│   │   │   └── db.ts                              # Dexie.js IndexedDB offline cache
│   │   └── types/
│   │       └── index.ts                           # Shared data contracts
│   └── .env.example
│
└── backend/                                       # Python FastAPI (Deployable on Render)
    ├── requirements.txt
    ├── Procfile                                   # PaaS start command
    ├── render.yaml
    ├── app/
    │   ├── main.py                                # FastAPI app with CORS & health checks
    │   ├── core/
    │   │   └── config.py                          # Environment settings
    │   ├── models/
    │   │   └── schemas.py                         # Pydantic models (Evidence Object, DPR)
    │   ├── engines/                               # Deterministic calculation engines
    │   │   ├── financial.py                       # Project cost, margin, EMI & cashflow
    │   │   ├── schemes.py                         # PMEGP, MUDRA, PMFME rule engine
    │   │   ├── feasibility.py                     # Multi-factor feasibility scoring
    │   │   ├── time_machine.py                    # Seasonality & launch window optimizer
    │   │   ├── cluster.py                         # Local economic ring matcher
    │   │   ├── dpr.py                             # 29-Section bankable DPR compiler
    │   │   └── lifecycle.py                       # Health scores & risk alert system
    │   ├── tools/
    │   │   └── agent_tools.py                     # Strict 23 Agent Tool Contracts (§25)
    │   ├── agent/
    │   │   └── crew_orchestrator.py               # CrewAI & Gemini evidence orchestrator
    │   └── api/
    │       └── v1/
    │           ├── router.py
    │           └── endpoints/                     # advisor, schemes, goals, clusters...
    ├── tests/
    │   └── test_engines.py                        # Pytest test suite (100% pass)
    └── .env.example
```

---

## 🚀 How to Host on Vercel (Frontend)

1. Open [Vercel Dashboard](https://vercel.com/new).
2. Import the `manish1-irl/SIH-v2` repository.
3. Configure the project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** Click **Edit** and choose `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. In **Environment Variables**, configure:
   - `NEXT_PUBLIC_API_BASE_URL`: The deployed URL of your Render backend (e.g. `https://sih-ai-advisor-backend.onrender.com`)
5. Click **Deploy**.

---

## 🚀 How to Host on Render (Backend)

### Option A: Automatic via Blueprint
1. In Render, select **New -> Blueprint**.
2. Connect `manish1-irl/SIH-v2`.
3. Render will read the root `render.yaml` automatically and configure the `sih-ai-advisor-backend` web service.

### Option B: Manual Web Service
1. In Render, select **New -> Web Service**.
2. Connect `manish1-irl/SIH-v2`.
3. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.9` or `3.13.0`
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `SUPABASE_URL`: *(Your Supabase Project URL)*
   - `SUPABASE_KEY`: *(Your Supabase API Key)*
5. Click **Create Web Service**.

---

## 💻 Local Development Setup

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
pytest tests/test_engines.py
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Antigravity advisor interface.
