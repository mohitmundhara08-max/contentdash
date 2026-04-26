import { NextResponse } from 'next/server'

// MUST be dynamic — reads env vars at runtime, not build time
export const dynamic = 'force-dynamic'

export async function GET() {
  // Use server-side env var (no NEXT_PUBLIC_ prefix = read at runtime, not baked at build)
  const appId    = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  const redirect = `${appUrl}/api/auth/callback`

  if (!appId) {
    return NextResponse.json(
      { error: 'INSTAGRAM_APP_ID not set in Vercel environment variables' },
      { status: 500 }
    )
  }

  const state  = Math.random().toString(36).slice(2)
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
  ].join(',')

  const url = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${state}`

  return NextResponse.redirect(url)
}
