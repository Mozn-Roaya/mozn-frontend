# Contributing to Mozn Front-ends

Thanks for your interest in improving Mozn! This repo hosts the **two web
front-ends** for the Mozn early-warning platform. This guide covers local setup,
the conventions we hold to, and how to get a change merged.

> New here? Start with the [root README](./README.md) and the
> [architecture guide](./docs/architecture.md).

---

## Repository layout

```
mozn-frontend/
├── mozn-dashboard/web/     # Admin dashboard (Next.js)
├── mozn-public/frontend/   # Public map app (Next.js)
├── docs/                   # Project documentation
├── dev.sh                  # Run both apps together for local dev
└── ecosystem.config.js     # PM2 process config (production)
```

There is **intentionally no root `package.json`**. A root lockfile makes Next.js
infer the monorepo as the workspace root and compile over a huge scope (very slow
dev). Each app manages its own dependencies. Run `npm install` **inside each app**.

---

## Local setup

**Prerequisites:** Node.js ≥ 18.18 (20+ recommended), npm, and a reachable Mozn
backend API (a separate Go service — this repo is frontend-only).

Run both apps at once from the repo root:

```bash
./dev.sh          # public → http://localhost:3000, dashboard → http://localhost:3001
```

Or run one app on its own:

```bash
cd mozn-dashboard/web        # or: cd mozn-public/frontend
npm install
cp .env.example .env.local   # point it at your backend
npm run dev
```

See [`docs/deployment.md`](./docs/deployment.md) for environment variables.

---

## Golden rules

These are non-negotiable conventions across both apps. Reviews will ask for them.

1. **Bilingual + RTL, always.** Every user-facing string needs **both** `en` and
   `ar` copy. Use **logical** Tailwind utilities (`ps/pe`, `ms/me`, `start/end`,
   `text-start`) — never physical ones (`pl/pr`, `left/right`) — so Arabic mirrors
   correctly. Check the Arabic/RTL layout, not just English LTR. See
   [`docs/i18n-and-rtl.md`](./docs/i18n-and-rtl.md).

2. **Token-first styling. No raw hex.** Colours, spacing, radius, typography and
   shadow all come from Tailwind v4 `@theme` design tokens. Never hardcode a hex
   value in a component. See [`docs/styling.md`](./docs/styling.md).

3. **Reuse before you build.** Check the existing UI primitives and feature
   components before adding new ones. In the dashboard, UI primitives are
   **shadcn/ui (new-york)** — add new ones via the shadcn CLI, don't hand-roll
   buttons/inputs/dialogs. Icons are **lucide-react** in both apps; don't add
   another icon package.

4. **Respect the data-fetch boundary.** Server-side fetch helpers must not be
   imported into client components. Expose a thin route handler instead. See
   [`docs/api-contract.md`](./docs/api-contract.md).

---

## Before you open a PR

Run the checks in the app(s) you touched:

**Dashboard (`mozn-dashboard/web`)**

```bash
npm run lint
npm run typecheck
npm run build      # for anything non-trivial
```

**Public app (`mozn-public/frontend`)**

```bash
npm run lint
npm run test       # Vitest
npx tsc --noEmit   # no script alias here
npm run build
```

Fix every error your change introduces before requesting review.

---

## Commit & PR conventions

- Keep changes **minimal and localized** — one logical change per PR.
- Write clear, imperative commit messages (`fix: …`, `feat: …`, `docs: …`).
- In the PR description, summarize **what changed**, **why**, and note any
  remaining visual differences vs. the design.
- If your change touches the JSON the frontend expects from the backend, say so
  explicitly — the backend lives in a separate repo and must be kept in sync.

---

## Reporting issues

Open a GitHub issue with: what you expected, what happened, steps to reproduce,
which app (dashboard or public), and browser/OS. Screenshots of the rendered UI
(both LTR and RTL if relevant) help a lot.
