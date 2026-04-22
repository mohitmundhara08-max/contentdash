'use client'
import { useState } from 'react'
import { Channel } from '@/lib/types'

interface AuditResult {
  profile_strategy: string
  content_mix: { reel: number; carousel: number; longform: number; reasoning: string }
  posting_frequency: string
  whats_working: string[]
  whats_missing: string[]
  top_improvements: { action: string; impact: string; reason: string }[]
  hook_formula: string
  growth_levers: string[]
  overall_score: number
  summary: string
}

const IMPACT_COLOR: Record<string, string> = { High: '#e94560', Medium: '#f59e0b', Low: '#3b82f6' }

interface Props { channel: Channel; apiKey: string }

export default function AuditView({ channel, apiKey }: Props) {
  const [audit,   setAudit]   = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function runAudit() {
    if (!apiKey.trim()) return setError('Add your Anthropic API key in ⚙️ Settings first')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: channel.handle, niche: channel.niche, objective: channel.objective, audience: channel.audience, apiKey }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAudit(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Audit failed')
    } finally { setLoading(false) }
  }

  function ScoreCircle({ score }: { score: number }) {
    const color = score >= 8 ? '#34d399' : score >= 6 ? '#fbbf24' : '#f87171'
    return (
      <div style={{ width:72, height:72, borderRadius:'50%', border:`4px solid ${color}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <div style={{ fontSize:22, fontWeight:700, color }}>{score}</div>
        <div style={{ fontSize:9, color:'var(--text-muted)' }}>/ 10</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>📋 Channel Audit</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
            AI-powered deep dive into your channel strategy, gaps, and growth opportunities.
          </div>
          {!channel.ig_account && (
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, padding:'6px 10px', background:'var(--bg-elevated)', borderRadius:8, display:'inline-block' }}>
              💡 Manual channel — audit based on your niche, objective and audience inputs
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={runAudit} disabled={loading}>
          {loading ? '⚙️ Auditing…' : audit ? '🔄 Re-audit' : '📋 Run Audit'}
        </button>
      </div>

      {error && <div style={{ color:'#f87171', padding:'10px 14px', background:'rgba(248,113,113,0.1)', borderRadius:8, marginBottom:16, fontSize:13 }}>⚠️ {error}</div>}

      {loading && (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📋</div>
          <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:8 }}>Running channel audit…</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Analysing strategy, gaps, and growth levers</div>
        </div>
      )}

      {!loading && audit && (
        <div style={{ display:'grid', gap:16 }}>
          {/* Summary + score */}
          <div className="card" style={{ display:'flex', gap:20, alignItems:'center' }}>
            <ScoreCircle score={audit.overall_score} />
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Overall Assessment</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{audit.summary}</div>
            </div>
          </div>

          {/* Content mix */}
          <div className="card">
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Recommended Content Mix</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
              {[['🎬 Reels', audit.content_mix.reel], ['🖼️ Carousels', audit.content_mix.carousel], ['📹 Long-form', audit.content_mix.longform]].map(([label, val]) => (
                <div key={label as string} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--accent)' }}>{val}%</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{label as string}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>{audit.content_mix.reasoning}</div>
          </div>

          {/* What's working vs missing */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="card">
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:'#34d399' }}>✅ What's Working</div>
              {audit.whats_working.map((item, i) => (
                <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--text-secondary)' }}>
                  <span style={{ color:'#34d399', flexShrink:0 }}>→</span>{item}
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:'#f87171' }}>❌ What's Missing</div>
              {audit.whats_missing.map((item, i) => (
                <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--text-secondary)' }}>
                  <span style={{ color:'#f87171', flexShrink:0 }}>→</span>{item}
                </div>
              ))}
            </div>
          </div>

          {/* Top improvements */}
          <div className="card">
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>🚀 Top Improvements (Priority Order)</div>
            {audit.top_improvements.map((item, i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(233,69,96,0.15)', color:'var(--accent)', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{item.action}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{item.reason}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${IMPACT_COLOR[item.impact] || 'var(--text-muted)'}22`, color: IMPACT_COLOR[item.impact] || 'var(--text-muted)', flexShrink:0 }}>{item.impact}</span>
              </div>
            ))}
          </div>

          {/* Hook formula + posting + growth levers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="card">
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🎯 Hook Formula</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.7, background:'rgba(233,69,96,0.06)', padding:'10px 12px', borderRadius:8, borderLeft:'3px solid var(--accent)', fontStyle:'italic' }}>
                "{audit.hook_formula}"
              </div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10, marginTop:14 }}>📅 Posting Frequency</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{audit.posting_frequency}</div>
            </div>
            <div className="card">
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>📈 Growth Levers</div>
              {audit.growth_levers.map((lever, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom: i < audit.growth_levers.length-1 ? '1px solid var(--border)' : 'none', fontSize:12, color:'var(--text-secondary)', alignItems:'flex-start' }}>
                  <span style={{ color:'var(--accent)', fontWeight:700, flexShrink:0 }}>{i+1}.</span>{lever}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !audit && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>📋</div>
          <div style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:8 }}>No audit yet</div>
          <div style={{ fontSize:13, marginBottom:24 }}>Get a full AI-powered strategy audit for <strong style={{ color:'var(--text-primary)' }}>{channel.name}</strong></div>
          <button className="btn-primary" onClick={runAudit} style={{ padding:'10px 24px' }}>📋 Run Channel Audit</button>
        </div>
      )}
    </div>
  )
}
