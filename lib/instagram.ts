// ─── Instagram Graph API helpers ────────────────────────────────────
// Used by API routes — never imported in client components

const APP_ID     = process.env.INSTAGRAM_APP_ID || ''
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || ''
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Step 1: Build the OAuth URL user gets redirected to
export function getOAuthURL(state: string): string {
  const params = new URLSearchParams({
    client_id:     APP_ID,
    redirect_uri:  `${APP_URL}/api/auth/callback`,
    scope:         'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list',
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`
}

// Step 2: Exchange code for short-lived token
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     APP_ID,
      client_secret: APP_SECRET,
      redirect_uri:  `${APP_URL}/api/auth/callback`,
      code,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.access_token
}

// Step 3: Exchange for long-lived token (60-day expiry)
export async function getLongLivedToken(shortToken: string): Promise<{ token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type:        'fb_exchange_token',
    client_id:         APP_ID,
    client_secret:     APP_SECRET,
    fb_exchange_token: shortToken,
  })
  const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { token: data.access_token, expires_in: data.expires_in }
}

// Step 4: Get connected Instagram Business account
export async function getIGAccount(accessToken: string) {
  // Get Facebook pages
  const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
  const pages = await pagesRes.json()
  if (!pages.data?.length) throw new Error('No Facebook Pages found. Connect a Page to your Instagram account first.')

  const page = pages.data[0]
  const pageToken = page.access_token

  // Get Instagram account linked to the page
  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`
  )
  const igData = await igRes.json()
  const igId = igData.instagram_business_account?.id
  if (!igId) throw new Error('No Instagram Business Account linked to this Facebook Page.')

  // Get Instagram account details
  const detailRes = await fetch(
    `https://graph.facebook.com/v18.0/${igId}?fields=username,name,profile_picture_url,followers_count,media_count&access_token=${pageToken}`
  )
  const detail = await detailRes.json()

  return { ...detail, page_access_token: pageToken }
}

// Pull insights for a specific media post
export async function getMediaInsights(mediaId: string, accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=reach,saved,shares,comments_count,plays&access_token=${accessToken}`
  )
  const data = await res.json()
  return data.data || []
}

// Pull recent media list for an IG account
export async function getRecentMedia(igUserId: string, accessToken: string, limit = 20) {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`
  )
  const data = await res.json()
  return data.data || []
}
