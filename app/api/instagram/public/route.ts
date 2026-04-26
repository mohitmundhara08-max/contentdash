import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const handle = new URL(req.url).searchParams.get('handle')?.replace('@','').trim()
  if (!handle) return NextResponse.json({ error: 'Handle required' }, { status: 400 })

  try {
    // Try fetching with a browser-like user agent
    const res = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    })

    if (res.status === 404) return NextResponse.json({ error: 'Account not found. Check the username.' }, { status: 404 })
    if (!res.ok) return NextResponse.json({ error: 'Could not reach Instagram' }, { status: 400 })

    const html = await res.text()

    // Extract name from og:title — format: "Name (@handle) • Instagram photos and videos"
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
    const rawTitle   = titleMatch?.[1] || ''
    const name       = rawTitle.split('(')[0].trim() || handle

    // Extract image
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    const picture    = imageMatch?.[1] || ''

    // Extract description — "X Followers, Y Following, Z Posts - Bio"
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/)
    const desc      = descMatch?.[1] || ''

    // Parse followers from description
    const followersMatch = desc.match(/([\d,.]+[KkMmBb]?)\s*Followers?/i)
    const followersRaw   = followersMatch?.[1]?.replace(/,/g, '') || ''

    function parseCount(s: string): number {
      if (!s) return 0
      const upper = s.toUpperCase()
      if (upper.endsWith('M')) return Math.round(parseFloat(s) * 1_000_000)
      if (upper.endsWith('K')) return Math.round(parseFloat(s) * 1_000)
      if (upper.endsWith('B')) return Math.round(parseFloat(s) * 1_000_000_000)
      return parseInt(s) || 0
    }

    const followers = parseCount(followersRaw)

    // Extract bio — everything after "Posts - " in description
    const bioMatch = desc.match(/\d+\s*Posts?\s*[-–]\s*(.+)/i)
    const bio      = bioMatch?.[1]?.replace(/\s*-\s*See Instagram.*$/i, '').trim() || ''

    // If Instagram blocked us (login wall), name will be generic
    const blocked = name === 'Instagram' || name === 'Log in' || rawTitle.includes('Log in')

    if (blocked) {
      // Return basic info — at least the handle is confirmed to exist since we got 200
      return NextResponse.json({
        handle:    `@${handle}`,
        name:      handle,
        followers: null,  // null = unknown, not 0
        bio:       '',
        picture:   '',
        note:      'Profile is private or Instagram limited public data',
      })
    }

    return NextResponse.json({
      handle:    `@${handle}`,
      name:      name || handle,
      followers: followers || null,
      bio,
      picture,
    })

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
