'use client'
import { useState } from 'react'
import { Channel } from '@/lib/types'

const COLORS = ['#e94560','#0fb8a0','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']

interface Props {
  onClose:  () => void
  onAdded:  (ch: Channel) => void
}

export default function AddChannelModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({ name:'', handle:'', objective:'', audience:'', niche:'', color: COLORS[0] })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(k: keyof typeof form, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function save() {
    if (!form.name || !form.objective || !form.audience) {
      return setError('Channel name, objective and audience are required')
    }
    setLoading(true); setError('')
    const res  = await fetch('/api/channels', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save'); setLoading(false); return }
    onAdded(data)
  }

  const Field = (label: string, key: keyof typeof form, ph: string, required = false) => (
    <div>
      <div className="section-label">{label}{required && ' *'}</div>
      <input className="input" placeholder={ph} value={form[key] as string} onChange={e => set(key, e.target.value)} />
    </div>
  )

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:520 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:600 }}>Add Channel</div>
          <button className="btn-ghost" onClick={onClose} style={{ padding:'6px 10px' }}>✕</button>
        </div>

        <div style={{ display:'grid', gap:14 }}>
          {Field('Channel Name', 'name', 'e.g. Testbook AP Channel', true)}
          {Field('Instagram Handle', 'handle', '@testbook_ap')}
          {Field('Niche / Category', 'niche', 'e.g. EdTech, Career, Fitness')}
          {Field('Channel Objective', 'objective', 'e.g. Help NET qualifiers land AP jobs', true)}
          {Field('Target Audience', 'audience', 'e.g. UGC NET qualifiers seeking AP positions', true)}

          <div>
            <div className="section-label">Channel Colour</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)}
                  style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border: form.color===c ? '3px solid white' : '3px solid transparent', transition:'border 0.1s' }}
                />
              ))}
            </div>
          </div>

          {error && <div style={{ color:'#f87171', fontSize:12 }}>{error}</div>}

          <div style={{ fontSize:12, color:'var(--text-muted)', padding:'10px 0 0' }}>
            💡 You can connect this channel to an Instagram account later via "Connect Instagram account" in the channel switcher.
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Saving…' : 'Add Channel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
