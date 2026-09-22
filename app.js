let restaurants = [],
  reports = [],
  map,
  markers = [],
  activeFilter = "all";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (d) =>
  d
    ? new Date(d + "T12:00:00").toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";
const modelLabel = (m) =>
  m === "no-tip"
    ? "No tipping"
    : m === "service-included"
      ? "Service included"
      : "Not sure";
const evidenceLabel = (e) =>
  ({
    visited: "Visited in person",
    website: "Restaurant website",
    employee: "Employee",
    other: "Other source",
  })[e] || e;
function track(event, props = {}) {
  const payload = {
    event,
    at: new Date().toISOString(),
    source: new URLSearchParams(location.search).get("utm_source") || "direct",
    ...props,
  };
  const events = JSON.parse(localStorage.getItem("tft-analytics") || "[]");
  events.push(payload);
  localStorage.setItem("tft-analytics", JSON.stringify(events));
  console.info("[analytics]", payload);
}
function ageDays(d) {
  return d
    ? Math.floor((Date.now() - new Date(d + "T12:00:00")) / 86400000)
    : 9999;
}
function info(r) {
  const rr = reports
    .filter((x) => x.restaurantId === r.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const supportive = rr.filter((x) => x.status === r.model),
    conflicting = rr.filter((x) => x.status !== r.model);
  const last = rr[0]?.date || null;
  let freshness = "needs";
  if (conflicting.length && rr[0] && rr[0].status !== r.model)
    freshness = "disputed";
  else if (ageDays(last) <= 90) freshness = "fresh";
  else if (ageDays(last) <= 365) freshness = "stale";
  return { rr, supportive, conflicting, last, freshness };
}
const statusLabel = (s) =>
  ({
    fresh: "CONFIRMED RECENTLY",
    stale: "GETTING STALE",
    needs: "NEEDS VERIFICATION",
    disputed: "DISPUTED",
  })[s];
async function init() {
  const seed = await fetch("data/restaurants.json").then((r) => r.json());
  const local = JSON.parse(
    localStorage.getItem("tft-data") || '{"restaurants":[],"reports":[]}',
  );
  restaurants = [...seed.restaurants, ...local.restaurants];
  reports = [...seed.reports, ...local.reports];
  map = L.map("map", { zoomControl: false }).setView([43.6532, -79.3832], 12);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  bind();
  render();
  track("map_loaded", { places: restaurants.length });
}
function filtered() {
  const q = $("#search").value.trim().toLowerCase();
  let rows = restaurants.filter(
    (r) =>
      !q ||
      [r.name, r.address, r.neighbourhood].join(" ").toLowerCase().includes(q),
  );
  if (activeFilter === "fresh")
    rows = rows.filter((r) => info(r).freshness === "fresh");
  if (activeFilter === "stale")
    rows = rows.filter((r) =>
      ["stale", "needs", "disputed"].includes(info(r).freshness),
    );
  if (["service-included", "no-tip"].includes(activeFilter))
    rows = rows.filter((r) => r.model === activeFilter);
  const sort = $("#sort").value;
  rows.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "reports"
        ? info(b).rr.length - info(a).rr.length
        : (info(b).last || "").localeCompare(info(a).last || ""),
  );
  return rows;
}
function render() {
  const rows = filtered();
  $("#resultCount").textContent =
    `${rows.length} place${rows.length === 1 ? "" : "s"}`;
  $("#placeCount").textContent = restaurants.length;
  $("#confirmationCount").textContent = reports.length;
  const latest = [...reports].sort((a, b) => b.date.localeCompare(a.date))[0]
    ?.date;
  $("#updatedLabel").textContent = latest
    ? `Latest report ${dateLabel(latest)}`
    : "Waiting for first report";
  $("#restaurantList").innerHTML =
    rows
      .map((r) => {
        const i = info(r);
        return `<article class="card" data-id="${r.id}"><div class="card-top"><div><div class="meta">${r.neighbourhood}</div><h3>${r.name}</h3><div class="meta">${r.address}</div></div><span class="badge ${i.freshness}">${statusLabel(i.freshness)}</span></div><span class="model">${modelLabel(r.model)}</span><div class="confirmation-line"><b>${i.supportive.length}</b> confirmation${i.supportive.length === 1 ? "" : "s"} · Last checked ${dateLabel(i.last)}</div></article>`;
      })
      .join("") || '<div class="card">No matching places.</div>';
  markers.forEach((m) => m.remove());
  markers = [];
  rows
    .filter((r) => r.lat && r.lng)
    .forEach((r) => {
      const m = L.marker([r.lat, r.lng], {
        icon: L.divIcon({
          className: "",
          html: '<div class="pin"></div>',
          iconSize: [18, 18],
        }),
      })
        .addTo(map)
        .bindTooltip(r.name);
      m.on("click", () => openPlace(r.id));
      markers.push(m);
    });
  $$(".card[data-id]").forEach(
    (c) => (c.onclick = () => openPlace(c.dataset.id)),
  );
}
function openPlace(id) {
  const r = restaurants.find((x) => x.id === id),
    i = info(r);
  track("restaurant_opened", { restaurantId: id });
  const history = i.rr
    .slice(0, 6)
    .map(
      (x) =>
        `<li><b>${dateLabel(x.date)}</b><span>${x.status === r.model ? "Still " + modelLabel(r.model).toLowerCase() : x.status === "tip-prompt" ? "Tip prompt reported" : x.status === "tip-expected" ? "Tip expected reported" : x.status === "service-included" ? "Service included reported" : "Change reported"} · ${evidenceLabel(x.evidence)}${x.sourceUrl ? ` · <a href="${x.sourceUrl}" target="_blank" rel="noopener">source</a>` : ""}</span></li>`,
    )
    .join("");
  $("#placeContent").innerHTML =
    `<p class="eyebrow">${r.neighbourhood.toUpperCase()}</p><h2>${r.name}</h2><p>${r.address}</p><div class="detail-status"><div><b>${modelLabel(r.model)}</b><br><small>Last checked ${dateLabel(i.last)}</small></div><span class="badge ${i.freshness}">${statusLabel(i.freshness)}</span></div><div class="feedback"><button data-confirm="${r.id}">Still accurate</button><button data-change="${r.id}">This has changed</button></div><h3>Recent reports</h3><ul class="history">${history || "<li>No reports yet. Be the first to verify it.</li>"}</ul>${r.note ? `<p class="meta">${r.note}</p>` : ""}`;
  $("#placeDialog").showModal();
  $("[data-confirm]").onclick = () => confirmPlace(r.id);
  $("[data-change]").onclick = () => openChange(r.id);
}
function confirmPlace(id) {
  track("confirmation_started", { restaurantId: id });
  const r = restaurants.find((x) => x.id === id);
  reports.push({
    id: "local-report-" + Date.now(),
    restaurantId: id,
    status: r.model,
    evidence: "visited",
    date: today(),
  });
  save();
  track("restaurant_confirmed", { restaurantId: id });
  $("#placeDialog").close();
  render();
}
function openChange(id) {
  track("change_report_started", { restaurantId: id });
  $("#placeDialog").close();
  $("#changeForm [name=restaurantId]").value = id;
  $("#changeDialog").showModal();
}
function save() {
  localStorage.setItem(
    "tft-data",
    JSON.stringify({
      restaurants: restaurants.filter((r) => r.id.startsWith("local-")),
      reports: reports.filter((r) => r.id.startsWith("local-")),
    }),
  );
}
function bind() {
  $("#search").oninput = render;
  $("#sort").onchange = render;
  $$("#filters .chip").forEach(
    (b) =>
      (b.onclick = () => {
        $$("#filters .chip").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        activeFilter = b.dataset.filter;
        render();
      }),
  );
  const openAdd = () => {
    track("add_place_started");
    $("#addDialog").showModal();
  };
  $("#addBtn").onclick = openAdd;
  $("#mapAddBtn").onclick = openAdd;
  $("#aboutBtn").onclick = () => $("#aboutDialog").showModal();
  $$("dialog .close").forEach(
    (b) => (b.onclick = () => b.closest("dialog").close()),
  );
  $$(".cancel").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  $("#addForm").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      id = "local-" + Date.now(),
      model = f.get("model");
    restaurants.push({
      id,
      name: f.get("name"),
      address: f.get("address"),
      neighbourhood: f.get("neighbourhood"),
      model,
      lat: null,
      lng: null,
    });
    reports.push({
      id: "local-report-" + Date.now(),
      restaurantId: id,
      status: model,
      evidence: f.get("evidence"),
      sourceUrl: f.get("sourceUrl") || "",
      date: today(),
    });
    save();
    track("place_submitted", { restaurantId: id, model });
    e.target.reset();
    $("#addDialog").close();
    render();
  };
  $("#changeForm").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      id = f.get("restaurantId");
    reports.push({
      id: "local-report-" + Date.now(),
      restaurantId: id,
      status: f.get("status"),
      evidence: f.get("evidence"),
      sourceUrl: f.get("sourceUrl") || "",
      date: today(),
    });
    save();
    track("change_reported", { restaurantId: id, status: f.get("status") });
    e.target.reset();
    $("#changeDialog").close();
    render();
  };
}
init().catch((err) => {
  document.body.innerHTML = `<main style="padding:40px;font-family:sans-serif"><h1>Could not load prototype</h1><p>${err.message}</p><p>Run this project from a local web server. See README.md.</p></main>`;
});
