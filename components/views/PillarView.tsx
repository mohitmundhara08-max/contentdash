import { Post } from '@/lib/types'

const FORMAT_EMOJI: Record<string, string> = {
  'Reel': '🎬', 'Carousel': '🖼️', 'Long-form': '📹',
}
const PILLAR_COLORS = ['#3b82f6','#10b981','#f59e0b','#e94560']
const FORMAT_COLORS = ['#3b82f6','#10b981','#f59e0b']

export default function PillarView({ posts, pillars }: { posts: Post[]; pillars: string[] }) {
  const total   = posts.length || 1
  const formats = ['Reel', 'Carousel', 'Long-form']

  function avg(arr: Post[], key: keyof Post) {
    if (!arr.length) return 0
    return Math.round(arr.reduce((s, p) => s + (p[key] as number), 0) / arr.length)
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

      {/* Pillar distribution */}
      <div className="card">
        <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Content Pillars</div>
        <div style={{ display:'grid', gap:14 }}>
          {pillars.map((pillar, i) => {
            const count = posts.filter(p => p.pillar === pillar).length
            const p     = Math.round((count / total) * 100)
            return (
              <div key={pillar}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{pillar}</span>
                  <span style={{ fontSize:12, color: PILLAR_COLORS[i % 4], fontWeight:600 }}>{count} posts · {p}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${p}%`, background: PILLAR_COLORS[i % 4] }} />
                </div>
              </div>
            )
          })}
          {pillars.length === 0 && <div style={{ color:'var(--text-muted)', fontSize:13 }}>Generate a plan to see pillars</div>}
        </div>
      </div>

      {/* Format mix */}
      <div className="card">
        <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Format Mix</div>
        <div style={{ display:'grid', gap:14 }}>
          {formats.map((fmt, i) => {
            const count = posts.filter(p => p.format === fmt).length
            const p     = Math.round((count / total) * 100)
            return (
              <div key={fmt}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{FORMAT_EMOJI[fmt]} {fmt}</span>
                  <span style={{ fontSize:12, color: FORMAT_COLORS[i], fontWeight:600 }}>{count} posts · {p}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${p}%`, background: FORMAT_COLORS[i] }} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)', display:'grid', gap:6 }}>
          <div style={{ fontWeight:600, color:'var(--text-secondary)', marginBottom:4 }}>Optimal mix</div>
          {[['Reels','~40%','Reach & discovery'],['Carousels','~40%','Saves & profile visits'],['Long-form','~20%','Authority & watch time']].map(([f,p,r]) => (
            <div key={f} style={{ display:'flex', gap:12 }}>
              <span style={{ minWidth:80 }}>{f}</span>
              <span style={{ minWidth:40, color:'var(--accent)' }}>{p}</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avg targets by pillar */}
      <div className="card">
        <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Avg Targets by Pillar</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr>
              {['Pillar','Reach','Saves','Shares','Comments'].map(h => (
                <th key={h} style={{ padding:'6px 8px', textAlign: h==='Pillar'?'left':'center', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pillars.map((pillar, i) => {
              const pp = posts.filter(p => p.pillar === pillar)
              return (
                <tr key={pillar} style={{ borderTop:'1px solid var(--border)' }}>
                  <td style={{ padding:'8px' }}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: PILLAR_COLORS[i%4]+'22', color: PILLAR_COLORS[i%4], fontWeight:600 }}>{pillar}</span>
                  </td>
                  {(['reach_target','saves_target','shares_target','comments_target'] as const).map(k => (
                    <td key={k} style={{ padding:'8px', textAlign:'center', color:'var(--text-secondary)' }}>{avg(pp,k).toLocaleString()}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Posting cadence */}
      <div className="card">
        <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Posting Cadence</div>
        {[
          ['Tuesday',  'Reel',      '🎬', '#3b82f6', 'Reach & discovery — algorithmic push'],
          ['Thursday', 'Carousel',  '🖼️', '#10b981', 'Saves & profile visits — reference content'],
          ['Saturday', 'Long-form', '📹', '#f59e0b', 'Authority & watch time — deep content'],
        ].map(([day, fmt, emoji, color, role]) => (
          <div key={day} style={{ display:'flex', gap:14, alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:42, height:42, borderRadius:10, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{emoji}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{day} — {fmt}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
