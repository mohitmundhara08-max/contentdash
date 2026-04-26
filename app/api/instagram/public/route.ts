import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const handle = new URL(req.url).searchParams.get('handle')?.replace('@','').trim()
  if (!handle) return NextResponse.json({ error: 'Handle required' }, { status: 400 })

  const rapidKey = process.env.RAPIDAPI_KEY
  if (!rapidKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set in Vercel env vars' }, { status: 500 })

  // Try multiple RapidAPI Instagram endpoints in order until one works
  const endpoints = [
    {
      url: `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${handle}`,
      host: 'instagram-scraper-api2.p.rapidapi.com',
      parse: (d: Record<string,unknown>) => {
        const u = (d.data as Record<string,unknown>) || d
        return {
          name:      String(u.full_name || u.username || handle),
          followers: Number(u.follower_count || u.followers || 0),
          following: Number(u.following_count || u.following || 0),
          posts:     Number(u.media_count || u.posts || 0),
          bio:       String(u.biography || u.bio || ''),
          picture:   String(u.profile_pic_url_hd || u.profile_pic_url || u.picture || ''),
          verified:  Boolean(u.is_verified || u.verified || false),
          category:  String(u.category || u.business_category_name || ''),
        }
      }
    },
    {
      url: `https://instagram-scraper-20251.p.rapidapi.com/user/info/?username=${handle}`,
      host: 'instagram-scraper-20251.p.rapidapi.com',
      parse: (d: Record<string,unknown>) => {
        const u = (d.user as Record<string,unknown>) || d
        return {
          name:      String(u.full_name || handle),
          followers: Number((u.edge_followed_by as Record<string,unknown>)?.count || u.follower_count || 0),
          following: Number((u.edge_follow as Record<string,unknown>)?.count || u.following_count || 0),
          posts:     Number((u.edge_owner_to_timeline_media as Record<string,unknown>)?.count || u.media_count || 0),
          bio:       String(u.biography || ''),
          picture:   String(u.profile_pic_url_hd || u.profile_pic_url || ''),
          verified:  Boolean(u.is_verified || false),
          category:  String(u.business_category_name || ''),
        }
      }
    },
    {
      url: `https://instagram-data1.p.rapidapi.com/user/info?username=${handle}`,
      host: 'instagram-data1.p.rapidapi.com',
      parse: (d: Record<string,unknown>) => ({
        name:      String(d.full_name || handle),
        followers: Number(d.followers || 0),
        following: Number(d.following || 0),
        posts:     Number(d.posts || 0),
        bio:       String(d.bio || ''),
        picture:   String(d.profile_pic || ''),
        verified:  Boolean(d.verified || false),
        category:  '',
      })
    },
  ]

  let lastError = 'All Instagram data sources failed'

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: {
          'x-rapidapi-key': rapidKey,
          'x-rapidapi-host': ep.host,
        },
      })

      if (!res.ok) {
        lastError = `${ep.host}: HTTP ${res.status}`
        continue
      }

      const raw = await res.json() as Record<string,unknown>

      // Check for API-level errors
      if (raw.error || raw.message?.toString().includes('not found') || raw.status === 'fail') {
        lastError = String(raw.error || raw.message || 'Not found')
        continue
      }

      const parsed = ep.parse(raw)

      // Validate we got real data
      if (!parsed.name || parsed.name === 'undefined') {
        lastError = 'No profile data returned'
        continue
      }

      return NextResponse.json({
        handle:    `@${handle}`,
        name:      parsed.name,
        followers: parsed.followers || null,
        following: parsed.following || null,
        posts:     parsed.posts || null,
        bio:       parsed.bio,
        picture:   parsed.picture,
        verified:  parsed.verified,
        category:  parsed.category,
      })

    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Request failed'
    }
  }

  return NextResponse.json({ error: `Could not fetch profile: ${lastError}` }, { status: 404 })
}
