import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { channelName, objective, audience, keyword, duration, quickMode, apiKey } = body

    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      return NextResponse.json({ error: 'No API key provided. Add your Anthropic API key in Settings.' }, { status: 400 })
    }

    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + 1)

    const systemPrompt = quickMode
      ? `You are a social media content strategist. Return ONLY valid JSON — no markdown, no explanation.`
      : `You are a world-class social media content strategist specialising in Indian education and career content. Return ONLY valid JSON — no markdown, no explanation, no code blocks.`

    const postDays = ['Tuesday', 'Thursday', 'Saturday']
    const formats = ['Reel', 'Carousel', 'Long-form']

    const userPrompt = quickMode
      ? `Generate a quick content plan for:
Channel: ${channelName}
Objective: ${objective}
Audience: ${audience}
Keyword/Topic: ${keyword}
Duration: ${duration} days

Return JSON: { "posts": [ { "day": 1, "week": 1, "format": "Reel", "pillar": "string", "title": "string", "hook": "string", "hashtags": "string", "post_date": "string" } ] }
Generate ${Math.ceil(duration / 7) * 3} posts total. Rotate formats: Reel on Tuesdays, Carousel on Thursdays, Long-form on Saturdays. Post dates start from ${startDate.toDateString()}.`
      : `Generate a full ${duration}-day content plan for:
Channel: ${channelName}
Objective: ${objective}
Target Audience: ${audience}
Keyword/Topic: ${keyword}

Rules:
- Post 3 times/week: Tuesdays (Reel), Thursdays (Carousel), Saturdays (Long-form)
- Create ${Math.ceil(duration / 7) * 3} posts total
- Start dates from ${startDate.toDateString()}
- 4 content pillars relevant to ${keyword}
- Each post must drive a specific emotion: curiosity, urgency, trust, or FOMO
- Scripts must be production-ready with timing cues for Reels, slide-by-slide for Carousels, chapter timestamps for Long-form
- AI prompts must be detailed enough for Midjourney/DALL-E with aspect ratio, style, color palette
- Hashtags: 5-8 relevant, mix of niche and broad

Return JSON:
{
  "pillars": ["pillar1", "pillar2", "pillar3", "pillar4"],
  "strategy": "2-3 sentence overall strategy",
  "hook_formula": "the hook formula for this audience",
  "posts": [
    {
      "day": 1,
      "week": 1,
      "format": "Reel",
      "pillar": "pillar name",
      "title": "post title",
      "hook": "opening hook line",
      "content_brief": "2-3 sentence content brief",
      "script": "full production script with cues",
      "ai_prompt": "detailed image/video generation prompt with aspect ratio and style",
      "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
      "cta": "call to action text",
      "post_date": "Day Name, DD Mon YYYY",
      "reach_target": 5000,
      "saves_target": 200,
      "shares_target": 100,
      "comments_target": 80,
      "plays_target": 8000,
      "priority": 4,
      "notes": "brief production note"
    }
  ]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content[0].text.trim()
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const plan = JSON.parse(clean)

    return NextResponse.json(plan)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
