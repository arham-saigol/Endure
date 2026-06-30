# Endure

A quiet archive of effort. One mission, one deadline, one entry a night.

Endure is not a task manager or a habit tracker. It is a calm personal space
where you record what happened each day, see that you are still moving, and
regain momentum when you feel close to giving up.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **InstantDB** for auth and data
- **DeepSeek V4 Pro** (`deepseek-v4-pro`, max reasoning) for the daily signal,
  summary, and momentum line
- Deploy target: **Vercel**

## Setup

### 1. Install

```bash
npm install
```

### 2. Create an InstantDB app

Go to <https://www.instantdb.com>, create an app, and copy its **App ID**.

The schema lives in [`instant.schema.ts`](./instant.schema.ts). On first use,
InstantDB creates the entities/attributes automatically. To register the schema
and lock it down for production, install the CLI and push:

```bash
npx instant-cli@latest init        # link your app (once)
npx instant-cli@latest push schema
npx instant-cli@latest push perms  # production privacy — see instant.perms.ts
```

**Push schema before perms.** [`instant.perms.ts`](./instant.perms.ts) scopes
every mission and entry to its owner (`auth.id in data.ref('user.id')`) and
locks the schema from client-side changes. Without it, anyone who signs into the
app could read everyone's data, so push perms before launch.

### 3. Get a DeepSeek API key

Create a key at <https://platform.deepseek.com/api_keys>.

### 4. Configure environment

Copy `.env.local.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_INSTANT_APP_ID=...
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-v4-pro
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in with an email magic code, set up your
mission, and record your first entry.

## How it works

- **Auth** — magic-code login via InstantDB. New emails create an account.
- **Mission** — one active mission: a title, a deadline, and an optional
  description of what it means. No tasks, no pillars.
- **Main view** — days remaining and one strong, AI-written momentum line that
  refreshes daily from your recent entries. The mission title is never shown
  here; the description lives in a quiet, expandable line. Below it is the
  calendar.
- **Calendar** — a ledger of days. Recorded days glow softly, today carries a
  quiet ring, open past days stay faint, future days are inactive. Click today
  or an open day to write; click a recorded day to revisit it.
- **Daily entry** — one large writing area and one submit action. After you
  submit, DeepSeek reads the entry and writes a short **daily signal** (a human
  heading for the day) and a one-paragraph **summary**.
- **Entry detail** — the signal as the headline, the summary beneath, and your
  raw entry collapsed by default.

The momentum line and the signal/summary are generated server-side through
`/api/momentum` and `/api/analyze`, which call DeepSeek with thinking enabled
and `reasoning_effort: "high"`. Results are stored on the entry/mission in
InstantDB, so the app stays fast and works offline-tolerant.

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import it into Vercel (Next.js is auto-detected).
3. Set the same three environment variables in the Vercel project settings.
4. Deploy.

## PWA & mobile

Endure is a proper installable PWA:

- `app/manifest.ts` generates the web manifest (standalone display, theme and
  background colors, maskable + any icons).
- `public/sw.js` is a service worker that network-first serves the app shell
  and cache-first serves static assets + self-hosted fonts, so the app opens
  offline. It never touches `/api/*` or InstantDB traffic. Registered in
  production by `components/PWARegister.tsx`.
- Apple meta tags (`apple-mobile-web-app-*`, apple-touch-icon) make it
  installable on iOS home screens.
- The layout uses `viewport-fit: cover` plus `env(safe-area-inset-*)` padding
  so content clears notches. Inputs stay at 16px+ to prevent iOS zoom-on-focus.

Icons are generated from `public/icon.svg`:

```bash
node scripts/gen-icons.mjs   # uses @resvg/resvg-js (devDependency)
```

## Project layout

```
app/
  layout.tsx              fonts + PWA metadata + theme
  manifest.ts             web app manifest
  page.tsx                routes by auth + mission state
  onboarding/page.tsx     mission setup
  mission/page.tsx        main view: days, momentum, calendar
  entry/[date]/page.tsx   compose (empty day) or detail (recorded day)
  api/analyze/route.ts    DeepSeek -> daily signal + summary
  api/momentum/route.ts   DeepSeek -> daily momentum line
components/               Header, AuthScreen, Calendar, RequireAuth, PWARegister
lib/                      db (InstantDB), dates, deepseek, ai
public/                   sw.js, icon.svg, generated PNG icons
scripts/                  gen-icons.mjs
instant.schema.ts         data model
instant.perms.ts          owner-scoped production permissions
```

Endure is deliberately small. No teams, no analytics, no streaks, no scores —
only the proof that you kept going.
