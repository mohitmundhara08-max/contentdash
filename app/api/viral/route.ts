import { NextRequest, NextResponse } from 'next/server'

function parseClaudeJSON(raw: string): any {
  let t = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(t)
  } catch {
    // ignore
  }

  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end > start) {
    const sliced = t.slice(start, end + 1)
    try {
      return JSON.parse(sliced)
    } catch {
      // ignore
    }
  }

  throw new Error(
    'Viral JSON was cut off or malformed — try again or reduce output length.',
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { niche, objective, audience, handle, apiKey } = body

    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      return NextResponse.json(
        {
          error:
            'No Anthropic API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.',
        },
        { status: 400 },
      )
    }

    const systemPrompt =
      'You are a viral content analyst for Indian Instagram and YouTube. You always return ONLY valid JSON with no markdown, no code blocks, no explanation — just raw JSON.'

    const userPrompt = `Channel niche: ${niche}
Goal: ${objective}
Audience: ${audience}
${handle ? `Handle: ${handle}` : ''}

Identify the top 10 content patterns that are going viral right now for this specific niche and audience in India.

Return ONLY this JSON (no markdown):
{
  "viral_patterns": [
    {
      "topic": "specific content topic",
      "format": "Reel",
      "trigger": "FOMO",
      "hook": "actual Hinglish hook line",
      "reach_potential": "Viral",
      "platform": "Instagram Reels",
      "example_title": "exact viral-style title",
      "reason": "1 sentence on why this pattern is performing"
    }
  ],
  "insight": "1-2 sentences about the single biggest content opportunity in this niche right now."
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json(
        { error: `Claude API error: ${err}` },
        { status: 500 },
      )
    }

    const data = await response.json()
    const text = (data.content?.[0]?.text || '').trim()
    const json = parseClaudeJSON(text)

    return NextResponse.json(json)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
