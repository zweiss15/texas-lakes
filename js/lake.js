let historyData = [];
let currentSlice = [];
let currentPoints = [];
let chartViewBox = { width: 600, height: 220 };

function getSlug() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[0] || "";
}

function formatTimestamp(fetchedAtIso) {
  const d = new Date(fetchedAtIso);
  const datePart = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `As of ${datePart} at ${timePart}`;
}

function renderStatus(latest) {
  document.title = `Is ${latest.name} Full Yet?`;
  document.getElementById("tagline").textContent = `Is ${latest.name} Full Yet?`;
  document.getElementById("location").textContent = latest.location;

  const status = document.getElementById("status");
  const percent = document.getElementById("percent");
  const timestamp = document.getElementById("timestamp");

  const pct = latest.percentFull;
  const isFull = pct >= 100;

  status.textContent = isFull ? "YUP" : "NOPE";
  status.className = isFull ? "full" : "not-full";

  percent.textContent = `${pct.toFixed(1)}% full today`;
  timestamp.textContent = formatTimestamp(latest.fetchedAt);
}

function renderChart(days) {
  const svg = document.getElementById("chart");
  const slice = historyData.slice(-days);
  if (slice.length === 0) return;

  const width = 600;
  const height = 220;
  const padding = { top: 10, right: 10, bottom: 8, left: 28 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const xFor = (i) =>
    padding.left + (slice.length === 1 ? 0 : (i / (slice.length - 1)) * plotWidth);
  const yFor = (pct) => padding.top + plotHeight - (pct / 100) * plotHeight;

  const points = slice.map((d, i) => [xFor(i), yFor(d.percentFull)]);

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const baseline = (padding.top + plotHeight).toFixed(1);
  const areaPath =
    `M${points[0][0].toFixed(1)},${baseline} ` +
    points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L${points[points.length - 1][0].toFixed(1)},${baseline} Z`;

  const gridLines = [0, 25, 50, 75, 100]
    .map((pct) => {
      const y = yFor(pct).toFixed(1);
      return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />
              <text x="0" y="${(Number(y) - 2).toFixed(1)}">${pct}%</text>`;
    })
    .join("");

  const [lastX, lastY] = points[points.length - 1];

  svg.innerHTML = `
    <g class="chart-grid">${gridLines}</g>
    <path class="chart-fill" d="${areaPath}"></path>
    <path class="chart-line" d="${linePath}"></path>
    <circle class="chart-dot" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.5"></circle>
    <line class="chart-hover-line" x1="0" y1="${padding.top}" x2="0" y2="${baseline}" style="display:none"></line>
    <circle class="chart-hover-dot" r="4" style="display:none"></circle>
  `;

  currentSlice = slice;
  currentPoints = points;
  chartViewBox = { width, height };
}

function formatChartDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function updateHover(clientX, clientY) {
  if (!currentPoints.length) return;

  const svg = document.getElementById("chart");
  const tooltip = document.getElementById("chart-tooltip");
  const rect = svg.getBoundingClientRect();
  const scaleX = chartViewBox.width / rect.width;
  const xInViewBox = (clientX - rect.left) * scaleX;

  let nearestIdx = 0;
  let nearestDist = Infinity;
  currentPoints.forEach(([x], i) => {
    const dist = Math.abs(x - xInViewBox);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestIdx = i;
    }
  });

  const [x, y] = currentPoints[nearestIdx];
  const point = currentSlice[nearestIdx];

  const hoverDot = svg.querySelector(".chart-hover-dot");
  const hoverLine = svg.querySelector(".chart-hover-line");
  hoverDot.setAttribute("cx", x.toFixed(1));
  hoverDot.setAttribute("cy", y.toFixed(1));
  hoverDot.style.display = "";
  hoverLine.setAttribute("x1", x.toFixed(1));
  hoverLine.setAttribute("x2", x.toFixed(1));
  hoverLine.style.display = "";

  tooltip.textContent = `${point.percentFull.toFixed(1)}% — ${formatChartDate(point.date)}`;
  tooltip.style.display = "block";

  const wrapRect = svg.parentElement.getBoundingClientRect();
  const rawLeft = clientX - wrapRect.left + 12;
  const maxLeft = wrapRect.width - tooltip.offsetWidth - 4;
  tooltip.style.left = `${Math.max(4, Math.min(rawLeft, maxLeft))}px`;
  tooltip.style.top = `${Math.max(0, clientY - wrapRect.top - 32)}px`;
}

function hideHover() {
  const svg = document.getElementById("chart");
  const tooltip = document.getElementById("chart-tooltip");
  const hoverDot = svg.querySelector(".chart-hover-dot");
  const hoverLine = svg.querySelector(".chart-hover-line");
  if (hoverDot) hoverDot.style.display = "none";
  if (hoverLine) hoverLine.style.display = "none";
  tooltip.style.display = "none";
}

function setActiveButton(days) {
  document.querySelectorAll(".chart-controls button").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.range) === days);
  });
}

async function loadData() {
  const slug = getSlug();
  if (!slug) throw new Error("Could not determine lake slug from URL");

  const [latestRes, historyRes] = await Promise.all([
    fetch(`/data/${slug}/latest.json`, { cache: "no-store" }),
    fetch(`/data/${slug}/history.json`, { cache: "no-store" }),
  ]);
  if (!latestRes.ok) throw new Error(`Failed to load latest data: ${latestRes.status}`);
  if (!historyRes.ok) throw new Error(`Failed to load history data: ${historyRes.status}`);

  const latest = await latestRes.json();
  historyData = await historyRes.json();

  renderStatus(latest);

  const defaultRange = 365;
  renderChart(defaultRange);
  setActiveButton(defaultRange);

  document.querySelectorAll(".chart-controls button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const days = Number(btn.dataset.range);
      renderChart(days);
      setActiveButton(days);
    });
  });

  const svg = document.getElementById("chart");
  svg.addEventListener("mousemove", (e) => updateHover(e.clientX, e.clientY));
  svg.addEventListener("mouseleave", hideHover);
  svg.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (touch) updateHover(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
  svg.addEventListener("touchend", hideHover);
}

loadData().catch((err) => {
  document.getElementById("status").textContent = "Error";
  document.getElementById("timestamp").textContent =
    "Couldn't load lake data — try refreshing.";
  console.error(err);
});
