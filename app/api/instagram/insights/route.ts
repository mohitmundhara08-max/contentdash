import { NextRequest, NextResponse } from 'next/server'
import { getRecentMedia } from '@/lib/instagram'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('channelId')
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

  // Get channel + linked IG account
  const { data: channel, error: chErr } = await supabase
    .from('ig_channels')
    .select('*, ig_account:ig_accounts(*)')
    .eq('id', channelId)
    .single()
  if (chErr || !channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  const igAccount = channel.ig_account
  if (!igAccount?.access_token) {
    return NextResponse.json({ error: 'No Instagram account linked. Connect via OAuth first.' }, { status: 400 })
  }

  try {
    const media = await getRecentMedia(igAccount.ig_user_id, igAccount.access_token)
    return NextResponse.json({ media, account: { username: igAccount.username, followers: igAccount.followers_count } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch insights'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
