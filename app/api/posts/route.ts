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

    // 2) Insert new posts
    const rows = (posts || []).map((post: any) => ({
      ...post,
      plan_id: savedPlan.id,
      channel_id: channelId,
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
