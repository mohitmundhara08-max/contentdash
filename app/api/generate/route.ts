import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SONNET = 'claude-sonnet-4-6'
const HAIKU  = 'claude-haiku-4-5-20251001'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function parseJSON(raw: string): Record<string, unknown> {
  let t = raw.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try { return JSON.parse(t) } catch { /**/ }
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  if (s !== -1 && e > s) try { return JSON.parse(t.slice(s, e + 1)) } catch { /**/ }
  if (t.endsWith(',')) { t = t.slice(0, -1); try { return JSON.parse(t + ']}') } catch { /**/ } }
  throw new Error('Response was cut off — try a shorter duration or Quick mode')
}

// ── Stream from Anthropic, collect full text ──────────────────────────────────

async function callAnthropic(key: string, model: string, system: string, prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: maxTokens, stream: true, system, messages: [{ role: 'user', content: prompt }] }),
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
      for (const line of dec.decode(value, { stream: true }).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const ev = JSON.parse(raw) as { type?: string; delta?: { type?: string; text?: string } }
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') text += ev.delta.text || ''
        } catch { /**/ }
      }
    }
  } finally { reader.releaseLock() }
  return text
}

// ── Core streaming response ───────────────────────────────────────────────────
// Writes first byte immediately → Vercel timer satisfied → no timeout possible

function streamResponse(key: string, model: string, system: string, prompt: string, maxTokens: number, validate?: (d: Record<string,unknown>) => void): Response {
  const enc = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  ;(async () => {
    try {
      await writer.write(enc.encode(' '))  // first byte in <1s → Vercel happy
      const raw  = await callAnthropic(key, model, system, prompt, maxTokens)
      const data = parseJSON(raw)
      if (validate) validate(data)
      await writer.write(enc.encode(JSON.stringify(data)))
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg.includes('529') || msg.includes('overloaded')) msg = 'Claude is overloaded. Wait 30s and retry.'
      if (msg.includes('401')) msg = 'Invalid API key. Check ⚙️ Settings.'
      if (msg.includes('credit') || msg.includes('quota')) msg = 'API limit reached. Check console.anthropic.com.'
      await writer.write(enc.encode(JSON.stringify({ error: msg })))
    } finally { await writer.close() }
  })()
  return new Response(readable, { headers: { 'Content-Type': 'application/json' } })
}

const SYS_JSON = 'You are a JSON API. Output ONLY valid JSON starting with {. No markdown. No explanation. No truncation — always close all brackets.'

// ── Actions ───────────────────────────────────────────────────────────────────

function doGenerate(b: Record<string,unknown>, key: string): Response {
  const name = b.channelName as string
  const obj  = b.objective   as string
  const aud  = b.audience    as string
  const kw   = (b.keyword as string) || ''
  const dur  = Number(b.duration) || 30
  const qm   = Boolean(b.quickMode)

  // Use Math.floor to match UI labels: 7→3, 14→6, 30→12, 60→24
  const n     = Math.max(Math.floor(dur / 7) * 3, 3)
  const dates = buildDates(n)

  if (qm) {
    // QUICK MODE: Haiku, minimal fields, very fast (~3s)
    const prompt = `Create a ${dur}-day Instagram content calendar, exactly ${n} posts.
Channel: ${name} | Goal: ${obj} | Audience: ${aud}
${kw ? `Topic: ${kw}` : 'Choose the most engaging topics for this audience.'}
Format: Reel=Tue Carousel=Thu Long-form=Sat
Post dates: ${dates.join(' | ')}
Output JSON (exactly ${n} posts in the array):
{"pillars":["p1","p2","p3","p4"],"strategy":"1 sentence","hook_formula":"hook formula","posts":[{"day":1,"week":1,"format":"Reel","pillar":"p1","title":"title","hook":"Hinglish hook","hashtags":"#t1 #t2 #t3 #t4 #t5","cta":"cta","post_date":"${dates[0]}","reach_target":5000,"saves_target":150,"shares_target":80,"comments_target":60,"plays_target":8000,"priority":4,"notes":"","content_brief":"","script":"","ai_prompt":""}]}`
    return streamResponse(key, HAIKU, SYS_JSON, prompt, n * 120 + 400,
      d => { if (!Array.isArray((d as {posts?:unknown[]}).posts)) throw new Error('No posts returned') })
  }

  // FULL MODE: Sonnet, all fields, streaming handles time
  const prompt = `Create a ${dur}-day Instagram content calendar, exactly ${n} posts.
Channel: ${name} | Goal: ${obj} | Audience: ${aud}
${kw ? `Topic: ${kw}` : 'Choose the most viral topics for this audience.'}
Format rotation: Reel=Tuesday Carousel=Thursday Long-form=Saturday
Post dates in order: ${dates.join(' | ')}
Output JSON (exactly ${n} posts, all fields filled):
{"pillars":["Discovery","Authority","Community","Conversion"],"strategy":"2 sentence strategy","hook_formula":"specific hook formula for this audience","posts":[{"day":1,"week":1,"format":"Reel","pillar":"Discovery","title":"specific post title","hook":"Hinglish scroll-stopping hook","content_brief":"2-3 sentence brief","hashtags":"#t1 #t2 #t3 #t4 #t5","cta":"call to action","post_date":"${dates[0]}","reach_target":5000,"saves_target":200,"shares_target":100,"comments_target":80,"plays_target":8000,"priority":4,"notes":""}]}`

  const maxTok = Math.min(n * 480 + 500, 8000)
  return streamResponse(key, SONNET, SYS_JSON, prompt, maxTok,
    d => { if (!Array.isArray((d as {posts?:unknown[]}).posts)) throw new Error('No posts returned') })
}

function doScript(b: Record<string,string>, key: string): Response {
  const prompt = `Write a production-ready script for this post.
Title: ${b.title} | Format: ${b.format} | Hook: ${b.hook}
Brief: ${b.content_brief} | Channel: ${b.channelName} | Audience: ${b.audience}
Reel: 🎬 HOOK(0-3s) / 📢 VOICEOVER / 📋 BODY(3 beats Hinglish) / ✅ CTA
Carousel: 📱 SLIDE 1: / 📱 SLIDE 2: etc (8 slides full copy)
Long-form: [00:00] Intro / chapters with talking points
AI prompt: Midjourney/DALL-E ready, aspect ratio, Indian context.
Output JSON: {"script":"full script","ai_prompt":"AI prompt"}`
  return streamResponse(key, SONNET, SYS_JSON, prompt, 1400)
}

function doSuggest(b: Record<string,string>, key: string): Response {
  const prompt = `Indian Instagram viral content strategist.
Niche: ${b.niche} | Goal: ${b.objective} | Audience: ${b.audience}
Suggest 8 specific viral topics. Output JSON:
{"suggestions":[{"topic":"specific title","format":"Reel","hook":"Hinglish hook","reason":"why it works","score":8,"pillar":"pillar name"}]}`
  return streamResponse(key, HAIKU, SYS_JSON, prompt, 1200)
}

function doViral(b: Record<string,string>, key: string): Response {
  const prompt = `Viral content analyst for Indian Instagram/YouTube.
Niche: ${b.niche} | Goal: ${b.objective} | Audience: ${b.audience}${b.handle ? ` | Handle: ${b.handle}` : ''}
Top 10 viral content patterns right now. Output JSON:
{"viral_patterns":[{"topic":"str","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"exact viral title","reason":"why it works"}],"insight":"key niche insight"}`
  return streamResponse(key, SONNET, SYS_JSON, prompt, 2000)
}

function doAudit(b: Record<string,string>, key: string): Response {
  const prompt = `Expert Instagram growth strategist. Channel audit.
Handle: ${b.handle || 'not shared'} | Niche: ${b.niche} | Goal: ${b.objective} | Audience: ${b.audience}
Output JSON:
{"profile_strategy":"str","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"str"},"posting_frequency":"3x/week","whats_working":["str","str","str"],"whats_missing":["str","str","str"],"top_improvements":[{"action":"str","impact":"High","reason":"str"},{"action":"str","impact":"Medium","reason":"str"},{"action":"str","impact":"High","reason":"str"}],"hook_formula":"specific formula for this audience","growth_levers":["str","str","str"],"overall_score":7,"summary":"2-3 sentence honest assessment"}`
  return streamResponse(key, SONNET, SYS_JSON, prompt, 2000)
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>
  const key  = (body.apiKey as string) || process.env.ANTHROPIC_API_KEY
  if (!key) return new Response(
    JSON.stringify({ error: 'No API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  )

  const action = (body.action as string) || 'generate'
  const b = body as Record<string, string>

  if (action === 'post_script') return doScript(b, key)
  if (action === 'suggest')     return doSuggest(b, key)
  if (action === 'viral')       return doViral(b, key)
  if (action === 'audit')       return doAudit(b, key)
  return doGenerate(body, key)
}
