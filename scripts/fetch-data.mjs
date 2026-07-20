import { writeFile, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { LAKES } from "./lakes-config.mjs";

const rootPath = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));

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

async function fetchLake(lake) {
  const csvUrl = `https://waterdatafortexas.org/reservoirs/individual/${lake.slug}-1year.csv`;
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

  const percentFullMonthAgo = findClosestRow(rows, monthAgoDate).percentFull;
  const percentFullYearAgo = findClosestRow(rows, yearAgoDate).percentFull;

  const latest = {
    slug: lake.slug,
    name: lake.name,
    city: lake.city,
    location: lake.location,
    date: last.date,
    waterLevel: last.waterLevel,
    percentFull: last.percentFull,
    percentFullMonthAgo,
    percentFullYearAgo,
    conservationCapacity,
    fetchedAt,
  };

  await mkdir(rootPath(`data/${lake.slug}`), { recursive: true });
  await writeFile(
    rootPath(`data/${lake.slug}/latest.json`),
    `${JSON.stringify(latest, null, 2)}\n`
  );
  await writeFile(
    rootPath(`data/${lake.slug}/history.json`),
    `${JSON.stringify(rows, null, 2)}\n`
  );

  console.log(`[${lake.slug}] ${rows.length} days fetched, ${latest.percentFull}% full`);
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
