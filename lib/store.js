"use strict";
const fs   = require("fs");
const path = require("path");

const TOKEN  = process.env.GITHUB_TOKEN || "";
const REPO   = process.env.GITHUB_REPO  || "";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE   = "data/products.json";
const LOCAL  = path.join(__dirname, "..", FILE);

let cache = [];
let sha   = null;                       // GitHub blob sha, needed to update the file

const mode = () => (TOKEN && REPO) ? "github" : "local";
const ghH  = () => ({
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "pickwise-api",
});

async function readGH() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}?ref=${BRANCH}`, { headers: ghH() });
  if (r.status === 404) throw Object.assign(new Error("not found"), { code: 404 });
  if (!r.ok) throw new Error("gh read " + r.status);
  const j = await r.json();
  sha = j.sha;
  return JSON.parse(Buffer.from(j.content, "base64").toString("utf8"));
}
async function writeGH(arr) {
  const payload = {
    message: "chore: update catalog",
    content: Buffer.from(JSON.stringify(arr, null, 2)).toString("base64"),
    branch: BRANCH,
  };
  if (sha) payload.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
    method: "PUT", headers: { ...ghH(), "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("gh write " + r.status);
  const j = await r.json();
  sha = j.content.sha;
}
const readLocal  = () => JSON.parse(fs.readFileSync(LOCAL, "utf8"));
const writeLocal = (arr) => { fs.mkdirSync(path.dirname(LOCAL), { recursive: true }); fs.writeFileSync(LOCAL, JSON.stringify(arr, null, 2)); };

async function persist() {
  try { writeLocal(cache); } catch (e) { console.warn("[store] local write failed:", e.message); }
  if (mode() === "github") {
    try { await writeGH(cache); }
    catch (e) { console.warn("[store] github write failed (local copy saved):", e.message); }
  }
}

async function load() {
  let loaded = null;
  if (mode() === "github") {
    try { loaded = await readGH(); }
    catch (e) { console.warn("[store] github read failed, trying local:", e.message); }
  }
  if (!loaded) { try { loaded = readLocal(); } catch { loaded = null; } }
  if (!loaded || !loaded.length) loaded = require("./seed").SEED.slice();
  cache = loaded;
  await persist();                       // ensures the file exists in the repo on first boot
  console.log(`[store] loaded ${cache.length} products via ${mode()}`);
}

const stamp = () => new Date().toISOString();
const api = {
  mode,
  load,
  all:    () => cache.slice(),
  active: () => cache.filter((p) => p.active !== false).sort((a, b) => (a.position ?? 999) - (b.position ?? 999)),
  get:    (id) => cache.find((p) => p.id === id) || null,
  async add(p) {
    p = { ...p, id: p.id || ("p" + Date.now()), position: p.position ?? cache.length, updatedAt: stamp() };
    cache.push(p); await persist(); return p;
  },
  async update(id, patch) {
    const i = cache.findIndex((p) => p.id === id); if (i < 0) return null;
    cache[i] = { ...cache[i], ...patch, updatedAt: stamp() }; await persist(); return cache[i];
  },
  async remove(id) { cache = cache.filter((p) => p.id !== id); await persist(); },
  async reorder(ids) {
    ids.forEach((id, i) => { const p = cache.find((x) => x.id === id); if (p) p.position = i; });
    await persist();
  },
};
module.exports = api;
