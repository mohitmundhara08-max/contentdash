import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 45
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { handle, niche, objective, audience, apiKey } = await req.json()
    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'No API key' }, { status: 400 })

    const prompt = `You are an expert Instagram growth strategist. Do a detailed channel audit.

Channel details:
- Handle: ${handle || 'not provided'}
- Niche: ${niche}
- Objective: ${objective}
- Audience: ${audience}

Based on what you know about successful channels in this niche, provide a comprehensive audit covering:

1. PROFILE STRATEGY — What the profile/bio should communicate
2. CONTENT MIX — Ideal Reel/Carousel/Long-form ratio for this niche
3. POSTING FREQUENCY — Optimal cadence for this audience
4. WHAT'S LIKELY WORKING — Content patterns that perform in this niche
5. WHAT'S LIKELY MISSING — Common gaps in channels like this
6. TOP 5 IMPROVEMENTS — Highest impact changes to make immediately
7. HOOK FORMULA — The specific hook pattern for this audience
8. GROWTH LEVERS — The 3 things that move the needle most in this niche

Return ONLY this JSON:
{
  "profile_strategy": "what the profile should communicate",
  "content_mix": { "reel": 40, "carousel": 40, "longform": 20, "reasoning": "why" },
  "posting_frequency": "X times per week on these days",
  "whats_working": ["pattern 1", "pattern 2", "pattern 3"],
  "whats_missing": ["gap 1", "gap 2", "gap 3"],
  "top_improvements": [
    { "action": "what to do", "impact": "High", "reason": "why" }
  ],
  "hook_formula": "belief → break → truth formula specific to this audience",
  "growth_levers": ["lever 1", "lever 2", "lever 3"],
  "overall_score": 7,
  "summary": "2-3 sentence overall assessment"
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
