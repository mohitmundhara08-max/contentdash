import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const HOST = 'instagram-scraper-stable-api.p.rapidapi.com'

// All available GET endpoints on this API that return user profile data
const ENDPOINTS = [
  `https://${HOST}/get_ig_user_about.php?username_or_url=`,
  `https://${HOST}/ig_get_fb_profile_hover.php?username_or_url=`,
  `https://${HOST}/ig_get_user_info.php?username_or_url=`,
]

function extractUser(raw: Record<string,unknown>): Record<string,unknown> | null {
  // Try every common nesting pattern APIs use
  const candidates = [
    (raw.data as Record<string,unknown>)?.user,
    (raw.data as Record<string,unknown>)?.data,
    raw.data,
    raw.user,
    raw.result,
    raw,
  ]
  for (const c of candidates) {
    const u = c as Record<string,unknown>
    // Must have at least a name or username to be a valid user object
    if (u && (u.full_name || u.username || u.name)) return u
  }
  return null
}

export async function GET(req: NextRequest) {
  const handle = new URL(req.url).searchParams.get('handle')?.replace('@','').trim()
  if (!handle) return NextResponse.json({ error: 'Handle required' }, { status: 400 })

  const rapidKey = process.env.RAPIDAPI_KEY
  if (!rapidKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set in Vercel env vars' }, { status: 500 })

  const headers = {
    'Content-Type':    'application/json',
    'x-rapidapi-host': HOST,
    'x-rapidapi-key':  rapidKey,
  }

  let lastError = 'All endpoints failed'

  for (const base of ENDPOINTS) {
    try {
      const res = await fetch(`${base}${encodeURIComponent(handle)}`, { headers })
      if (!res.ok) { lastError = `HTTP ${res.status}`; continue }

      const raw = await res.json() as Record<string,unknown>
      if (raw.error || raw.message) { lastError = String(raw.error || raw.message); continue }

      const u = extractUser(raw)
      if (!u) { lastError = 'No user data in response'; continue }

      // Parse numbers from any field name variation
      const n = (keys: string[]) => {
        for (const k of keys) {
          const v = u[k]
          if (typeof v === 'number' && v > 0) return v
          if (typeof v === 'object' && v !== null && 'count' in v) return Number((v as Record<string,unknown>).count)
        }
        return null
      }

      return NextResponse.json({
        handle:    `@${handle}`,
        name:      String(u.full_name || u.name || handle),
        followers: n(['follower_count','followers','followed_by_count']),
        following: n(['following_count','following','follows_count']),
        posts:     n(['media_count','posts','post_count','edge_owner_to_timeline_media']),
        bio:       String(u.biography || u.bio || u.description || ''),
        picture:   String(u.profile_pic_url_hd || u.profile_pic_url || u.avatar || u.picture || ''),
        verified:  Boolean(u.is_verified || u.verified),
        category:  String(u.category || u.business_category_name || ''),
      })

    } catch (e) { lastError = e instanceof Error ? e.message : 'Request failed' }
  }

  return NextResponse.json({ error: `Could not fetch profile: ${lastError}` }, { status: 404 })
}
