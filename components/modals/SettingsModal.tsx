'use client'
import { useState } from 'react'

interface Props {
  apiKey:  string
  onSave:  (k: string) => void
  onClose: () => void
}

export default function SettingsModal({ apiKey, onSave, onClose }: Props) {
  const [key, setKey] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  function save() {
    onSave(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:480 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:600 }}>⚙️ Settings</div>
          <button className="btn-ghost" onClick={onClose} style={{ padding:'6px 10px' }}>✕</button>
        </div>

        <div style={{ display:'grid', gap:16 }}>
          {/* API Key */}
          <div>
            <div className="section-label">Anthropic API Key</div>
            <input className="input" type="password" placeholder="sk-ant-…" value={key} onChange={e => setKey(e.target.value)} />
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, lineHeight:1.5 }}>
              Get yours at{' '}
              <a href="https://console.anthropic.com" target="_blank" style={{ color:'var(--accent)' }}>
                console.anthropic.com
              </a>
              . Stored in your browser only — never sent to any server other than Anthropic.
            </div>
          </div>

          {/* Info box */}
          <div style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'var(--text-secondary)', border:'1px solid var(--border)' }}>
            <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>What this key powers:</div>
            <div style={{ lineHeight:1.7 }}>
              The AI content generator calls Claude to create your 30-day plans, scripts, hook lines, hashtag sets, and AI image/video prompts. Uses ~5,000–8,000 tokens per generation.
            </div>
          </div>

          {/* Instagram section */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
            <div className="section-label" style={{ marginBottom:10 }}>Instagram / Meta OAuth</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:12, lineHeight:1.6 }}>
              To connect your Instagram accounts and pull real metrics, you need a Facebook Developer App.
            </div>
            <div style={{ display:'grid', gap:8, fontSize:12, color:'var(--text-secondary)' }}>
              {[
                ['1.', 'Go to developers.facebook.com → Create App'],
                ['2.', 'Add Instagram Graph API product'],
                ['3.', 'Copy App ID + App Secret'],
                ['4.', 'Add them as INSTAGRAM_APP_ID + INSTAGRAM_APP_SECRET in Vercel env vars'],
                ['5.', 'Set NEXT_PUBLIC_APP_URL to your live Vercel URL'],
              ].map(([n, s]) => (
                <div key={n as string} style={{ display:'flex', gap:10 }}>
                  <span style={{ color:'var(--accent)', fontWeight:600, flexShrink:0 }}>{n as string}</span>
                  <span>{s as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn-ghost" onClick={onClose}>Close</button>
            <button className="btn-primary" onClick={save}>
              {saved ? '✓ Saved' : 'Save API Key'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
