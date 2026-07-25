"use strict";
const crypto = require("crypto");
const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const PASS   = process.env.ADMIN_PASSWORD || "";

const hash  = (s) => crypto.createHmac("sha256", SECRET).update(String(s)).digest("hex");
const token = () => (PASS ? hash(PASS) : null);

function safeEq(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
// Login: compare the typed password to the env password; hand back the bearer token.
const login = (pw) => (PASS && safeEq(pw || "", PASS) ? token() : null);
// Middleware check: the bearer must equal the token derived from the env password.
const check = (bearer) => !!PASS && !!bearer && safeEq(bearer.replace(/^Bearer\s+/i, ""), token());

module.exports = { login, check, enabled: () => !!PASS };
