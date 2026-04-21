'use client'
import { useState } from 'react'
import { Post } from '@/lib/types'
import PostCard from '@/components/ui/PostCard'

const FORMAT_STYLE: Record<string, string> = {
  'Reel': 'format-reel', 'Carousel': 'format-carousel', 'Long-form': 'format-longform',
}
const FORMAT_EMOJI: Record<string, string> = {
  'Reel': '🎬', 'Carousel': '🖼️', 'Long-form': '📹',
}
const PILLAR_STYLE = ['pillar-0','pillar-1','pillar-2','pillar-3']

export default function CalendarView({ posts, pillars }: { posts: Post[]; pillars: string[] }) {
  const [selected, setSelected] = useState<Post | null>(null)
  const [filter,   setFilter]   = useState('All')

  const filtered = filter === 'All' ? posts : posts.filter(p => p.format === filter)
  const weeks: Record<number, Post[]> = {}
  filtered.forEach(p => { if (!weeks[p.week]) weeks[p.week] = []; weeks[p.week].push(p) })
  const weekThemes = ['Reality reset', 'Deep dive', 'Strategy & tactics', 'Convert & win']

  function pctColor(p: number | null) {
    if (p === null) return 'var(--text-muted)'
    if (p >= 90) return '#34d399'
    if (p >= 60) return '#fbbf24'
    return '#f87171'
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:20, alignItems:'start' }}>
      {/* Left — calendar */}
      <div>
        {/* Filters */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          {['All','Reel','Carousel','Long-form'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn-ghost"
              style={{ fontSize:12, ...(filter===f ? { background:'rgba(233,69,96,0.15)', borderColor:'var(--accent)', color:'var(--accent)' } : {}) }}>
              {f === 'All' ? 'All formats' : `${FORMAT_EMOJI[f]} ${f}`}
            </button>
          ))}
          <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)' }}>
            {filtered.length} posts
          </div>
        </div>

        {/* Weeks */}
        {Object.entries(weeks).map(([week, wPosts]) => (
          <div key={week} style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:12 }}>
              Week {week} — {weekThemes[+week-1] || `Phase ${week}`}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:10 }}>
              {wPosts.map(post => (
                <PostCard key={post.id} post={post} pillars={pillars} selected={selected?.id === post.id} onClick={() => setSelected(selected?.id === post.id ? null : post)} />
              ))}
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
            <div style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:6 }}>No content generated yet</div>
            <div style={{ fontSize:13 }}>Click ✨ Generate to create your first plan</div>
          </div>
        )}
      </div>

      {/* Right — post detail */}
      {selected && (
        <div style={{ position:'sticky', top:80 }}>
          <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-hover)', borderRadius:16, padding:24 }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ flex:1, marginRight:12 }}>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                  <span className={`badge ${FORMAT_STYLE[selected.format]}`}>{FORMAT_EMOJI[selected.format]} {selected.format}</span>
                  <span className={`badge ${PILLAR_STYLE[pillars.indexOf(selected.pillar) % 4]}`}>{selected.pillar}</span>
                  <span className="badge" style={{ background:'var(--bg-elevated)', color:'var(--text-secondary)' }}>Day {selected.day}</span>
                </div>
                <div style={{ fontSize:15, fontWeight:600, lineHeight:1.4 }}>{selected.title}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{selected.post_date}</div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost" style={{ padding:'5px 10px', fontSize:12, flexShrink:0 }}>✕</button>
            </div>

            {/* Fields */}
            {[
              ['Hook', selected.hook],
              ['Content Brief', selected.content_brief],
              ['CTA', selected.cta],
              ['Hashtags', selected.hashtags],
            ].filter(([,v]) => v).map(([label, value]) => (
              <div key={label as string} style={{ marginBottom:14 }}>
                <div className="section-label">{label as string}</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{value as string}</div>
              </div>
            ))}

            {selected.script && (
              <div style={{ marginBottom:14 }}>
                <div className="section-label">Script</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.7, background:'var(--bg-elevated)', borderRadius:8, padding:'10px 12px', whiteSpace:'pre-wrap', maxHeight:220, overflowY:'auto' }}>
                  {selected.script}
                </div>
              </div>
            )}

            {selected.ai_prompt && (
              <div style={{ marginBottom:14 }}>
                <div className="section-label">AI Image / Video Prompt</div>
                <div style={{ fontSize:12, color:'#fbbf24', lineHeight:1.6, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'10px 12px' }}>
                  {selected.ai_prompt}
                </div>
                <button className="btn-ghost" style={{ marginTop:8, fontSize:11 }} onClick={() => navigator.clipboard.writeText(selected.ai_prompt)}>
                  Copy prompt
                </button>
              </div>
            )}

            {/* Targets */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
              {[['Reach',selected.reach_target],['Saves',selected.saves_target],['Shares',selected.shares_target],['Comments',selected.comments_target],['Plays',selected.plays_target]].map(([label,val]) => (
                <div key={label as string} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'8px', textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{(val as number)?.toLocaleString() || '—'}</div>
                  <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2 }}>{label as string}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
