'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface IGAccount {
  id: string
  username: string
  name: string
  profile_picture_url: string
  followers_count: number
}

interface Channel {
  id: string
  name: string
  handle: string
  objective: string
  audience: string
  niche: string
  color: string
  ig_account?: IGAccount
}

interface Post {
  id: string
  plan_id: string
  channel_id: string
  day: number
  week: number
  format: string
  pillar: string
  title: string
  hook: string
  content_brief: string
  script: string
  ai_prompt: string
  hashtags: string
  cta: string
  post_date: string
  reach_target: number
  saves_target: number
  shares_target: number
  comments_target: number
  plays_target: number
  priority: number
  notes: string
}

interface Suggestion {
  topic: string
  format: string
  hook: string
  reason: string
  score: number
  pillar: string
}

interface ViralPattern {
  topic: string
  format: string
  trigger: string
  hook: string
  reach_potential: string
  platform: string
  example_title: string
  reason: string
}

interface AuditResult {
  profile_strategy: string
  content_mix: {
    reel: number
    carousel: number
    longform: number
    reasoning: string
  }
  posting_frequency: string
  whats_working: string[]
  whats_missing: string[]
  top_improvements: { action: string; impact: string; reason: string }[]
  hook_formula: string
  growth_levers: string[]
  overall_score: number
  summary: string
}

type Tab = 'calendar' | 'tracker' | 'pillars' | 'strategy' | 'viral' | 'audit'

const FE: Record<string, string> = { Reel: '🎬', Carousel: '🖼️', 'Long-form': '📹' }
const COLORS = ['#e94560', '#0fb8a0', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
const TABS: { key: Tab; label: string }[] = [
  { key: 'calendar', label: '📅 Calendar' },
  { key: 'tracker', label: '📊 Tracker' },
  { key: 'pillars', label: '🔍 Pillars' },
  { key: 'strategy', label: '🎯 Strategy' },
  { key: 'viral', label: '🔥 Viral' },
  { key: 'audit', label: '📋 Audit' },
]

async function af(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const txt = (await res.text()).trim()

  try {
    const d = JSON.parse(txt)
    if (!res.ok) throw new Error(d.error || `Error ${res.status}`)
    return d
  } catch (e) {
    if (txt.includes('<!DOCTYPE') || txt.includes('<html')) {
      throw new Error(`Route not found (${url}). Redeploy the latest API routes.`)
    }
    throw new Error(e instanceof Error ? e.message : `Bad response: ${txt.slice(0, 120)}`)
  }
}

function Shimmer({ h = 80 }: { h?: number }) {
  return <div className="shimmer" style={{ height: h, borderRadius: 12 }} />
}

function AccountSwitcher({
  channels,
  active,
  onSwitch,
  onAddManual,
  onDelete,
}: {
  channels: Channel[]
  active: Channel | null
  onSwitch: (c: Channel) => void
  onAddManual: () => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '6px 12px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: 13,
          minWidth: 190,
        }}
      >
        {active ? (
          <>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: active.color, flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {active.name}
              </div>
              {active.handle && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{active.handle}</div>}
            </div>
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Select channel…</span>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hover)',
            borderRadius: 12,
            minWidth: 250,
            padding: 6,
            zIndex: 100,
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          {channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => {
                onSwitch(ch)
                setOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: active?.id === ch.id ? 'var(--bg-elevated)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: ch.color,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {ch.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {ch.handle || ch.niche}
                  {ch.ig_account && <span style={{ color: '#34d399', marginLeft: 4 }}>● live</span>}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(ch.id)
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <button
            onClick={() => {
              window.location.href = '/login'
              setOpen(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 600,
              }}
            >
              📷 Connect Instagram account
            </span>
          </button>

          <button
            onClick={() => {
              onAddManual()
              setOpen(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            + Add channel manually
          </button>
        </div>
      )}
    </div>
  )
}

function AddChannelModal({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: (c: Channel) => void
}) {
  const [f, setF] = useState({
    name: '',
    handle: '',
    objective: '',
    audience: '',
    niche: '',
    color: COLORS[0],
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const s = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))

  async function save() {
    if (!f.name || !f.objective || !f.audience) {
      setErr('Name, objective and audience required')
      return
    }
    setLoading(true)
    setErr('')
    try {
      const d = await af('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      onAdded(d)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed')
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Add Channel</div>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <input className="input" placeholder="Channel name" value={f.name} onChange={(e) => s('name', e.target.value)} />
          <input className="input" placeholder="@handle" value={f.handle} onChange={(e) => s('handle', e.target.value)} />
          <input className="input" placeholder="Niche" value={f.niche} onChange={(e) => s('niche', e.target.value)} />
          <input className="input" placeholder="Objective" value={f.objective} onChange={(e) => s('objective', e.target.value)} />
          <input className="input" placeholder="Audience" value={f.audience} onChange={(e) => s('audience', e.target.value)} />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => s('color', c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: f.color === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {err && <div style={{ color: '#f87171', fontSize: 12 }}>{err}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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

function SettingsModal({
  apiKey,
  onSave,
  onClose,
}: {
  apiKey: string
  onSave: (k: string) => void
  onClose: () => void
}) {
  const [k, setK] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  function save() {
    onSave(k)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>⚙️ Settings</div>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <input
            className="input"
            type="password"
            placeholder="Anthropic API key"
            value={k}
            onChange={(e) => setK(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={onClose}>Close</button>
            <button className="btn-primary" onClick={save}>{saved ? '✓ Saved' : 'Save API Key'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GenerateModal({
  channel,
  apiKey,
  initialKeyword,
  onClose,
  onDone,
}: {
  channel: Channel
  apiKey: string
  initialKeyword?: string
  onClose: () => void
  onDone: (posts: Post[], meta: Record<string, string>) => void
}) {
  const [kw, setKw] = useState(initialKeyword || '')
  const [obj, setObj] = useState(channel.objective)
  const [aud, setAud] = useState(channel.audience)
  const [dur, setDur] = useState(30)
  const [loading, setLoading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggs, setSuggs] = useState<Suggestion[]>([])
  const [err, setErr] = useState('')

  async function getSuggestions() {
    if (!apiKey) {
      setErr('Add API key in ⚙️ Settings first')
      return
    }

    setSuggesting(true)
    setErr('')

    try {
      const d = await af('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest',
          channelId: channel.id,
          niche: channel.niche,
          objective: obj,
          audience: aud,
          apiKey,
        }),
      })
      setSuggs(Array.isArray(d.suggestions) ? d.suggestions : [])
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSuggesting(false)
    }
  }

  async function generate() {
    if (!apiKey) {
      setErr('Add API key in ⚙️ Settings first')
      return
    }

    setLoading(true)
    setErr('')

    try {
      const plan = await af('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          channelName: channel.name,
          objective: obj,
          audience: aud,
          keyword: kw || '',
          duration: dur,
          quickMode: true,
          apiKey,
        }),
      })

      const saved = await af('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: { channel_id: channel.id, keyword: kw || channel.niche, duration: dur },
          posts: plan.posts,
          channelId: channel.id,
          strategy: plan.strategy || '',
          hook_formula: plan.hook_formula || '',
        }),
      })

      onDone(saved.posts || [], {
        strategy: plan.strategy || '',
        hook_formula: plan.hook_formula || '',
        pillars: (plan.pillars || []).join(', '),
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>✨ Generate Content Plan</div>
          <input className="input" placeholder="Topic" value={kw} onChange={(e) => setKw(e.target.value)} />
          <input className="input" placeholder="Objective" value={obj} onChange={(e) => setObj(e.target.value)} />
          <input className="input" placeholder="Audience" value={aud} onChange={(e) => setAud(e.target.value)} />

          <select className="select" value={dur} onChange={(e) => setDur(+e.target.value)}>
            <option value={7}>7 days — 3 posts</option>
            <option value={14}>14 days — 6 posts</option>
            <option value={30}>30 days — 12 posts</option>
            <option value={60}>60 days — 24 posts</option>
          </select>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" onClick={getSuggestions} disabled={suggesting}>
              {suggesting ? 'Finding…' : '✨ Suggest topics'}
            </button>
            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? 'Generating…' : `Generate ${dur}-Day Plan`}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>

          {suggs.length > 0 && (
            <div className="card">
              {suggs.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setKw(s.topic)}
                  style={{ padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                >
                  <div style={{ fontWeight: 600 }}>{s.topic}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.hook}</div>
                </div>
              ))}
            </div>
          )}

          {err && <div style={{ color: '#f87171', fontSize: 12 }}>⚠️ {err}</div>}
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [active, setActive] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [pillars, setPillars] = useState<string[]>([])
  const [meta, setMeta] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<Tab>('calendar')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)

  const [viralPatterns, setViralPatterns] = useState<ViralPattern[]>([])
  const [viralInsight, setViralInsight] = useState('')
  const [viralLoading, setViralLoading] = useState(false)
  const [viralError, setViralError] = useState('')

  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')

  const [showGen, setShowGen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showSet, setShowSet] = useState(false)
  const [genTopic, setGenTopic] = useState('')

  const loadPosts = useCallback(async (cid: string) => {
    setPostsLoading(true)
    try {
      const d = await af(`/api/posts?channelId=${cid}`)
      const p: Post[] = Array.isArray(d) ? d : []
      setPosts(p)
      setPillars([...new Set(p.map((x) => x.pillar))].filter(Boolean))
    } catch (e) {
      console.error('loadPosts', e)
    } finally {
      setLoading(false)
      setPostsLoading(false)
    }
  }, [])

  async function loadChannels() {
    setLoading(true)
    try {
      const d = await af('/api/channels')
      const chs: Channel[] = Array.isArray(d) ? d : []
      setChannels(chs)

      if (chs.length > 0) {
        const sid = typeof window !== 'undefined' ? localStorage.getItem('active_channel_id') : null
        const target = chs.find((c) => c.id === sid) || chs[0]
        setActive(target)
        await loadPosts(target.id)
      } else {
        setLoading(false)
      }
    } catch (e) {
      console.error('loadChannels', e)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem('anthropic_api_key') || '')
    }
    loadChannels()
  }, [loadPosts])

  function switchChannel(ch: Channel) {
    setActive(ch)
    setPosts([])
    setPillars([])
    setMeta({})
    if (typeof window !== 'undefined') localStorage.setItem('active_channel_id', ch.id)
    loadPosts(ch.id)
  }

  async function deleteChannel(id: string) {
    if (!confirm('Remove this channel?')) return

    await af('/api/channels', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    const updated = channels.filter((c) => c.id !== id)
    setChannels(updated)

    if (active?.id === id) {
      if (typeof window !== 'undefined') localStorage.removeItem('active_channel_id')
      if (updated.length > 0) switchChannel(updated[0])
      else {
        setActive(null)
        setPosts([])
        setPillars([])
      }
    }
  }

  function onChannelAdded(ch: Channel) {
    setChannels((p) => [...p, ch])
    setShowAdd(false)
    switchChannel(ch)
  }

  function onGenerated(np: Post[], nm: Record<string, string>) {
    setPosts(np)
    setMeta(nm)
    setPillars([...new Set(np.map((x) => x.pillar))].filter(Boolean))
    setShowGen(false)
    setGenTopic('')
    setTab('calendar')
  }

  function saveKey(k: string) {
    setApiKey(k)
    if (typeof window !== 'undefined') localStorage.setItem('anthropic_api_key', k)
  }

  function useViralTopic(t: string) {
    setGenTopic(t)
    setShowGen(true)
  }

  async function findViral() {
    if (!active || !apiKey) {
      setViralError(!apiKey ? 'Add API key in ⚙️ Settings' : 'No channel selected')
      return
    }
    if (!active.niche || !active.objective || !active.audience) {
      setViralError('Please fill niche, objective, and audience for this channel first')
      return
    }

    setViralLoading(true)
    setViralError('')
    try {
      const d = await af('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'viral',
          niche: active.niche,
          handle: active.handle,
          objective: active.objective,
          audience: active.audience,
          apiKey,
        }),
      })
      setViralPatterns(d.viral_patterns || [])
      setViralInsight(d.insight || '')
    } catch (e: unknown) {
      setViralError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setViralLoading(false)
    }
  }

  async function runAudit() {
    if (!active || !apiKey) {
      setAuditError(!apiKey ? 'Add API key in ⚙️ Settings' : 'No channel selected')
      return
    }
    if (!active.niche || !active.objective || !active.audience) {
      setAuditError('Please fill niche, objective, and audience for this channel first')
      return
    }

    setAuditLoading(true)
    setAuditError('')
    try {
      const d = await af('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'audit',
          handle: active.handle,
          niche: active.niche,
          objective: active.objective,
          audience: active.audience,
          apiKey,
        }),
      })
      setAudit(d as AuditResult)
    } catch (e: unknown) {
      setAuditError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setAuditLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>ContentDash</div>
        <AccountSwitcher
          channels={channels}
          active={active}
          onSwitch={switchChannel}
          onAddManual={() => setShowAdd(true)}
          onDelete={deleteChannel}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowSet(true)}>⚙️</button>
          <button className="btn-primary" onClick={() => (active ? setShowGen(true) : setShowAdd(true))}>
            ✨ Generate
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className="btn-ghost"
            onClick={() => setTab(t.key)}
            style={tab === t.key ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[140, 110, 110].map((h, i) => <Shimmer key={i} h={h} />)}
        </div>
      ) : !active ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>Welcome to ContentDash</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Add your first channel to start</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => (window.location.href = '/login')}>📷 Connect Instagram</button>
            <button className="btn-ghost" onClick={() => setShowAdd(true)}>Add manually</button>
          </div>
        </div>
      ) : postsLoading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[...Array(9)].map((_, i) => <Shimmer key={i} h={72} />)}
        </div>
      ) : (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>{active.name}</div>

          {tab === 'calendar' && (
            <div>
              <div style={{ marginBottom: 12, color: 'var(--text-muted)' }}>{posts.length} posts</div>
              {posts.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No content yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {posts.map((p) => (
                    <div key={p.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day {p.day}</div>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {FE[p.format] || '📌'} {p.format} · {p.pillar}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'tracker' && <div>Tracker view shell loaded.</div>}
          {tab === 'pillars' && <div>Pillars: {pillars.join(', ') || 'No pillars yet'}</div>}
          {tab === 'strategy' && <div>{meta.strategy || 'No strategy yet.'}</div>}

          {tab === 'viral' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <button className="btn-primary" onClick={findViral} disabled={viralLoading}>
                {viralLoading ? 'Analysing…' : '🔥 Find Viral'}
              </button>
              {viralError && <div style={{ color: '#f87171' }}>⚠️ {viralError}</div>}
              {viralInsight && <div>Key insight: {viralInsight}</div>}
              {viralPatterns.map((p, i) => (
                <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 600 }}>{p.example_title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.reason}</div>
                  <button className="btn-ghost" onClick={() => useViralTopic(p.example_title)} style={{ marginTop: 8 }}>
                    Use this topic
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'audit' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <button className="btn-primary" onClick={runAudit} disabled={auditLoading}>
                {auditLoading ? 'Auditing…' : '📋 Run Audit'}
              </button>
              {auditError && <div style={{ color: '#f87171' }}>⚠️ {auditError}</div>}
              {audit && (
                <div>
                  <div style={{ fontWeight: 700 }}>Score: {audit.overall_score}/10</div>
                  <div style={{ color: 'var(--text-muted)' }}>{audit.summary}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showGen && active && (
        <GenerateModal
          channel={active}
          apiKey={apiKey}
          initialKeyword={genTopic}
          onClose={() => {
            setShowGen(false)
            setGenTopic('')
          }}
          onDone={onGenerated}
        />
      )}

      {showAdd && <AddChannelModal onClose={() => setShowAdd(false)} onAdded={onChannelAdded} />}
      {showSet && <SettingsModal apiKey={apiKey} onSave={saveKey} onClose={() => setShowSet(false)} />}

      <style jsx global>{`
        :root {
          --bg: #0b1020;
          --bg-card: #12182b;
          --bg-surface: #12182b;
          --bg-elevated: #1a2238;
          --border: #26314f;
          --border-hover: #344266;
          --text-primary: #f3f5ff;
          --text-secondary: #c7d0ee;
          --text-muted: #8e9ac3;
          --accent: #e94560;
        }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--text-primary);
          font-family: Inter, system-ui, sans-serif;
        }
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
        }
        .input, .select, .btn-primary, .btn-ghost {
          border-radius: 10px;
          padding: 10px 12px;
          font: inherit;
        }
        .input, .select {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
          width: 100%;
          box-sizing: border-box;
        }
        .btn-primary {
          background: var(--accent);
          color: white;
          border: none;
          cursor: pointer;
        }
        .btn-ghost {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border);
          cursor: pointer;
        }
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }
        .modal {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px;
        }
        .shimmer {
          background: linear-gradient(90deg, #131a2d 25%, #1c2540 50%, #131a2d 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
