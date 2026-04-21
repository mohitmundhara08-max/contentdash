import { Post } from '@/lib/types'

const FORMAT_STYLE: Record<string, string> = {
  'Reel': 'format-reel', 'Carousel': 'format-carousel', 'Long-form': 'format-longform',
}
const FORMAT_EMOJI: Record<string, string> = {
  'Reel': '🎬', 'Carousel': '🖼️', 'Long-form': '📹',
}
const PILLAR_STYLE = ['pillar-0','pillar-1','pillar-2','pillar-3']

interface Props {
  post:     Post
  pillars:  string[]
  selected: boolean
  onClick:  () => void
}

export default function PostCard({ post, pillars, selected, onClick }: Props) {
  const pillarIdx = pillars.indexOf(post.pillar) % 4

  return (
    <div className={`post-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>Day {post.day}</span>
        {post.priority >= 5 && <span style={{ fontSize:11, color:'#f59e0b' }}>★</span>}
      </div>

      <div style={{ fontSize:12, fontWeight:600, lineHeight:1.4, marginBottom:8, color:'var(--text-primary)' }}>
        {post.title}
      </div>

      {post.hook && (
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:10, lineHeight:1.4 }}>
          {post.hook.slice(0, 72)}{post.hook.length > 72 ? '…' : ''}
        </div>
      )}

      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        <span className={`badge ${FORMAT_STYLE[post.format] || ''}`}>
          {FORMAT_EMOJI[post.format]} {post.format}
        </span>
        <span className={`badge ${PILLAR_STYLE[pillarIdx]}`} style={{ maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {post.pillar}
        </span>
      </div>

      <div style={{ marginTop:8, fontSize:10, color:'var(--text-muted)' }}>{post.post_date}</div>
    </div>
  )
}
