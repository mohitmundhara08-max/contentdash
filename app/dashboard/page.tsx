'use client'
import { useState, useEffect, useCallback } from 'react'
import { Channel, Post } from '@/lib/types'
import AccountSwitcher  from '@/components/ui/AccountSwitcher'
import GenerateModal    from '@/components/modals/GenerateModal'
import AddChannelModal  from '@/components/modals/AddChannelModal'
import SettingsModal    from '@/components/modals/SettingsModal'
import CalendarView     from '@/components/views/CalendarView'
import TrackerView      from '@/components/views/TrackerView'
import PillarView       from '@/components/views/PillarView'
import StrategyView     from '@/components/views/StrategyView'
import ViralView        from '@/components/views/ViralView'
import AuditView        from '@/components/views/AuditView'

type Tab = 'calendar' | 'tracker' | 'pillars' | 'strategy' | 'viral' | 'audit'

const TABS: { key: Tab; label: string }[] = [
  { key: 'calendar', label: '📅 Calendar'  },
  { key: 'tracker',  label: '📊 Tracker'   },
  { key: 'pillars',  label: '🔍 Pillars'   },
  { key: 'strategy', label: '🎯 Strategy'  },
  { key: 'viral',    label: '🔥 Viral'     },
  { key: 'audit',    label: '📋 Audit'     },
]

function Shimmer({ h = 80 }: { h?: number }) {
  return <div className="shimmer" style={{ height: h, borderRadius: 12 }} />
}

export default function Dashboard() {
  const [channels,       setChannels]       = useState<Channel[]>([])
  const [active,         setActive]         = useState<Channel | null>(null)
  const [posts,          setPosts]          = useState<Post[]>([])
  const [pillars,        setPillars]        = useState<string[]>([])
  const [meta,           setMeta]           = useState<Record<string, string>>({})
  const [tab,            setTab]            = useState<Tab>('calendar')
  const [apiKey,         setApiKey]         = useState('')
  const [loading,        setLoading]        = useState(true)
  const [postsLoading,   setPostsLoading]   = useState(false)
  const [showGenerate,   setShowGenerate]   = useState(false)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [showSettings,   setShowSettings]   = useState(false)
  const [generateTopic,  setGenerateTopic]  = useState('')  // pre-fill from viral finder

  useEffect(() => {
    setApiKey(localStorage.getItem('anthropic_api_key') || '')
    loadChannels()
  }, [])

  const loadPosts = useCallback(async (channelId: string) => {
    setPostsLoading(true)
    try {
      const res  = await fetch(`/api/posts?channelId=${channelId}`)
      const data = await res.json()
      const p: Post[] = Array.isArray(data) ? data : []
      setPosts(p)
      setPillars([...new Set(p.map(x => x.pillar))].filter(Boolean))
    } catch (e) {
      console.error('loadPosts:', e)
    } finally {
      setLoading(false); setPostsLoading(false)
    }
  }, [])

  async function loadChannels() {
    setLoading(true)
    try {
      const res  = await fetch('/api/channels')
      const data = await res.json()
      const chs: Channel[] = Array.isArray(data) ? data : []
      setChannels(chs)
      if (chs.length > 0) {
        const savedId = localStorage.getItem('active_channel_id')
        const toActivate = chs.find(c => c.id === savedId) || chs[0]
        setActive(toActivate)
        await loadPosts(toActivate.id)
      } else {
        setLoading(false)
      }
    } catch (e) {
      console.error('loadChannels:', e)
      setLoading(false)
    }
  }

  function switchChannel(ch: Channel) {
    setActive(ch); setPosts([]); setPillars([]); setMeta({})
    localStorage.setItem('active_channel_id', ch.id)
    loadPosts(ch.id)
  }

  async function deleteChannel(id: string) {
    if (!confirm('Remove this channel and all its content?')) return
    await fetch('/api/channels', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    const updated = channels.filter(c => c.id !== id)
    setChannels(updated)
    if (active?.id === id) {
      localStorage.removeItem('active_channel_id')
      if (updated.length > 0) switchChannel(updated[0])
      else { setActive(null); setPosts([]); setPillars([]) }
    }
  }

  function onChannelAdded(ch: Channel) {
    setChannels(prev => [...prev, ch]); setShowAddChannel(false); switchChannel(ch)
  }

  function onGenerated(newPosts: Post[], newMeta: Record<string, string>) {
    setPosts(newPosts); setMeta(newMeta)
    setPillars([...new Set(newPosts.map(x => x.pillar))].filter(Boolean))
    setShowGenerate(false); setGenerateTopic(''); setTab('calendar')
  }

  function saveApiKey(k: string) {
    setApiKey(k); localStorage.setItem('anthropic_api_key', k)
  }

  // Called from Viral Finder — pre-fills topic and opens generate modal
  function useViralTopic(topic: string) {
    setGenerateTopic(topic); setShowGenerate(true)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      {/* Nav */}
      <nav style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', padding:'0 20px', height:56, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:30 }}>
        <div style={{ fontSize:16, fontWeight:700, marginRight:4, whiteSpace:'nowrap' }}>
          <span style={{ color:'var(--accent)' }}>Content</span>Dash
        </div>

        <AccountSwitcher channels={channels} active={active} onSwitch={switchChannel} onAddManual={() => setShowAddChannel(true)} onDelete={deleteChannel} />

        <div style={{ flex:1 }} />

        {/* Tabs — scrollable on mobile */}
        <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)} style={{ fontSize:12, padding:'7px 14px' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1 }} />

        <button className="btn-primary" onClick={() => active ? setShowGenerate(true) : setShowAddChannel(true)} style={{ whiteSpace:'nowrap', fontSize:13 }}>
          ✨ Generate
        </button>
        <button className="btn-ghost" onClick={() => setShowSettings(true)} title="Settings" style={{ padding:'7px 10px' }}>⚙️</button>
      </nav>

      {/* Channel bar */}
      {active && (
        <div style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', padding:'6px 20px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:active.color, flexShrink:0 }} />
          <div style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ color:'var(--text-primary)', fontWeight:500 }}>{active.name}</span>
            {active.handle && <span>{active.handle}</span>}
            {active.niche  && <><span style={{ color:'var(--text-muted)' }}>·</span><span>{active.niche}</span></>}
            <span style={{ color:'var(--text-muted)' }}>·</span>
            <span>{posts.length} posts</span>
            {active.ig_account && <span style={{ color:'#34d399', fontSize:11 }}>● Instagram connected</span>}
          </div>
        </div>
      )}

      {/* Main */}
      <main style={{ flex:1, padding:'20px', maxWidth:1440, width:'100%', margin:'0 auto' }}>
        {loading ? (
          <div style={{ display:'grid', gap:12 }}>
            {[140,110,110].map((h,i) => <Shimmer key={i} h={h} />)}
          </div>
        ) : !active ? (
          <div style={{ textAlign:'center', padding:'100px 20px' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>📱</div>
            <div style={{ fontSize:22, fontWeight:600, marginBottom:8 }}>Welcome to ContentDash</div>
            <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:32 }}>Add your first channel to start generating content</div>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button className="btn-ig" onClick={() => window.location.href = '/login'} style={{ padding:'12px 24px', fontSize:14 }}>
                📷 Connect Instagram
              </button>
              <button className="btn-ghost" onClick={() => setShowAddChannel(true)} style={{ padding:'12px 24px', fontSize:14 }}>
                Add channel manually
              </button>
            </div>
          </div>
        ) : postsLoading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:10 }}>
            {[...Array(9)].map((_,i) => <Shimmer key={i} h={130} />)}
          </div>
        ) : (
          <>
            {tab === 'calendar' && <CalendarView posts={posts} pillars={pillars} />}
            {tab === 'tracker'  && <TrackerView  posts={posts} />}
            {tab === 'pillars'  && <PillarView   posts={posts} pillars={pillars} />}
            {tab === 'strategy' && <StrategyView posts={posts} meta={meta} />}
            {tab === 'viral'    && <ViralView    channel={active} apiKey={apiKey} onUseTopic={useViralTopic} />}
            {tab === 'audit'    && <AuditView    channel={active} apiKey={apiKey} />}
          </>
        )}
      </main>

      {/* Modals */}
      {showGenerate   && active && (
        <GenerateModal
          channel={active}
          apiKey={apiKey}
          initialKeyword={generateTopic}
          onClose={() => { setShowGenerate(false); setGenerateTopic('') }}
          onDone={onGenerated}
        />
      )}
      {showAddChannel && <AddChannelModal onClose={() => setShowAddChannel(false)} onAdded={onChannelAdded} />}
      {showSettings   && <SettingsModal apiKey={apiKey} onSave={saveApiKey} onClose={() => setShowSettings(false)} />}
    </div>
  )
}
