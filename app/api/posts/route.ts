import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'channelId required' }, { status: 400 })
    }

    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from('ig_posts')
      .select('*')
      .eq('channel_id', channelId)
      .order('week', { ascending: true })
      .order('day', { ascending: true })

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    // Fetch latest plan meta so strategy + hook_formula survive a page refresh
    const { data: planData } = await supabase
      .from('ig_content_plans')
      .select('strategy, hook_formula')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      posts: posts ?? [],
      meta: planData
        ? { strategy: planData.strategy ?? '', hook_formula: planData.hook_formula ?? '' }
        : {},
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan, posts, channelId, strategy, hook_formula } = body

    // Delete old posts + plans for this channel before inserting new ones
    const { error: postsDeleteError } = await supabase
      .from('ig_posts')
      .delete()
      .eq('channel_id', channelId)

    if (postsDeleteError) {
      return NextResponse.json({ error: postsDeleteError.message }, { status: 500 })
    }

    const { error: plansDeleteError } = await supabase
      .from('ig_content_plans')
      .delete()
      .eq('channel_id', channelId)

    if (plansDeleteError) {
      return NextResponse.json({ error: plansDeleteError.message }, { status: 500 })
    }

    // 1) Insert new content plan
    const { data: savedPlan, error: planError } = await supabase
      .from('ig_content_plans')
      .insert({
        channel_id: channelId,
        keyword: plan.keyword,
        duration: plan.duration,
        strategy,
        hook_formula,
      })
      .select()
      .single()

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }

    // 2) Insert posts with explicit column mapping — never spread raw AI output
    const rows = (posts || []).map((post: {
      day?: number
      week?: number
      format?: string
      pillar?: string
      title?: string
      hook?: string
      content_brief?: string
      script?: string
      ai_prompt?: string
      hashtags?: string
      cta?: string
      post_date?: string
      reach_target?: number
      saves_target?: number
      shares_target?: number
      comments_target?: number
      plays_target?: number
      priority?: number
      notes?: string
    }) => ({
      plan_id: savedPlan.id,
      channel_id: channelId,
      day: post.day ?? 1,
      week: post.week ?? 1,
      format: post.format ?? 'Reel',
      pillar: post.pillar ?? '',
      title: post.title ?? '',
      hook: post.hook ?? '',
      content_brief: post.content_brief ?? '',
      script: post.script ?? '',
      ai_prompt: post.ai_prompt ?? '',
      hashtags: post.hashtags ?? '',
      cta: post.cta ?? '',
      post_date: post.post_date ?? '',
      reach_target: post.reach_target ?? 0,
      saves_target: post.saves_target ?? 0,
      shares_target: post.shares_target ?? 0,
      comments_target: post.comments_target ?? 0,
      plays_target: post.plays_target ?? 0,
      priority: post.priority ?? 3,
      notes: post.notes ?? '',
    }))

    const { data: savedPosts, error: postsError } = await supabase
      .from('ig_posts')
      .insert(rows)
      .select()

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    return NextResponse.json({ posts: savedPosts })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { postId, content_brief, script, ai_prompt, cta, notes } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ig_posts')
      .update({ content_brief, script, ai_prompt, cta, notes })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 },
    )
  }
}
