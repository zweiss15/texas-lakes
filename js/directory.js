const METRO_CITIES = new Set([
  "Austin",
  "San Antonio",
  "Houston",
  "Dallas",
  "Fort Worth",
  "Dallas-Fort Worth",
]);

let lakes = [];
let sortKey = "default";
let sortDir = "desc";

function formatCapacity(acreFeet) {
  return `${(acreFeet / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}k`;
}

function formatPct(pct) {
  return `${pct.toFixed(1)}%`;
}

function compareDefault(a, b) {
  const aMetro = METRO_CITIES.has(a.city) ? 0 : 1;
  const bMetro = METRO_CITIES.has(b.city) ? 0 : 1;
  if (aMetro !== bMetro) return aMetro - bMetro;
  return b.conservationCapacity - a.conservationCapacity;
}

function render() {
  const sorted =
    sortKey === "default"
      ? [...lakes].sort(compareDefault)
      : [...lakes].sort((a, b) => {
          let av = a[sortKey];
          let bv = b[sortKey];
          if (typeof av === "string") {
            av = av.toLowerCase();
            bv = bv.toLowerCase();
          }
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        });

  const tbody = document.getElementById("lakes-body");
  tbody.innerHTML = sorted
    .map((lake) => {
      const isFull = lake.percentFull >= 100;
      return `
        <tr>
          <td class="left"><a href="/${lake.slug}/">${lake.name}</a></td>
          <td class="left">${lake.city}</td>
          <td class="${isFull ? "full" : ""}">${formatPct(lake.percentFull)}</td>
          <td>${formatPct(lake.percentFullMonthAgo)}</td>
          <td>${formatPct(lake.percentFullYearAgo)}</td>
          <td>${formatCapacity(lake.conservationCapacity)}</td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.toggle("sorted", th.dataset.sort === sortKey);
    th.dataset.dir = th.dataset.sort === sortKey ? sortDir : "";
  });
}

function attachSortHandlers() {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir = key === "name" || key === "city" ? "asc" : "desc";
      }
      render();
    });
  });
}

async function loadLakes() {
  const res = await fetch("/data/lakes.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load lakes: ${res.status}`);
  lakes = await res.json();
  attachSortHandlers();
  render();
}

loadLakes().catch((err) => {
  document.getElementById("lakes-body").innerHTML =
    '<tr><td colspan="6">Couldn\'t load lake data — try refreshing.</td></tr>';
  console.error(err);
});
