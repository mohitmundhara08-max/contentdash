import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SONNET = 'claude-sonnet-4-6'
const HAIKU = 'claude-haiku-4-5-20251001'

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
  throw new Error('Response was cut off — try Quick mode or a shorter duration')
}

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

// Returns streaming Response — first byte in <1s so Vercel never times out
function streamIt(key: string, model: string, system: string, prompt: string, maxTokens: number, validate?: (d: Record<string,unknown>) => void): Response {
  const enc = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  ;(async () => {
    try {
      await writer.write(enc.encode(' ')) // keepalive byte → Vercel timer satisfied
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

const SYS = 'You are a JSON API. Output ONLY valid complete JSON starting with {. Fill ALL fields with real, specific content. Never use placeholder text like "str" or "string". Never truncate.'

// ── GENERATE ─────────────────────────────────────────────────────────────────
function doGenerate(b: Record<string,unknown>, key: string): Response {
  const name = b.channelName as string
  const obj  = b.objective   as string
  const aud  = b.audience    as string
  const kw   = (b.keyword as string) || ''
  const dur  = Number(b.duration) || 30
  const qm   = Boolean(b.quickMode)
  const n    = Math.max(Math.floor(dur / 7) * 3, 3)
  const dates = buildDates(n)

    if (qm) {
    // QUICK: Haiku, minimal fields only, ~3 seconds
    const prompt = `Create a ${dur}-day Instagram content plan with ${n} posts.
Channel: ${name} | Goal: ${obj} | Audience: ${aud}
${kw ? `Topic: ${kw}` : 'Choose the most viral topics for this audience.'}
Format: Reel on Tue, Carousel on Thu, Long-form on Sat
Post dates: ${dates.join(' | ')}

Reply with ONLY this JSON, filling every field with real specific content:
{
  "pillars": ["Pillar Name 1", "Pillar Name 2", "Pillar Name 3", "Pillar Name 4"],
  "strategy": "Write 1 real sentence about the content strategy.",
  "hook_formula": "Write the specific hook formula for this audience.",
  "posts": [
    {
      "day": 1, "week": 1, "format": "Reel", "pillar": "Pillar Name 1",
      "title": "Write the actual post title here",
      "hook": "Write the actual Hinglish hook line here",
      "content_brief": "", "script": "", "ai_prompt": "",
      "hashtags": "#actualHashtag1 #actualHashtag2 #actualHashtag3 #actualHashtag4 #actualHashtag5",
      "cta": "Write the actual call to action",
      "post_date": "${dates[0]}",
      "reach_target": 5000, "saves_target": 150, "shares_target": 80, "comments_target": 60, "plays_target": 8000,
      "priority": 4, "notes": ""
    }
  ]
}`
    const maxOut = Math.min(n * 200 + 600, 3800)
    return streamIt(
      key,
      HAIKU,
      SYS,
      prompt,
      maxOut,
      d => {
        if (!Array.isArray((d as { posts?: unknown[] }).posts)) {
          throw new Error('No posts returned — try again')
        }
      },
    )
  } // ← this closing brace is the important part

  // FULL: Sonnet, all fields, scripts loaded on-demand per post
  const prompt = `Create a ${dur}-day Instagram content calendar with ${n} posts.
Channel: ${name} | Goal: ${obj} | Audience: ${aud}
${kw ? `Topic: ${kw}` : 'Choose the most viral, specific topics for this audience.'}
Format: Reel=Tuesday Carousel=Thursday Long-form=Saturday
Post dates: ${dates.join(' | ')}

Reply with ONLY this JSON, filling EVERY field with real, specific, actionable content:
{
  "pillars": ["Specific Pillar 1", "Specific Pillar 2", "Specific Pillar 3", "Specific Pillar 4"],
  "strategy": "Write 2 real sentences about the content strategy for this channel.",
  "hook_formula": "Write the exact hook formula: e.g. Start with audience belief → break it → deliver truth",
  "posts": [
    {
      "day": 1, "week": 1, "format": "Reel", "pillar": "Pillar Name",
      "title": "Write the actual specific post title",
      "hook": "Write the actual Hinglish scroll-stopping hook",
      "content_brief": "Write 2-3 sentences describing exactly what this post covers.",
      "script": "", "ai_prompt": "",
      "hashtags": "#actualTag1 #actualTag2 #actualTag3 #actualTag4 #actualTag5",
      "cta": "Write the specific call to action",
      "post_date": "${dates[0]}",
      "reach_target": 5000, "saves_target": 200, "shares_target": 100,
      "comments_target": 80, "plays_target": 8000, "priority": 4, "notes": ""
    }
  ]
}`
  const maxTok = Math.min(n * 480 + 500, 8000)
  return streamIt(key, SONNET, SYS, prompt, maxTok,
    d => { if (!Array.isArray((d as {posts?:unknown[]}).posts)) throw new Error('No posts returned — try again') })
}

// ── SCRIPT (on-demand per post) ───────────────────────────────────────────────
function doScript(b: Record<string,string>, key: string): Response {
  const prompt = `Write a complete production-ready script for this Instagram post.

Post details:
- Title: ${b.title}
- Format: ${b.format}
- Hook: ${b.hook}
- Brief: ${b.content_brief}
- Channel: ${b.channelName}
- Audience: ${b.audience}

Script format:
- Reel: 🎬 HOOK (0-3s) / 📢 VOICEOVER / 📋 BODY (3 beats, Hinglish where natural) / ✅ CTA
- Carousel: 📱 SLIDE 1 — COVER: [text] / 📱 SLIDE 2: [text] / etc (8-10 slides, full copy each)
- Long-form: [00:00] Intro / [02:00] Chapter 1 / etc with talking points

AI image/video prompt: Midjourney or DALL-E ready. Include exact aspect ratio (9:16 for Reel, 4:5 for Carousel, 16:9 for Long-form), visual style, and Indian context.

Reply with ONLY this JSON:
{"script": "Write the complete full script here — do not abbreviate", "ai_prompt": "Write the complete detailed AI image/video generation prompt here"}`
  return streamIt(key, SONNET, SYS, prompt, 1500)
}

// ── SUGGEST ───────────────────────────────────────────────────────────────────
function doSuggest(b: Record<string,string>, key: string): Response {
  const prompt = `You are a viral content strategist for Indian Instagram and YouTube.

Channel niche: ${b.niche}
Goal: ${b.objective}
Target audience: ${b.audience}

Suggest 8 highly specific, viral-ready content topics for this exact niche and audience.

Reply with ONLY this JSON — fill every field with real specific content:
{
  "suggestions": [
    {
      "topic": "Write the specific post title (not generic)",
      "format": "Reel",
      "hook": "Write the actual Hinglish hook line for this specific topic",
      "reason": "Write 1 sentence explaining exactly why this will get high engagement",
      "score": 8,
      "pillar": "Write the content pillar this belongs to"
    }
  ]
}`
  return streamIt(key, HAIKU, SYS, prompt, 1400)
}

// ── VIRAL ─────────────────────────────────────────────────────────────────────
function doViral(b: Record<string,string>, key: string): Response {
  const prompt = `You are a viral content analyst for Indian Instagram and YouTube.

Channel niche: ${b.niche}
Goal: ${b.objective}
Audience: ${b.audience}
${b.handle ? `Handle: ${b.handle}` : ''}

Identify the top 6 content patterns that are going viral right now for this specific niche and audience in India.

Reply with ONLY this JSON — fill every field with real, specific content:
{
  "viral_patterns": [
    {
      "topic": "Write the specific content topic",
      "format": "Reel",
      "trigger": "FOMO",
      "hook": "Write the actual Hinglish hook line",
      "reach_potential": "Viral",
      "platform": "Instagram Reels",
      "example_title": "Write an exact viral title that would work for this topic",
      "reason": "Write 1 sentence explaining why this specific pattern is getting high reach right now"
    }
  ],
  "insight": "Write 1-2 sentences about the single most important content opportunity in this niche right now."
}`
  return streamIt(key, SONNET, SYS, prompt, 2800)
}

// ── AUDIT ─────────────────────────────────────────────────────────────────────
function doAudit(b: Record<string,string>, key: string): Response {
  const prompt = `You are an expert Instagram growth strategist.

Channel to audit:
- Handle: ${b.handle || 'not provided'}
- Niche: ${b.niche}
- Goal: ${b.objective}
- Audience: ${b.audience}

Provide a detailed channel audit with real, specific, actionable insights for THIS specific niche.

Reply with ONLY this JSON — every field must have real specific content, not generic advice:
{
  "profile_strategy": "Write 1-2 sentences about what the profile bio and highlights should communicate for this specific niche.",
  "content_mix": {
    "reel": 40,
    "carousel": 40,
    "longform": 20,
    "reasoning": "Write 1 sentence explaining why this specific mix works for this niche and audience."
  },
  "posting_frequency": "Write the specific recommendation, e.g. 3x per week: Tue/Thu/Sat",
  "whats_working": [
    "Write one specific thing that works well in this niche",
    "Write another specific working pattern",
    "Write a third specific working strategy"
  ],
  "whats_missing": [
    "Write one specific content gap in this niche",
    "Write another specific missing element",
    "Write a third specific opportunity"
  ],
  "top_improvements": [
    {"action": "Write one specific actionable improvement", "impact": "High", "reason": "Write why this improvement matters"},
    {"action": "Write a second specific improvement", "impact": "Medium", "reason": "Write why this matters"},
    {"action": "Write a third specific improvement", "impact": "High", "reason": "Write why this matters"}
  ],
  "hook_formula": "Write the exact hook formula for this audience: e.g. Start with [belief] → expose [cost] → reveal [truth]",
  "growth_levers": [
    "Write one specific growth lever for this niche",
    "Write a second specific growth lever",
    "Write a third specific growth lever"
  ],
  "overall_score": 6,
  "summary": "Write 2-3 honest sentences assessing this channel's current strategy and biggest opportunity."
}`
  return streamIt(key, SONNET, SYS, prompt, 3000)
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
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
