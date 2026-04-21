import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getLongLivedToken, getIGAccount } from '@/lib/instagram'
import { supabase } from '@/lib/supabase'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    const msg = encodeURIComponent(searchParams.get('error_description') || 'Access denied')
    return NextResponse.redirect(`${APP_URL}/callback?error=${msg}`)
  }

  try {
    // Exchange code → short token → long-lived token
    const shortToken = await exchangeCodeForToken(code)
    const { token, expires_in } = await getLongLivedToken(shortToken)

    // Get Instagram account details
    const igData = await getIGAccount(token)

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Upsert into Supabase (update if account already connected)
    const { error: dbError } = await supabase
      .from('ig_accounts')
      .upsert({
        ig_user_id:          igData.id,
        username:            igData.username,
        name:                igData.name || igData.username,
        profile_picture_url: igData.profile_picture_url || '',
        access_token:        token, // In production: encrypt this
        token_expires_at:    expiresAt,
        followers_count:     igData.followers_count || 0,
        media_count:         igData.media_count || 0,
        connected:           true,
      }, { onConflict: 'ig_user_id' })

    if (dbError) throw new Error(dbError.message)

    return NextResponse.redirect(
      `${APP_URL}/callback?success=1&username=${encodeURIComponent(igData.username)}`
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.redirect(`${APP_URL}/callback?error=${encodeURIComponent(msg)}`)
  }
}
