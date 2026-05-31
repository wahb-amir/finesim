# FinSim Frontend (`@finsim/web`)

Next.js 16 App Router application that renders the FinSim game UI. The frontend is intentionally thin: it sends player choices to the Express API and renders whatever the server returns. No simulation logic runs in the browser.

---

## Table of Contents

- [Quick Start](#quick-start)
- [App Structure](#app-structure)
- [Pages & Routes](#pages--routes)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Key Components](#key-components)
- [Tech Stack](#tech-stack)

---

## Quick Start

```bash
# From repo root
echo "NEXT_PUBLIC_API_URL=http://localhost:8081/api" > frontend/.env.local

pnpm install
pnpm dev          # starts Next.js on port 3000
```

The backend must be running on port 8081 (or wherever `NEXT_PUBLIC_API_URL` points). See the [backend README](../backend/README.md) for setup.

Production build:

```bash
pnpm build
pnpm start
```

---

## App Structure

```
frontend/
├── app/                        # Next.js App Router
│   ├── layout.jsx              # Root layout — wraps all pages in AppProviders
│   ├── page.jsx                # Landing page (/)
│   ├── auth/page.jsx           # Sign up / log in
│   ├── dashboard/page.jsx      # Session history + start new game
│   ├── setup/page.jsx          # Game configuration
│   ├── game/page.jsx           # Main game board
│   ├── debrief/page.jsx        # Post-game debrief
│   ├── profile/page.jsx        # Account + onboarding profile
│   ├── leaderboard/page.jsx    # Top scores
│   ├── onboarding/page.jsx     # Onboarding flow
│   ├── share/[slug]/           # Public shareable debrief view
│   ├── context/
│   │   └── AuthContext.js      # Authentication state + user object
│   └── globals.css
│
├── components/
│   ├── brand/
│   │   └── BrandLogo.jsx
│   ├── dashboard/
│   │   └── SessionDetailModal.jsx
│   ├── debrief/
│   │   ├── DebriefView.jsx         # Full debrief layout
│   │   ├── DecisionBreakdown.jsx   # Round-by-round decision analysis
│   │   └── LessonCards.jsx         # Behavioral insight cards
│   ├── features/
│   │   └── InteractiveTools.jsx    # Landing page: CompoundCalculator, DecisionSimulator
│   ├── game/
│   │   ├── GameContent.jsx
│   │   ├── GameFooter.jsx
│   │   ├── GameHeader.jsx
│   │   ├── GameLoadingScreen.jsx
│   │   ├── GameMetricsSidebar.jsx
│   │   ├── GameRoundPanel.jsx
│   │   ├── GameToast.jsx
│   │   ├── SwipeDecisionCard.tsx
│   │   ├── CreditBadge.jsx
│   │   └── constants.js
│   ├── layout/
│   │   ├── AppNavbar.jsx
│   │   ├── Breadcrumb.jsx
│   │   └── HeaderFooter.jsx       # Nav, Footer, Ticker
│   ├── providers/
│   │   └── AppProviders.jsx       # Composes AuthContext + GameContext providers
│   ├── sections/
│   │   └── CoreSections.jsx       # Landing page sections
│   ├── share/
│   │   ├── ShareCard.jsx
│   │   └── ShareSheet.jsx
│   └── ui/
│       ├── AdvisorPanel.jsx
│       ├── BottomSheet.tsx
│       ├── ChoiceCard.jsx
│       ├── ConfirmModal.jsx
│       ├── MetricCard.jsx
│       ├── Modal.jsx
│       ├── NetWorthChart.jsx
│       ├── RoundProgress.jsx
│       └── StatCard.jsx
│
├── context/
│   └── GameContext.jsx            # Client-side game view state
│
├── hooks/
│   └── useGameSession.js          # API calls for game session lifecycle
│
└── lib/
    ├── api.js                     # All fetch wrappers for the backend API
    ├── data.js                    # Static / reference data
    ├── debrief-utils.js           # Debrief payload helpers
    ├── format.js                  # Number, currency, score formatters
    ├── game-types.ts              # TypeScript types for game objects
    ├── mistake-patterns.js        # Behavioral pattern label maps
    └── share.js                   # Share link utilities
```

---

## Pages & Routes

| Route            | Auth     | Description                                                      |
| ---------------- | -------- | ---------------------------------------------------------------- |
| `/`              | No       | Landing page — hero, stats, compound calculator, decision simulator, leaderboard preview |
| `/auth`          | No       | Sign up / log in form. Redirects to `/dashboard` on success.    |
| `/dashboard`     | Yes      | Lists past sessions with a session detail modal. CTA to start a new game. |
| `/setup`         | Yes      | Career, salary, financial goal, and climate configuration. POSTs to `/api/game/session`. |
| `/game`          | Yes      | Main game board — round progress, event card, metrics sidebar, swipe/click choices, advisor panel. |
| `/debrief`       | Yes      | Full post-game report: verdict, behavioral profile, decision breakdown, net worth chart. |
| `/profile`       | Yes      | Account settings and onboarding profile.                         |
| `/leaderboard`   | No       | Top scores across players.                                       |
| `/onboarding`    | —        | Onboarding flow (alternate entry point).                         |
| `/share/[slug]`  | No       | Public read-only debrief view for a shared session.              |

Unauthenticated users attempting to access protected routes are redirected to `/auth`.

---

## State Management

### `AuthContext` (`app/context/AuthContext.js`)

Provides `user`, `loading`, `login`, `logout`, and `signup` to the entire app. Persists authentication state across page navigation via the backend's httpOnly JWT cookie. Mounted at the root layout via `AppProviders`.

### `GameContext` (`context/GameContext.jsx`)

Client-side view state for an active game session: current event, metrics, round number, advisor state, and UI flags (loading, toast messages, etc.). Populated by API responses from `useGameSession`. Does **not** compute any outcomes — it mirrors what the server returns.

`AppProviders` (`components/providers/AppProviders.jsx`) composes both contexts and wraps the root layout.

---

## API Integration

All backend calls are centralized in `lib/api.js`. Every function uses `fetch` with `credentials: "include"` so the auth cookie is sent automatically.

The `useGameSession` hook (`hooks/useGameSession.js`) wraps the game-specific calls (start session, submit round, fetch advisor, fetch debrief) and keeps `GameContext` in sync.

Key API functions (from `lib/api.js`):

- `createSession(payload)` — POST `/api/game/session`
- `submitRound(sessionId, choice)` — POST `/api/game/session/round`
- `fetchAdvisor(sessionId)` — POST `/api/game/session/:id/advisor`
- `fetchDebrief(sessionId)` — GET `/api/game/session/:id/debrief`
- `fetchSessions()` — GET `/api/game/sessions`
- `fetchUserData()` — GET `/api/game/sessions/userData`
- `createShare(sessionId)` — POST `/api/share`
- `login`, `signup`, `logout`, `getMe` — auth endpoints

---

## Key Components

### Game Board (`components/game/`)

The main gameplay UI assembled from composable parts:

- **`GameHeader`** — round counter, age, session metadata
- **`GameMetricsSidebar`** — live metric cards (net worth, credit score, debt, surplus, stress, 401k status)
- **`GameRoundPanel`** — event narrative and choice layout
- **`SwipeDecisionCard`** — swipeable/clickable card rendering a single choice with bullets
- **`GameFooter`** — advisor button, progress indicator
- **`AdvisorPanel`** (`components/ui/`) — slides in with the Socratic advisor response; tracks remaining uses
- **`GameToast`** — transient outcome messages after each round
- **`GameLoadingScreen`** — shown while the API processes a round
- **`CreditBadge`** — visual credit score indicator

### Debrief (`components/debrief/`)

- **`DebriefView`** — top-level layout: verdict headline, score badge, and section navigation
- **`DecisionBreakdown`** — round-by-round table of choices made vs. optimal, with immediate impact and 30-year projected cost
- **`LessonCards`** — behavioral insight cards (dominant pattern, strengths, blind spots)
- **`NetWorthChart`** (`components/ui/`) — Recharts line chart comparing player trajectory to optimal path, round by round

### Landing Page (`app/page.jsx` + `components/`)

- **`CoreSections`** — `HeroSection`, `StatsSection`, `MythBusterSection`, `HowItWorksSection`, `LeaderboardSection`, `FinalCTA`
- **`InteractiveTools`** — client-side `CompoundCalculator` and `DecisionSimulator` — interactive without requiring auth
- **`HeaderFooter`** — `Nav`, `Footer`, `Ticker`

### Share (`components/share/`)

- **`ShareSheet`** — bottom sheet with the share link and copy controls
- **`ShareCard`** — the renderable card used on the public `/share/[slug]` route

---

## Tech Stack

| Concern         | Technology                                   |
| --------------- | -------------------------------------------- |
| Framework       | Next.js 16, React 19, App Router             |
| Styling         | Tailwind CSS v4                              |
| Animation       | Framer Motion 12                             |
| Charts          | Recharts 3                                   |
| Icons           | Lucide React                                 |
| Type safety     | TypeScript (selected files), JSX elsewhere   |
| Linting         | ESLint with `eslint-config-next`             |