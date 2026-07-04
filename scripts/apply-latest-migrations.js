#!/usr/bin/env node
/**
 * Apply pending SQL migrations to Supabase database.
 *
 * Tracks which migrations have been applied via a `_migrations` table.
 * Usage:
 *   SUPABASE_PAT="sbp_xxxxx" node scripts/apply-latest-migrations.js
 *   SUPABASE_DB_PASSWORD="your-password" node scripts/apply-latest-migrations.js
 */
const { readFileSync, readdirSync } = require("fs")
const { join } = require("path")

const pat = process.env.SUPABASE_PAT
const dbPassword = process.env.SUPABASE_DB_PASSWORD

if (!pat && !dbPassword) {
  console.error("Missing credentials. Set SUPABASE_PAT or SUPABASE_DB_PASSWORD")
  process.exit(1)
}

const PROJECT_REF = "vbgdknxiysrnkldckvud"
const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations")

async function applyViaPat(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API error (${response.status}): ${text}`)
  }

  const data = await response.json()
  if (Array.isArray(data)) return
  throw new Error(`Unexpected response: ${JSON.stringify(data)}`)
}

async function applyViaDbUrl(sql) {
  const { Pool } = require("pg")
  const pool = new Pool({
    host: "aws-0-us-east-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: `postgres.${PROJECT_REF}`,
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  const client = await pool.connect()
  try {
    await client.query(sql)
  } finally {
    client.release()
    await pool.end()
  }
}

async function getAppliedMigrations(runQuery) {
  try {
    const result = await runQuery("SELECT filename FROM public._migrations ORDER BY filename")
    return new Set((result || []).map(r => r.filename))
  } catch {
    return new Set()
  }
}

async function ensureMigrationsTable(runQuery) {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `)
}

async function recordMigration(runQuery, filename) {
  await runQuery(
    `INSERT INTO public._migrations (filename) VALUES ('${filename.replace(/'/g, "''")}') ON CONFLICT DO NOTHING`
  )
}

async function main() {
  const apply = pat ? applyViaPat : applyViaDbUrl
  const runQuery = async (sql) => {
    if (pat) return applyViaPat(sql)
    return applyViaDbUrl(sql)
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort()

  if (files.length === 0) {
    console.log("No migration files found.")
    process.exit(0)
  }

  await ensureMigrationsTable(runQuery)
  const applied = await getAppliedMigrations(runQuery)
  const pending = files.filter(f => !applied.has(f))

  if (pending.length === 0) {
    console.log("All migrations already applied.")
    process.exit(0)
  }

  console.log(`Found ${pending.length} pending migration(s):`)
  pending.forEach(f => console.log(`  - ${f}`))

  for (const file of pending) {
    const sqlPath = join(MIGRATIONS_DIR, file)
    const sql = readFileSync(sqlPath, "utf8")

    process.stdout.write(`Applying ${file}... `)
    try {
      await apply(sql)
      await recordMigration(runQuery, file)
      console.log("OK")
    } catch (err) {
      console.log("FAILED")
      console.error(`  Error: ${err.message}`)
      process.exit(1)
    }
  }

  console.log("All pending migrations applied successfully!")
  process.exit(0)
}

main()
