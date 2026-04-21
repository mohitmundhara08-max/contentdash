import { Post } from '@/lib/types'

const FORMAT_STYLE: Record<string, string> = {
  'Reel': 'format-reel', 'Carousel': 'format-carousel', 'Long-form': 'format-longform',
}
const FORMAT_EMOJI: Record<string, string> = {
  'Reel': '🎬', 'Carousel': '🖼️', 'Long-form': '📹',
}

export default function StrategyView({ posts, meta }: { posts: Post[]; meta: Record<string, string> }) {
  const totalReach  = posts.reduce((s, p) => s + p.reach_target, 0)
  const totalSaves  = posts.reduce((s, p) => s + p.saves_target, 0)
  const p5Posts     = posts.filter(p => p.priority === 5)

  const kpis = [
    ['Total posts',   posts.length.toString()],
    ['Posts/week',    '3'],
    ['Monthly reach', `${(totalReach/1000).toFixed(0)}K`],
    ['Monthly saves', `${(totalSaves/1000).toFixed(1)}K`],
    ['Reels',         posts.filter(p=>p.format==='Reel').length.toString()],
    ['Carousels',     posts.filter(p=>p.format==='Carousel').length.toString()],
    ['Long-form',     posts.filter(p=>p.format==='Long-form').length.toString()],
    ['Priority 5',    `${p5Posts.length} posts`],
  ]

  // Group by week
  const byWeek: Record<number, Post[]> = {}
  posts.forEach(p => { if (!byWeek[p.week]) byWeek[p.week] = []; byWeek[p.week].push(p) })

  return (
    <div style={{ display:'grid', gap:20 }}>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {kpis.map(([label, value]) => (
          <div key={label} className="metric-card">
            <div style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Strategy */}
      {meta.strategy && (
        <div className="card">
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>📌 Channel Strategy</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>{meta.strategy}</div>
        </div>
      )}

      {/* Hook formula */}
      {meta.hook_formula && (
        <div className="card">
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>🎯 Hook Formula</div>
          <div style={{ display:'grid', gap:8 }}>
            {[
              ['Belief →', 'Lead with what your audience already believes', '#3b82f6'],
              ['Break it →', 'Show why that belief is costing them time or opportunity', '#e94560'],
              ['Truth →', 'Give them the real answer that makes them follow you', '#10b981'],
            ].map(([step, desc, color]) => (
              <div key={step} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, borderLeft:`3px solid ${color}` }}>
                <span style={{ fontSize:11, fontWeight:700, color, whiteSpace:'nowrap', paddingTop:2, minWidth:70 }}>{step}</span>
                <span style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
          {meta.hook_formula && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(233,69,96,0.08)', border:'1px solid rgba(233,69,96,0.2)', borderRadius:8, fontSize:12, color:'var(--text-secondary)', fontStyle:'italic' }}>
              "{meta.hook_formula}"
            </div>
          )}
        </div>
      )}

      {/* Week breakdown */}
      <div className="card">
        <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>📋 Weekly Breakdown</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
          {Object.entries(byWeek).map(([week, wPosts]) => (
            <div key={week} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Week {week}</div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:10 }}>{wPosts.length} posts</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {wPosts.slice(0,4).map(p => (
                  <span key={p.id} className={`badge ${FORMAT_STYLE[p.format]}`} style={{ fontSize:9 }}>
                    {FORMAT_EMOJI[p.format]} {p.format}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority 5 posts */}
      {p5Posts.length > 0 && (
        <div className="card">
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>🔥 High Priority Posts (P5)</div>
          <div style={{ display:'grid', gap:8 }}>
            {p5Posts.slice(0, 6).map(post => (
              <div key={post.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:'rgba(233,69,96,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
                  D{post.day}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{post.post_date} · {post.format}</div>
                </div>
                <span className={`badge ${FORMAT_STYLE[post.format]}`} style={{ fontSize:10, flexShrink:0 }}>{FORMAT_EMOJI[post.format]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
          <div style={{ fontSize:14 }}>Generate a content plan to see strategy breakdown</div>
        </div>
      )}
    </div>
  )
}
