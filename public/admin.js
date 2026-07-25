"use strict";
const $ = (s) => document.querySelector(s);
const API = "";                       // same origin (admin is served by the backend)
let TOKEN = localStorage.getItem("pw_token") || "";
let PRODUCTS = [];
let currentId = null;

/* ---------- toasts ---------- */
function toast(msg, err) {
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : "");
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---------- api helper ---------- */
async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (TOKEN) headers["Authorization"] = "Bearer " + TOKEN;
  const r = await fetch(API + path, { ...opts, headers, credentials: 'include' });
  if (r.status === 401) { logout(); throw new Error("unauthorized"); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || ("HTTP " + r.status));
  return data;
}

/* ---------- auth ---------- */
function logout() { TOKEN = ""; localStorage.removeItem("pw_token"); $("#app").classList.add("hidden"); $("#login").classList.remove("hidden"); }
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#loginErr").textContent = "";
  try {
    const r = await fetch(API + "/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: $("#loginPw").value }),
      credentials: 'include'
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "no");
    // server sets a session cookie; keep token for backward compatibility
    TOKEN = d.token || ""; if (TOKEN) localStorage.setItem("pw_token", TOKEN);
    boot();
  } catch { $("#loginErr").textContent = "Wrong password."; }
});
$("#btnLogout").addEventListener("click", logout);

/* ---------- list ---------- */
function discount(p) { return p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0; }
function renderList() {
  const q = ($("#listSearch").value || "").toLowerCase();
  const box = $("#list"); box.innerHTML = "";
  const rows = PRODUCTS.filter((p) => !q || (p.title + " " + p.category + " " + (p.tags || []).join(" ")).toLowerCase().includes(q));
  $("#countBadge").textContent = `(${rows.length}/${PRODUCTS.length})`;
  if (!rows.length) { box.innerHTML = `<p class="mono text-xs text-inkSoft p-3">No products match.</p>`; return; }
  rows.forEach((p) => {
    const el = document.createElement("div");
    el.className = "row-item" + (p.id === currentId ? " sel" : "");
    el.innerHTML = `
      <img src="${p.image || "https://picsum.photos/seed/x/100/100"}" alt="" />
      <div class="min-w-0 flex-1">
        <p class="font-bold text-sm truncate">${esc(p.title || "Untitled")}</p>
        <p class="mono text-[11px] text-inkSoft">$${(+p.price || 0).toFixed(2)} · ★ ${(+p.rating || 0).toFixed(1)} ${p.active ? "" : "· HIDDEN"}</p>
      </div>
      ${discount(p) ? `<span class="mono text-[11px] text-hot">−${discount(p)}%</span>` : ""}`;
    el.addEventListener("click", () => select(p.id));
    box.appendChild(el);
  });
}
$("#listSearch").addEventListener("input", renderList);

/* ---------- editor ---------- */
const F = ["asin","title","brand","category","price","was","rating","reviews","image","url","verdict","tags","flag","active"];
function clearForm() {
  currentId = null; $("#edTitle").textContent = "New product";
  F.forEach((k) => { const el = $("#f_" + k); if (el) el.value = (k === "active" ? "true" : (k === "category" ? "tech" : "")); });
  updatePreview();
}
function fillForm(p) {
  currentId = p.id; $("#edTitle").textContent = "Edit product";
  F.forEach((k) => {
    const el = $("#f_" + k); if (!el) return;
    el.value = k === "tags" ? (p.tags || []).join(", ") : (k === "active" ? String(p.active !== false) : (p[k] ?? ""));
  });
  updatePreview();
}
function readForm() {
  const tags = $("#f_tags").value.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    asin: $("#f_asin").value.trim(), title: $("#f_title").value.trim(), brand: $("#f_brand").value.trim(),
    category: $("#f_category").value, price: parseFloat($("#f_price").value) || 0, was: parseFloat($("#f_was").value) || 0,
    rating: parseFloat($("#f_rating").value) || 0, reviews: parseInt($("#f_reviews").value) || 0,
    image: $("#f_image").value.trim(), url: $("#f_url").value.trim(), verdict: $("#f_verdict").value.trim(),
    tags, flag: $("#f_flag").value || null, active: $("#f_active").value === "true",
  };
}
function select(id) { const p = PRODUCTS.find((x) => x.id === id); if (p) { fillForm(p); renderList(); } }

/* ---------- live preview ---------- */
const FLAG = { choice: "Editor's Choice", value: "Best Value", hot: "Hot Deal" };
function updatePreview() {
  const p = readForm(); const d = p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0;
  $("#preview").innerHTML = `
    <div style="position:relative">
      <img src="${p.image || "https://picsum.photos/seed/prev/600/400"}" alt="" />
      ${p.flag ? `<span class="flag" style="position:absolute;top:8px;left:8px">${FLAG[p.flag] || p.flag}</span>` : ""}
      ${d ? `<span class="mono" style="position:absolute;top:8px;right:8px;background:#16211a;color:#ffc531;padding:4px 7px;border-radius:6px;font-size:11px">−${d}%</span>` : ""}
    </div>
    <div class="b">
      <p class="mono" style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#177a4c">${esc(p.category)}</p>
      <h3 class="display" style="font-weight:800;font-size:1.05rem;margin:4px 0">${esc(p.title || "Your product title")}</h3>
      <p style="font-style:italic;color:#4b5a51;font-size:.85rem">"${esc(p.verdict || "Your one-line verdict appears here.")}"</p>
      <p class="mono" style="font-weight:700;font-size:1.2rem;margin-top:8px">$${p.price.toFixed(2)} ${p.was > p.price ? `<s style="color:#93a09a;font-size:.85rem">$${p.was.toFixed(2)}</s>` : ""}[...]
    </div>`;
}
F.forEach((k) => { const el = $("#f_" + k); if (el) el.addEventListener("input", updatePreview); });

/* ---------- save / delete / reorder ---------- */
$("#editor").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = readForm();
  if (!data.title) { toast("Title is required.", true); return; }
  $("#saveState").textContent = "saving…";
  try {
    if (currentId) await api("/api/admin/products/" + currentId, { method: "PUT", body: JSON.stringify(data) });
    else { const created = await api("/api/admin/products", { method: "POST", body: JSON.stringify(data) }); currentId = created.id; }
    toast(currentId ? "Saved ✓" : "Created ✓");
    await loadProducts(); select(currentId); markSaved();
  } catch (err) { toast(err.message, true); }
  finally { $("#saveState").textContent = ""; }
});
$("#btnDelete").addEventListener("click", async () => {
  if (!currentId) return;
  if (!confirm("Delete this product?")) return;
  try { await api("/api/admin/products/" + currentId, { method: "DELETE" }); toast("Deleted"); clearForm(); await loadProducts(); markSaved(); }
  catch (err) { toast(err.message, true); }
});
$("#btnNew").addEventListener("click", () => { clearForm(); renderList(); });

async function move(dir) {
  if (!currentId) return;
  const i = PRODUCTS.findIndex((p) => p.id === currentId); const j = i + dir;
  if (j < 0 || j >= PRODUCTS.length) return;
  [PRODUCTS[i], PRODUCTS[j]] = [PRODUCTS[j], PRODUCTS[i]];
  try { await api("/api/admin/reorder", { method: "PUT", body: JSON.stringify({ ids: PRODUCTS.map((p) => p.id) }) });
    await loadProducts(); select(currentId); toast("Reordered"); }
  catch (err) { toast(err.message, true); }
}
$("#btnUp").addEventListener("click", () => move(-1));
$("#btnDown").addEventListener("click", () => move(1));

/* ---------- Amazon auto-fetch ---------- */
$("#btnFetch").addEventListener("click", async () => {
  const asin = $("#f_asin").value.trim();
  if (!asin) { toast("Paste an ASIN first.", true); return; }
  $("#fetchState").innerHTML = `<span class="light warn mr-1"></span>fetching…`;
  try {
    const d = await api("/api/admin/amazon/lookup?asin=" + encodeURIComponent(asin));
    if (d.title)  $("#f_title").value  = d.title;
    if (d.brand)  $("#f_brand").value  = d.brand;
    if (d.price)  $("#f_price").value  = d.price;
    if (d.image)  $("#f_image").value  = d.image;
    if (d.rating) $("#f_rating").value = d.rating;
    if (d.reviews)$("#f_reviews").value= d.reviews;
    $("#f_url").value = `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(window.PW_TAG || "")}`;
    updatePreview(); $("#fetchState").innerHTML = `<span class="light on mr-1"></span>filled ✓`;
    toast("Auto-filled from Amazon ✓");
  } catch (err) { $("#fetchState").innerHTML = `<span class="light off mr-1"></span>manual`; toast(err.message, true); }
});

/* ---------- boot ---------- */
function esc(v) { return String(v ?? "").replace(/[&<>\"']/g, (s) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[s])); }
function markSaved() {
  const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  $("#tkSave").textContent = t; $("#tkSave2").textContent = t;
}
async function loadProducts() { PRODUCTS = await api("/api/admin/products"); renderList(); }
async function boot() {
  try {
    const st = await api("/api/admin/status");
    $("#login").classList.add("hidden"); $("#app").classList.remove("hidden");
    const storeTxt = "store: " + st.store, paapiTxt = "pa-api: " + (st.paapi ? "ON" : "manual");
    $("#tkStore").textContent = $("#tkStore2").textContent = storeTxt;
    $("#tkPaapi").textContent = $("#tkPaapi2").textContent = paapiTxt;
    $("#storePill").textContent = st.store; $("#paapiPill").textContent = st.paapi ? "ON" : "manual";
    $("#storeDot").className = "light " + (st.github ? "on" : "warn");
    $("#paapiDot").className = "light " + (st.paapi ? "on" : "off");
    await loadProducts();
    $("#tkCount").textContent = $("#tkCount2").textContent = "products: " + PRODUCTS.length;
    if (!PRODUCTS.length) clearForm(); else select(PRODUCTS[0].id);
  } catch { logout(); }
}
if (TOKEN) boot();
