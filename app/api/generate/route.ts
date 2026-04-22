import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MODEL_FAST    = 'claude-haiku-4-5-20251001'  // 2-4s  — suggest
const MODEL_DEFAULT = 'claude-sonnet-4-6'           // 5-12s — everything else

async function callClaude(key: string, model: string, prompt: string, maxTokens = 3000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  })
  const data = await res.json() as { content?: { text?: string }[]; error?: { message?: string } }
  if (!res.ok) throw new Error(data?.error?.message || `Claude API error ${res.status}`)
  const text = data.content?.[0]?.text?.trim() || ''
  const clean = text.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim()
  try { return JSON.parse(clean) } catch {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) try { return JSON.parse(m[0]) } catch { /* fall */ }
    throw new Error('AI returned invalid format — try again')
  }
}

// Phase 1: Generate calendar structure FAST — no scripts, no AI prompts
// Completes in ~5 seconds
async function handleGenerate(body: Record<string, unknown>, key: string) {
  const channelName = body.channelName as string
  const objective   = body.objective   as string
  const audience    = body.audience    as string
  const keyword     = (body.keyword as string) || ''
  const duration    = Number(body.duration) || 30
  const postsCount  = Math.ceil(duration / 7) * 3

  const today = new Date(); today.setDate(today.getDate() + 1)
  const postDates: string[] = []
  const d = new Date(today)
  while (postDates.length < postsCount) {
    if ([2,4,6].includes(d.getDay()))
      postDates.push(d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' }))
    d.setDate(d.getDate() + 1)
  }

  // NOTE: No scripts or AI prompts here — those are loaded on demand per post (Phase 2)
  // This keeps generation under 8 seconds on any plan
  const result = await callClaude(key, MODEL_DEFAULT,
    `Create a ${duration}-day Instagram content plan, ${postsCount} posts.
Channel: ${channelName} | Objective: ${objective} | Audience: ${audience}
${keyword ? `Topic: ${keyword}` : 'Pick the most viral topics for this channel and audience.'}
Post dates: ${postDates.join(' | ')}
Format: Reel=Tuesday, Carousel=Thursday, Long-form=Saturday

Return ONLY valid JSON (no markdown, no code fences):
{
  "pillars": ["pillar1","pillar2","pillar3","pillar4"],
  "strategy": "2-3 sentence strategy",
  "hook_formula": "specific hook formula for this audience",
  "posts": [
    {
      "day": 1, "week": 1, "format": "Reel", "pillar": "pillar name",
      "title": "specific post title",
      "hook": "Hinglish hook line that stops the scroll",
      "content_brief": "2-3 sentence content brief explaining what this post covers",
      "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
      "cta": "specific call to action",
      "post_date": "${postDates[0]}",
      "reach_target": 5000, "saves_target": 200, "shares_target": 100,
      "comments_target": 80, "plays_target": 8000, "priority": 4, "notes": ""
    }
  ]
}`,
    postsCount * 300  // ~300 tokens per post, no scripts = very fast
  )

  if (!result.posts?.length) throw new Error('No posts returned — try again')
  return NextResponse.json(result)
}

// Phase 2: Generate script + AI prompt for ONE post — called on-demand when user clicks
// Completes in ~3-5 seconds
async function handlePostScript(body: Record<string, string>, key: string) {
  const result = await callClaude(key, MODEL_DEFAULT,
    `Write a complete, production-ready social media script for this post.

Post Details:
- Title: ${body.title}
- Format: ${body.format} (Reel / Carousel / Long-form)
- Hook: ${body.hook}
- Content Brief: ${body.content_brief}
- Pillar: ${body.pillar}
- Channel: ${body.channelName}
- Audience: ${body.audience}

Script format rules:
- For Reel: use 🎬 HOOK (0-3 sec) / 📢 VOICEOVER / 📋 BODY (3 points, 15-20 sec each) / ✅ CTA
- For Carousel: use 📱 SLIDE 1 — COVER: / 📱 SLIDE 2: / etc. (8-10 slides)
- For Long-form: use [00:00] Intro / [02:00] Chapter 1 / etc. with talking points per chapter
- Hinglish where natural for Indian audience

AI Prompt format: Midjourney/DALL-E ready with exact style, colors, aspect ratio
(9:16 for Reels, 4:5 for Carousels, 16:9 for Long-form), Indian visual context

Return ONLY valid JSON (no markdown):
{
  "script": "full production script here",
  "ai_prompt": "detailed AI image/video generation prompt here"
}`,
    1500
  )
  return NextResponse.json(result)
}

async function handleSuggest(body: Record<string, string>, key: string) {
  const result = await callClaude(key, MODEL_FAST,
    `Viral content strategist for Indian Instagram/YouTube.
Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}
Suggest 8 high-potential topics. Return ONLY JSON:
{ "suggestions": [{ "topic":"string","format":"Reel","hook":"Hinglish hook","reason":"why it works","score":8,"pillar":"string" }] }`,
    1200
  )
  return NextResponse.json(result)
}

async function handleViral(body: Record<string, string>, key: string) {
  const result = await callClaude(key, MODEL_DEFAULT,
    `Viral content analyst for Indian Instagram/YouTube.
Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}${body.handle ? ` | Handle: ${body.handle}` : ''}
Top 10 viral content patterns for this niche right now.
Return ONLY JSON:
{ "viral_patterns": [{ "topic":"string","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"exact viral title","reason":"string" }], "insight":"one key niche insight" }`,
    2000
  )
  return NextResponse.json(result)
}

async function handleAudit(body: Record<string, string>, key: string) {
  const result = await callClaude(key, MODEL_DEFAULT,
    `Expert Instagram growth strategist. Channel audit.
Handle: ${body.handle || 'not shared'} | Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}
Return ONLY JSON:
{ "profile_strategy":"string","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"string"},"posting_frequency":"string","whats_working":["string","string","string"],"whats_missing":["string","string","string"],"top_improvements":[{"action":"string","impact":"High","reason":"string"}],"hook_formula":"string","growth_levers":["string","string","string"],"overall_score":7,"summary":"2-3 sentence assessment" }`,
    2000
  )
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const key  = (body.apiKey as string) || process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'No API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.' }, { status: 400 })

    const action = (body.action as string) || 'generate'
    const b = body as Record<string, string>

    if (action === 'post_script') return handlePostScript(b, key)
    if (action === 'suggest')     return handleSuggest(b, key)
    if (action === 'viral')       return handleViral(b, key)
    if (action === 'audit')       return handleAudit(b, key)
    return handleGenerate(body, key)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('529') || msg.includes('overloaded'))
      return NextResponse.json({ error: 'Claude is overloaded. Wait 30s and try again.' }, { status: 429 })
    if (msg.includes('401') || msg.includes('authentication'))
      return NextResponse.json({ error: 'Invalid API key. Check in ⚙️ Settings.' }, { status: 401 })
    if (msg.includes('credit') || msg.includes('quota'))
      return NextResponse.json({ error: 'API usage limit reached. Check console.anthropic.com.' }, { status: 402 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
