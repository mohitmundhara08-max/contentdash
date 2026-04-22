import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function callClaude(key: string, model: string, prompt: string, maxTokens = 6000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = data.content?.[0]?.text?.trim() || ''
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(clean) } catch { throw new Error('AI returned invalid JSON — please try again') }
}

async function handleSuggest(body: Record<string, string>, key: string) {
  let pastPosts: string[] = []
  if (body.channelId) {
    const { data } = await supabase.from('ig_posts').select('title, format').eq('channel_id', body.channelId).order('created_at', { ascending: false }).limit(20)
    if (data?.length) pastPosts = data.map((p: Record<string, string>) => `[${p.format}] ${p.title}`)
  }
  const result = await callClaude(key, 'claude-haiku-4-5-20251001',
    `Viral content strategist for Indian Instagram/YouTube.
Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}
${pastPosts.length ? `Past posts (avoid repeating):\n${pastPosts.join('\n')}` : ''}
Give 8 high-potential topic suggestions. Return ONLY JSON:
{ "suggestions": [{ "topic":"string","format":"Reel","hook":"Hinglish hook","reason":"why it works","score":8,"pillar":"pillar" }] }`, 2000)
  return NextResponse.json(result)
}

async function handleViral(body: Record<string, string>, key: string) {
  const result = await callClaude(key, 'claude-sonnet-4-6',
    `Viral content analyst for Indian Instagram/YouTube.
Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}${body.handle ? ` | Handle: ${body.handle}` : ''}
Identify top 10 viral content patterns for this exact niche/audience right now.
Return ONLY JSON:
{ "viral_patterns": [{ "topic":"string","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"exact viral title","reason":"why it works" }], "insight":"one key niche insight" }`, 3000)
  return NextResponse.json(result)
}

async function handleAudit(body: Record<string, string>, key: string) {
  const result = await callClaude(key, 'claude-sonnet-4-6',
    `Expert Instagram growth strategist. Do a channel audit.
Handle: ${body.handle || 'not provided'} | Niche: ${body.niche} | Objective: ${body.objective} | Audience: ${body.audience}
Return ONLY JSON:
{ "profile_strategy":"string","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"string"},"posting_frequency":"string","whats_working":["string"],"whats_missing":["string"],"top_improvements":[{"action":"string","impact":"High","reason":"string"}],"hook_formula":"string","growth_levers":["string"],"overall_score":7,"summary":"string" }`, 3000)
  return NextResponse.json(result)
}

async function handleGenerate(body: Record<string, unknown>, key: string) {
  const { channelName, objective, audience, keyword, duration, quickMode } = body as Record<string, string>
  const dur = Number(duration) || 30
  const postsCount = Math.ceil(dur / 7) * 3

  const today = new Date(); today.setDate(today.getDate() + 1)
  const postDates: string[] = []
  const d = new Date(today)
  while (postDates.length < postsCount) {
    if ([2,4,6].includes(d.getDay())) postDates.push(d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' }))
    d.setDate(d.getDate() + 1)
  }

  const prompt = quickMode
    ? `${dur}-day Instagram plan, ${postsCount} posts. Channel: ${channelName}. Objective: ${objective}. Audience: ${audience}. Topic: ${keyword || 'derive from channel objective'}.
Return ONLY JSON: { "pillars":["p1","p2","p3","p4"],"strategy":"string","hook_formula":"string","posts":[{ "day":1,"week":1,"format":"Reel","pillar":"string","title":"string","hook":"Hinglish hook","hashtags":"#tag1 #tag2","cta":"string","post_date":"${postDates[0]}","reach_target":5000,"saves_target":150,"shares_target":80,"comments_target":60,"plays_target":8000,"priority":4,"notes":"" }] }`
    : `Full ${dur}-day Instagram content plan, ${postsCount} posts.
Channel: ${channelName} | Objective: ${objective} | Audience: ${audience}
${keyword ? `Topic: ${keyword}` : 'Derive best topics from channel objective and audience.'}
Rules: Reel=Tuesday, Carousel=Thursday, Long-form=Saturday. Hooks in Hinglish where appropriate.
Scripts: 🎬 HOOK / 📢 VOICEOVER / 📋 BODY (3 points) / ✅ CTA for Reels. Slide-by-slide for Carousels. Chapter timestamps for Long-form.
AI prompts: Midjourney/DALL-E ready with style, aspect ratio (9:16 Reels, 4:5 Carousels, 16:9 Long-form), Indian context.
Post dates in order: ${postDates.join(', ')}
Return ONLY JSON: { "pillars":["p1","p2","p3","p4"],"strategy":"string","hook_formula":"string","posts":[{ "day":1,"week":1,"format":"Reel","pillar":"string","title":"string","hook":"hook","content_brief":"brief","script":"FULL script with 🎬/📢/📋/✅ cues","ai_prompt":"detailed AI generation prompt","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5","cta":"cta","post_date":"${postDates[0]}","reach_target":5000,"saves_target":200,"shares_target":100,"comments_target":80,"plays_target":8000,"priority":4,"notes":"note" }] }`

  const plan = await callClaude(key, 'claude-opus-4-6', prompt, 8000)
  if (!plan.posts?.length) throw new Error('No posts returned — try again')
  return NextResponse.json(plan)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const key = body.apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'No API key. Add it in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.' }, { status: 400 })
    const action = body.action || 'generate'
    if (action === 'suggest') return handleSuggest(body, key)
    if (action === 'viral')   return handleViral(body, key)
    if (action === 'audit')   return handleAudit(body, key)
    return handleGenerate(body, key)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('generate route error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
