#!/usr/bin/env node

/**
 * Guwahati Biotech Park - GBP-FTMS
 * Supabase Keep-Alive Ping Service
 *
 * Prevents Supabase free-tier project from pausing due to 7 days of inactivity.
 * Usage:
 *   node scripts/keep-alive.js          # Run once immediately
 *   node scripts/keep-alive.js --daemon # Run continuously in background every 24h
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env if present
function getEnvConfig() {
  const env = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://zbjzddcwltdfvgkjvnwr.supabase.co',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpianpkZGN3bHRkZnZna2p2bndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTg2NDksImV4cCI6MjEwMzQ3NDY0OX0.ZCQHNcYXMjHuDcE19uH3vSrf2-Tz1x0EBfkP0V2U9O4',
  }

  const envPath = path.resolve(__dirname, '../.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
  }

  return env
}

const config = getEnvConfig()
const SUPABASE_URL = config.VITE_SUPABASE_URL.replace(/\/$/, '')
const ANON_KEY = config.VITE_SUPABASE_ANON_KEY

async function pingSupabase() {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Pinging Supabase at ${SUPABASE_URL}...`)

  const endpoints = [
    `${SUPABASE_URL}/rest/v1/profiles?select=count&limit=1`,
    `${SUPABASE_URL}/rest/v1/files?select=count&limit=1`,
  ]

  let success = false

  for (const endpoint of endpoints) {
    try {
      const start = Date.now()
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact',
        },
      })

      const elapsed = Date.now() - start
      if (res.ok || res.status === 200 || res.status === 206 || res.status === 401 || res.status === 403) {
        console.log(`[${timestamp}] ✓ Keep-alive ping successful: HTTP ${res.status} (${elapsed}ms)`)
        success = true
        break
      } else {
        console.warn(`[${timestamp}] Endpoint ${endpoint} returned HTTP ${res.status}`)
      }
    } catch (err) {
      console.error(`[${timestamp}] Request error on ${endpoint}:`, err.message)
    }
  }

  return success
}

async function run() {
  const isDaemon = process.argv.includes('--daemon') || process.argv.includes('-d')

  // Run once immediately
  await pingSupabase()

  if (isDaemon) {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
    console.log(`[Keep-Alive Daemon] Running in background. Next ping scheduled in 24 hours.`)
    setInterval(async () => {
      await pingSupabase()
    }, TWENTY_FOUR_HOURS)
  }
}

run().catch(err => {
  console.error('Fatal error in keep-alive script:', err)
  process.exit(1)
})
