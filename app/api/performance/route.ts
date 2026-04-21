import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('ig_performance')
    .upsert(body, { onConflict: 'post_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('ig_performance')
    .select('*')
    .eq('post_id', postId)
    .single()
  if (error) return NextResponse.json(null)
  return NextResponse.json(data)
}
