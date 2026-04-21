import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('ig_channels')
    .select(`
      id, name, handle, objective, audience, niche, color, ig_account_id, created_at,
      ig_account:ig_accounts ( id, username, name, profile_picture_url, followers_count, connected )
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('channels GET error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('ig_channels')
    .insert({
      name:      body.name,
      handle:    body.handle    || '',
      objective: body.objective || '',
      audience:  body.audience  || '',
      niche:     body.niche     || '',
      color:     body.color     || '#e94560',
    })
    .select()
    .single()

  if (error) {
    console.error('channels POST error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabase.from('ig_channels').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
