import { NextRequest, NextResponse } from 'next/server'

// Edge Runtime = 30s timeout on Vercel Hobby (default Node.js = 10s, too short for Claude)
// Pro plan respects maxDuration = 60s
export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Sonnet: 8-15 seconds (works on Hobby Edge 30s)
// Opus:   20-40 seconds (needs Pro plan + maxDuration 60)
const MODEL_FAST    = 'claude-haiku-4-5-20251001'  // ~3-6s  — suggestions
const MODEL_DEFAULT = 'claude-sonnet-4-6'           // ~8-15s — viral, audit, generate

async function callClaude(key: string, model: string, prompt: string, maxTokens = 5000) {
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
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json() as { content?: { text?: string }[]; error?: { message?: string }; type?: string }

  if (!res.ok) {
    const errMsg = data?.error?.message || `Claude API error ${res.status}`
    throw new Error(errMsg)
  }

  const text = data.content?.[0]?.text?.trim() || ''
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    // If Claude wrapped in text, try to extract JSON
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) } catch { /* fall through */ }
    }
    throw new Error('AI returned invalid JSON — please try again')
  }
}

async function handleSuggest(body: Record<string, string>, key: string) {
  // Note: In Edge Runtime, we skip Supabase lookup to stay fast
  // Past posts context is optional — suggestions still work well without it
  const result = await callClaude(
    key,
    MODEL_FAST,
    `Viral content strategist for Indian Instagram/YouTube.
Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}
Give 8 high-potential topic suggestions. Each should be specific and viral-ready.
Return ONLY valid JSON (no markdown):
{ "suggestions": [{ "topic":"specific topic title","format":"Reel","hook":"Hinglish hook line","reason":"why it will perform","score":8,"pillar":"pillar name" }] }`,
    1500
  )
  return NextResponse.json(result)
}

async function handleViral(body: Record<string, string>, key: string) {
  const result = await callClaude(
    key,
    MODEL_DEFAULT,
    `Viral content analyst for Indian Instagram/YouTube.
Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}${body.handle ? ` | Handle: ${body.handle}` : ''}
Identify top 10 viral content patterns working right now for this niche and audience.
Return ONLY valid JSON (no markdown):
{ "viral_patterns": [{ "topic":"string","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"exact viral title","reason":"why it works for this audience" }], "insight":"one key insight about what is working in this niche right now" }`,
    2500
  )
  return NextResponse.json(result)
}

async function handleAudit(body: Record<string, string>, key: string) {
  const result = await callClaude(
    key,
    MODEL_DEFAULT,
    `Expert Instagram growth strategist. Channel audit.
Handle: ${body.handle || 'not shared'} | Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}
Return ONLY valid JSON (no markdown):
{ "profile_strategy":"string","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"string"},"posting_frequency":"X times/week","whats_working":["string","string","string"],"whats_missing":["string","string","string"],"top_improvements":[{"action":"string","impact":"High","reason":"string"}],"hook_formula":"specific hook formula for this audience","growth_levers":["string","string","string"],"overall_score":7,"summary":"2-3 sentence honest assessment" }`,
    2500
  )
  return NextResponse.json(result)
}

async function handleGenerate(body: Record<string, unknown>, key: string) {
  const channelName = body.channelName as string
  const objective   = body.objective   as string
  const audience    = body.audience    as string
  const keyword     = body.keyword     as string || ''
  const duration    = Number(body.duration) || 30
  const quickMode   = Boolean(body.quickMode)

  const postsCount = Math.ceil(duration / 7) * 3

  // Build post dates (Tue/Thu/Sat)
  const today = new Date(); today.setDate(today.getDate() + 1)
  const postDates: string[] = []
  const d = new Date(today)
  while (postDates.length < postsCount) {
    if ([2, 4, 6].includes(d.getDay())) {
      postDates.push(d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' }))
    }
    d.setDate(d.getDate() + 1)
  }

  const dateList = postDates.join(' | ')

  const prompt = quickMode
    ? `Create a ${duration}-day Instagram content plan with ${postsCount} posts.
Channel: ${channelName} | Objective: ${objective} | Audience: ${audience}
${keyword ? `Topic: ${keyword}` : 'Pick the best topics for this channel and audience.'}
Post dates in order: ${dateList}
Format rotation: Reel (Tue), Carousel (Thu), Long-form (Sat)

Return ONLY valid JSON (no markdown):
{
  "pillars": ["pillar1","pillar2","pillar3","pillar4"],
  "strategy": "2-sentence strategy",
  "hook_formula": "hook formula for this audience",
  "posts": [
    { "day":1,"week":1,"format":"Reel","pillar":"string","title":"string","hook":"Hinglish hook","content_brief":"brief","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5","cta":"string","post_date":"${postDates[0]}","reach_target":5000,"saves_target":150,"shares_target":80,"comments_target":60,"plays_target":8000,"priority":4,"notes":"" }
  ]
}`
    : `Create a full ${duration}-day Instagram content plan with ${postsCount} posts.
Channel: ${channelName} | Objective: ${objective} | Audience: ${audience}
${keyword ? `Topic: ${keyword}` : 'Pick the best viral topics for this channel and audience.'}
Post dates in order: ${dateList}

Rules:
- Reel=Tuesday, Carousel=Thursday, Long-form=Saturday
- 4 content pillars specific to the audience
- Hooks in Hinglish where natural
- Scripts: for Reels use 🎬 HOOK (0-3s) / 📢 VOICEOVER / 📋 BODY (3 points) / ✅ CTA. For Carousels: 📱 SLIDE 1: / 📱 SLIDE 2: etc. For Long-form: chapter timestamps
- AI prompts: Midjourney/DALL-E ready — include style, aspect ratio (9:16 Reels, 4:5 Carousels, 16:9 Long-form), Indian context
- Be specific and production-ready

Return ONLY valid JSON (no markdown):
{
  "pillars": ["p1","p2","p3","p4"],
  "strategy": "2-3 sentence content strategy",
  "hook_formula": "specific hook formula for this audience",
  "posts": [
    {
      "day":1,"week":1,"format":"Reel","pillar":"pillar name",
      "title":"post title",
      "hook":"hook line in Hinglish",
      "content_brief":"2-3 sentence brief",
      "script":"FULL script — use 🎬/📢/📋/✅ format for Reels, slide-by-slide for Carousels",
      "ai_prompt":"detailed Midjourney/DALL-E prompt with aspect ratio and style",
      "hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5",
      "cta":"call to action",
      "post_date":"${postDates[0]}",
      "reach_target":5000,"saves_target":200,"shares_target":100,"comments_target":80,"plays_target":8000,
      "priority":4,"notes":"production note"
    }
  ]
}`

  const plan = await callClaude(key, MODEL_DEFAULT, prompt, quickMode ? 3000 : 6000)
  if (!plan.posts?.length) throw new Error('No posts returned — please try again')

  return NextResponse.json(plan)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const key = (body.apiKey as string) || process.env.ANTHROPIC_API_KEY

    if (!key) {
      return NextResponse.json(
        { error: 'No API key found. Add your Anthropic API key in ⚙️ Settings, or add ANTHROPIC_API_KEY to Vercel environment variables.' },
        { status: 400 }
      )
    }

    const action = (body.action as string) || 'generate'
    const b = body as Record<string, string>

    if (action === 'suggest') return handleSuggest(b, key)
    if (action === 'viral')   return handleViral(b, key)
    if (action === 'audit')   return handleAudit(b, key)
    return handleGenerate(body, key)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[generate]', msg)

    // Give actionable error messages
    if (msg.includes('529') || msg.includes('overloaded')) {
      return NextResponse.json({ error: 'Claude API is overloaded right now. Wait 30 seconds and try again.' }, { status: 429 })
    }
    if (msg.includes('401') || msg.includes('authentication')) {
      return NextResponse.json({ error: 'Invalid API key. Check your Anthropic API key in ⚙️ Settings.' }, { status: 401 })
    }
    if (msg.includes('insufficient') || msg.includes('credit') || msg.includes('quota')) {
      return NextResponse.json({ error: 'Anthropic API usage limit reached. Check your account at console.anthropic.com.' }, { status: 402 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
