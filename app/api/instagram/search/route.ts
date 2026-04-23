import { NextRequest, NextResponse } from 'next/server'

interface IGUser {
  username: string
  full_name?: string
  profile_pic_url?: string
  follower_count?: number
  is_verified?: boolean
  biography?: string
  category_name?: string
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json({ users: [] })

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.error('RAPIDAPI_KEY env var not set')
    return NextResponse.json({ users: [], error: 'Search unavailable — RAPIDAPI_KEY not configured' })
  }

  try {
    const res = await fetch(
      `https://instagram120.p.rapidapi.com/v1/search_users?search_query=${encodeURIComponent(q)}`,
      {
        headers: {
          'x-rapidapi-host': 'instagram120.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) {
      console.error('instagram120 error', res.status, await res.text())
      return NextResponse.json({ users: [] })
    }

    const data = await res.json()

    // instagram120 returns { data: { users: [ { user: { ... } } ] } }
    const raw: Array<{ user?: IGUser } | IGUser> = data?.data?.users ?? []

    const users = raw
      .map((item) => {
        const u: IGUser = ('user' in item && item.user ? item.user : item) as IGUser
        return {
          username: u.username ?? '',
          full_name: u.full_name || u.username || '',
          profile_pic_url: u.profile_pic_url || '',
          follower_count: u.follower_count || 0,
          is_verified: u.is_verified || false,
          biography: u.biography || '',
          category: u.category_name || '',
        }
      })
      .filter((u) => u.username)
      .slice(0, 8)

    return NextResponse.json({ users })
  } catch (e) {
    console.error('instagram search failed', e)
    return NextResponse.json({ users: [] })
  }
}
