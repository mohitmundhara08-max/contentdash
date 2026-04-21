'use client'
import { useState } from 'react'
import { Channel, Post } from '@/lib/types'

interface Props {
  channel: Channel
  apiKey:  string
  onClose: () => void
  onDone:  (posts: Post[], meta: Record<string, string>) => void
}

export default function GenerateModal({ channel, apiKey, onClose, onDone }: Props) {
  const [keyword,   setKeyword]   = useState('')
  const [objective, setObjective] = useState(channel.objective)
  const [audience,  setAudience]  = useState(channel.audience)
  const [duration,  setDuration]  = useState(30)
  const [quickMode, setQuickMode] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [progress,  setProgress]  = useState('')
  const [error,     setError]     = useState('')

  // Progress steps — uses actual duration value
  function getSteps(dur: number) {
    return [
      'Analysing keyword and audience…',
      'Building content pillars…',
      'Writing hooks and scripts…',
      'Generating AI image prompts…',
      `Finalising ${dur}-day calendar…`,
    ]
  }

  async function generate() {
    if (!keyword.trim()) return setError('Enter a keyword or topic to continue')
    if (!apiKey.trim()) return setError('Add your Anthropic API key in ⚙️ Settings first')
    setLoading(true); setError('')

    const steps = getSteps(duration)
    let i = 0
    const interval = setInterval(() => {
      setProgress(steps[Math.min(i++, steps.length - 1)])
    }, 2500)

    try {
      // Step 1: Generate content with Claude
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: channel.name,
          objective,
          audience,
          keyword,
          duration,      // passes selected duration correctly
          quickMode,
          apiKey,
        }),
      })
      const genData = await genRes.json()
      if (!genRes.ok || genData.error) throw new Error(genData.error || 'Generation failed')
      if (!genData.posts?.length) throw new Error('No posts returned — try again')

      // Step 2: Save to Supabase
      const saveRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: {
            channel_id: channel.id,
            keyword,
            duration,
          },
          posts:        genData.posts,
          channelId:    channel.id,
          strategy:     genData.strategy     || '',
          hook_formula: genData.hook_formula || '',
        }),
      })
      const saved = await saveRes.json()
      if (!saveRes.ok || saved.error) throw new Error(saved.error || 'Failed to save posts')

      onDone(
        saved.posts,
        {
          strategy:     genData.strategy     || '',
          hook_formula: genData.hook_formula || '',
          pillars:      (genData.pillars || []).join(', '),
        }
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      clearInterval(interval)
      setLoading(false)
      setProgress('')
    }
  }

  const postsCount = Math.ceil(duration / 7) * 3

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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
          {/* Keyword */}
          <div>
            <div className="section-label">Keyword / Topic *</div>
            <input
              className="input"
              placeholder="e.g. UGC NET qualifying strategy, AP job search, fitness tips"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>

          {/* Objective */}
          <div>
            <div className="section-label">Channel Objective</div>
            <input className="input" value={objective} onChange={e => setObjective(e.target.value)} />
          </div>

          {/* Audience */}
          <div>
            <div className="section-label">Target Audience</div>
            <input className="input" value={audience} onChange={e => setAudience(e.target.value)} />
          </div>

          {/* Duration + Mode */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div className="section-label">Duration</div>
              <select
                className="select"
                style={{ width:'100%' }}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >
                <option value={7}>7 days (1 week)</option>
                <option value={14}>14 days (2 weeks)</option>
                <option value={30}>30 days (1 month)</option>
                <option value={60}>60 days (2 months)</option>
              </select>
            </div>
            <div>
              <div className="section-label">Mode</div>
              <div style={{ display:'flex', gap:8, marginTop:2 }}>
                {([['Full', false], ['Quick ⚡', true]] as const).map(([label, q]) => (
                  <button
                    key={label}
                    onClick={() => setQuickMode(q)}
                    className="btn-ghost"
                    style={{
                      flex:1, justifyContent:'center', fontSize:12,
                      ...(quickMode === q ? { background:'rgba(233,69,96,0.15)', borderColor:'var(--accent)', color:'var(--accent)' } : {}),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info box — updates live with selected duration */}
          <div style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'var(--text-secondary)', border:'1px solid var(--border)' }}>
            {quickMode
              ? `⚡ Quick — ${postsCount} posts, hooks + hashtags only. Fast generation (~5s).`
              : `📋 Full — ${postsCount} posts with scripts, AI prompts, CTAs, targets (~15–20s).`}
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
