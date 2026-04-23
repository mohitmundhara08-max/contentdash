import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      action,
      channelName,
      objective,
      audience,
      keyword,
      duration,
      quickMode,
      apiKey,
      // enrich fields
      postId,
      title,
      hook,
      format,
      pillar,
    } = body

    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: 'No Anthropic API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.' },
        { status: 400 },
      )
    }

    // ─── action: suggest ─────────────────────────────────────────────────────
    if (action === 'suggest') {
      const suggestPrompt = `You are a world-class Instagram content strategist for Indian education and career content.

Channel: ${channelName}
Objective: ${objective}
Audience: ${audience}
Current topic/keyword: ${keyword}

Suggest 6 fresh, high-engagement content topic ideas for this channel.

Return ONLY this JSON (no markdown, no explanation):
{
  "suggestions": [
    {
      "topic": "specific topic or angle",
      "format": "Reel",
      "hook": "opening hook line",
      "reason": "1 sentence why this will perform well",
      "score": 85,
      "pillar": "content pillar name"
    }
  ]
}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1200,
          system: 'You are a world-class social media content strategist. Return ONLY valid JSON with no markdown, no code blocks, no explanation — just raw JSON.',
          messages: [{ role: 'user', content: suggestPrompt }],
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
      }

      const d = await res.json()
      const raw = (d.content?.[0]?.text || '').trim()
      const clean = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim()
      return NextResponse.json(JSON.parse(clean))
    }

    // ─── action: enrich (one post at a time, background queue) ───────────────
    if (action === 'enrich') {
      const enrichPrompt = `You are a world-class Instagram content strategist for Indian education and career content.

Post details:
- Title: ${title}
- Hook: ${hook}
- Format: ${format}
- Pillar: ${pillar}
Channel objective: ${objective}
Audience: ${audience}

Generate rich production content for this single post.

Return ONLY this JSON (no markdown, no explanation):
{
  "content_brief": "2-3 sentence content brief explaining the angle and value",
  "script": "full production-ready script with timing cues for Reel / slide-by-slide for Carousel / chapter timestamps for Long-form",
  "ai_prompt": "detailed Midjourney/DALL-E prompt with style, colors, aspect ratio",
  "cta": "specific call to action",
  "notes": "1 sentence production note"
}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 900,
          system: 'You are a world-class social media content strategist. Return ONLY valid JSON with no markdown, no code blocks, no explanation — just raw JSON.',
          messages: [{ role: 'user', content: enrichPrompt }],
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
      }

      const d = await res.json()
      const raw = (d.content?.[0]?.text || '').trim()
      const clean = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim()

      const enriched = JSON.parse(clean)
      // postId is passed so caller can PATCH the right row
      return NextResponse.json({ postId, ...enriched })
    }

    // ─── action: generate (default) ──────────────────────────────────────────
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + 1)

    const days = Number(duration) || 30
    const postsCount = Math.ceil(days / 7) * 3

    const systemPrompt =
      'You are a world-class social media content strategist specialising in Indian education and career content for Instagram and YouTube. You always return ONLY valid JSON with no markdown, no code blocks, no explanation — just raw JSON.'

    const userPrompt = quickMode
      ? `Generate a quick ${days}-day Instagram content plan.
Channel: ${channelName}
Objective: ${objective}
Audience: ${audience}
Topic: ${keyword}
Posts: ${postsCount} total. Rotate: Reels on Tue, Carousels on Thu, Long-form on Sat. Start: ${startDate.toDateString()}.

Keep outputs short but include realistic metric targets.

Return ONLY this JSON (no markdown):
{
  "posts": [
    {
      "day": 1,
      "week": 1,
      "format": "Reel",
      "pillar": "pillar name",
      "title": "post title",
      "hook": "opening hook line",
      "hashtags": "#tag1 #tag2 #tag3",
      "post_date": "Tue, 22 Apr 2026",
      "reach_target": 5000,
      "saves_target": 200,
      "shares_target": 100,
      "comments_target": 80,
      "plays_target": 8000,
      "priority": 4
    }
  ]
}`
      : `Generate a ${days}-day Instagram content plan. Return ONLY skeleton data — no scripts, no ai_prompts, no content_brief (those will be generated separately).
Channel: ${channelName}
Objective: ${objective}
Target Audience: ${audience}
Keyword/Topic: ${keyword}
Total posts: ${postsCount}
Start date: ${startDate.toDateString()}

Rules:
- 3 posts/week: Reel on Tuesday, Carousel on Thursday, Long-form on Saturday
- 4 meaningful content pillars specific to the topic
- Hook formula: Lead with audience belief → break it → replace with truth
- Hashtags: 5-8 per post, mix niche + broad
- Metric targets: realistic for a growing channel (reach 2k–15k, saves 80–500, shares 40–300)
- Priority 5 = must-post hero content, 4 = high value, 3 = standard

Return ONLY this JSON (no markdown):
{
  "pillars": ["pillar1","pillar2","pillar3","pillar4"],
  "strategy": "2-3 sentence overall content strategy",
  "hook_formula": "the specific hook formula for this audience",
  "posts": [
    {
      "day": 1,
      "week": 1,
      "format": "Reel",
      "pillar": "pillar name",
      "title": "post title",
      "hook": "opening hook line",
      "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
      "cta": "",
      "post_date": "Tue, 22 Apr 2026",
      "reach_target": 5000,
      "saves_target": 200,
      "shares_target": 100,
      "comments_target": 80,
      "plays_target": 8000,
      "priority": 4,
      "notes": ""
    }
  ]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: quickMode ? 'claude-haiku-4-5' : 'claude-opus-4-5',
max_tokens: quickMode ? 6000 : 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = (data.content?.[0]?.text || '').trim()

    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    let plan
try {
  plan = JSON.parse(clean)
} catch {
  return NextResponse.json(
    { error: 'Claude returned malformed JSON — try again or switch to Quick Mode.' },
    { status: 500 },
  )
}
return NextResponse.json(plan)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
