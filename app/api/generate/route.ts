import { NextRequest, NextResponse } from 'next/server'

// CRITICAL: Vercel default is 10s — Claude generation needs 20-40s
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { channelName, objective, audience, keyword, duration, quickMode, apiKey } = body

    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: 'No Anthropic API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.' },
        { status: 400 }
      )
    }

    const today     = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + 1)
    const postsCount = Math.ceil(duration / 7) * 3

    // Build post dates (Tue/Thu/Sat pattern)
    const postDates: string[] = []
    const d = new Date(startDate)
    const targets = [2, 4, 6] // Tue=2, Thu=4, Sat=6
    while (postDates.length < postsCount) {
      if (targets.includes(d.getDay())) {
        postDates.push(d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' }))
      }
      d.setDate(d.getDate() + 1)
    }

    const systemPrompt = `You are a world-class social media content strategist for Indian education and career content. Return ONLY valid JSON — no markdown, no code fences, no explanation. All text content can be in Hinglish (Hindi+English mix) where appropriate for the audience.`

    const userPrompt = quickMode
      ? `Generate a ${duration}-day Instagram content plan with ${postsCount} posts.
Channel: ${channelName}
Objective: ${objective}
Audience: ${audience}
Topic: ${keyword || 'Based on the channel objective and audience'}

Return ONLY this JSON:
{
  "pillars": ["pillar1","pillar2","pillar3","pillar4"],
  "strategy": "2-sentence strategy",
  "hook_formula": "hook formula for this audience",
  "posts": [
    {
      "day": 1, "week": 1,
      "format": "Reel",
      "pillar": "pillar name",
      "title": "post title",
      "hook": "opening hook line in Hinglish",
      "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
      "cta": "call to action",
      "post_date": "${postDates[0]}",
      "reach_target": 5000, "saves_target": 150, "shares_target": 80, "comments_target": 60, "plays_target": 8000,
      "priority": 4, "notes": ""
    }
  ]
}`
      : `Generate a full ${duration}-day Instagram content plan with ${postsCount} posts.
Channel: ${channelName}
Objective: ${objective}
Target Audience: ${audience}
${keyword ? `Topic/Keyword: ${keyword}` : `Derive the best topics from the channel objective and audience.`}

Rules:
- Reel on Tuesday, Carousel on Thursday, Long-form on Saturday
- 4 content pillars specific to this audience
- All hooks and scripts can be Hinglish where it suits the audience
- Scripts: full production-ready (🎬 HOOK, 📢 VOICEOVER, 📋 BODY, ✅ CTA format for Reels; slide-by-slide for Carousels; chapter timestamps for Long-form)
- AI prompts: detailed for Midjourney/DALL-E — include style, colors, aspect ratio (9:16 Reels, 4:5 Carousels, 16:9 Long-form), Indian context
- Hook formula: belief → break it → replace with truth
- Use these exact post dates in order: ${postDates.join(', ')}

Return ONLY this JSON:
{
  "pillars": ["pillar1","pillar2","pillar3","pillar4"],
  "strategy": "2-3 sentence content strategy",
  "hook_formula": "the specific hook formula for this audience",
  "posts": [
    {
      "day": 1, "week": 1,
      "format": "Reel",
      "pillar": "pillar name",
      "title": "post title",
      "hook": "hook line in Hinglish if appropriate",
      "content_brief": "2-3 sentence brief",
      "script": "full production script — for Reels use 🎬 HOOK / 📢 VOICEOVER / 📋 BODY / ✅ CTA format with timing cues. For Carousels use 📱 SLIDE 1 — COVER: / 📱 SLIDE 2: etc. For Long-form use chapter timestamps.",
      "ai_prompt": "detailed AI image/video generation prompt with style, aspect ratio, Indian context",
      "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6",
      "cta": "call to action text",
      "post_date": "${postDates[0]}",
      "reach_target": 5000,
      "saves_target": 200,
      "shares_target": 100,
      "comments_target": 80,
      "plays_target": 8000,
      "priority": 4,
      "notes": "production note"
    }
  ]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 8000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', response.status, errText)
      return NextResponse.json({ error: `Claude API error (${response.status}): ${errText.slice(0, 200)}` }, { status: 500 })
    }

    const data  = await response.json()
    const text  = data.content?.[0]?.text?.trim() || ''
    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    let plan
    try {
      plan = JSON.parse(clean)
    } catch {
      console.error('JSON parse failed. Raw:', clean.slice(0, 500))
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 })
    }

    if (!plan.posts?.length) {
      return NextResponse.json({ error: 'No posts returned. Try again.' }, { status: 500 })
    }

    return NextResponse.json(plan)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Generate route error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
