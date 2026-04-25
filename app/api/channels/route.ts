import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET — fetch all channels with their linked IG account if any
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ig_channels')
      .select(`
        id, name, handle, objective, audience, niche, color, created_at, ig_account_id,
        ig_account:ig_accounts (
          id, username, name, profile_picture_url, followers_count, connected
        )
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[channels GET]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[channels GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST — create a new channel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string
      handle?: string
      objective: string
      audience: string
      niche?: string
      color?: string
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })
    }
    if (!body.objective?.trim()) {
      return NextResponse.json({ error: 'Objective is required' }, { status: 400 })
    }
    if (!body.audience?.trim()) {
      return NextResponse.json({ error: 'Audience is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ig_channels')
      .insert({
        name:      body.name.trim(),
        handle:    body.handle?.trim() || null,
        objective: body.objective.trim(),
        audience:  body.audience.trim(),
        niche:     body.niche?.trim() || '',
        color:     body.color || '#e94560',
      })
      .select(`
        id, name, handle, objective, audience, niche, color, created_at, ig_account_id,
        ig_account:ig_accounts (
          id, username, name, profile_picture_url, followers_count, connected
        )
      `)
      .single()

    if (error) {
      console.error('[channels POST]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[channels POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE — remove a channel and all its data
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string }

    if (!id) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    // Delete posts first (FK constraint), then plans, then channel
    await supabase.from('ig_posts').delete().eq('channel_id', id)
    await supabase.from('ig_content_plans').delete().eq('channel_id', id)

    const { error } = await supabase
      .from('ig_channels')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[channels DELETE]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[channels DELETE]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
