'use client'
export default function LoginPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:32, fontWeight:700, marginBottom:8 }}>
          <span style={{ color:'var(--accent)' }}>Post</span>lab
        </div>
        <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:48 }}>AI-powered Instagram content studio</div>
        <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-hover)', borderRadius:16, padding:32 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📱</div>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Welcome to Postlab</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:28, lineHeight:1.7 }}>
            Plan, generate, and manage Instagram content for multiple channels — all in one place.
          </div>
          <button onClick={() => window.location.href = '/dashboard'}
            style={{ width:'100%', padding:'13px 20px', background:'var(--accent)', border:'none', borderRadius:10, color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}
