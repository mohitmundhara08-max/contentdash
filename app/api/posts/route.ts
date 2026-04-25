import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const channelId = new URL(req.url).searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

    const { data: posts, error } = await supabase
      .from('ig_posts')
      .select('*')
      .eq('channel_id', channelId)
      .order('day', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: plan } = await supabase
      .from('ig_content_plans')
      .select('strategy, hook_formula')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      posts: posts || [],
      meta: { strategy: plan?.strategy || '', hook_formula: plan?.hook_formula || '' }
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      channelId: string
      plan: { channel_id: string; keyword: string; duration: number }
      posts: Record<string, unknown>[]
      strategy?: string
      hook_formula?: string
    }

    const { channelId, plan, posts, strategy = '', hook_formula = '' } = body
    if (!channelId || !posts?.length) return NextResponse.json({ error: 'channelId and posts required' }, { status: 400 })

    await supabase.from('ig_posts').delete().eq('channel_id', channelId)
    await supabase.from('ig_content_plans').delete().eq('channel_id', channelId)

    const { data: newPlan, error: planError } = await supabase
      .from('ig_content_plans')
      .insert({ channel_id: channelId, keyword: plan?.keyword || '', duration: plan?.duration || 30, strategy, hook_formula })
      .select('id')
      .single()

    if (planError || !newPlan) return NextResponse.json({ error: planError?.message || 'Failed to create plan' }, { status: 500 })

    const toInsert = posts.map((p) => ({
      plan_id:         newPlan.id,
      channel_id:      channelId,
      day:             Number(p.day)             || 1,
      week:            Number(p.week)            || 1,
      format:          String(p.format           || 'Reel'),
      pillar:          String(p.pillar           || ''),
      title:           String(p.title            || ''),
      hook:            String(p.hook             || ''),
      content_brief:   String(p.content_brief    || ''),
      script:          String(p.script           || ''),
      ai_prompt:       String(p.ai_prompt        || ''),
      hashtags:        String(p.hashtags         || ''),
      cta:             String(p.cta              || ''),
      post_date:       String(p.post_date        || ''),
      reach_target:    Number(p.reach_target)    || 0,
      saves_target:    Number(p.saves_target)    || 0,
      shares_target:   Number(p.shares_target)   || 0,
      comments_target: Number(p.comments_target) || 0,
      plays_target:    Number(p.plays_target)    || 0,
      priority:        Number(p.priority)        || 3,
      notes:           String(p.notes            || ''),
    }))

    const { data: savedPosts, error: postsError } = await supabase
      .from('ig_posts').insert(toInsert).select('*')

    if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

    return NextResponse.json({ posts: savedPosts || [], meta: { strategy, hook_formula } })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; script?: string; ai_prompt?: string }
    if (!body.id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 })

    const update: Record<string, string> = {}
    if (body.script    !== undefined) update.script    = body.script
    if (body.ai_prompt !== undefined) update.ai_prompt = body.ai_prompt

    const { error } = await supabase.from('ig_posts').update(update).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { error } = await supabase.from('ig_posts').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
