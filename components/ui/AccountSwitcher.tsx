'use client'
import { useState, useRef, useEffect } from 'react'
import { Channel } from '@/lib/types'

const COLORS = ['#e94560','#0fb8a0','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']

interface Props {
  channels:      Channel[]
  active:        Channel | null
  onSwitch:      (ch: Channel) => void
  onAddManual:   () => void
  onDelete:      (id: string) => void
}

export default function AccountSwitcher({ channels, active, onSwitch, onAddManual, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const ref  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display:'flex', alignItems:'center', gap:8,
          background:'var(--bg-elevated)', border:'1px solid var(--border)',
          borderRadius:10, padding:'7px 12px', cursor:'pointer',
          color:'var(--text-primary)', fontSize:13, minWidth:200,
          transition:'border-color 0.15s',
        }}
      >
        {active ? (
          <>
            <div style={{ width:8, height:8, borderRadius:'50%', background:active.color, flexShrink:0 }} />
            <div style={{ flex:1, textAlign:'left', overflow:'hidden' }}>
              <div style={{ fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{active.name}</div>
              {active.handle && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{active.handle}</div>}
            </div>
          </>
        ) : (
          <span style={{ color:'var(--text-muted)' }}>Select channel…</span>
        )}
        <span style={{ color:'var(--text-muted)', fontSize:10, marginLeft:4 }}>{open ? '▴' : '▾'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', left:0,
          background:'var(--bg-card)', border:'1px solid var(--border-hover)',
          borderRadius:12, minWidth:260, padding:6, zIndex:100,
          boxShadow:'0 12px 32px rgba(0,0,0,0.5)',
        }}>
          {/* Connected via Instagram OAuth */}
          {channels.filter(c => c.ig_account).length > 0 && (
            <div style={{ padding:'6px 10px 4px', fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Instagram connected
            </div>
          )}
          {channels.filter(c => c.ig_account).map(ch => (
            <ChannelRow key={ch.id} ch={ch} active={active} onSwitch={() => { onSwitch(ch); setOpen(false) }} onDelete={() => onDelete(ch.id)} />
          ))}

          {/* Manual channels */}
          {channels.filter(c => !c.ig_account).length > 0 && (
            <div style={{ padding:'8px 10px 4px', fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', borderTop: channels.filter(c => c.ig_account).length > 0 ? '1px solid var(--border)' : 'none', marginTop: channels.filter(c => c.ig_account).length > 0 ? 4 : 0 }}>
              Manual channels
            </div>
          )}
          {channels.filter(c => !c.ig_account).map(ch => (
            <ChannelRow key={ch.id} ch={ch} active={active} onSwitch={() => { onSwitch(ch); setOpen(false) }} onDelete={() => onDelete(ch.id)} />
          ))}

          {/* Divider + actions */}
          <div style={{ height:1, background:'var(--border)', margin:'6px 4px' }} />

          <button
            onClick={() => { window.location.href = '/login'; setOpen(false) }}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'transparent', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, color:'white' }}
          >
            <span style={{ fontSize:15 }}>📷</span>
            <span style={{ background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:600 }}>
              Connect Instagram account
            </span>
          </button>

          <button
            onClick={() => { onAddManual(); setOpen(false) }}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'transparent', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--text-secondary)' }}
          >
            <span style={{ fontSize:15 }}>+</span> Add channel manually
          </button>
        </div>
      )}
    </div>
  )
}

function ChannelRow({ ch, active, onSwitch, onDelete }: { ch: Channel; active: Channel | null; onSwitch: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false)
  const isActive = active?.id === ch.id

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, background: isActive ? 'var(--bg-elevated)' : hover ? 'rgba(255,255,255,0.03)' : 'transparent', cursor:'pointer' }}
      onClick={onSwitch}
    >
      {/* Avatar */}
      {ch.ig_account?.profile_picture_url ? (
        <img src={ch.ig_account.profile_picture_url} alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
      ) : (
        <div style={{ width:28, height:28, borderRadius:'50%', background:ch.color, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white' }}>
          {ch.name[0].toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight: isActive ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-primary)' }}>{ch.name}</div>
        <div style={{ fontSize:10, color:'var(--text-muted)' }}>
          {ch.handle || ch.niche}
          {ch.ig_account && <span style={{ color:'#34d399', marginLeft:4 }}>● connected</span>}
        </div>
      </div>

      {/* Delete */}
      {hover && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', fontSize:14, padding:'2px 4px', borderRadius:4, flexShrink:0 }}
          title="Remove channel"
        >✕</button>
      )}
    </div>
  )
}
