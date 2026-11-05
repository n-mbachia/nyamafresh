const { ORDER_ENDPOINT, WHATSAPP_NUMBER, POCHI_NUMBER, MIN_ORDER, CUTOFF_TEXT, SLOTS, GOAT_LEAD_DAYS, GOAT_DEPOSIT, GOAT_PRICE_KG, FEE_RATE } = CONFIG;
const $ = id => document.getElementById(id);
const fmt = n => "KES " + Math.round(n).toLocaleString("en-KE");
const waLink = t => "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(t);
const MAX_QTY = 20, MAX_GOAT_DAYS = 90;
const ROW = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-chalk/30 py-3.5";
const BTN = "size-11 cursor-pointer rounded-full border border-chalk-dim bg-transparent p-0 text-2xl font-semibold leading-none text-chalk active:bg-white/15";
const INP = "h-11 w-[58px] rounded-lg border border-chalk-dim bg-white/10 p-0 text-center font-semibold text-chalk placeholder:text-chalk-dim [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/* ---------- helpers ---------- */
function h(tag, cls, ...kids) { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids); return e; }
const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };   // local date, not UTC
const normPhone = v => { const m = v.replace(/[\s-]/g, "").match(/^(?:\+?254|0)([17]\d{8})$/); return m ? "254" + m[1] : ""; };
const newRef = () => { const a = "0123456789ABCDEFGHJKMNPQRSTVWXYZ", r = crypto.getRandomValues(new Uint8Array(6)); return "NF-" + [...r].map(x => a[x % 32]).join(""); };

/* ---------- state ---------- */
const state = { mode: "packs", qty: {}, box: null, goat: null };

/* ---------- pricing engine: one place for every amount ---------- */
function quote() {
  const zone = ZONES.find(z => z.id === $("zone").value) || null;
  const q = { mode: state.mode, zone, fee: zone ? zone.fee : null, lines: [], extra: [], sub: 0, conv: 0, total: 0, payNow: 0 };
  if (q.mode === "packs") {
    PACKS.forEach(p => { const n = state.qty[p.id] || 0; if (n > 0) { q.lines.push(p.name + " x " + n); q.sub += n * p.price; } });
  } else if (q.mode === "box" && state.box) {
    q.lines.push(state.box.name + " (" + state.box.note + "), weekly standing order"); q.sub = state.box.price;
  } else if (q.mode === "goat" && state.goat) {
    q.lines.push(state.goat.name + " (" + state.goat.note + "), cut: " + $("goatCut").value); q.sub = state.goat.kg * GOAT_PRICE_KG;
  }
  q.conv = Math.round(q.sub * FEE_RATE);
  q.total = q.sub + q.conv;
  q.payNow = q.mode === "goat" ? Math.round(q.total * GOAT_DEPOSIT) : q.total;
  if (q.mode === "goat" && q.sub) q.extra.push("Estimate only: final meat price is " + fmt(GOAT_PRICE_KG) + "/kg of dressed weight, plus the " + Math.round(FEE_RATE * 100) + "% convenience fee",
    "Deposit now: " + fmt(q.payNow), "Balance after weighing, before dispatch: about " + fmt(q.total - q.payNow));
  return q;
}

/* ---------- validation ---------- */
function validate(q) {
  if (!q.sub) return { packs: "Add at least one pack.", box: "Choose a box size.", goat: "Choose half or whole goat." }[q.mode];
  if (q.mode === "packs" && q.sub < MIN_ORDER) return "Pack orders start at " + fmt(MIN_ORDER) + ".";
  if (q.mode === "goat") {
    const d = $("goatDate").value;
    if (!d) return "Choose the date you need it.";
    if (d < inDays(GOAT_LEAD_DAYS)) return "Goat orders need at least " + GOAT_LEAD_DAYS + " days' notice.";
    if (d > inDays(MAX_GOAT_DAYS)) return "Please pick a date within " + MAX_GOAT_DAYS + " days.";
  }
  if (!q.zone) return "Choose where you are.";
  if ($("name").value.trim().length < 2) return "Add your name.";
  if (!normPhone($("phone").value)) return "Enter a valid Kenyan mobile number, like 0712 345 678.";
  if ($("area").value.trim().length < 4) return "Describe your estate and gate so the rider can find you.";
  return "";
}

/* ---------- message and payload ---------- */
const whenText = q => q.mode === "goat" ? "Date needed: " + $("goatDate").value : "Delivery day: " + $("slot").value;
function buildMessage(q, ref) {
  return ["Hello, I'd like to place an order. (Ref " + ref + ")", "", ...q.lines.map(l => "- " + l), ...q.extra.map(l => "- " + l), "",
    whenText(q), "Meat subtotal: " + fmt(q.sub), "Convenience fee (" + Math.round(FEE_RATE * 100) + "%): " + fmt(q.conv),
    (q.mode === "goat" ? "Estimated order total: " : "Order total: ") + fmt(q.total),
    (q.mode === "goat" ? "Deposit to pay now: " : "To pay before delivery: ") + fmt(q.payNow),
    "Delivery (charged separately, pay the rider on arrival): " + (q.fee == null ? "please confirm" : fmt(q.fee)),
    "Name: " + $("name").value.trim(), "Phone: " + $("phone").value.trim(), "Location: " + q.zone.name + ", " + $("area").value.trim(),
    $("notes").value.trim() ? "Notes: " + $("notes").value.trim() : ""
  ].filter((x, i, a) => x !== "" || (i > 0 && a[i - 1] !== "")).join("\n");
}
const payload = (q, ref) => ({
  ref, order_type: q.mode, name: $("name").value.trim(), phone: normPhone($("phone").value), zone: q.zone.id,
  area: $("area").value.trim(), slot: $("slot").value, date: $("goatDate").value, notes: $("notes").value.trim(), website: $("website").value,
  items: Object.entries(state.qty).filter(([, n]) => n > 0).map(([id, qty]) => ({ id, qty })),
  box: state.box && state.box.id, goat: state.goat && { id: state.goat.id, cut: $("goatCut").value }, client_total: q.total
});

/* ---------- rendering ---------- */
function refresh() {
  const q = quote();
  $("sub").textContent = fmt(q.sub); $("convFee").textContent = fmt(q.conv);
  $("total").textContent = $("barTotal").textContent = fmt(q.total);
  $("payNow").textContent = fmt(q.payNow);
  $("feeTxt").textContent = q.fee == null ? "Confirmed on WhatsApp" : fmt(q.fee);
  const all = [...q.lines, ...q.extra];
  $("summary").replaceChildren(...(all.length ? all : ["Nothing selected yet."]).map(t => h("li", "", t)));
  $("barBtn").textContent = q.sub > 0 ? "Review order" : "Choose items";
  $("barBtn").classList.toggle("animate-pulse-ring", q.sub > 0);
  $("send").classList.toggle("animate-pulse-ring", q.sub > 0);
}
function setMode(m) {
  state.mode = m;
  const tabs = [...document.querySelectorAll("#tabs .tab")];
  tabs.forEach(t => { const on = t.dataset.mode === m; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
  ["packs", "box", "goat"].forEach(k => $("p-" + k).classList.toggle("hidden", k !== m));
  $("slotWrap").classList.toggle("hidden", m === "goat");
  $("dateWrap").classList.toggle("hidden", m !== "goat");
  $("payRow").classList.toggle("hidden", m !== "goat");
  $("payLbl").textContent = "Deposit to pay now (" + Math.round(GOAT_DEPOSIT * 100) + "%)";
  $("totLbl").textContent = m === "goat" ? "Estimated order total" : "Order total, pay before delivery";
  refresh();
}

/* ---------- build the interface ---------- */
$("cycleNote").textContent = "Delivery: " + SLOTS.join(" & ") + " · " + CUTOFF_TEXT + " · goat: " + GOAT_LEAD_DAYS + " days' notice.";
$("feeLbl").textContent = "Convenience fee (" + Math.round(FEE_RATE * 100) + "%)";
$("priceNote").textContent = "Prices shown + " + Math.round(FEE_RATE * 100) + "% convenience fee. Delivery fee is separate.";
$("payNote").textContent = "Pay by M-Pesa Pochi la Biashara" + (POCHI_NUMBER ? ": " + POCHI_NUMBER : "; we’ll send the number on WhatsApp after confirmation.");
$("quickChat").href = waLink("Hello, I have a question about halal meat delivery in Kikuyu.");
$("share").href = "https://wa.me/?text=" + encodeURIComponent("Fresh halal beef and goat, delivered in Kikuyu: " + location.href);
SLOTS.forEach(s => $("slot").add(new Option(s, s)));
ZONES.forEach(z => $("zone").add(new Option(z.name, z.id)));
GOAT_CUTS.forEach(c => $("goatCut").add(new Option(c, c)));
$("goatDate").min = inDays(GOAT_LEAD_DAYS); $("goatDate").max = inDays(MAX_GOAT_DAYS);

const setQty = (id, v, input) => { const n = Math.min(MAX_QTY, Math.max(0, parseInt(v) || 0)); state.qty[id] = n; input.value = n || ""; refresh(); };
PACKS.forEach(p => {
  const input = h("input", INP); Object.assign(input, { type: "number", min: 0, max: MAX_QTY, step: 1, placeholder: "0" });
  input.inputMode = "numeric"; input.setAttribute("aria-label", "Number of " + p.name);
  const step = (sign, label, sym) => { const b = h("button", BTN, sym); b.type = "button"; b.setAttribute("aria-label", label + " " + p.name); b.onclick = () => setQty(p.id, (state.qty[p.id] || 0) + sign, input); return b; };
  input.oninput = () => setQty(p.id, input.value, input);
  $("cuts").append(h("div", ROW,
    h("div", "min-w-0 font-display text-[1.1rem] font-medium leading-tight", p.name, h("span", "mt-0.5 block font-body text-sm font-normal text-chalk-dim", fmt(p.price) + " " + p.unit + " · " + p.note)),
    h("div", "flex items-center gap-1.5", step(-1, "Fewer", "−"), input, step(1, "More", "+"))));
});
function opts(el, list, price, pick) {
  list.forEach(o => {
    const b = h("button", "opt", h("span", "font-display text-[1.1rem] font-medium", o.name, h("small", "block font-body text-sm font-normal text-chalk-dim", o.note)), h("strong", "whitespace-nowrap", price(o)));
    b.type = "button"; b.setAttribute("aria-pressed", "false");
    b.onclick = () => { el.querySelectorAll(".opt").forEach(x => x.setAttribute("aria-pressed", String(x === b))); pick(o); refresh(); };
    el.append(b);
  });
}
opts($("boxOpts"), BOXES, o => fmt(o.price), o => state.box = o);
opts($("goatOpts"), GOATS, o => "about " + fmt(o.kg * GOAT_PRICE_KG), o => state.goat = o);

const tabs = [...document.querySelectorAll("#tabs .tab")];
tabs.forEach((t, i) => {
  t.onclick = () => setMode(t.dataset.mode);
  t.onkeydown = e => { const n = e.key === "ArrowRight" ? (i + 1) % 3 : e.key === "ArrowLeft" ? (i + 2) % 3 : null; if (n !== null) { e.preventDefault(); tabs[n].focus(); setMode(tabs[n].dataset.mode); } };
});
$("zone").onchange = $("goatCut").onchange = refresh;

/* Remember details on this phone only, and only if the customer leaves the box ticked */
const SAVED = ["name", "phone", "area"];
try { SAVED.forEach(k => { const v = localStorage.getItem("nf_" + k); if (v) $(k).value = v; }); } catch (e) {}
const remember = () => { try { SAVED.forEach(k => $("remember").checked ? localStorage.setItem("nf_" + k, $(k).value.trim()) : localStorage.removeItem("nf_" + k)); } catch (e) {} };

/* Sticky bar on phones */
let inBoard = false, inPanel = false;
const syncBar = () => { const s = inBoard && !inPanel; $("bar").classList.toggle("translate-y-0", s); $("bar").classList.toggle("translate-y-[110%]", !s); };
if ("IntersectionObserver" in window) {
  new IntersectionObserver(e => { inBoard = e[0].isIntersecting; syncBar(); }).observe($("order"));
  new IntersectionObserver(e => { inPanel = e[0].isIntersecting; syncBar(); }, { threshold: 0.15 }).observe($("details"));
}
$("barBtn").onclick = () => $("details").scrollIntoView({ behavior: "smooth", block: quote().sub > 0 ? "start" : "center" });

/* ---------- order submission: explicit states, one reference per order ---------- */
let sending = false, ref = null, refSig = "";
function showFallback(msg) {
  $("fbLink").href = waLink(msg); $("fallback").hidden = false;
  $("copyBtn").onclick = async () => { try { await navigator.clipboard.writeText(msg); $("copyBtn").textContent = "copied, now paste it in WhatsApp"; } catch (e) { $("copyBtn").textContent = "copy failed, please try again"; } };
}
async function submit() {
  if (sending) return;
  const q = quote(), err = validate(q);
  $("error").textContent = err; $("status").textContent = "";
  if (err) return;
  remember();
  const sig = JSON.stringify([q.mode, q.lines, normPhone($("phone").value), $("goatDate").value, $("slot").value, q.zone.id]);
  if (sig !== refSig) { ref = newRef(); refSig = sig; }        // retrying the same order keeps the same reference
  const msg = buildMessage(q, ref);
  showFallback(msg);
  sending = true; $("send").disabled = true; $("send").textContent = "Sending...";
  let status = "Order " + ref + ". Send the WhatsApp message to confirm.";
  if (ORDER_ENDPOINT) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(ORDER_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(q, ref)), signal: ctl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      status = "Order " + ref + " saved. Send the WhatsApp message to confirm.";
    } catch (e) {
      status = "Could not save your order online. Send the WhatsApp message instead. Ref " + ref + ".";
    } finally { clearTimeout(timer); }
  }
  $("status").textContent = status;
  sending = false; $("send").disabled = false; $("send").textContent = "Confirm order on WhatsApp";
  window.location.href = waLink(msg);
}
$("send").onclick = submit;
setMode("packs");
