import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const handle = new URL(req.url).searchParams.get('handle')?.replace('@','').trim()
  if (!handle) return NextResponse.json({ error: 'Handle required' }, { status: 400 })

  const rapidKey = process.env.RAPIDAPI_KEY
  if (!rapidKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set in Vercel env vars' }, { status: 500 })

  try {
    // Instagram Scraper Stable API - "Basic User + Posts" endpoint
    const res = await fetch(
      `https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_info.php?username_or_url=${encodeURIComponent(handle)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key':  rapidKey,
          'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status} — check your RapidAPI subscription` }, { status: res.status })
    }

    const raw = await res.json() as Record<string, unknown>

    // Handle API-level errors
    if (raw.error || raw.status === 'fail' || raw.detail) {
      return NextResponse.json({ error: String(raw.error || raw.detail || 'Profile not found') }, { status: 404 })
    }

    // The API returns nested user object
    const u = (raw.user || raw.data || raw) as Record<string, unknown>

    const followers = Number(
      u.follower_count || u.followers ||
      (u.edge_followed_by as Record<string,unknown>)?.count || 0
    )
    const following = Number(
      u.following_count || u.following ||
      (u.edge_follow as Record<string,unknown>)?.count || 0
    )
    const posts = Number(
      u.media_count || u.posts ||
      (u.edge_owner_to_timeline_media as Record<string,unknown>)?.count || 0
    )

    return NextResponse.json({
      handle:    `@${handle}`,
      name:      String(u.full_name || u.name || handle),
      followers: followers || null,
      following: following || null,
      posts:     posts || null,
      bio:       String(u.biography || u.bio || ''),
      picture:   String(u.profile_pic_url_hd || u.profile_pic_url || u.picture || ''),
      verified:  Boolean(u.is_verified || u.verified || false),
      category:  String(u.category || u.business_category_name || ''),
    })

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
