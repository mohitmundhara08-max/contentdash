import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SONNET = 'claude-sonnet-4-6'
const HAIKU  = 'claude-haiku-4-5-20251001'

async function ask(key: string, model: string, prompt: string, tokens: number) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: tokens,
      stream: true,
      system: 'You are a JSON API. Respond with ONLY valid JSON. No markdown. No explanation. No code fences. Start directly with {',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } }
    throw new Error(err?.error?.message || `API error ${res.status}`)
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
        const l = line.trim()
        if (!l.startsWith('data: ')) continue
        const raw = l.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const ev = JSON.parse(raw) as { type?: string; delta?: { type?: string; text?: string } }
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            text += ev.delta.text || ''
          }
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.releaseLock()
  }

  text = text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```\s*$/i,'').trim()
  try { return JSON.parse(text) } catch { /* fall */ }
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e > s) try { return JSON.parse(text.slice(s, e+1)) } catch { /* fall */ }
  throw new Error('Try again — Claude returned invalid format')
}

function buildDates(n: number) {
  const dates: string[] = []
  const d = new Date(); d.setDate(d.getDate() + 1)
  while (dates.length < n) {
    if ([2,4,6].includes(d.getDay()))
      dates.push(d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

async function generate(body: Record<string,unknown>, key: string) {
  const name = body.channelName as string, obj = body.objective as string
  const aud  = body.audience   as string, kw  = (body.keyword as string)||''
  const dur  = Number(body.duration)||30, n   = Math.ceil(dur/7)*3
  const dates = buildDates(n)
  const result = await ask(key, SONNET, `
Create a ${dur}-day Instagram content calendar, ${n} posts.
Channel: ${name} | Goal: ${obj} | Audience: ${aud}
${kw?`Topic: ${kw}`:'Pick the most viral topics for this audience.'}
Format: Reel=Tuesday Carousel=Thursday Long-form=Saturday
Post dates: ${dates.join(' | ')}
Return ONLY JSON starting with {
{
  "pillars":["Discovery","Authority","Community","Conversion"],
  "strategy":"2 sentence strategy",
  "hook_formula":"hook formula for this audience",
  "posts":[{
    "day":1,"week":1,"format":"Reel","pillar":"Discovery",
    "title":"post title","hook":"Hinglish hook",
    "content_brief":"2-3 sentence brief",
    "hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5",
    "cta":"call to action","post_date":"${dates[0]}",
    "reach_target":5000,"saves_target":200,"shares_target":100,
    "comments_target":80,"plays_target":8000,"priority":4,"notes":""
  }]
}`, n*280)
  if (!Array.isArray((result as {posts?:unknown[]}).posts)) throw new Error('No posts — try again')
  return NextResponse.json(result)
}

async function postScript(body: Record<string,string>, key: string) {
  const r = await ask(key, SONNET, `
Write a production-ready script for this post.
Title: ${body.title} | Format: ${body.format} | Hook: ${body.hook}
Brief: ${body.content_brief} | Channel: ${body.channelName} | Audience: ${body.audience}
Reel: 🎬 HOOK / 📢 VOICEOVER / 📋 BODY (3 beats Hinglish) / ✅ CTA
Carousel: 📱 SLIDE 1: / 📱 SLIDE 2: etc (8-10 slides)
Long-form: [00:00] Intro / [02:00] Chapter... with talking points
AI prompt: Midjourney/DALL-E ready with aspect ratio and Indian context.
Return ONLY JSON: {"script":"full script","ai_prompt":"AI generation prompt"}`, 1200)
  return NextResponse.json(r)
}

async function suggest(body: Record<string,string>, key: string) {
  const r = await ask(key, HAIKU, `
Indian Instagram viral content strategist.
Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}
Suggest 8 viral topics. Return ONLY JSON:
{"suggestions":[{"topic":"title","format":"Reel","hook":"Hinglish hook","reason":"why","score":8,"pillar":"name"}]}`, 900)
  return NextResponse.json(r)
}

async function viral(body: Record<string,string>, key: string) {
  const r = await ask(key, SONNET, `
Viral content analyst for Indian Instagram/YouTube.
Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}${body.handle?` | Handle: ${body.handle}`:''}
Top 10 viral patterns right now. Return ONLY JSON:
{"viral_patterns":[{"topic":"str","format":"Reel","trigger":"FOMO","hook":"Hinglish hook","reach_potential":"Viral","platform":"Reels","example_title":"viral title","reason":"why"}],"insight":"key insight"}`, 1800)
  return NextResponse.json(r)
}

async function audit(body: Record<string,string>, key: string) {
  const r = await ask(key, SONNET, `
Instagram growth expert. Channel audit.
Handle: ${body.handle||'not shared'} | Niche: ${body.niche} | Goal: ${body.objective} | Audience: ${body.audience}
Return ONLY JSON:
{"profile_strategy":"str","content_mix":{"reel":40,"carousel":40,"longform":20,"reasoning":"str"},"posting_frequency":"str","whats_working":["s","s","s"],"whats_missing":["s","s","s"],"top_improvements":[{"action":"str","impact":"High","reason":"str"}],"hook_formula":"str","growth_levers":["s","s","s"],"overall_score":7,"summary":"2-3 sentence assessment"}`, 1800)
  return NextResponse.json(r)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string,unknown>
    const key  = (body.apiKey as string)||process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({error:'No API key. Add in ⚙️ Settings or set ANTHROPIC_API_KEY in Vercel env vars.'},{status:400})
    const action = (body.action as string)||'generate'
    const b = body as Record<string,string>
    if (action==='post_script') return postScript(b,key)
    if (action==='suggest')     return suggest(b,key)
    if (action==='viral')       return viral(b,key)
    if (action==='audit')       return audit(b,key)
    return generate(body,key)
  } catch(e:unknown) {
    const m = e instanceof Error?e.message:'Unknown error'
    if (m.includes('529')||m.includes('overloaded')) return NextResponse.json({error:'Claude overloaded. Wait 30s and retry.'},{status:429})
    if (m.includes('401')) return NextResponse.json({error:'Invalid API key. Check in ⚙️ Settings.'},{status:401})
    if (m.includes('credit')||m.includes('quota')) return NextResponse.json({error:'API limit reached. Check console.anthropic.com.'},{status:402})
    return NextResponse.json({error:m},{status:500})
  }
}
