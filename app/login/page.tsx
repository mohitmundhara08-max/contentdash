'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  function connectInstagram() {
    setLoading(true)
    window.location.href = '/api/auth/instagram'
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400, textAlign:'center' }}>

        {/* Logo */}
        <div style={{ fontSize:32, fontWeight:700, marginBottom:8 }}>
          <span style={{ color:'var(--accent)' }}>Content</span>Dash
        </div>
        <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:48 }}>
          AI-powered Instagram content studio
        </div>

        {/* Card */}
        <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-hover)', borderRadius:16, padding:32 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📱</div>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Connect your Instagram</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:28, lineHeight:1.6 }}>
            Sign in with Facebook to connect your Instagram Business accounts. We never see or store your password.
          </div>

          <button className="btn-ig" onClick={connectInstagram} disabled={loading}
            style={{ width:'100%', justifyContent:'center', fontSize:14, padding:'12px 20px' }}>
            {loading ? 'Redirecting…' : '📷 Continue with Instagram'}
          </button>

          <div style={{ margin:'20px 0', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>or</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>

          <button className="btn-ghost" onClick={() => window.location.href = '/?manual=1'}
            style={{ width:'100%', justifyContent:'center' }}>
            Add channel manually (no Instagram login)
          </button>
        </div>

        {/* Trust signals */}
        <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[
            ['🔒','No password stored'],
            ['✅','Official Meta OAuth'],
            ['🚫','No posting access'],
          ].map(([icon, label]) => (
            <div key={label} style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', lineHeight:1.4 }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{icon}</div>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
