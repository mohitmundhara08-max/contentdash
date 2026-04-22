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
  const [selected,   setSelected]   = useState<Post | null>(null)
  const [filter,     setFilter]     = useState('All')
  const [copied,     setCopied]     = useState('')
  const [activeTab,  setActiveTab]  = useState<'brief'|'script'|'prompt'>('brief')

  const filtered = filter === 'All' ? posts : posts.filter(p => p.format === filter)
  const weeks: Record<number, Post[]> = {}
  filtered.forEach(p => { if (!weeks[p.week]) weeks[p.week] = []; weeks[p.week].push(p) })
  const weekThemes = ['Reality reset', 'Deep dive', 'Strategy & tactics', 'Convert & win']

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  function selectPost(post: Post) {
    setSelected(selected?.id === post.id ? null : post)
    setActiveTab('brief')
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap:20, alignItems:'start' }}>
      {/* Left — calendar */}
      <div>
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          {['All','Reel','Carousel','Long-form'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn-ghost"
              style={{ fontSize:12, ...(filter===f ? { background:'rgba(233,69,96,0.15)', borderColor:'var(--accent)', color:'var(--accent)' } : {}) }}>
              {f === 'All' ? 'All formats' : `${FORMAT_EMOJI[f]} ${f}`}
            </button>
          ))}
          <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)' }}>{filtered.length} posts</div>
        </div>

        {Object.entries(weeks).map(([week, wPosts]) => (
          <div key={week} style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:12 }}>
              Week {week} — {weekThemes[+week-1] || `Phase ${week}`}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:10 }}>
              {wPosts.map(post => (
                <PostCard key={post.id} post={post} pillars={pillars} selected={selected?.id === post.id} onClick={() => selectPost(post)} />
              ))}
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
            <div style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:6 }}>No content yet</div>
            <div style={{ fontSize:13 }}>Click ✨ Generate — or pick a topic from 🔥 Viral Finder</div>
          </div>
        )}
      </div>

      {/* Right — detail panel */}
      {selected && (
        <div style={{ position:'sticky', top:80 }}>
          <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-hover)', borderRadius:16, overflow:'hidden' }}>
            {/* Panel header */}
            <div style={{ padding:'18px 20px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span className={`badge ${FORMAT_STYLE[selected.format]}`}>{FORMAT_EMOJI[selected.format]} {selected.format}</span>
                  <span className={`badge ${PILLAR_STYLE[pillars.indexOf(selected.pillar) % 4]}`}>{selected.pillar}</span>
                  <span className="badge" style={{ background:'var(--bg-elevated)', color:'var(--text-secondary)' }}>Day {selected.day}</span>
                  {selected.priority >= 5 && <span className="badge" style={{ background:'rgba(245,158,11,0.15)', color:'#fbbf24' }}>★ Priority</span>}
                </div>
                <button onClick={() => setSelected(null)} className="btn-ghost" style={{ padding:'4px 9px', fontSize:12 }}>✕</button>
              </div>
              <div style={{ fontSize:15, fontWeight:600, lineHeight:1.4, marginBottom:4 }}>{selected.title}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{selected.post_date}</div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)' }}>
              {(['brief','script','prompt'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ flex:1, padding:'10px', fontSize:12, fontWeight:500, border:'none', cursor:'pointer', transition:'all 0.15s',
                    background: activeTab===t ? 'var(--bg-elevated)' : 'transparent',
                    color: activeTab===t ? 'var(--text-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab===t ? '2px solid var(--accent)' : '2px solid transparent',
                  }}>
                  {t === 'brief' ? '📋 Brief' : t === 'script' ? '🎬 Script' : '🤖 AI Prompt'}
                </button>
              ))}
            </div>

            {/* Panel body */}
            <div style={{ padding:'16px 20px', maxHeight:520, overflowY:'auto' }}>
              {activeTab === 'brief' && (
                <div style={{ display:'grid', gap:14 }}>
                  {selected.hook && (
                    <div>
                      <div className="section-label">Hook</div>
                      <div style={{ fontSize:13, color:'var(--accent)', fontStyle:'italic', lineHeight:1.6 }}>"{selected.hook}"</div>
                    </div>
                  )}
                  {selected.content_brief && (
                    <div>
                      <div className="section-label">Content Brief</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{selected.content_brief}</div>
                    </div>
                  )}
                  {selected.cta && (
                    <div>
                      <div className="section-label">CTA</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{selected.cta}</div>
                    </div>
                  )}
                  {selected.hashtags && (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div className="section-label" style={{ margin:0 }}>Hashtags</div>
                        <button onClick={() => copy(selected.hashtags, 'hashtags')} style={{ fontSize:10, color: copied==='hashtags' ? '#34d399' : 'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                          {copied==='hashtags' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <div style={{ fontSize:12, color:'#3b82f6', lineHeight:1.8 }}>{selected.hashtags}</div>
                    </div>
                  )}
                  {/* Targets */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
                    {[['Reach',selected.reach_target],['Saves',selected.saves_target],['Shares',selected.shares_target],['Comments',selected.comments_target],['Plays',selected.plays_target]].map(([label,val]) => (
                      <div key={label as string} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'8px 4px', textAlign:'center' }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{((val as number)||0).toLocaleString()}</div>
                        <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2 }}>{label as string}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'script' && (
                <div>
                  {selected.script ? (
                    <>
                      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
                        <button onClick={() => copy(selected.script, 'script')} className="btn-ghost" style={{ fontSize:11, padding:'5px 12px' }}>
                          {copied==='script' ? '✓ Copied' : 'Copy script'}
                        </button>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.8, background:'var(--bg-elevated)', borderRadius:10, padding:'14px', whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
                        {selected.script}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>📝</div>
                      <div style={{ fontSize:13 }}>No script — use Full mode when generating to include scripts</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'prompt' && (
                <div>
                  {selected.ai_prompt ? (
                    <>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>Paste into Midjourney, DALL-E, or Firefly</div>
                        <button onClick={() => copy(selected.ai_prompt, 'prompt')} className="btn-ghost" style={{ fontSize:11, padding:'5px 12px' }}>
                          {copied==='prompt' ? '✓ Copied' : 'Copy prompt'}
                        </button>
                      </div>
                      <div style={{ fontSize:12, color:'#fbbf24', lineHeight:1.7, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'14px' }}>
                        {selected.ai_prompt}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
                      <div style={{ fontSize:13 }}>No AI prompt — use Full mode when generating to include image prompts</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
