import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zbjzddcwltdfvgkjvnwr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpianpkZGN3bHRkZnZna2p2bndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTg2NDksImV4cCI6MjEwMzQ3NDY0OX0.ZCQHNcYXMjHuDcE19uH3vSrf2-Tz1x0EBfkP0V2U9O4'

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
  peon: 'Dispatch / Staff',
  viewer: 'Viewer / Staff',
}

export const DEPARTMENTS = [
  'Admin',
  'Biotech Incubation',
  'Finance & Accounts',
  'Legal & Compliance',
  'Research & Development',
  'Human Resources',
  'Procurement & Store',
  'Facility Management',
]

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