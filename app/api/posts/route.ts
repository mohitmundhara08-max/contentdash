import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('channelId')
  const planId    = searchParams.get('planId')

  let query = supabase
    .from('ig_posts')
    .select('*, ig_performance(*)')
    .order('day', { ascending: true })

  if (channelId) query = query.eq('channel_id', channelId)
  if (planId)    query = query.eq('plan_id', planId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { plan, posts, channelId, strategy, hook_formula } = await req.json()

  const { data: planData, error: planErr } = await supabase
    .from('ig_content_plans')
    .insert({ ...plan, strategy, hook_formula })
    .select()
    .single()
  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })

  const postsWithPlan = posts.map((p: Record<string, unknown>) => ({
    ...p,
    plan_id:    planData.id,
    channel_id: channelId,
  }))

  const { data: postsData, error: postsErr } = await supabase
    .from('ig_posts')
    .insert(postsWithPlan)
    .select()
  if (postsErr) return NextResponse.json({ error: postsErr.message }, { status: 500 })

  return NextResponse.json({ plan: planData, posts: postsData })
}

export async function DELETE(req: NextRequest) {
  const { planId } = await req.json()
  const { error }  = await supabase.from('ig_content_plans').delete().eq('id', planId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
