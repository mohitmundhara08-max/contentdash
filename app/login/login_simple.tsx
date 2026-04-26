import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const handle = new URL(req.url).searchParams.get('handle')?.replace('@','').trim()
  if (!handle) return NextResponse.json({ error: 'Handle required' }, { status: 400 })

  try {
    const res = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    })

    if (res.status === 404) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (!res.ok) return NextResponse.json({ error: 'Could not reach Instagram' }, { status: 400 })

    const html = await res.text()

    // Extract from og meta tags (always public)
    const nameMatch  = html.match(/<meta property="og:title" content="([^"]+)"/)
    const descMatch  = html.match(/<meta property="og:description" content="([^"]+)"/)
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)

    // og:title = "Name (@handle) • Instagram photos and videos"
    const rawTitle = nameMatch?.[1] || ''
    const name = rawTitle.split('(')[0].trim() || handle

    // og:description = "X Followers, Y Following, Z Posts - Bio text here"
    const desc = descMatch?.[1] || ''

    const followersMatch = desc.match(/([\d,.]+[KMkMbB]?)\s+Followers?/i)
    const followersRaw   = followersMatch?.[1]?.replace(/,/g,'') || '0'

    function parseCount(s: string): number {
      if (s.toUpperCase().endsWith('M')) return Math.round(parseFloat(s) * 1_000_000)
      if (s.toUpperCase().endsWith('K')) return Math.round(parseFloat(s) * 1_000)
      if (s.toUpperCase().endsWith('B')) return Math.round(parseFloat(s) * 1_000_000_000)
      return parseInt(s) || 0
    }

    const followers = parseCount(followersRaw)
    const picture   = imageMatch?.[1] || ''
    const bioMatch  = desc.match(/Posts? - (.+)/i)
    const bio       = bioMatch?.[1]?.replace(/ - See Instagram.*$/i,'').trim() || ''

    return NextResponse.json({ handle: `@${handle}`, name, followers, bio, picture })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
