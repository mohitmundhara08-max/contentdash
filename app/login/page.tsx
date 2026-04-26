'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  function connectInstagram() {
    setLoading(true)
    // This redirects to Instagram's own login page — we never see your password
    window.location.href = '/api/auth/instagram'
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:32, fontWeight:700, marginBottom:8 }}>
          <span style={{ color:'var(--accent)' }}>Post</span>lab
        </div>
        <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:48 }}>AI-powered Instagram content studio</div>

        <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-hover)', borderRadius:16, padding:32 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📷</div>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Connect your Instagram</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:28, lineHeight:1.7 }}>
            Click below — you'll be taken to <strong style={{ color:'var(--text-primary)' }}>Instagram's own login page</strong> to sign in. We never see or store your password.
          </div>

          <button className="btn-ig" onClick={connectInstagram} disabled={loading}
            style={{ width:'100%', justifyContent:'center', fontSize:14, padding:'13px 20px' }}>
            {loading ? 'Opening Instagram…' : '📷 Log in with Instagram'}
          </button>

          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:16, lineHeight:1.6, padding:'10px', background:'var(--bg-elevated)', borderRadius:8 }}>
            <strong style={{ color:'var(--text-secondary)' }}>Note:</strong> Requires an Instagram Business or Creator account linked to a Facebook Page. Personal accounts are not supported by Instagram's official API.
          </div>

          <div style={{ margin:'20px 0', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>or</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>

          <button className="btn-ghost" onClick={() => window.location.href = '/dashboard'}
            style={{ width:'100%', justifyContent:'center' }}>
            Add channel manually (no Instagram login)
          </button>
        </div>

        <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[['🔒','No password seen'],['✅','Official Instagram OAuth'],['🚫','Zero posting access']].map(([icon, label]) => (
            <div key={label} style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', lineHeight:1.5 }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{icon}</div>{label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
