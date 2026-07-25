"use strict";
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || null;
const ADMIN_PLAIN = process.env.ADMIN_PASSWORD || null;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";

if (!ADMIN_HASH && !ADMIN_PLAIN) {
  // no admin configured — admin console will be locked out
  // enabled() will return false
}

function enabled() {
  return !!(ADMIN_HASH || ADMIN_PLAIN);
}

function computeTokenFromHash(hash) {
  // deterministic token derived from the password hash and session secret
  return crypto.createHmac("sha256", String(SESSION_SECRET)).update(String(hash)).digest("hex");
}

function login(password) {
  if (!enabled()) return null;
  if (!password) return null;
  // if plain password env is present, accept it (use bcrypt compare if hash available)
  if (ADMIN_HASH) {
    try {
      if (bcrypt.compareSync(String(password), ADMIN_HASH)) return computeTokenFromHash(ADMIN_HASH);
    } catch (e) {
      return null;
    }
  }
  if (ADMIN_PLAIN) {
    if (String(password) === String(ADMIN_PLAIN)) {
      // if we only have plain, derive a token from the plain value (but prefer hash in production)
      const hash = ADMIN_PLAIN; // use plain as the stable seed
      return computeTokenFromHash(hash);
    }
  }
  return null;
}

function check(token) {
  if (!token) return false;
  if (!enabled()) return false;
  // Accept token derived from ADMIN_HASH or ADMIN_PLAIN
  if (ADMIN_HASH) {
    const expected = computeTokenFromHash(ADMIN_HASH);
    if (safeEq(token, expected)) return true;
  }
  if (ADMIN_PLAIN) {
    const expected = computeTokenFromHash(ADMIN_PLAIN);
    if (safeEq(token, expected)) return true;
  }
  return false;
}

function safeEq(a, b) {
  try {
    const aa = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  } catch (e) { return false; }
}

module.exports = { enabled, login, check };
