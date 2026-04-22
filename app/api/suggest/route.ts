import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { channelId, niche, objective, audience, apiKey } = await req.json()
    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'No API key' }, { status: 400 })

    let pastPosts: string[] = []
    if (channelId) {
      const { data } = await supabase
        .from('ig_posts').select('title, pillar, format, priority')
        .eq('channel_id', channelId).order('created_at', { ascending: false }).limit(20)
      if (data?.length) pastPosts = data.map(p => `[${p.format}] ${p.title}`)
    }

    const prompt = `You are a viral content strategist for Indian Instagram/YouTube.
Channel niche: ${niche}
Objective: ${objective}
Audience: ${audience}
${pastPosts.length ? `Past posts (avoid repeating):\n${pastPosts.join('\n')}` : ''}

Generate 8 high-potential content topic suggestions. Return ONLY this JSON:
{
  "suggestions": [
    {
      "topic": "specific topic title",
      "format": "Reel",
      "hook": "hook line (Hinglish if fits audience)",
      "reason": "one sentence: why this will perform",
      "score": 8,
      "pillar": "pillar name"
    }
  ]
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text?.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
    return NextResponse.json(JSON.parse(text))
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
