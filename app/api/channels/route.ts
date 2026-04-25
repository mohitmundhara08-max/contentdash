import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch channels without join — avoids PostgREST schema cache issue
    const { data: channels, error } = await supabase
      .from('ig_channels')
      .select('id, name, handle, objective, audience, niche, color, created_at, ig_account_id')
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Manually attach ig_account data if account IDs exist
    const accountIds = (channels || [])
      .map(c => c.ig_account_id)
      .filter(Boolean)

    let accountMap: Record<string, unknown> = {}
    if (accountIds.length > 0) {
      const { data: accounts } = await supabase
        .from('ig_accounts')
        .select('id, username, name, profile_picture_url, followers_count, connected')
        .in('id', accountIds)

      if (accounts) {
        accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))
      }
    }

    const result = (channels || []).map(ch => ({
      ...ch,
      ig_account: ch.ig_account_id ? accountMap[ch.ig_account_id] || null : null,
    }))

    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string; handle?: string; objective: string
      audience: string; niche?: string; color?: string
    }

    if (!body.name?.trim())      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })
    if (!body.objective?.trim()) return NextResponse.json({ error: 'Objective is required' }, { status: 400 })
    if (!body.audience?.trim())  return NextResponse.json({ error: 'Audience is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('ig_channels')
      .insert({
        name:      body.name.trim(),
        handle:    body.handle?.trim()    || null,
        objective: body.objective.trim(),
        audience:  body.audience.trim(),
        niche:     body.niche?.trim()     || '',
        color:     body.color             || '#e94560',
      })
      .select('id, name, handle, objective, audience, niche, color, created_at, ig_account_id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ...data, ig_account: null })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })

    await supabase.from('ig_posts').delete().eq('channel_id', id)
    await supabase.from('ig_content_plans').delete().eq('channel_id', id)
    const { error } = await supabase.from('ig_channels').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
