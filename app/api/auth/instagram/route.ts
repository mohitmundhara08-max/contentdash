import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Facebook App ID (940915165322978) — used for Facebook OAuth dialog
  // Instagram App ID (4386508151569210) — used for Instagram API calls after auth
  const fbAppId  = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL
  const redirect = `${appUrl}/api/auth/callback`

  if (!fbAppId) {
    return NextResponse.json(
      { error: 'FACEBOOK_APP_ID not set in Vercel environment variables' },
      { status: 500 }
    )
  }

  const state = Math.random().toString(36).slice(2)

  // Facebook OAuth with Instagram permissions
  // Must use Facebook App ID here, not Instagram App ID
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_manage_comments',
    'pages_show_list',
  ].join(',')

  const url = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${fbAppId}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${state}`

  return NextResponse.redirect(url)
}
