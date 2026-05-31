# FinSim Backend (`@finsim/api`)

Express API that owns **authentication**, **game session lifecycle**, the **financial simulation engine**, and **AI features** (Socratic advisor + post-game debrief via Groq, with RAG over a Supabase pgvector knowledge base). Also handles **shareable session links**.

The frontend is a thin client: it sends choices and renders whatever the API returns. Never duplicate simulation logic in the web app.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Folder Structure](#folder-structure)
- [Request Flow](#request-flow)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Simulation Engine](#simulation-engine)
- [AI & RAG](#ai--rag)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Development Tips](#development-tips)

---

## Quick Start

```bash
# From repo root
cp backend/.env.example backend/.env
# Set MONGO_URI and JWT_SECRET at minimum

pnpm install
pnpm dev:backend
```

Verify: `curl http://localhost:8081/api/health`

The API expects the frontend at `CLIENT_URL` (default `http://localhost:3000`) for CORS with credentials.

---

## Environment Variables

Copy `backend/.env.example` → `backend/.env`. Keys must match exactly for the production deploy validation script.

| Variable               | Required | Description                                 |
| ---------------------- | -------- | ------------------------------------------- |
| `MONGO_URI`            | Yes      | MongoDB connection string                   |
| `PORT`                 | Yes      | Listen port (default `8081` in example)     |
| `JWT_SECRET`           | Yes      | Secret for signing httpOnly auth cookies    |
| `NODE_ENV`             | Yes      | `development` or `production`               |
| `CLIENT_URL`           | No       | Frontend origin for CORS (default `:3000`)  |
| `GROQ_API_KEY`         | For AI   | Groq API key for advisor + debrief          |
| `SUPABASE_URL`         | For RAG  | Supabase project URL                        |
| `SUPABASE_SERVICE_KEY` | For RAG  | Service role key (server-side only)         |
| `SUPABASE_ANON_KEY`    | For RAG  | Anon key (used by some RAG scripts)         |

Without Groq/Supabase, core gameplay still works; advisor and debrief calls will error.

---

## Folder Structure

```
backend/
├── server.js                     # Express app, middleware, route mounting, listen
├── .env.example
├── DEPLOY.md                     # GitHub Actions → VPS deployment guide
├── package.json
├── scripts/
│   ├── deploy.sh                 # Used by CI on the VPS
│   └── validate-env.sh           # Ensures .env keys match .env.example
└── src/
    ├── routes/
    │   ├── auth.js               # POST signin, login, logout; GET me
    │   ├── setup.js              # POST/PUT player setup profile
    │   ├── game.js               # Session CRUD, rounds, advisor, debrief
    │   ├── ai.js                 # Standalone debrief endpoint
    │   └── share.js              # Public share slug routes
    ├── controller/
    │   ├── game.js               # Session lifecycle handlers
    │   ├── advisor.js            # On-demand advisor handler
    │   ├── debrief.js            # Debrief generation handler
    │   └── share.js              # Share link creation + retrieval
    ├── middleware/
    │   └── authMiddleware.js     # JWT from httpOnly cookie → req.user
    ├── Models/
    │   ├── auth.js               # User schema
    │   ├── setup.js              # Onboarding/setup profile
    │   ├── GameSession.js        # Authoritative session + simState
    │   └── Onboarding.js         # Extended onboarding data
    ├── services/
    │   ├── simulation/           # Core game engine (see below)
    │   │   ├── index.js          # Re-exports engine + metrics helpers
    │   │   ├── engine.js         # createNewGame, applyChoice
    │   │   ├── events.js         # Event generation
    │   │   ├── scenarios.js      # Scenario definitions + modifiers
    │   │   ├── metrics.js        # toUIMetrics, deriveScenarioId
    │   │   ├── math.js           # Financial calculations
    │   │   ├── prng.js           # Deterministic randomness
    │   │   └── setupProfile.js   # Career/salary → starting state
    │   ├── debrief/              # Debrief payload building + persistence
    │   ├── advisor/              # Advisor call counting + persistence
    │   └── share/                # Share slug generation + resolution
    ├── ai/
    │   ├── advisor.js            # Groq Socratic advisor prompt
    │   └── debrief.js            # Groq debrief generation prompt
    ├── rag/
    │   ├── knowledge/            # Source .txt + finsim-internal.json
    │   ├── chunk-knowledge.js    # Split sources into chunks
    │   ├── embed-and-seed.js     # Embed + upsert to Supabase
    │   ├── retriever.js          # Query pgvector at inference time
    │   ├── chunks.json           # Generated chunk manifest
    │   └── 001_pgvector.sql      # Supabase schema for embeddings
    └── utils/
        └── dbConnection.js       # Mongoose connect helper
```

---

## Request Flow

```
HTTP request
    │
    ▼
server.js
    ├── cors + json + cookie-parser
    ├── rate limiter (general 100/15min · AI 20/min)
    └── route mount
            │
            ├── /api/auth/*     authMiddleware optional per route
            ├── /api/setup      authMiddleware required
            ├── /api/game/*     authMiddleware required
            ├── /api/ai/*       authMiddleware required (tighter rate limit)
            └── /api/share/*    no auth required (public)
                    │
                    ▼
            controller/*.js
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   Models/    services/      ai/ + rag/
   (MongoDB)  simulation     (Groq + Supabase)
```

**Auth:** JWT stored in an httpOnly cookie named `token`. `authMiddleware` verifies it and attaches `req.user` to the request.

**Game sessions:** `GameSession` stores `simState` (the full internal simulation state), `currentEvent`, `currentNarrative`, and an append-only `rounds[]` audit trail. Clients receive UI-shaped metrics and events only — raw `simState` is never sent to the browser.

---

## API Reference

Base URL: `http://localhost:8081/api`

All game and setup routes require a valid auth cookie unless noted.

### Health

| Method | Path      | Auth | Description                          |
| ------ | --------- | ---- | ------------------------------------ |
| GET    | `/health` | No   | Returns `{ success: true, message }` |

### Auth — `/api/auth`

| Method | Path      | Body                           | Description       |
| ------ | --------- | ------------------------------ | ----------------- |
| POST   | `/signin` | `{ name, email, password }`   | Register account  |
| POST   | `/login`  | `{ email, password }`         | Log in            |
| GET    | `/me`     | —                              | Current user      |
| POST   | `/logout` | —                              | Clear auth cookie |

### Setup — `/api`

| Method | Path     | Body                           | Description               |
| ------ | -------- | ------------------------------ | ------------------------- |
| POST   | `/setup` | `{ name, confidence, goal }`  | Create setup profile      |
| PUT    | `/setup` | `{ name, confidence, goal }`  | Update existing profile   |

### Game — `/api/game`

| Method | Path                     | Description                                       |
| ------ | ------------------------ | ------------------------------------------------- |
| POST   | `/session`               | Start game — returns `sessionId`, event, metrics  |
| POST   | `/session/round`         | Submit `{ sessionId, choice: "left"\|"right" }`   |
| GET    | `/session/:id`           | Reload active session view                        |
| POST   | `/session/:id/advisor`   | On-demand advisor (max 4 calls per session)       |
| GET    | `/session/:id/debrief`   | Lazy-generate + return debrief payload            |
| POST   | `/session/:id/abandon`   | Mark session abandoned (preserves history)        |
| GET    | `/sessions`              | List authenticated user's past sessions           |
| GET    | `/sessions/userData`     | Aggregated stats for profile / dashboard          |

#### Create Session — Request Body

```json
{
  "playerName": "Alex",
  "career": "Software Engineer",
  "startSalary": 75000,
  "goal": "build-wealth",
  "climateLabel": "Stable"
}
```

#### Create Session — Response Shape

```json
{
  "success": true,
  "sessionId": "...",
  "currentRound": 1,
  "metrics": {
    "netWorth": 800,
    "creditScore": 680,
    "totalDebt": 0,
    "monthlySurplus": 1200,
    "emergencyFundMonths": 0,
    "stressIndex": 20,
    "is401kActive": false
  },
  "event": {
    "id": "...",
    "title": "...",
    "left": {},
    "right": {},
    "crisis": false
  },
  "narrative": { "headline": "...", "advisorHint": "..." },
  "scenarioId": "baseline",
  "ageYears": 22
}
```

#### Submit Round — Response

Same shape as create session, plus optional `debrief` snippet. When `status: "completed"`, the client navigates to `/debrief`.

### Share — `/api/share`

| Method | Path          | Auth | Description                        |
| ------ | ------------- | ---- | ---------------------------------- |
| POST   | `/`           | Yes  | Create a share slug for a session  |
| GET    | `/:slug`      | No   | Retrieve shared session data       |

### AI — `/api/ai`

| Method | Path       | Description                   |
| ------ | ---------- | ----------------------------- |
| POST   | `/debrief` | Standalone debrief generation |

---

## Data Models

### User (`Models/auth.js`)

Standard email/password account. Password hashed with bcrypt. Referenced by `GameSession.userId` and `Setup.userId`.

### Setup (`Models/setup.js`)

Player preferences from early onboarding: `name`, `confidence`, `goal`. One document per user.

### GameSession (`Models/GameSession.js`)

The central document for a game run. Key fields:

| Field               | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `userId`            | Owner — all queries scoped to authenticated user          |
| `status`            | `active` · `completed` · `abandoned`                      |
| `currentRound`      | 1–10 while playing; advances after each choice            |
| `simState`          | Full internal simulation state (server-side only)         |
| `currentEvent`      | Event card currently shown to the player                  |
| `rounds[]`          | Audit trail: choice, metrics before/after, narrative      |
| `advisorMessages[]` | Persisted advisor responses                               |
| `advisorCallsUsed`  | Capped at 4 per session                                   |
| `debriefPayload`    | Cached debrief once generated (lazy)                      |

### Onboarding (`Models/Onboarding.js`)

Extended player profile: archetype, confidence level, primary goal, past game statistics. Used by the advisor to personalize Socratic questions.

---

## Simulation Engine

Location: `src/services/simulation/`

### Entry Points

```js
const { createNewGame, applyChoice, deriveScenarioId, toUIMetrics } =
  require('./src/services/simulation');

// Start a session
const step = createNewGame({
  scenarioId: 'baseline',
  seed: 12345,
  startSalary: 75000,
  climateLabel: 'Stable',
  career: 'Software Engineer',
});
// → { state, event, narrative, metrics }

// Apply a player choice
const next = applyChoice({ state: step.state, choice: 'left' });
// → { state, event, narrative, metrics, completed?, debrief? }
```

### Scenarios

Defined in `scenarios.js`. Available IDs:

- `baseline`
- `recession`
- `startup-founder`
- `immigrant-household`
- `single-parent`

`deriveScenarioId(session)` maps the player's `goal`, `climateLabel`, and `startSalary` to a scenario at session creation time.

### Determinism

Each session is assigned `simSeed = hashStringToSeed(session._id)`. The PRNG in `prng.js` ensures identical choices always produce identical outcomes for the same session, making results reproducible and shareable.

### Choice Format

The API accepts `"left"` / `"right"` (UI swipe directions). `"A"` / `"B"` are normalized internally for round history storage.

### Smoke Test

```bash
pnpm --filter @finsim/api test:sim
```

---

## AI & RAG

### Advisor (`src/ai/advisor.js`)

Triggered by `POST /api/game/session/:id/advisor`. Context assembled server-side from:

- Current metrics and event
- Round history and detected suboptimal choice patterns
- User onboarding profile (archetype, confidence, goal, past game history)
- Retrieved knowledge chunks (RAG)

The model (`llama-3.3-70b-versatile` via Groq) is instructed to ask exactly **one Socratic question** — grounded in the player's real numbers — and never reveal the correct option. Limited to **4 calls per game session**.

### Debrief (`src/ai/debrief.js` + `services/debrief/`)

Generated lazily on `GET /api/game/session/:id/debrief` and cached on the session document. Uses **multi-query RAG** (6 targeted queries run in parallel, deduplicated and re-ranked by similarity) to supply grounded context before generating a structured JSON report that includes:

- Verdict and score (0–1000) with a label (e.g., *Wealth Architect*, *Debt Survivor*)
- Round-by-round decision cost analysis with 30-year compound projections
- Behavioral profile: dominant and secondary cognitive bias patterns (present bias, loss aversion, lifestyle inflation, etc.)
- Compound opportunity cost summary
- Credit score journey and real-world mortgage impact estimate
- Optimal path comparison with net worth delta per round
- Net worth by round (player vs. optimal) for chart rendering

### RAG Pipeline

```bash
# From backend/ — requires Supabase env vars
pnpm chunk          # knowledge/*.txt → chunks.json
pnpm seed           # embed chunks → Supabase pgvector
pnpm seed:fresh     # truncate + re-seed
pnpm build-kb       # chunk + fresh seed (full rebuild)
```

Knowledge sources live in `src/rag/knowledge/` and cover: credit scores, compound interest, debt, taxes, investing, insurance, behavioral finance, and `finsim-internal.json` (game-specific rules and optimal choices).

The embedding model is `Xenova/all-MiniLM-L6-v2`, loaded locally via `@xenova/transformers`. The Supabase schema is in `src/rag/001_pgvector.sql` — run once to create the `knowledge_chunks` table and the `match_chunks` RPC function.

---

## Scripts

| Script           | Command                           | Purpose                        |
| ---------------- | --------------------------------- | ------------------------------ |
| Dev server       | `pnpm dev`                        | `node --watch server.js`       |
| Production       | `pnpm start`                      | `node server.js`               |
| Chunk knowledge  | `pnpm chunk`                      | Build `chunks.json`            |
| Seed embeddings  | `pnpm seed` / `pnpm seed:fresh`   | Upsert / re-seed Supabase      |
| Full KB rebuild  | `pnpm build-kb`                   | Chunk then fresh seed          |
| Simulation smoke | `pnpm test:sim`                   | Quick engine sanity check      |

---

## Deployment

Production deployment uses PM2 (`ecosystem.config.cjs` at repo root) and GitHub Actions. Full VPS setup, secrets, and nginx reverse-proxy notes: **[DEPLOY.md](./DEPLOY.md)**

---

## Development Tips

1. **Change simulation behavior** → edit `src/services/simulation/` only. Run `pnpm test:sim` after any change.
2. **Add a new API route** → handler in `controller/`, wire in `routes/`, mount in `server.js`.
3. **New persisted field on sessions** → update `Models/GameSession.js` and the relevant controller; never expose raw `simState` in API responses.
4. **AI prompt tuning** → `src/ai/advisor.js` and `src/ai/debrief.js`; keep business logic out of prompt strings.
5. **Rate limits** → general limiter on all `/api/*`; tighter `aiLimiter` (20 req/min) on `/api/ai` and advisor calls.
6. **Auth debugging** → confirm cookie `token` is set with `credentials: "include"` on the frontend and `CLIENT_URL` matches the browser origin exactly.