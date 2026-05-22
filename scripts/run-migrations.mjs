// One-time migration runner. Reads POSTGRES_URL_NON_POOLING from .env.vercel.tmp
// and executes the SQL migration files in order, plus the admin grant.
// Usage: node scripts/run-migrations.mjs

import { readFileSync } from "node:fs";
import { Client } from "pg";

// ── Load connection string from the pulled env file ──
const env = Object.fromEntries(
  readFileSync(".env.vercel.tmp", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      let v = l.slice(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return [l.slice(0, idx).trim(), v];
    }),
);

const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
if (!connectionString) {
  console.error("No POSTGRES_URL found in .env.vercel.tmp");
  process.exit(1);
}

const steps = [
  { label: "migration-002 (roles, shared_lessons, audit_log)", file: "supabase/migration-002-shared-lessons.sql" },
  { label: "migration-003 (recover old per-user lessons)", file: "supabase/migration-003-recover-old-lessons.sql" },
];

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const run = async () => {
  await client.connect();
  console.log("Connected to Postgres.\n");

  for (const step of steps) {
    const sql = readFileSync(step.file, "utf8");
    process.stdout.write(`Running ${step.label}… `);
    try {
      await client.query(sql);
      console.log("OK");
    } catch (err) {
      console.log("FAILED");
      console.error(`  ${err.message}`);
    }
  }

  // Verify: founder role + counts
  console.log("\n── Verification ──");
  const role = await client.query(
    `select u.email, p.role from public.profiles p
     join auth.users u on u.id = p.user_id
     where u.email = 'cedric.g.kato@gmail.com'`,
  );
  console.log("Founder role:", role.rows[0] ?? "(no profile row found)");

  const shared = await client.query(
    `select lang_code, count(*)::int as n from public.shared_lessons group by lang_code order by lang_code`,
  );
  console.log("Shared lessons by language:", shared.rows.length ? shared.rows : "(none)");

  const oldLessons = await client.query(
    `select l.lang_code, count(*)::int as n from public.lessons l
     join auth.users u on u.id = l.user_id
     where u.email = 'cedric.g.kato@gmail.com' group by l.lang_code`,
  );
  console.log("Old per-user lessons (founder):", oldLessons.rows.length ? oldLessons.rows : "(none)");

  await client.end();
  console.log("\nDone.");
};

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
