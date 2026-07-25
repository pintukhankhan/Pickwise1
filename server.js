"use strict";
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const store   = require("./lib/store");
const amazon  = require("./lib/amazon");
const auth    = require("./lib/auth");

const app  = express();
const PORT = process.env.PORT || 3000;

const allow = (process.env.STOREFRONT_URL || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: (o, cb) => cb(null, !o || allow.includes("*") || allow.includes(o)), credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Session middleware (NOTE: in-memory store is NOT suitable for production multi-replica deployments)
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";
if (!process.env.SESSION_SECRET) console.warn("⚠️  SESSION_SECRET not set — using a development fallback. Set SESSION_SECRET in production.");
app.use(session({
  name: process.env.SESSION_NAME || 'pw.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
}));

// Rate limiter for login endpoint
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 6, message: { error: 'Too many login attempts, try again later.' } });

// Admin console (served same-origin as the API → no CORS pain on writes)
app.use("/admin", express.static(path.join(__dirname, "public")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

// ---- Public read API (the storefront uses these) ----
app.get("/api/health", (req, res) => res.json({
  ok: true, store: store.mode(), paapi: amazon.available(), count: store.active().length,
}));
app.get("/api/products",     (req, res) => res.json(store.active()));
app.get("/api/products/:id", (req, res) => {
  const p = store.get(req.params.id);
  return p ? res.json(p) : res.status(404).json({ error: "not found" });
});

// ---- Admin write API (password-protected) ----
app.post("/api/admin/login", loginLimiter, (req, res) => {
  const t = auth.login(req.body && req.body.password);
  if (!t) return res.status(401).json({ error: "wrong password" });
  // set server-side session for browser clients
  req.session.isAdmin = true;
  // keep returning a token for backward compatibility (admin.js clients using Bearer tokens)
  return res.json({ token: t });
});

const requireAdmin = (req, res, next) => {
  // session-based auth (preferred)
  if (req.session && req.session.isAdmin) return next();
  // bearer token fallback
  const ah = req.get("authorization") || "";
  if (ah.startsWith("Bearer ") && auth.check(ah.slice(7))) return next();
  return res.status(401).json({ error: "unauthorized" });
};

app.get("/api/admin/status", requireAdmin, (req, res) => res.json({
  store: store.mode(), github: store.mode() === "github", paapi: amazon.available(), count: store.all().length,
}));
app.get("/api/admin/products", requireAdmin, (req, res) => res.json(store.all()));

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const p = req.body || {};
  if (p.asin && !p.url) p.url = amazon.buildUrl(p.asin, p.title);
  res.json(await store.add(p));
});
app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const p = await store.update(req.params.id, req.body || {});
  return p ? res.json(p) : res.status(404).json({ error: "not found" });
});
app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  await store.remove(req.params.id); res.json({ ok: true });
});
app.put("/api/admin/reorder", requireAdmin, async (req, res) => {
  await store.reorder(req.body.ids || []); res.json({ ok: true });
});

// Optional Amazon auto-fill (degrades gracefully when PA-API is off)
app.get("/api/admin/amazon/lookup", requireAdmin, async (req, res) => {
  if (!amazon.available()) return res.status(503).json({ error: "PA-API not configured — enter details manually." });
  const data = await amazon.lookup(String(req.query.asin || "").trim());
  return data ? res.json(data) : res.status(404).json({ error: "Amazon returned nothing for that ASIN." });
});
app.get("/api/admin/amazon/url", requireAdmin, (req, res) =>
  res.json({ url: amazon.buildUrl(String(req.query.asin || "").trim(), String(req.query.q || "")) }));

// ---- Boot ----
(async () => {
  await store.load();
  if (!auth.enabled()) console.warn("⚠️  ADMIN_PASSWORD not set — admin console is locked out. Set it on Render.");
  app.listen(PORT, () => console.log(`PickWise API → http://localhost:${PORT}  ·  admin → /admin`));
})();
