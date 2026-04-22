import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json({ users: [] })

  try {
    const res = await fetch(
      `https://www.instagram.com/web/search/topsearch/?query=${encodeURIComponent(q)}&context=blended`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'X-IG-App-ID': '936619743392459',
          'Referer': 'https://www.instagram.com/',
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) return NextResponse.json({ users: [] })

    const data = await res.json()
    const users = (data.users || []).slice(0, 6).map((u: {
      user: {
        username: string
        full_name: string
        profile_pic_url: string
        follower_count: number
        is_verified: boolean
        biography?: string
        category?: string
      }
    }) => ({
      username: u.user.username,
      full_name: u.user.full_name,
      profile_pic_url: u.user.profile_pic_url,
      follower_count: u.user.follower_count,
      is_verified: u.user.is_verified,
      biography: u.user.biography || '',
      category: u.user.category || '',
    }))

    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ users: [] })
  }
}
