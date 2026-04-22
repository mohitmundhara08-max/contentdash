'use client'
import { useState } from 'react'
import { Channel } from '@/lib/types'

interface ViralPattern {
  topic: string; format: string; trigger: string; hook: string;
  reach_potential: string; platform: string; example_title: string; reason: string
}

const TRIGGER_COLOR: Record<string, string> = {
  FOMO: '#e94560', Aspiration: '#3b82f6', 'Pain point': '#f59e0b',
  Curiosity: '#8b5cf6', Exclusivity: '#10b981',
}
const REACH_COLOR: Record<string, string> = {
  Viral: '#e94560', High: '#f59e0b', Medium: '#3b82f6', Low: 'var(--text-muted)'
}
const FORMAT_EMOJI: Record<string, string> = { Reel: '🎬', Carousel: '🖼️', 'Long-form': '📹' }

interface Props {
  channel: Channel
  apiKey: string
  onUseTopic: (topic: string) => void
}

export default function ViralView({ channel, apiKey, onUseTopic }: Props) {
  const [patterns, setPatterns] = useState<ViralPattern[]>([])
  const [insight,  setInsight]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [searched, setSearched] = useState(false)

  async function findViral() {
    if (!apiKey.trim()) return setError('Add your Anthropic API key in ⚙️ Settings first')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/viral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: channel.niche, handle: channel.handle, objective: channel.objective, audience: channel.audience, apiKey }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPatterns(data.viral_patterns || [])
      setInsight(data.insight || '')
      setSearched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>🔥 Viral Content Finder</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
            Discover what's working right now in your niche — then use it as your next post.
          </div>
        </div>
        <button className="btn-primary" onClick={findViral} disabled={loading} style={{ whiteSpace:'nowrap' }}>
          {loading ? '⚙️ Analysing…' : searched ? '🔄 Refresh' : '🔍 Find Viral Content'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color:'#f87171', padding:'10px 14px', background:'rgba(248,113,113,0.1)', borderRadius:8, marginBottom:16, fontSize:13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔥</div>
          <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:8 }}>Analysing viral patterns in your niche…</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>This takes ~10 seconds</div>
        </div>
      )}

      {/* Insight banner */}
      {insight && !loading && (
        <div style={{ background:'rgba(233,69,96,0.08)', border:'1px solid rgba(233,69,96,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
          <span style={{ color:'var(--accent)', fontWeight:600 }}>Key insight: </span>{insight}
        </div>
      )}

      {/* Viral patterns grid */}
      {!loading && patterns.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {patterns.map((p, i) => (
            <div key={i} className="card" style={{ position:'relative' }}>
              {/* Reach badge */}
              <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, background:`${REACH_COLOR[p.reach_potential] || 'var(--text-muted)'}22`, color: REACH_COLOR[p.reach_potential] || 'var(--text-muted)', border:`1px solid ${REACH_COLOR[p.reach_potential] || 'var(--text-muted)'}44` }}>
                {p.reach_potential}
              </div>

              {/* Format + trigger */}
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--bg-elevated)', color:'var(--text-secondary)' }}>
                  {FORMAT_EMOJI[p.format]} {p.format}
                </span>
                <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${TRIGGER_COLOR[p.trigger] || '#888'}22`, color: TRIGGER_COLOR[p.trigger] || 'var(--text-muted)' }}>
                  {p.trigger}
                </span>
              </div>

              {/* Title */}
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6, lineHeight:1.4, paddingRight:60 }}>{p.example_title}</div>

              {/* Hook */}
              <div style={{ fontSize:12, color:'var(--accent)', fontStyle:'italic', marginBottom:8, lineHeight:1.5 }}>"{p.hook}"</div>

              {/* Reason */}
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14, lineHeight:1.5 }}>{p.reason}</div>

              {/* Use it button */}
              <button onClick={() => onUseTopic(p.example_title)}
                style={{ width:'100%', padding:'8px', background:'rgba(233,69,96,0.1)', border:'1px solid rgba(233,69,96,0.3)', borderRadius:8, color:'var(--accent)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233,69,96,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(233,69,96,0.1)')}
              >
                ✨ Generate content for this topic
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !searched && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🔥</div>
          <div style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:8 }}>No analysis yet</div>
          <div style={{ fontSize:13, marginBottom:24 }}>
            Click "Find Viral Content" to discover what's working in <strong style={{ color:'var(--text-primary)' }}>{channel.niche || 'your niche'}</strong> right now.
          </div>
          <button className="btn-primary" onClick={findViral} style={{ padding:'10px 24px' }}>
            🔍 Find Viral Content
          </button>
        </div>
      )}
    </div>
  )
}
