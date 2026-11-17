# Next Platform

One Next.js web platform for the POS system. After login, people are routed by role:

| Section | Who | Status |
|---|---|---|
| `/owner/*` | Café owner / manager | 🚧 login done; devices, menu, sales next |
| `/customer/*` | Customers (loyalty) | later |
| `/admin/*` | Super-admin | later |

Backend: [Backend_Platform](https://github.com/samimh23/Backend_Platform) · POS: [Pos_Cafe](https://github.com/samimh23/Pos_Cafe)

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind · shadcn/ui (Base UI) · Zod

## Run locally

```bash
# 1. backend on :3000 (see Backend_Platform)
# 2. this app on :3001
cp .env.example .env.local
pnpm install
pnpm dev            # http://localhost:3001
pnpm test           # unit tests
pnpm build          # production build (strict Cache Components checks)
```

## How auth works

```
Browser ──form──▶ Server Action ──▶ backend /v1/auth/login
                       │
                       └─ stores tokens in httpOnly cookies (pos_at 15 min, pos_rt 30 days)
Every page ──▶ src/proxy.ts
                 ├─ access token expired? → refresh with pos_rt (never on prefetch)
                 └─ /owner without owner/manager session → /login?next=…
Server Components ──▶ lib/backend/server.ts (ownerFetch) ──▶ backend with the token
```

- The browser never sees the tokens (httpOnly) and never calls the backend directly.
- The proxy check is only optimistic; the backend verifies the token on every call.
- Next.js 16 rule (Cache Components): anything reading cookies/searchParams sits inside `<Suspense>`.

## Structure

```
src/
├── proxy.ts                 route guard + token refresh (Next 16 name for middleware)
├── app/
│   ├── page.tsx             landing
│   ├── (auth)/login, signup Server Action forms
│   └── owner/               owner area (layout with navigation)
├── components/ui/           shadcn/ui
└── lib/
    ├── actions/auth.ts      login / signup / logout (Server Actions)
    ├── auth/                cookies, token decoding
    └── backend/             backend client, errors (FR messages), server helpers
```

> This Next.js version has breaking changes from older docs — read `node_modules/next/dist/docs/` (see AGENTS.md).
