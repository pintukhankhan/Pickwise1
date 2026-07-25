# PickWise · The Engine

> The backend that powers PickWise — a live affiliate catalog, a password‑gated **control room** to run it, and an optional Amazon brain to enrich it. Built with Node + Express. The shop window lives in a separate repo; this is the machine behind the glass.

`Node ≥ 18` · `Express` · zero framework on the frontend console (Tailwind via CDN) · **free to run forever**

---

## 🔁 The loop (read this first)

Everything in this repo exists to keep one closed loop spinning:

```
   ┌─────────────────────────── PickWise1 (this repo) ───────────────────────────┐
   │                                                                              │
   │   🛰️  CONTROL ROOM  (/admin)                                                 │
   │   add · edit · auto‑fetch · reorder · publish                                │
   │            │  writes                                                         │
   │            ▼                                                                 │
   │   ⚙️  EXPRESS API  (/api/...)   ──saves──▶   🗄️  data/products.json          │
   │            ▲                                  (committed back to THIS repo    │
   │            │  reads                            via the GitHub API, so it     │
   │            │                                  survives every restart)         │
   └────────────┼─────────────────────────────────────────────────────────────────┘
                │  GET /api/products
                │
   ┌────────────┴────────────  Pickwise  (GitHub Pages) ──────────────────────────┐
   │   🛍️  STOREFRONT  — renders the live catalog, filters it, and lets the       │
   │       Wise advisor reason over the *same* data shoppers click.               │
   └──────────────────────────────────────────────────────────────────────────────┘
```

One catalog. The console writes it, the storefront reads it, the advisor scores it. **That closed loop is the whole product.**

---

## 🗺️ Two repos — don't confuse them

| Repo | What it is | Where it runs | Public URL |
|---|---|---|---|
| **`Pickwise1`** *(this one)* | the **engine** — API + admin console | **Render** (a server) | `…onrender.com/admin` |
| **`Pickwise`** *(the shop window)* | the storefront shoppers see | **GitHub Pages** | `…github.io/Pickwise/` |

The engine only **serves** `/admin` and `/api/...`. Hitting the bare Render URL with nothing after it is *not* an error — there's intentionally no page there.

---

## 📦 What's inside (and the autocorrect checklist)

Uploaded on a phone? Open each path and confirm the name is **spelled exactly** like this — a single stray space or swapped letter silently crashes the server.

```
Pickwise1/
├── server.js              ✅  Express app · routes · boot
├── package.json           ✅  ⚠️ NOT package.jaon / package. json
├── .env.example           ✅  the env template (copy → .env / Render)
├── README.md              ✅  you are here
│
├── data/
│   └── seed.js            ✅  10 studio‑gear products, loaded on first boot
│   (products.json)        🟢  created automatically on first save — your DB
│
├── lib/
│   ├── store.js           ✅  GitHub‑as‑database + local fallback
│   ├── amazon.js          ✅  affiliate URLs + optional PA‑API
│   └── auth.js            ✅  single‑admin password gate
│
└── public/                (the control room UI, served same‑origin)
    ├── admin.html         ✅
    ├── admin.css          ✅
    └── admin.js           ✅
```

> 📱 **Phone gotcha, lived and learned:** autocorrect loves to rename `package.json` → `package.jaon` and `index.html` → `index. html`. **Turn autocorrect off** (or use *Desktop site* mode) whenever you type a filename. The server forgives a lot; it does not forgive a misspelled `package.json`.

---

## ▶️ Run it locally

```bash
cp .env.example .env        # then fill it in (see below)
npm install
npm run dev                 # node --watch server.js
```

Open **http://localhost:3000/admin** → unlock with your `ADMIN_PASSWORD`.

---

## 🚀 Deploy to Render

1. **New → Web Service** → connect this repo.
2. **Build Command** `npm install` · **Start Command** `node server.js` · **Branch** `main` · **Free** tier.
3. Add the **Environment** variables (next section).
4. Deploy. In the logs you want to see:
   ```
   [store] loaded 10 products via github
   PickWise API → http://localhost:10000  ·  admin → /admin
   ```
5. Open `https://<your‑service>.onrender.com/admin` → unlock → your 10 seeded products appear. Edit one → **Save** → check the repo: `data/products.json` now exists. Persistence confirmed. 🟢

---

## 🔐 Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `ADMIN_PASSWORD` | **yes** | unlocks the console. Long + unique. |
| `SESSION_SECRET` | **yes** | any long random string (signs the bearer token). |
| `AMAZON_TAG` | yes | your associate tag → `shoyebkhan192-20` |
| `GITHUB_TOKEN` | **yes*** | a PAT (scope `repo`) so edits save back to the repo. *Without it the site runs but edits vanish on restart.* |
| `GITHUB_REPO` | yes* | `owner/repo` → e.g. `pintukhankhan/Pickwise1` (mind the capital **P**) |
| `GITHUB_BRANCH` | yes* | `main` |
| `STOREFRONT_URL` | yes | the Pages origin for CORS → `https://pintukhankhan.github.io` (use `*` while testing) |
| `PAAPI_ACCESS_KEY` | no | Amazon PA‑API — leave blank = manual entry |
| `PAAPI_SECRET_KEY` | no | same |
| `PAAPI_PARTNER_TAG` | no | same as `AMAZON_TAG` |

\* required for persistence. **Generate the token:** GitHub → Settings → Developer settings → *Personal access tokens (classic)* → Generate → tick **`repo`** only → copy the `ghp_…` string straight into Render (you won't see it twice).

---

## 🔌 The API

**Public (the storefront reads these — no auth):**

| Method | Path | Returns |
|---|---|---|
| `GET` | `/api/health` | `{ "ok":true, "store":"github", "paapi":false, "count":10 }` |
| `GET` | `/api/products` | active products, sorted by `position` |
| `GET` | `/api/products/:id` | one product |

**Admin (bearer token from `/api/admin/login`):**

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/login` | `{ "password":"…" }` → `{ "token":"…" }` |
| `GET` | `/api/admin/status` | store mode, pa‑api flag, counts |
| `GET` | `/api/admin/products` | all products (incl. hidden) |
| `POST` | `/api/admin/products` | create |
| `PUT` | `/api/admin/products/:id` | update |
| `DELETE` | `/api/admin/products/:id` | remove |
| `PUT` | `/api/admin/reorder` | `{ "ids":[…] }` set display order |
| `GET` | `/api/admin/amazon/lookup?asin=…` | auto‑fill (503 if PA‑API off) |
| `GET` | `/api/admin/amazon/url?asin=…&q=…` | build a tagged affiliate link |

Every affiliate link carries your tag — a real `/dp/ASIN` link when you know the ASIN, a tagged `/s?k=` search link otherwise (always resolves, never 404s, never points at the wrong product).

---

## 🛰️ The control room (`/admin`)

A single‑screen console: a live product list, a full editor, a **live card preview** that updates as you type, ▲▼ reordering, and a ⚡ **Fetch** button that auto‑fills title / price / image / rating from Amazon when PA‑API is on (and politely says *"manual"* when it isn't). A status ticker across the top reports the store mode, the PA‑API light, the product count, and the last save time.

---

## 🛒 Amazon PA‑API — the honest gate

The **Fetch** button is wired and ready, but Amazon only grants PA‑API access to associates who've already made **3 qualifying sales**, via an AWS account with a card on file. So for your first months the workflow is **manual entry** — which is exactly what curated, high‑earning sites do anyway. The moment you qualify, drop the three `PAAPI_*` vars in and the button lights up green. **No code change.**

---

## 🗄️ Why the repo *is* the database

Render's free containers forget their disk on restart. So `lib/store.js` writes every edit back into `data/products.json` in **this repo** through the GitHub API — persistent, versioned, free. The store is isolated in that one file: swap it for Postgres/Supabase later by rewriting only `load()`/`persist()`, and every route keeps working.

---

## ⚠️ Gotchas (the short list)

- **Render free tier sleeps** after ~15 min idle; first visit after a nap takes ~20–40 s. Fix with a free UptimeRobot ping every 10 min, or a paid tier later.
- **Verify prices before publishing.** Amazon requires displayed prices to be accurate; the console reminds you, the storefront discloses it.
- **One admin.** `auth.js` is a single‑password gate — right for a solo operator. Need multiple editors later? That's the one module to replace with real sessions.
- **Filenames are case‑ and space‑sensitive.** See the checklist above. Yes, really.

---

## © License

© 2026 PickWise. All rights reserved. Content, verdicts, and design are property of PickWise — not for redistribution without permission.

---

*Tested picks. Honest prices. Built by hand, deployed for free.* 🎙️
