import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const fbAppId  = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL
  const redirect = `${appUrl}/api/auth/callback`

  if (!fbAppId) {
    return NextResponse.json({ error: 'FACEBOOK_APP_ID not set' }, { status: 500 })
  }

  const state = Math.random().toString(36).slice(2)

  // Only valid Facebook Login scopes — instagram_business_* are NOT valid here
  const scopes = 'pages_show_list,instagram_basic,pages_read_engagement'

  const url = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${fbAppId}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${state}`

  return NextResponse.redirect(url)
}
