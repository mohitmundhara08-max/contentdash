import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Models
const SONNET = 'claude-sonnet-4-6'
const HAIKU  = 'claude-haiku-4-5-20251001'

// ─── Core: Streaming fetch from Anthropic ────────────────────────────────────
// Streaming = first byte arrives in <2s, Vercel never times out the function.
// The full response can take 30+ seconds without triggering any timeout.
async function ask(
  key: string,
  model: string,
  prompt: string,
  tokens: number
): Promise<Record<string, unknown>> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: tokens,
      stream: true,   // ← THE FIX: streaming prevents all timeout issues
      system: 'You are a JSON API. Respond with ONLY valid JSON. No markdown, no explanation, no code fences. Just raw JSON starting with {',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } }
    throw new Error(err?.error?.message || `Anthropic API error ${res.status}`)
  }

  // Collect the full streamed response text
  let text = ''
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = dec.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        const l = line.trim()
        if (!l.startsWith('data: ')) continue
        const raw = l.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const ev = JSON.parse(raw) as {
            type?: string
            delta?: { type?: string; text?: string }
          }
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            text += ev.delta.text || ''
          }
        } catch { /* skip malformed SSE lines */ }
      }
    }
  } finally {
    reader.releaseLock()
  }

  // Parse the assembled text as JSON
  text = text.trim()
  // Strip accidental markdown fences
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  // Try direct parse
  try { return JSON.parse(text) as Record<string, unknown> } catch { /* fall through */ }

  // Find the JSON object if there's surrounding text
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown> } catch { /* fall */ }
  }

  throw new Error(`Claude returned invalid JSON — try again. Response: ${text.slice(0, 120)}`)
}

// ─── Build post dates (Tue/Thu/Sat) ─────────────────────────────────────────
function buildDates(count: number): string[] {
  const dates: string[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (dates.length < count) {
    if ([2, 4, 6].includes(d.getDay())) {
      dates.push(d.toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      }))
    }
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// ─── Action: generate calendar ───────────────────────────────────────────────
async function generate(body: Record<string, unknown>, key: string) {
  const name = body.channelName as string
  const obj  = body.objective   as string
  const aud  = body.audience    as string
  const kw   = (body.keyword as string) || ''
  const dur  = Number(body.duration) || 30
  const n    = Math.ceil(dur / 7) * 3
  const dates = buildDates(n)

  // Use Sonnet for quality — streaming prevents timeout
  // No scripts/AI prompts here — those load on demand per post (fast)
  const result = await ask(key, SONNET, `
Create a ${dur}-day Instagram content calendar with ${n} posts.
Channel: ${name}
Goal: ${obj}
Audience: ${aud}
${kw ? `Topic: ${kw}` : 'Pick the most viral topics for this audience right now.'}
Format rotation: Reel on Tue, Carousel on Thu, Long-form on Sat
Post dates in order: ${dates.join(' | ')}

Return ONLY a JSON object like this (no markdown, start directly with {):
{
  "pillars": ["Discovery","Authority","Community","Conversion"],
  "strategy": "2 sentence strategy",
  "hook_formula": "specific hook formula for this audience",
  "posts": [
    {
      "day": 1,
      "week": 1,
      "format": "Reel",
      "pillar": "Discovery",
      "title": "specific post title",
      "hook": "Hinglish scroll-stopping hook",
      "content_brief": "2-3 sentence brief explaining what this post covers",
      "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
      "cta": "specific call to action",
      "post_date": "${dates[0]}",
      "reach_target": 5000,
      "saves_target": 200,
      "shares_target": 100,
      "comments_target": 80,
      "plays_target": 8000,
      "priority": 4,
      "notes": ""
    }
  ]
}
`, n * 280)

  if (!Array.isArray((result as {posts?: unknown[]}).posts) || !(result as {posts?: unknown[]}).posts?.length) {
    throw new Error('No posts in response — try again')
  }
  return NextResponse.json(result)
}

// ─── Action: post_script (on-demand per post) ────────────────────────────────
async function postScript(body: Record<string, string>, key: string) {
  const result = await ask(key, SONNET, `
Write a production-ready social media script for this post.

Title: ${body.title}
Format: ${body.format}
Hook: ${body.hook}
Brief: ${body.content_brief}
Pillar: ${body.pillar}
Channel: ${body.channelName}
Audience: ${body.audience}

Script rules:
- Reel: write as 🎬 HOOK (0-3s) / 📢 VOICEOVER / 📋 BODY (3 beats, Hinglish) / ✅ CTA
- Carousel: write as 📱 SLIDE 1 — COVER: ... / 📱 SLIDE 2: ... / etc (8-10 slides with full copy)
- Long-form: write as [00:00] Intro / [02:00] Chapter 1... with talking points per section

AI prompt: Midjourney/DALL-E ready with style, aspect ratio (9:16 Reel, 4:5 Carousel, 16:9 Long-form), Indian context.

Return ONLY JSON starting with {:
{"script":"full production script here","ai_prompt":"detailed AI image/video prompt here"}
`, 1500)

  return NextResponse.json(result)
}

// ─── Action: suggest topics ──────────────────────────────────────────────────
async function suggest(body: Record<string, string>, key: string) {
  const result = await ask(key, HAIKU, `
Viral content strategist for Indian Instagram/YouTube.
Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}
Suggest 8 viral topics. Return ONLY JSON starting with {:
{"suggestions":[{"topic":"specific title","format":"Reel","hook":"Hinglish hook","reason":"why it works","score":8,"pillar":"name"}]}
`, 900)
  return NextResponse.json(result)
}

// ─── Action: viral finder ────────────────────────────────────────────────────
async function viral(body: Record<string, string>, key: string) {
  const result = await ask(key, SONNET, `
Viral content analyst for Indian Instagram/YouTube.
Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}${body.handle ? ` | Handle: ${body.handle}` : ''}
Top 10 viral content patterns working right now. Return ONLY JSON starting with {:
{"viral_patterns":[{"topic":"string","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"viral title","reason":"why"}],"insight":"key niche insight"}
`, 1800)
  return NextResponse.json(result)
}

// ─── Action: channel audit ───────────────────────────────────────────────────
async function audit(body: Record<string, string>, key: string) {
  const result = await ask(key, SONNET, `
Expert Instagram growth strategist. Channel audit.
Handle: ${body.handle || 'not shared'} | Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}
Return ONLY JSON starting with {:
{"profile_strategy":"string","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"string"},"posting_frequency":"string","whats_working":["str","str","str"],"whats_missing":["str","str","str"],"top_improvements":[{"action":"str","impact":"High","reason":"str"}],"hook_formula":"string","growth_levers":["str","str","str"],"overall_score":7,"summary":"2-3 sentence assessment"}
`, 1800)
  return NextResponse.json(result)
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const key  = (body.apiKey as string) || process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json(
      { error: 'No API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel Environment Variables.' },
      { status: 400 }
    )

    const action = (body.action as string) || 'generate'
    const b = body as Record<string, string>

    if (action === 'post_script') return postScript(b, key)
    if (action === 'suggest')     return suggest(b, key)
    if (action === 'viral')       return viral(b, key)
    if (action === 'audit')       return audit(b, key)
    return generate(body, key)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[generate]', msg)
    if (msg.includes('529') || msg.includes('overloaded'))
      return NextResponse.json({ error: 'Claude is overloaded. Wait 30 seconds and try again.' }, { status: 429 })
    if (msg.includes('401') || msg.includes('authentication'))
      return NextResponse.json({ error: 'Invalid API key. Check in ⚙️ Settings.' }, { status: 401 })
    if (msg.includes('credit') || msg.includes('quota'))
      return NextResponse.json({ error: 'API usage limit reached. Check console.anthropic.com.' }, { status: 402 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
