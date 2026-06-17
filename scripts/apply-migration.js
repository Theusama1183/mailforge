#!/usr/bin/env node
/**
 * Migration script for MailForge
 * Applies SQL migrations to Supabase database
 *
 * Usage:
 *   # Using Supabase PAT (Personal Access Token) — preferred
 *   SUPABASE_PAT="sbp_xxxxx" node scripts/apply-migration.js
 *
 *   # Or using DB password (from Supabase Dashboard → Database Settings)
 *   SUPABASE_DB_PASSWORD="your-password" node scripts/apply-migration.js
 */
const { readFileSync } = require("fs")
const { join } = require("path")

const pat = process.env.SUPABASE_PAT
const dbPassword = process.env.SUPABASE_DB_PASSWORD

if (!pat && !dbPassword) {
  console.error("❌ Missing credentials. Set either SUPABASE_PAT or SUPABASE_DB_PASSWORD")
  console.error("")
  console.error("Usage:")
  console.error("  SUPABASE_PAT='sbp_xxxxx' node scripts/apply-migration.js")
  console.error("  # or")
  console.error("  SUPABASE_DB_PASSWORD='your-password' node scripts/apply-migration.js")
  process.exit(1)
}

const PROJECT_REF = "vbgdknxiysrnkldckvud"

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
  // Empty array = success
  if (Array.isArray(data) && data.length === 0) return
  // Non-empty = result rows (also success)
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

async function main() {
  const sqlPath = join(__dirname, "..", "supabase", "migrations", "0011_apply_workspace_fixes.sql")
  const sql = readFileSync(sqlPath, "utf8")

  console.log("📦 Applying migration...")
  try {
    if (pat) {
      console.log("🔑 Using Supabase PAT (Management API)...")
      await applyViaPat(sql)
    } else {
      console.log("🔌 Connecting to Supabase database via PgBouncer...")
      await applyViaDbUrl(sql)
    }
    console.log("✅ Migration applied successfully!")
    process.exit(0)
  } catch (err) {
    console.error("❌ Migration failed:", err.message)
    process.exit(1)
  }
}

main()
