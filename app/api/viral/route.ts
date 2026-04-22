import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 45
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { niche, handle, objective, audience, apiKey } = await req.json()
    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'No API key' }, { status: 400 })

    const prompt = `You are a viral content analyst for Indian social media (Instagram/YouTube Shorts).

Channel info:
- Niche: ${niche}
- Objective: ${objective}
- Audience: ${audience}
${handle ? `- Instagram handle: ${handle}` : ''}

Based on your knowledge of what goes viral in Indian social media for this exact niche and audience, identify the top 10 content formats and topics that are currently performing best.

For each viral content pattern, provide:
1. The exact type of content (topic + format)
2. Why it goes viral (psychological trigger: FOMO, aspiration, pain point, curiosity)
3. A killer hook in Hinglish
4. Estimated reach potential (Low/Medium/High/Viral)
5. Best platform (Reels/Shorts/Carousels)
6. An example title that would crush it

Return ONLY this JSON:
{
  "viral_patterns": [
    {
      "topic": "specific topic",
      "format": "Reel",
      "trigger": "FOMO",
      "hook": "hook line in Hinglish",
      "reach_potential": "Viral",
      "platform": "Reels",
      "example_title": "exact title that would perform",
      "reason": "why this works for this audience"
    }
  ],
  "insight": "one key insight about what's working right now in this niche"
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text?.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
    return NextResponse.json(JSON.parse(text))
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
