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

function getComparator() {
  if (sortKey === "default") return compareDefault;
  return (a, b) => {
    let av = a[sortKey];
    let bv = b[sortKey];
    if (typeof av === "string") {
      av = av.toLowerCase();
      bv = bv.toLowerCase();
    }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  };
}

function rowHtml(lake) {
  const isFull = lake.percentFull >= 100;
  const star = lake.featured ? '<span class="star">★</span> ' : "";
  return `
    <tr class="${lake.featured ? "featured-row" : ""}">
      <td class="left">${star}<a href="/${lake.slug}/">${lake.name}</a></td>
      <td class="left">${lake.city}</td>
      <td class="${isFull ? "full" : ""}">${formatPct(lake.percentFull)}</td>
      <td>${formatPct(lake.percentFullMonthAgo)}</td>
      <td>${formatPct(lake.percentFullYearAgo)}</td>
      <td>${formatCapacity(lake.conservationCapacity)}</td>
    </tr>
  `;
}

function render() {
  const comparator = getComparator();
  const featured = lakes.filter((l) => l.featured).sort(comparator);
  const rest = lakes.filter((l) => !l.featured).sort(comparator);

  const divider =
    featured.length && rest.length ? '<tr class="divider-row"><td colspan="6"></td></tr>' : "";

  document.getElementById("lakes-body").innerHTML =
    featured.map(rowHtml).join("") + divider + rest.map(rowHtml).join("");

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
