// Export every published lesson from Supabase to local markdown files.
// This is how a future Claude Code session reads the full lesson corpus when
// revamping the app. shared_lessons is public-read, so the anon key suffices
// (service-role key also works if present).
//
// Usage:
//   npx vercel env pull .env.vercel.tmp --environment=production --yes
//   node scripts/export-lessons.mjs
//
// Output: _prep/generated-lessons/{lang}/week-NNN.md  +  manifest.json

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function parseEnv(file) {
  const raw = readFileSync(file, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let v = line.slice(i + 1).replace(/\r/g, "").trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[line.slice(0, i).trim()] = v;
  }
  return out;
}

const env = parseEnv(".env.vercel.tmp");
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("Missing Supabase URL or key in .env.vercel.tmp. Run `vercel env pull .env.vercel.tmp` first.");
  process.exit(1);
}

const OUT_DIR = join("_prep", "generated-lessons");

async function fetchAllLessons() {
  const all = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const url =
      `${URL}/rest/v1/shared_lessons` +
      `?select=lang_code,week_number,content,updated_at` +
      `&order=lang_code.asc,week_number.asc&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) {
      throw new Error(`REST ${res.status}: ${await res.text()}`);
    }
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

const run = async () => {
  console.log(`Reading shared_lessons from ${URL} …`);
  const rows = await fetchAllLessons();
  console.log(`Fetched ${rows.length} lesson(s).`);

  mkdirSync(OUT_DIR, { recursive: true });

  const byLang = {};
  for (const r of rows) {
    const dir = join(OUT_DIR, r.lang_code);
    mkdirSync(dir, { recursive: true });
    const fname = `week-${String(r.week_number).padStart(3, "0")}.md`;
    writeFileSync(join(dir, fname), r.content, "utf8");
    byLang[r.lang_code] = (byLang[r.lang_code] || 0) + 1;
  }

  const manifest = {
    exportedAt: new Date().toISOString(),
    totalLessons: rows.length,
    byLanguage: byLang,
    lessons: rows.map((r) => ({
      langCode: r.lang_code,
      weekNumber: r.week_number,
      chars: r.content.length,
      updatedAt: r.updated_at,
      file: `${r.lang_code}/week-${String(r.week_number).padStart(3, "0")}.md`,
    })),
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log("\nBy language:", byLang);
  console.log(`\nWrote ${rows.length} file(s) to ${OUT_DIR}/`);
  console.log("Manifest:", join(OUT_DIR, "manifest.json"));
};

run().catch((err) => {
  console.error("Export failed:", err.message);
  process.exit(1);
});
