import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zxkdjktltrfxjzadeqnn.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a2Rqa3RsdHJmeGp6YWRlcW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTQzMTEsImV4cCI6MjA5MjQzMDMxMX0.Dj2OUfCf2roIzxTslTRAIisc-E8c-5egCUdAo3t2YYE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
