import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getFileNumber(dept) {
  const prefix = dept?.substring(0, 4).toUpperCase() || 'GEN'
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `GBP/${year}/${prefix}/${rand}`
}

export function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  officer: 'Officer',
  peon: 'Peon / Dispatch',
  viewer: 'Viewer / Staff',
}

export const PRIORITY_COLORS = {
  normal: 'bg-blue-100 text-blue-800',
  urgent: 'bg-yellow-100 text-yellow-800',
  immediate: 'bg-red-100 text-red-800',
}

export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  in_transit: 'bg-orange-100 text-orange-800',
  archived: 'bg-gray-100 text-gray-800',
}