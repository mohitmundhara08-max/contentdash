import { NextRequest, NextResponse } from 'next/server'

// Works within Vercel Hobby 10s Node.js limit using fast models
// Edge Runtime declaration kept as backup for Pro users
export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Haiku = 2-4s per call (fits in 10s Node.js limit easily)
// Sonnet = 5-10s per call (fits in 25s Edge limit)
const HAIKU  = 'claude-haiku-4-5-20251001'
const SONNET = 'claude-sonnet-4-6'

async function ask(key: string, model: string, prompt: string, tokens: number) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: tokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const d = await r.json() as { content?: {text?:string}[]; error?: {message?:string} }
  if (!r.ok) throw new Error(d?.error?.message || `API error ${r.status}`)
  const txt = d.content?.[0]?.text?.trim() || ''
  const clean = txt.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim()
  try { return JSON.parse(clean) } catch {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) try { return JSON.parse(m[0]) } catch { /**/ }
    throw new Error('Claude returned invalid JSON — try again')
  }
}

// ── GENERATE calendar — uses HAIKU, completes in 3-5 seconds ─────────────
async function generate(body: Record<string,unknown>, key: string) {
  const name     = body.channelName as string
  const obj      = body.objective   as string
  const aud      = body.audience    as string
  const kw       = (body.keyword as string) || ''
  const dur      = Number(body.duration) || 30
  const n        = Math.ceil(dur / 7) * 3
  const qm       = Boolean(body.quickMode)

  // Build post dates Tue/Thu/Sat
  const dates: string[] = []
  const d = new Date(); d.setDate(d.getDate() + 1)
  while (dates.length < n) {
    if ([2,4,6].includes(d.getDay()))
      dates.push(d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}))
    d.setDate(d.getDate() + 1)
  }

  // Use Haiku for speed — scripts loaded on-demand per post separately
  const plan = await ask(key, HAIKU, `
You are a viral Instagram content strategist for India. Create a ${dur}-day content calendar.
Channel: ${name} | Goal: ${obj} | Audience: ${aud}
${kw ? `Topic: ${kw}` : 'Pick the most viral topics for this audience.'}
Format: Reel=Tuesday, Carousel=Thursday, Long-form=Saturday
Post dates in order: ${dates.join(' | ')}

Return ONLY valid JSON, no markdown:
{
  "pillars":["p1","p2","p3","p4"],
  "strategy":"2-sentence strategy",
  "hook_formula":"specific hook formula for this audience",
  "posts":[{
    "day":1,"week":1,"format":"Reel","pillar":"pillar name",
    "title":"specific post title",
    "hook":"scroll-stopping Hinglish hook",
    "content_brief":"2-3 sentence brief",
    "hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5",
    "cta":"call to action",
    "post_date":"${dates[0]}",
    "reach_target":5000,"saves_target":200,"shares_target":100,
    "comments_target":80,"plays_target":8000,"priority":4,"notes":""
  }]
}`, Math.max(n * 250, 1500))

  if (!plan.posts?.length) throw new Error('No posts returned — try again')
  return NextResponse.json(plan)
}

// ── POST SCRIPT — on-demand per post, uses Sonnet ────────────────────────
async function postScript(body: Record<string,string>, key: string) {
  const data = await ask(key, SONNET, `
Write a production-ready social media script.
Title: ${body.title}
Format: ${body.format}
Hook: ${body.hook}
Brief: ${body.content_brief}
Pillar: ${body.pillar}
Channel: ${body.channelName}
Audience: ${body.audience}

Script format:
- Reel: 🎬 HOOK (0-3s) / 📢 VOICEOVER / 📋 BODY (3 beats) / ✅ CTA — Hinglish where natural
- Carousel: 📱 SLIDE 1 — COVER: / 📱 SLIDE 2: etc (8-10 slides with full copy)
- Long-form: [00:00] Intro / [02:00] Chapter... with talking points

AI prompt: Midjourney/DALL-E ready — include exact style, aspect ratio (9:16 Reel, 4:5 Carousel, 16:9 Long-form), Indian visual context.

Return ONLY valid JSON:
{"script":"full production script","ai_prompt":"detailed AI generation prompt"}
`, 1200)
  return NextResponse.json(data)
}

// ── SUGGEST topics — Haiku, 2-3 seconds ──────────────────────────────────
async function suggest(body: Record<string,string>, key: string) {
  const data = await ask(key, HAIKU, `
Viral content strategist for Indian Instagram/YouTube.
Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}
Suggest 8 specific, viral-ready topics. Return ONLY valid JSON:
{"suggestions":[{"topic":"string","format":"Reel","hook":"Hinglish hook","reason":"why it works","score":8,"pillar":"string"}]}
`, 900)
  return NextResponse.json(data)
}

// ── VIRAL finder — Sonnet, 5-8 seconds ───────────────────────────────────
async function viral(body: Record<string,string>, key: string) {
  const data = await ask(key, SONNET, `
Viral content analyst for Indian Instagram/YouTube.
Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}${body.handle?` | Handle: ${body.handle}`:''}
Top 10 viral content patterns working right now. Return ONLY valid JSON:
{"viral_patterns":[{"topic":"string","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"exact viral title","reason":"string"}],"insight":"one key niche insight"}
`, 1800)
  return NextResponse.json(data)
}

// ── AUDIT — Sonnet, 5-8 seconds ──────────────────────────────────────────
async function audit(body: Record<string,string>, key: string) {
  const data = await ask(key, SONNET, `
Expert Instagram growth strategist. Channel audit.
Handle: ${body.handle||'not shared'} | Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}
Return ONLY valid JSON:
{"profile_strategy":"string","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"string"},"posting_frequency":"string","whats_working":["s","s","s"],"whats_missing":["s","s","s"],"top_improvements":[{"action":"string","impact":"High","reason":"string"}],"hook_formula":"string","growth_levers":["s","s","s"],"overall_score":7,"summary":"2-3 sentence assessment"}
`, 1800)
  return NextResponse.json(data)
}

// ── MAIN handler ──────────────────────────────────────────────────────────
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
    if (msg.includes('529') || msg.includes('overloaded'))
      return NextResponse.json({ error: 'Claude is overloaded. Wait 30s and try again.' }, { status: 429 })
    if (msg.includes('401'))
      return NextResponse.json({ error: 'Invalid API key. Check in ⚙️ Settings.' }, { status: 401 })
    if (msg.includes('credit') || msg.includes('quota'))
      return NextResponse.json({ error: 'API usage limit reached. Check console.anthropic.com.' }, { status: 402 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
