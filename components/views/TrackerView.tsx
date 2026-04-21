'use client'
import { useState } from 'react'
import { Post } from '@/lib/types'

const FORMAT_STYLE: Record<string, string> = {
  'Reel': 'format-reel', 'Carousel': 'format-carousel', 'Long-form': 'format-longform',
}

function pct(actual: number, target: number) {
  if (!target || !actual) return null
  return Math.round((actual / target) * 100)
}
function pctColor(p: number | null) {
  if (p === null) return 'var(--text-muted)'
  if (p >= 90) return '#34d399'
  if (p >= 60) return '#fbbf24'
  return '#f87171'
}

export default function TrackerView({ posts }: { posts: Post[] }) {
  const [actuals, setActuals] = useState<Record<string, Record<string, number>>>({})

  function update(postId: string, field: string, value: string) {
    setActuals(prev => ({ ...prev, [postId]: { ...(prev[postId] || {}), [field]: +value } }))
  }

  const metrics = ['reach', 'saves', 'shares', 'comments', 'plays']

  const totalReach    = posts.reduce((s, p) => s + p.reach_target, 0)
  const totalSaves    = posts.reduce((s, p) => s + p.saves_target, 0)
  const topFormat     = ['Reel','Carousel','Long-form'].sort((a,b) => posts.filter(p=>p.format===b).length - posts.filter(p=>p.format===a).length)[0] || '—'
  const filledPosts   = Object.keys(actuals).length

  return (
    <div>
      {/* Summary KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          ['Total posts',       posts.length.toString()],
          ['Reach target/mo',   (totalReach/1000).toFixed(0)+'K'],
          ['Saves target/mo',   (totalSaves/1000).toFixed(1)+'K'],
          ['Actuals filled',    `${filledPosts} / ${posts.length}`],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['Day','Format','Title',
                'T:Reach','A:Reach','%',
                'T:Saves','A:Saves','%',
                'T:Shares','A:Shares','%',
                'T:Comments','A:Comments','%',
                'Score'
              ].map(h => (
                <th key={h} style={{ padding:'10px 8px', textAlign: h.startsWith('T:')||h.startsWith('A:')||h==='%'||h==='Score'||h==='Day' ? 'center' : 'left', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', whiteSpace:'nowrap', fontWeight:600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map(post => {
              const a = actuals[post.id] || {}
              const targets: Record<string, number> = {
                reach: post.reach_target, saves: post.saves_target,
                shares: post.shares_target, comments: post.comments_target,
              }
              const scores   = metrics.slice(0,4).map(m => pct(a[m] || 0, targets[m])).filter(x => x !== null) as number[]
              const avgScore = scores.length ? Math.round(scores.reduce((s,x)=>s+x,0)/scores.length) : null

              return (
                <tr key={post.id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 8px', color:'var(--text-muted)', fontSize:12, textAlign:'center' }}>D{post.day}</td>
                  <td style={{ padding:'10px 8px' }}>
                    <span className={`badge ${FORMAT_STYLE[post.format]}`} style={{ fontSize:10 }}>{post.format}</span>
                  </td>
                  <td style={{ padding:'10px 8px', fontSize:12, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</td>

                  {(['reach','saves','shares','comments'] as const).map(field => {
                    const target = targets[field]
                    const actual = a[field] || 0
                    const p = pct(actual, target)
                    return [
                      <td key={`t-${field}`} style={{ padding:'8px', textAlign:'center', fontSize:12, color:'rgba(59,130,246,0.7)' }}>{target.toLocaleString()}</td>,
                      <td key={`a-${field}`} style={{ padding:'6px 8px' }}>
                        <input type="number" min="0" placeholder="0"
                          style={{ width:68, background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-primary)', padding:'4px 8px', borderRadius:6, fontSize:12, outline:'none', textAlign:'center' }}
                          value={a[field] || ''}
                          onChange={e => update(post.id, field, e.target.value)}
                        />
                      </td>,
                      <td key={`p-${field}`} style={{ padding:'8px', textAlign:'center', fontSize:12, color: pctColor(p), fontWeight:600, minWidth:44 }}>
                        {p !== null ? `${p}%` : '—'}
                      </td>,
                    ]
                  }).flat()}

                  <td style={{ padding:'10px 8px' }}>
                    {avgScore !== null ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ width:52 }}>
                          <div className="progress-fill" style={{ width:`${Math.min(avgScore,100)}%`, background: pctColor(avgScore) }} />
                        </div>
                        <span style={{ fontSize:12, color: pctColor(avgScore), fontWeight:600 }}>{avgScore}%</span>
                      </div>
                    ) : <span style={{ color:'var(--text-muted)', fontSize:12 }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {posts.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
          <div style={{ fontSize:14 }}>Generate a content plan first to start tracking</div>
        </div>
      )}
    </div>
  )
}
