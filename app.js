let restaurants = [],
  map,
  markers = [],
  activeFilter = "all";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const modelLabel = (m) =>
  m === "no-tip"
    ? "No tipping"
    : m === "service-included"
      ? "Service included"
      : "Not sure";
async function init() {
  const seed = await fetch("data/restaurants.json").then((r) => r.json());
  restaurants = seed.restaurants;
  map = L.map("map", { zoomControl: false }).setView([43.6532, -79.3832], 12);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  bind();
  render();
}
function directionsUrl(r) {
  const dest =
    r.lat && r.lng
      ? `${r.lat},${r.lng}`
      : encodeURIComponent(`${r.name}, ${r.address}, Toronto`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}
function filtered() {
  const q = $("#search").value.trim().toLowerCase();
  let rows = restaurants.filter(
    (r) =>
      !q ||
      [r.name, r.address, r.neighbourhood].join(" ").toLowerCase().includes(q),
  );
  if (["service-included", "no-tip"].includes(activeFilter))
    rows = rows.filter((r) => r.model === activeFilter);
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}
function render() {
  const rows = filtered();
  $("#resultCount").textContent =
    `${rows.length} place${rows.length === 1 ? "" : "s"}`;
  $("#placeCount").textContent = restaurants.length;
  $("#restaurantList").innerHTML =
    rows
      .map(
        (r) =>
          `<article class="card" data-id="${r.id}"><div class="card-top"><div><div class="meta">${r.neighbourhood}</div><h3>${r.name}</h3><div class="meta">${r.address}</div></div></div><span class="model">${modelLabel(r.model)}</span><div class="card-actions"><a class="btn-outline" href="${directionsUrl(r)}" target="_blank" rel="noopener">Get directions</a><button type="button" class="btn-outline">See menu</button></div></article>`,
      )
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
  $$(".card-actions a, .card-actions button").forEach(
    (el) => (el.onclick = (e) => e.stopPropagation()),
  );
}
function openPlace(id) {
  const r = restaurants.find((x) => x.id === id);
  $("#placeContent").innerHTML =
    `<p class="eyebrow">${r.neighbourhood.toUpperCase()}</p><h2>${r.name}</h2><p>${r.address}</p><div class="card-actions"><a class="btn-outline" href="${directionsUrl(r)}" target="_blank" rel="noopener">Get directions</a><button type="button" class="btn-outline">See menu</button></div><p class="model">${modelLabel(r.model)}</p>${r.note ? `<p class="meta">${r.note}</p>` : ""}`;
  $("#placeDialog").showModal();
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
    $("#addForm").hidden = false;
    $("#addForm").reset();
    $("#addFormError").hidden = true;
    $("#addFormThanks").hidden = true;
    $("#addDialog").showModal();
  };
  $("#addBtn").onclick = openAdd;
  $("#mapAddBtn").onclick = openAdd;
  $("#aboutBtn").onclick = () => $("#aboutDialog").showModal();
  $$("dialog .close").forEach(
    (b) => (b.onclick = () => b.closest("dialog").close()),
  );
  $$(".cancel").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  $("#addForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const errorEl = $("#addFormError");
    errorEl.hidden = true;
    const turnstileToken = f.get("cf-turnstile-response");
    if (!turnstileToken) {
      errorEl.textContent = "Please complete the verification challenge.";
      errorEl.hidden = false;
      return;
    }
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          address: f.get("address"),
          neighbourhood: f.get("neighbourhood"),
          model: f.get("model"),
          evidence: f.get("evidence"),
          sourceUrl: f.get("sourceUrl") || "",
          turnstileToken,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      $("#addForm").hidden = true;
      $("#addFormThanks").hidden = false;
    } catch {
      errorEl.textContent = "Something went wrong. Please try again.";
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  };
}
init().catch((err) => {
  document.body.innerHTML = `<main style="padding:40px;font-family:sans-serif"><h1>Could not load prototype</h1><p>${err.message}</p><p>Run this project from a local web server. See README.md.</p></main>`;
});
