import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json({ users: [] })

  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent': 'Instagram 76.0.0.15.395 Android',
          'x-ig-app-id': '936619743392459',
        },
      }
    )

    if (!res.ok) return NextResponse.json({ users: [] })
    const data = await res.json()
    const u = data?.data?.user
    if (!u) return NextResponse.json({ users: [] })

    return NextResponse.json({
      users: [{
        username: u.username,
        full_name: u.full_name || u.username,
        profile_pic_url: u.profile_pic_url || '',
        follower_count: u.edge_followed_by?.count || 0,
        is_verified: u.is_verified || false,
        biography: u.biography || '',
        category: u.category_name || '',
      }]
    })
  } catch {
    return NextResponse.json({ users: [] })
  }
}
