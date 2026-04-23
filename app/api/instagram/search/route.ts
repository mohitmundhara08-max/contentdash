import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json({ users: [] })

  try {
    const res = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/search_users?search_query=${encodeURIComponent(q)}`,
      {
        headers: {
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) return NextResponse.json({ users: [] })

    const data = await res.json()
    const items = data?.data?.items || []

    const users = items.slice(0, 6).map((u: {
      username: string
      full_name: string
      profile_pic_url: string
      follower_count: number
      is_verified: boolean
      biography?: string
      category?: string
    }) => ({
      username: u.username,
      full_name: u.full_name,
      profile_pic_url: u.profile_pic_url,
      follower_count: u.follower_count,
      is_verified: u.is_verified,
      biography: u.biography || '',
      category: u.category || '',
    }))

    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ users: [] })
  }
}
