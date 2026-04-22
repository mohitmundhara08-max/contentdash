'use client'
import { useState } from 'react'
import { Channel, Post } from '@/lib/types'

interface Suggestion { topic: string; format: string; hook: string; reason: string; score: number; pillar: string }

interface Props {
  initialKeyword?: string
  channel: Channel
  apiKey:  string
  onClose: () => void
  onDone:  (posts: Post[], meta: Record<string, string>) => void
}

const FORMAT_EMOJI: Record<string, string> = { 'Reel': '🎬', 'Carousel': '🖼️', 'Long-form': '📹' }

export default function GenerateModal({ channel, apiKey, onClose, onDone, initialKeyword }: Props) {
  const [keyword,     setKeyword]     = useState(initialKeyword || '')
  const [objective,   setObjective]   = useState(channel.objective)
  const [audience,    setAudience]    = useState(channel.audience)
  const [duration,    setDuration]    = useState(30)
  const [quickMode,   setQuickMode]   = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [suggesting,  setSuggesting]  = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [progress,    setProgress]    = useState('')
  const [error,       setError]       = useState('')
  const [showSuggest, setShowSuggest] = useState(false)

  const postsCount = Math.ceil(duration / 7) * 3

  async function getSuggestions() {
    if (!apiKey.trim()) return setError('Add your Anthropic API key in ⚙️ Settings first')
    setSuggesting(true); setError(''); setShowSuggest(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.id, niche: channel.niche, objective, audience, apiKey }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuggestions(data.suggestions || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to get suggestions')
    } finally {
      setSuggesting(false)
    }
  }

  function pickSuggestion(s: Suggestion) {
    setKeyword(s.topic)
    setShowSuggest(false)
    setSuggestions([])
  }

  async function generate() {
    if (!apiKey.trim()) return setError('Add your Anthropic API key in ⚙️ Settings first')
    setLoading(true); setError('')

    const steps = [
      'Analysing topic and audience…',
      'Building content pillars…',
      'Writing hooks and scripts…',
      'Generating AI image prompts…',
      `Finalising ${duration}-day calendar…`,
    ]
    let i = 0
    const interval = setInterval(() => setProgress(steps[Math.min(i++, steps.length - 1)]), 2500)

    try {
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: channel.name, objective, audience, keyword: keyword || '', duration, quickMode, apiKey }),
      })
      const genData = await genRes.json()
      if (!genRes.ok || genData.error) throw new Error(genData.error || 'Generation failed')
      if (!genData.posts?.length) throw new Error('No posts returned — please try again')

      const saveRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan:         { channel_id: channel.id, keyword: keyword || channel.niche, duration },
          posts:        genData.posts,
          channelId:    channel.id,
          strategy:     genData.strategy     || '',
          hook_formula: genData.hook_formula || '',
        }),
      })
      const saved = await saveRes.json()
      if (!saveRes.ok || saved.error) throw new Error(saved.error || 'Failed to save — check Supabase')

      onDone(saved.posts, {
        strategy:     genData.strategy     || '',
        hook_formula: genData.hook_formula || '',
        pillars:      (genData.pillars || []).join(', '),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      clearInterval(interval); setLoading(false); setProgress('')
    }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:600 }}>✨ Generate Content Plan</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>
              for <span style={{ color:'var(--accent)' }}>{channel.name}</span>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding:'6px 10px' }}>✕</button>
        </div>

        <div style={{ display:'grid', gap:16 }}>
          {/* Keyword + Suggest */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div className="section-label" style={{ margin:0 }}>Keyword / Topic</div>
              <button onClick={getSuggestions} disabled={suggesting}
                style={{ fontSize:11, padding:'3px 10px', background:'rgba(233,69,96,0.12)', color:'var(--accent)', border:'1px solid rgba(233,69,96,0.3)', borderRadius:20, cursor:'pointer' }}>
                {suggesting ? '⚙️ Finding…' : '✨ Suggest for me'}
              </button>
            </div>
            <input className="input" placeholder="Optional — leave blank to auto-generate based on channel" value={keyword} onChange={e => setKeyword(e.target.value)} />

            {/* Suggestion chips */}
            {showSuggest && (
              <div style={{ marginTop:10, background:'var(--bg-elevated)', borderRadius:10, padding:12, border:'1px solid var(--border)' }}>
                {suggesting ? (
                  <div style={{ textAlign:'center', padding:'12px 0', color:'var(--text-secondary)', fontSize:13 }}>Finding best topics for your channel…</div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:10 }}>Click to use as your topic:</div>
                    <div style={{ display:'grid', gap:8 }}>
                      {suggestions.map((s, i) => (
                        <div key={i} onClick={() => pickSuggestion(s)}
                          style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 12px', background:'var(--bg-card)', borderRadius:8, cursor:'pointer', border:'1px solid var(--border)', transition:'all 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                        >
                          <span style={{ fontSize:16, flexShrink:0 }}>{FORMAT_EMOJI[s.format] || '📋'}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{s.topic}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic', marginBottom:3 }}>"{s.hook}"</div>
                            <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{s.reason}</div>
                          </div>
                          <div style={{ fontSize:11, fontWeight:700, color: s.score >= 8 ? '#34d399' : s.score >= 6 ? '#fbbf24' : 'var(--text-muted)', flexShrink:0 }}>
                            {s.score}/10
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Objective + Audience */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div className="section-label">Channel Objective</div>
              <input className="input" value={objective} onChange={e => setObjective(e.target.value)} />
            </div>
            <div>
              <div className="section-label">Target Audience</div>
              <input className="input" value={audience} onChange={e => setAudience(e.target.value)} />
            </div>
          </div>

          {/* Duration + Mode */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div className="section-label">Duration</div>
              <select className="select" style={{ width:'100%' }} value={duration} onChange={e => setDuration(Number(e.target.value))}>
                <option value={7}>7 days — 3 posts</option>
                <option value={14}>14 days — 6 posts</option>
                <option value={30}>30 days — 12 posts</option>
                <option value={60}>60 days — 24 posts</option>
              </select>
            </div>
            <div>
              <div className="section-label">Mode</div>
              <div style={{ display:'flex', gap:8, marginTop:2 }}>
                {([['Full', false], ['Quick ⚡', true]] as const).map(([label, q]) => (
                  <button key={label} onClick={() => setQuickMode(q)} className="btn-ghost"
                    style={{ flex:1, justifyContent:'center', fontSize:12, ...(quickMode === q ? { background:'rgba(233,69,96,0.15)', borderColor:'var(--accent)', color:'var(--accent)' } : {}) }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'var(--text-secondary)', border:'1px solid var(--border)' }}>
            {quickMode
              ? `⚡ Quick — ${postsCount} posts with hooks + hashtags only (~5s). No scripts or AI prompts.`
              : `📋 Full — ${postsCount} posts with full scripts, AI image prompts, CTAs, metric targets (~20–40s).`}
          </div>

          {/* Error */}
          {error && (
            <div style={{ color:'#f87171', fontSize:12, padding:'10px 12px', background:'rgba(248,113,113,0.1)', borderRadius:8, lineHeight:1.5 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:28, marginBottom:10 }}>⚙️</div>
              <div style={{ color:'var(--text-secondary)', fontSize:13 }}>{progress}</div>
              <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:14 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', animation:`pulse 1.2s ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!loading && (
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={generate}>
                Generate {duration}-Day Plan ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
