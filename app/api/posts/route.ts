import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('channelId')
  const planId = searchParams.get('planId')

  let query = supabase
    .from('ig_posts')
    .select('*, ig_performance(*)')
    .order('day', { ascending: true })

  if (channelId) query = query.eq('channel_id', channelId)
  if (planId) query = query.eq('plan_id', planId)

  const { data, error } = await query
  if (error) {
    console.error('posts GET error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { plan, posts, channelId, strategy, hook_formula } = body

  // Remove previous plans/posts for the same channel so post numbering doesn't stack.
  const { error: deletePostsErr } = await supabase
    .from('ig_posts')
    .delete()
    .eq('channel_id', channelId)

  if (deletePostsErr) {
    console.error('posts cleanup error:', deletePostsErr.message)
    return NextResponse.json({ error: deletePostsErr.message }, { status: 500 })
  }

  const { error: deletePlansErr } = await supabase
    .from('ig_content_plans')
    .delete()
    .eq('channel_id', plan.channel_id)

  if (deletePlansErr) {
    console.error('plans cleanup error:', deletePlansErr.message)
    return NextResponse.json({ error: deletePlansErr.message }, { status: 500 })
  }

  const { data: planData, error: planErr } = await supabase
    .from('ig_content_plans')
    .insert({
      channel_id: plan.channel_id,
      keyword: plan.keyword,
      duration: plan.duration,
      strategy: strategy || '',
      hook_formula: hook_formula || '',
    })
    .select()
    .single()

  if (planErr) {
    console.error('plan insert error:', planErr.message)
    return NextResponse.json({ error: planErr.message }, { status: 500 })
  }

  const postsToInsert = posts.map((p: Record<string, unknown>) => ({
    plan_id: planData.id,
    channel_id: channelId,
    day: p.day ?? 1,
    week: p.week ?? 1,
    format: p.format ?? 'Reel',
    pillar: p.pillar ?? '',
    title: p.title ?? '',
    hook: p.hook ?? '',
    content_brief: p.content_brief ?? '',
    script: p.script ?? '',
    ai_prompt: p.ai_prompt ?? '',
    hashtags: p.hashtags ?? '',
    cta: p.cta ?? '',
    post_date: p.post_date ?? '',
    reach_target: Number(p.reach_target) || 0,
    saves_target: Number(p.saves_target) || 0,
    shares_target: Number(p.shares_target) || 0,
    comments_target: Number(p.comments_target) || 0,
    plays_target: Number(p.plays_target) || 0,
    priority: Number(p.priority) || 3,
    notes: p.notes ?? '',
  }))

  const { data: postsData, error: postsErr } = await supabase
    .from('ig_posts')
    .insert(postsToInsert)
    .select()

  if (postsErr) {
    console.error('posts insert error:', postsErr.message)
    return NextResponse.json({ error: postsErr.message }, { status: 500 })
  }

  return NextResponse.json({ plan: planData, posts: postsData })
}

export async function DELETE(req: NextRequest) {
  const { planId } = await req.json()
  const { error } = await supabase.from('ig_content_plans').delete().eq('id', planId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
