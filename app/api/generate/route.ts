import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SONNET = 'claude-sonnet-4-6'
const HAIKU  = 'claude-haiku-4-5-20251001'

// Build Tue/Thu/Sat post dates
function buildDates(n: number): string[] {
  const dates: string[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (dates.length < n) {
    if ([2, 4, 6].includes(d.getDay()))
      dates.push(d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' }))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// Call Anthropic with streaming, collect full text
async function streamAnthropic(key: string, model: string, systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } }
    throw new Error(err?.error?.message || `Anthropic error ${res.status}`)
  }

  let text = ''
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = dec.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const ev = JSON.parse(raw) as { type?: string; delta?: { type?: string; text?: string } }
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta')
            text += ev.delta.text || ''
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.releaseLock()
  }
  return text
}

// Parse JSON from Claude response (handles markdown fences)
function parseJSON(text: string): Record<string, unknown> {
  text = text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try { return JSON.parse(text) } catch { /**/ }
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e > s) {
    try { return JSON.parse(text.slice(s, e + 1)) } catch { /**/ }
  }
  throw new Error('Could not parse response — try again')
}

const SYS = 'You are a JSON API. Output ONLY valid JSON starting with {. No markdown. No explanation.'

// Build prompts
function promptGenerate(name: string, obj: string, aud: string, kw: string, dur: number, n: number, dates: string[]): string {
  return `Create a ${dur}-day Instagram content calendar, ${n} posts.
Channel: ${name} | Goal: ${obj} | Audience: ${aud}
${kw ? `Topic: ${kw}` : 'Pick the most viral topics for this audience.'}
Format: Reel=Tuesday, Carousel=Thursday, Long-form=Saturday
Post dates in order: ${dates.join(' | ')}
Output JSON:
{"pillars":["Discovery","Authority","Community","Conversion"],"strategy":"2 sentence strategy","hook_formula":"hook formula","posts":[{"day":1,"week":1,"format":"Reel","pillar":"Discovery","title":"title","hook":"Hinglish hook","content_brief":"2-3 sentence brief","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5","cta":"cta text","post_date":"${dates[0]}","reach_target":5000,"saves_target":200,"shares_target":100,"comments_target":80,"plays_target":8000,"priority":4,"notes":""}]}`
}

function promptScript(title: string, format: string, hook: string, brief: string, channelName: string, audience: string): string {
  return `Write a production-ready script.
Title: ${title} | Format: ${format} | Hook: ${hook} | Brief: ${brief}
Channel: ${channelName} | Audience: ${audience}
Reel: 🎬 HOOK(0-3s) / 📢 VOICEOVER / 📋 BODY(3 beats Hinglish) / ✅ CTA
Carousel: 📱 SLIDE 1: / 📱 SLIDE 2: etc (8 slides)
Long-form: [00:00] Intro / [02:00] Chapter 1... with talking points
AI prompt: Midjourney/DALL-E ready with aspect ratio and Indian context.
Output JSON: {"script":"full script","ai_prompt":"AI generation prompt"}`
}

function promptSuggest(niche: string, obj: string, aud: string): string {
  return `Indian Instagram viral content strategist.
Niche: ${niche} | Goal: ${obj} | Audience: ${aud}
Output JSON: {"suggestions":[{"topic":"title","format":"Reel","hook":"Hinglish hook","reason":"why","score":8,"pillar":"name"}]}`
}

function promptViral(niche: string, obj: string, aud: string, handle: string): string {
  return `Viral content analyst for Indian Instagram/YouTube.
Niche: ${niche} | Goal: ${obj} | Audience: ${aud}${handle ? ` | Handle: ${handle}` : ''}
Top 10 viral content patterns right now.
Output JSON: {"viral_patterns":[{"topic":"str","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"viral title","reason":"why"}],"insight":"key niche insight"}`
}

function promptAudit(handle: string, niche: string, obj: string, aud: string): string {
  return `Expert Instagram growth strategist. Channel audit.
Handle: ${handle || 'not shared'} | Niche: ${niche} | Goal: ${obj} | Audience: ${aud}
Output JSON: {"profile_strategy":"str","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"str"},"posting_frequency":"str","whats_working":["s","s","s"],"whats_missing":["s","s","s"],"top_improvements":[{"action":"str","impact":"High","reason":"str"}],"hook_formula":"str","growth_levers":["s","s","s"],"overall_score":7,"summary":"2-3 sentence assessment"}`
}

// THE KEY: Returns a streaming Response immediately.
// First byte sent within ~1 second (keepalive space).
// Vercel never times out. Full response streams to client.
// Frontend's res.text() naturally waits for the complete body.
function streamResponse(
  key: string,
  model: string,
  userPrompt: string,
  maxTokens: number,
  validate?: (data: Record<string, unknown>) => void
): Response {
  const enc = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  ;(async () => {
    try {
      // Send a space immediately — Vercel sees first byte, timer satisfied
      await writer.write(enc.encode(' '))

      const raw = await streamAnthropic(key, model, SYS, userPrompt, maxTokens)
      const data = parseJSON(raw)
      if (validate) validate(data)
      await writer.write(enc.encode(JSON.stringify(data)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      let userMsg = msg
      if (msg.includes('529') || msg.includes('overloaded')) userMsg = 'Claude is overloaded. Wait 30s and retry.'
      if (msg.includes('401')) userMsg = 'Invalid API key. Check in ⚙️ Settings.'
      if (msg.includes('credit') || msg.includes('quota')) userMsg = 'API limit reached. Check console.anthropic.com.'
      await writer.write(enc.encode(JSON.stringify({ error: userMsg })))
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>
  const key  = (body.apiKey as string) || process.env.ANTHROPIC_API_KEY
  if (!key) {
    return new Response(
      JSON.stringify({ error: 'No API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const action = (body.action as string) || 'generate'
  const b = body as Record<string, string>

  if (action === 'suggest') {
    return streamResponse(key, HAIKU, promptSuggest(b.niche, b.objective, b.audience), 900)
  }

  if (action === 'viral') {
    return streamResponse(key, SONNET, promptViral(b.niche, b.objective, b.audience, b.handle || ''), 1800)
  }

  if (action === 'audit') {
    return streamResponse(key, SONNET, promptAudit(b.handle || '', b.niche, b.objective, b.audience), 1800)
  }

  if (action === 'post_script') {
    return streamResponse(key, SONNET, promptScript(b.title, b.format, b.hook, b.content_brief, b.channelName, b.audience), 1200)
  }

  // Default: generate calendar
  const dur   = Number(body.duration) || 30
  const n     = Math.ceil(dur / 7) * 3
  const dates = buildDates(n)
  const kw    = (body.keyword as string) || ''

  return streamResponse(
    key, SONNET,
    promptGenerate(b.channelName, b.objective, b.audience, kw, dur, n, dates),
    n * 280,
    (data) => {
      const posts = (data as { posts?: unknown[] }).posts
      if (!Array.isArray(posts) || posts.length === 0)
        throw new Error('No posts returned — try again')
    }
  )
}
