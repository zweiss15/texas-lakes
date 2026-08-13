import { writeFile, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { LAKES } from "./lakes-config.mjs";

const rootPath = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));

const DAY_MS = 24 * 60 * 60 * 1000;

function findClosestRow(rows, targetDate) {
  let closest = rows[0];
  let closestDiff = Math.abs(new Date(rows[0].date) - targetDate);
  for (const r of rows) {
    const diff = Math.abs(new Date(r.date) - targetDate);
    if (diff < closestDiff) {
      closest = r;
      closestDiff = diff;
    }
  }
  return closest;
}

// Groups rows by a bucket key (week or month) and collapses each bucket to
// one averaged point, so long ranges (5 years, all time) stay small and
// fast to render instead of shipping tens of thousands of daily points.
function downsample(rows, bucketKeyFor) {
  const buckets = new Map();
  for (const r of rows) {
    const key = bucketKeyFor(r.date);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(r);
  }
  return [...buckets.values()].map((group) => {
    const last = group[group.length - 1];
    const avgPct = group.reduce((s, r) => s + r.percentFull, 0) / group.length;
    const avgLevel = group.reduce((s, r) => s + r.waterLevel, 0) / group.length;
    return {
      date: last.date,
      waterLevel: Math.round(avgLevel * 100) / 100,
      percentFull: Math.round(avgPct * 10) / 10,
    };
  });
}

function weekKey(dateStr) {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.floor((d - jan1) / (7 * DAY_MS));
  return `${d.getFullYear()}-W${week}`;
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

async function fetchLake(lake) {
  const csvUrl = `https://waterdatafortexas.org/reservoirs/individual/${lake.slug}.csv`;
  const res = await fetch(csvUrl);
  if (!res.ok) {
    throw new Error(`[${lake.slug}] Failed to fetch CSV: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();

  const lines = text.split("\n").filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2) {
    throw new Error(`[${lake.slug}] CSV had no data rows`);
  }

  const header = lines[0].split(",");
  const rows = lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",");
      const record = Object.fromEntries(header.map((key, i) => [key, cols[i]]));
      return {
        date: record.date,
        waterLevel: parseFloat(record.water_level),
        percentFull: parseFloat(record.percent_full),
      };
    })
    .filter((r) => !Number.isNaN(r.percentFull) && !Number.isNaN(r.waterLevel));

  if (rows.length === 0) {
    throw new Error(`[${lake.slug}] No valid rows parsed from CSV`);
  }

  const last = rows[rows.length - 1];
  const lastLine = lines[lines.length - 1].split(",");
  const lastRecord = Object.fromEntries(header.map((key, i) => [key, lastLine[i]]));
  const conservationCapacity = parseInt(lastRecord.conservation_capacity, 10);
  const fetchedAt = new Date().toISOString();

  const latestDate = new Date(last.date);
  const monthAgoDate = new Date(latestDate);
  monthAgoDate.setDate(monthAgoDate.getDate() - 30);
  const yearAgoDate = new Date(latestDate);
  yearAgoDate.setDate(yearAgoDate.getDate() - 365);
  const fiveYearsAgoDate = new Date(latestDate);
  fiveYearsAgoDate.setDate(fiveYearsAgoDate.getDate() - 365 * 5);

  const percentFullMonthAgo = findClosestRow(rows, monthAgoDate).percentFull;
  const percentFullYearAgo = findClosestRow(rows, yearAgoDate).percentFull;

  const latest = {
    slug: lake.slug,
    name: lake.name,
    city: lake.city,
    location: lake.location,
    featured: Boolean(lake.featured),
    date: last.date,
    waterLevel: last.waterLevel,
    percentFull: last.percentFull,
    percentFullMonthAgo,
    percentFullYearAgo,
    conservationCapacity,
    recordStartDate: rows[0].date,
    fetchedAt,
  };

  // Recent (raw daily) -- covers the 1 Week / 1 Month / 6 Month / 1 Year buttons
  const recentRows = rows.filter((r) => latestDate - new Date(r.date) <= 400 * DAY_MS);

  // 5 years, downsampled to weekly -- daily would still be small, but
  // weekly is plenty for a "long trend" view and keeps every lake's file
  // the same rough size regardless of its data quality/gaps.
  const fiveYearRows = rows.filter((r) => new Date(r.date) >= fiveYearsAgoDate);
  const fiveYearDownsampled = downsample(fiveYearRows, weekKey);

  // All time, downsampled to monthly -- some lakes (Travis) go back to
  // 1940 with 30,000+ daily rows; monthly keeps this readable and light
  // regardless of how far back a lake's record goes.
  const allTimeDownsampled = downsample(rows, monthKey);

  const dir = rootPath(`data/${lake.slug}`);
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/latest.json`, `${JSON.stringify(latest, null, 2)}\n`);
  await writeFile(`${dir}/history.json`, `${JSON.stringify(recentRows, null, 2)}\n`);
  await writeFile(
    `${dir}/history-5y.json`,
    `${JSON.stringify(fiveYearDownsampled, null, 2)}\n`
  );
  await writeFile(
    `${dir}/history-all.json`,
    `${JSON.stringify(allTimeDownsampled, null, 2)}\n`
  );

  console.log(
    `[${lake.slug}] ${rows.length} days total (since ${rows[0].date}), ${latest.percentFull}% full`
  );
  return latest;
}

async function generateLakePage(lake) {
  await mkdir(rootPath(lake.slug), { recursive: true });
  await copyFile(rootPath("lake-template.html"), rootPath(`${lake.slug}/index.html`));
}

async function main() {
  const summaries = [];
  for (const lake of LAKES) {
    try {
      const latest = await fetchLake(lake);
      await generateLakePage(lake);
      summaries.push(latest);
    } catch (err) {
      console.error(`Skipping ${lake.slug}: ${err.message}`);
    }
  }

  await writeFile(rootPath("data/lakes.json"), `${JSON.stringify(summaries, null, 2)}\n`);
  console.log(`Updated data/lakes.json (${summaries.length}/${LAKES.length} lakes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
