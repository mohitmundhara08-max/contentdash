# ContentDash — Instagram Content Studio

AI-powered content planning dashboard for multiple Instagram channels. Generate 30-day content calendars, scripts, hooks, hashtags, and AI image prompts using Claude AI.

---

## Features

- **Multi-channel switcher** — manage 5+ Instagram accounts from one dashboard
- **Instagram OAuth** — connect accounts securely (no password stored)
- **AI content generator** — 30-day calendar, scripts, AI prompts, hashtags in one click
- **4 views** — Calendar, Performance Tracker, Pillar Analysis, Strategy Dashboard
- **Quick mode** — hooks + hashtags only for fast ideation

---

## Deploy to Vercel (3 steps)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/contentdash.git
git push -u origin main
```

### 2. Import on Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import the GitHub repo
- Framework: **Next.js** (auto-detected)
- Click **Deploy**

### 3. Add environment variables in Vercel
Go to your project → Settings → Environment Variables:

| Variable | Value | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key | Optional (can set in app) |
| `INSTAGRAM_APP_ID` | Facebook App ID | Phase 2 |
| `INSTAGRAM_APP_SECRET` | Facebook App Secret | Phase 2 |
| `NEXT_PUBLIC_APP_URL` | https://your-app.vercel.app | Phase 2 |

---

## First-time setup

1. Open your live URL
2. Click **⚙️ Settings** → paste your Anthropic API key → Save
3. Click **Add channel manually** or **Connect Instagram Account**
4. Click **✨ Generate** → enter keyword → get your 30-day plan

---

## Instagram OAuth setup (Phase 2)

1. Go to [developers.facebook.com](https://developers.facebook.com) → Create App
2. Add **Instagram Graph API** product
3. Under Valid OAuth Redirect URIs add: `https://your-app.vercel.app/api/auth/callback`
4. Copy App ID + App Secret → add to Vercel env vars
5. Users can now click "Connect Instagram Account" in the channel switcher

---

## Project structure

```
contentdash/
├── app/
│   ├── (auth)/login/          ← Instagram OAuth login page
│   ├── (auth)/callback/       ← OAuth success/error page
│   ├── (dashboard)/           ← Main dashboard
│   └── api/
│       ├── auth/instagram/    ← Starts OAuth flow
│       ├── auth/callback/     ← Handles OAuth, saves token to Supabase
│       ├── channels/          ← CRUD channels
│       ├── generate/          ← Claude AI content generator
│       ├── posts/             ← Save + fetch generated posts
│       ├── performance/       ← Track actual metrics
│       └── instagram/insights/← Pull real IG data
├── components/
│   ├── views/                 ← CalendarView, TrackerView, PillarView, StrategyView
│   ├── modals/                ← GenerateModal, AddChannelModal, SettingsModal
│   └── ui/                   ← AccountSwitcher, ConnectInstagram, PostCard
└── lib/
    ├── supabase.ts            ← Supabase client
    ├── instagram.ts           ← Instagram Graph API helpers
    └── types.ts               ← TypeScript interfaces
```

---

## Tech stack

- **Next.js 14** App Router
- **Tailwind CSS**
- **Supabase** (Postgres) — channels, posts, performance data, IG tokens
- **Anthropic Claude API** — AI content generation
- **Meta Graph API** — Instagram insights + OAuth
