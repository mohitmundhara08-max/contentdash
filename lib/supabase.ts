import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eureifhaekrqrrkbzkeg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cmVpZmhhZWtycXJya2J6a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzI2ODAsImV4cCI6MjA5MTI0ODY4MH0.rLkAH9kcDSs26R4L9lMd8BS9znRdX8TP2wbK1DCR_x0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
