'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface IGAccount { id:string; username:string; name:string; profile_picture_url:string; followers_count:number }
interface Channel { id:string; name:string; handle:string; objective:string; audience:string; niche:string; color:string; ig_account?:IGAccount }
interface Post { id:string; plan_id:string; channel_id:string; day:number; week:number; format:string; pillar:string; title:string; hook:string; content_brief:string; script:string; ai_prompt:string; hashtags:string; cta:string; post_date:string; reach_target:number; saves_target:number; shares_target:number; comments_target:number; plays_target:number; priority:number; notes:string }
interface Suggestion { topic:string; format:string; hook:string; reason:string; score:number; pillar:string }
interface ViralPattern { topic:string; format:string; trigger:string; hook:string; reach_potential:string; platform:string; example_title:string; reason:string }
interface AuditResult { profile_strategy:string; content_mix:{reel:number;carousel:number;longform:number;reasoning:string}; posting_frequency:string; whats_working:string[]; whats_missing:string[]; top_improvements:{action:string;impact:string;reason:string}[]; hook_formula:string; growth_levers:string[]; overall_score:number; summary:string }

// ─── Constants ──────────────────────────────────────────────────────────────
const FE: Record<string,string> = { Reel:'🎬', Carousel:'🖼️', 'Long-form':'📹' }
const FS: Record<string,string> = { Reel:'format-reel', Carousel:'format-carousel', 'Long-form':'format-longform' }
const PS = ['pillar-0','pillar-1','pillar-2','pillar-3']
const PC = ['#3b82f6','#10b981','#f59e0b','#e94560']
const COLORS = ['#e94560','#0fb8a0','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']
const RC: Record<string,string> = { Viral:'#e94560', High:'#f59e0b', Medium:'#3b82f6', Low:'#50607a' }
const IC: Record<string,string> = { High:'#e94560', Medium:'#f59e0b', Low:'#3b82f6' }
const TC: Record<string,string> = { FOMO:'#e94560', Aspiration:'#3b82f6', 'Pain point':'#f59e0b', Curiosity:'#8b5cf6', Exclusivity:'#10b981' }
const WT = ['Reality reset','Deep dive','Strategy & tactics','Convert & win']

// ─── Utils ──────────────────────────────────────────────────────────────────
function pct(a:number,t:number){return(!t||!a)?null:Math.round(a/t*100)}
function pc(p:number|null){if(p===null)return'var(--text-muted)';return p>=90?'#34d399':p>=60?'#fbbf24':'#f87171'}

async function af(url:string,opts?:RequestInit){
  const res=await fetch(url,opts)
  const txt=await res.text()
  try{const d=JSON.parse(txt);if(!res.ok)throw new Error(d.error||`Error ${res.status}`);return d}
  catch(e){
    if(txt.includes('<!DOCTYPE')||txt.includes('<html'))
      throw new Error(`Route not found (${url}). Paste the latest app/api/generate/route.ts to GitHub and redeploy Vercel.`)
    throw new Error(e instanceof Error?e.message:`Bad response: ${txt.slice(0,80)}`)
  }
}

function Sh({h=80}:{h?:number}){return<div className="shimmer" style={{height:h,borderRadius:12}}/>}

// ─── AccountSwitcher ────────────────────────────────────────────────────────
function AccountSwitcher({channels,active,onSwitch,onAddManual,onDelete}:{channels:Channel[];active:Channel|null;onSwitch:(c:Channel)=>void;onAddManual:()=>void;onDelete:(id:string)=>void}){
  const [open,setOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])
  return(
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:10,padding:'6px 12px',cursor:'pointer',color:'var(--text-primary)',fontSize:13,minWidth:190}}>
        {active?<><div style={{width:8,height:8,borderRadius:'50%',background:active.color,flexShrink:0}}/><div style={{flex:1,textAlign:'left',overflow:'hidden'}}><div style={{fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{active.name}</div>{active.handle&&<div style={{fontSize:10,color:'var(--text-muted)'}}>{active.handle}</div>}</div></>:<span style={{color:'var(--text-muted)'}}>Select channel…</span>}
        <span style={{color:'var(--text-muted)',fontSize:10}}>{open?'▴':'▾'}</span>
      </button>
      {open&&<div style={{position:'absolute',top:'calc(100% + 8px)',left:0,background:'var(--bg-card)',border:'1px solid var(--border-hover)',borderRadius:12,minWidth:250,padding:6,zIndex:100,boxShadow:'0 12px 32px rgba(0,0,0,0.5)'}}>
        {channels.map(ch=>(
          <div key={ch.id} onClick={()=>{onSwitch(ch);setOpen(false)}} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,background:active?.id===ch.id?'var(--bg-elevated)':'transparent',cursor:'pointer'}}>
            <div style={{width:26,height:26,borderRadius:'50%',background:ch.color,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white'}}>{ch.name[0]}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:active?.id===ch.id?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.name}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{ch.handle||ch.niche}{ch.ig_account&&<span style={{color:'#34d399',marginLeft:4}}>● live</span>}</div></div>
            <button onClick={e=>{e.stopPropagation();onDelete(ch.id)}} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:14,padding:'2px 4px'}}>✕</button>
          </div>
        ))}
        <div style={{height:1,background:'var(--border)',margin:'4px 0'}}/>
        <button onClick={()=>{window.location.href='/login';setOpen(false)}} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'transparent',border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}>
          <span style={{background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontWeight:600}}>📷 Connect Instagram account</span>
        </button>
        <button onClick={()=>{onAddManual();setOpen(false)}} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'transparent',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,color:'var(--text-secondary)'}}>+ Add channel manually</button>
      </div>}
    </div>
  )
}

// ─── GenerateModal ──────────────────────────────────────────────────────────
function GenerateModal({channel,apiKey,initialKeyword,onClose,onDone}:{channel:Channel;apiKey:string;initialKeyword?:string;onClose:()=>void;onDone:(posts:Post[],meta:Record<string,string>)=>void}){
  const [kw,setKw]=useState(initialKeyword||'')
  const [obj,setObj]=useState(channel.objective)
  const [aud,setAud]=useState(channel.audience)
  const [dur,setDur]=useState(30)
  const [qm,setQm]=useState(false)
  const [loading,setLoading]=useState(false)
  const [suggesting,setSuggesting]=useState(false)
  const [suggs,setSuggs]=useState<Suggestion[]>([])
  const [showS,setShowS]=useState(false)
  const [prog,setProg]=useState('')
  const [err,setErr]=useState('')
  const n=Math.max(Math.floor(dur/7)*3,3)

  async function getSuggestions(){
    if(!apiKey)return setErr('Add API key in ⚙️ Settings first')
    setSuggesting(true);setErr('');setShowS(true)
    try{const d=await af('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'suggest',channelId:channel.id,niche:channel.niche,objective:obj,audience:aud,apiKey})});setSuggs(d.suggestions||[])}
    catch(e:unknown){setErr(e instanceof Error?e.message:'Failed')}
    finally{setSuggesting(false)}
  }

  async function generate(){
    if(!apiKey)return setErr('Add API key in ⚙️ Settings first')
    setLoading(true);setErr('')
    const steps=['Analysing topic…','Building pillars…','Writing scripts…','Generating AI prompts…',`Finalising ${dur}-day plan…`]
    let i=0;const iv=setInterval(()=>setProg(steps[Math.min(i++,4)]),2500)
    try{
      const plan=await af('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'generate',channelName:channel.name,objective:obj,audience:aud,keyword:kw||'',duration:dur,quickMode:qm,apiKey})})
      const saved=await af('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:{channel_id:channel.id,keyword:kw||channel.niche,duration:dur},posts:plan.posts,channelId:channel.id,strategy:plan.strategy||'',hook_formula:plan.hook_formula||''})})
      onDone(saved.posts,{strategy:plan.strategy||'',hook_formula:plan.hook_formula||'',pillars:(plan.pillars||[]).join(', ')})
    }catch(e:unknown){setErr(e instanceof Error?e.message:'Failed — try again')}
    finally{clearInterval(iv);setLoading(false);setProg('')}
  }

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:620}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div><div style={{fontSize:18,fontWeight:600}}>✨ Generate Content Plan</div><div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>for <span style={{color:'var(--accent)'}}>{channel.name}</span></div></div>
          <button className="btn-ghost" onClick={onClose} style={{padding:'6px 10px'}}>✕</button>
        </div>
        <div style={{display:'grid',gap:14}}>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div className="section-label" style={{margin:0}}>Keyword / Topic <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:9}}>(optional)</span></div>
              <button onClick={getSuggestions} disabled={suggesting} style={{fontSize:11,padding:'3px 10px',background:'rgba(233,69,96,0.12)',color:'var(--accent)',border:'1px solid rgba(233,69,96,0.3)',borderRadius:20,cursor:'pointer'}}>{suggesting?'⚙️ Finding…':'✨ Suggest for me'}</button>
            </div>
            <input className="input" placeholder="Leave blank to auto-generate, or type your topic" value={kw} onChange={e=>setKw(e.target.value)}/>
            {showS&&<div style={{marginTop:8,background:'var(--bg-elevated)',borderRadius:10,padding:10,border:'1px solid var(--border)'}}>
              {suggesting?<div style={{textAlign:'center',padding:'8px 0',color:'var(--text-secondary)',fontSize:13}}>Finding best topics…</div>
              :suggs.map((s,i)=>(
                <div key={i} onClick={()=>{setKw(s.topic);setShowS(false)}} style={{display:'flex',gap:10,padding:'8px 10px',background:'var(--bg-card)',borderRadius:8,cursor:'pointer',border:'1px solid var(--border)',marginBottom:i<suggs.length-1?7:0}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <span style={{fontSize:14,flexShrink:0}}>{FE[s.format]||'📋'}</span>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{s.topic}</div><div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>"{s.hook}"</div></div>
                  <div style={{fontSize:12,fontWeight:700,color:s.score>=8?'#34d399':s.score>=6?'#fbbf24':'var(--text-muted)',flexShrink:0}}>{s.score}/10</div>
                </div>
              ))}
            </div>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><div className="section-label">Objective</div><input className="input" value={obj} onChange={e=>setObj(e.target.value)}/></div>
            <div><div className="section-label">Audience</div><input className="input" value={aud} onChange={e=>setAud(e.target.value)}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div className="section-label">Duration</div>
              <select className="select" style={{width:'100%'}} value={dur} onChange={e=>setDur(+e.target.value)}>
                <option value={7}>7 days — 3 posts</option><option value={14}>14 days — 6 posts</option>
                <option value={30}>30 days — 12 posts</option><option value={60}>60 days — 24 posts</option>
              </select>
            </div>
            <div><div className="section-label">Mode</div>
              <div style={{display:'flex',gap:8,marginTop:2}}>
                {([['Full',false],['Quick ⚡',true]] as const).map(([l,q])=>(
                  <button key={l} onClick={()=>setQm(q)} className="btn-ghost" style={{flex:1,justifyContent:'center',fontSize:12,...(qm===q?{background:'rgba(233,69,96,0.15)',borderColor:'var(--accent)',color:'var(--accent)'}:{})}}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{background:'var(--bg-elevated)',borderRadius:10,padding:'9px 14px',fontSize:12,color:'var(--text-secondary)',border:'1px solid var(--border)'}}>
            {qm?`⚡ Quick — ${n} posts, hooks + hashtags only (~5s).`:`📋 Full — ${n} posts with scripts, AI prompts, CTAs, targets (~20–40s).`}
          </div>
          {err&&<div style={{color:'#f87171',fontSize:12,padding:'10px 12px',background:'rgba(248,113,113,0.1)',borderRadius:8}}>⚠️ {err}</div>}
          {loading?<div style={{textAlign:'center',padding:'16px 0'}}><div style={{fontSize:24,marginBottom:8}}>⚙️</div><div style={{color:'var(--text-secondary)',fontSize:13}}>{prog}</div><div style={{display:'flex',justifyContent:'center',gap:4,marginTop:10}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}</div></div>
          :<div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={generate}>Generate {dur}-Day Plan ✨</button></div>}
        </div>
      </div>
    </div>
  )
}

// ─── AddChannelModal ────────────────────────────────────────────────────────
function AddChannelModal({onClose,onAdded}:{onClose:()=>void;onAdded:(c:Channel)=>void}){
  const [f,setF]=useState({name:'',handle:'',objective:'',audience:'',niche:'',color:COLORS[0]})
  const [loading,setLoading]=useState(false);const [err,setErr]=useState('')
  const s=(k:keyof typeof f,v:string)=>setF(p=>({...p,[k]:v}))
  async function save(){
    if(!f.name||!f.objective||!f.audience)return setErr('Name, objective and audience required')
    setLoading(true);setErr('')
    try{const d=await af('/api/channels',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});onAdded(d)}
    catch(e:unknown){setErr(e instanceof Error?e.message:'Failed');setLoading(false)}
  }
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:500}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}><div style={{fontSize:18,fontWeight:600}}>Add Channel</div><button className="btn-ghost" onClick={onClose} style={{padding:'6px 10px'}}>✕</button></div>
        <div style={{display:'grid',gap:14}}>
          {([['Channel Name *','name','e.g. Testbook AP Channel'],['Instagram Handle','handle','@testbook_ap'],['Niche / Category','niche','e.g. EdTech, Career, Fitness'],['Objective *','objective','e.g. Help NET qualifiers land AP jobs'],['Audience *','audience','e.g. UGC NET qualifiers']] as const).map(([l,k,ph])=>(
            <div key={k}><div className="section-label">{l}</div><input className="input" placeholder={ph} value={f[k]} onChange={e=>s(k,e.target.value)}/></div>
          ))}
          <div><div className="section-label">Colour</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>{COLORS.map(c=><div key={c} onClick={()=>s('color',c)} style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',border:f.color===c?'3px solid white':'3px solid transparent'}}/>)}</div></div>
          {err&&<div style={{color:'#f87171',fontSize:12}}>{err}</div>}
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save} disabled={loading}>{loading?'Saving…':'Add Channel'}</button></div>
        </div>
      </div>
    </div>
  )
}

// ─── SettingsModal ──────────────────────────────────────────────────────────
function SettingsModal({apiKey,onSave,onClose}:{apiKey:string;onSave:(k:string)=>void;onClose:()=>void}){
  const [k,setK]=useState(apiKey);const [saved,setSaved]=useState(false)
  function save(){onSave(k);setSaved(true);setTimeout(()=>setSaved(false),2000)}
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:460}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}><div style={{fontSize:18,fontWeight:600}}>⚙️ Settings</div><button className="btn-ghost" onClick={onClose} style={{padding:'6px 10px'}}>✕</button></div>
        <div style={{display:'grid',gap:14}}>
          <div><div className="section-label">Anthropic API Key</div><input className="input" type="password" placeholder="sk-ant-…" value={k} onChange={e=>setK(e.target.value)}/><div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>Get at <a href="https://console.anthropic.com" target="_blank" style={{color:'var(--accent)'}}>console.anthropic.com</a>. Browser-only — never sent to our servers.</div></div>
          <div style={{background:'var(--bg-elevated)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'var(--text-secondary)',border:'1px solid var(--border)'}}>Powers: content generation, viral finder, channel audit, smart suggestions (~5–8k tokens per full plan).</div>
          <div style={{borderTop:'1px solid var(--border)',paddingTop:14}}><div className="section-label" style={{marginBottom:8}}>Instagram OAuth</div><div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.7}}>To connect Instagram: create Facebook Developer App → add Instagram Graph API → add INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, NEXT_PUBLIC_APP_URL to Vercel env vars.</div></div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button className="btn-ghost" onClick={onClose}>Close</button><button className="btn-primary" onClick={save}>{saved?'✓ Saved':'Save API Key'}</button></div>
        </div>
      </div>
    </div>
  )
}

// ─── PostCard ───────────────────────────────────────────────────────────────
function PostCard({post,pillars,selected,onClick}:{post:Post;pillars:string[];selected:boolean;onClick:()=>void}){
  const pi=pillars.indexOf(post.pillar)%4
  return(
    <div className={`post-card ${selected?'selected':''}`} onClick={onClick}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:10,color:'var(--text-muted)'}}>Day {post.day}</span>{post.priority>=5&&<span style={{fontSize:11,color:'#f59e0b'}}>★</span>}</div>
      <div style={{fontSize:12,fontWeight:600,lineHeight:1.4,marginBottom:7}}>{post.title}</div>
      {post.hook&&<div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:9,lineHeight:1.4}}>{post.hook.slice(0,70)}{post.hook.length>70?'…':''}</div>}
      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
        <span className={`badge ${FS[post.format]||''}`}>{FE[post.format]} {post.format}</span>
        <span className={`badge ${PS[pi]}`} style={{maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.pillar}</span>
      </div>
      <div style={{fontSize:10,color:'var(--text-muted)',marginTop:7}}>{post.post_date}</div>
    </div>
  )
}

// ─── CalendarView ───────────────────────────────────────────────────────────
function CalendarView({posts,pillars,apiKey,channel}:{posts:Post[];pillars:string[];apiKey:string;channel:Channel}){
  const [sel,setSel]=useState<Post|null>(null)
  const [filter,setFilter]=useState('All')
  const [dtab,setDtab]=useState<'brief'|'script'|'prompt'>('brief')
  const [cp,setCp]=useState('')
  // Scripts stored locally — loaded on demand per post (keeps generation fast)
  const [loadedScripts,setLoadedScripts]=useState<Record<string,{script:string;ai_prompt:string}>>({})
  const [loadingScript,setLoadingScript]=useState(false)
  const [scriptErr,setScriptErr]=useState('')
  function copy(t:string,id:string){navigator.clipboard.writeText(t);setCp(id);setTimeout(()=>setCp(''),2000)}
  async function loadScript(post:Post){
    if(!apiKey){setScriptErr('Add your API key in ⚙️ Settings first');return}
    setLoadingScript(true);setScriptErr('')
    try{
      const data=await af('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'post_script',postId:post.id,title:post.title,format:post.format,hook:post.hook,content_brief:post.content_brief,pillar:post.pillar,channelName:channel.name,audience:channel.audience,apiKey})})
      setLoadedScripts(p=>({...p,[post.id]:data}))
    }catch(e:unknown){setScriptErr(e instanceof Error?e.message:'Failed to load script')}
    finally{setLoadingScript(false)}
  }
  const fil=filter==='All'?posts:posts.filter(p=>p.format===filter)
  const wks:Record<number,Post[]>={}
  fil.forEach(p=>{if(!wks[p.week])wks[p.week]=[];wks[p.week].push(p)})
  return(
    <div style={{display:'grid',gridTemplateColumns:sel?'1fr 410px':'1fr',gap:20,alignItems:'start'}}>
      <div>
        <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
          {['All','Reel','Carousel','Long-form'].map(f=><button key={f} onClick={()=>setFilter(f)} className="btn-ghost" style={{fontSize:12,...(filter===f?{background:'rgba(233,69,96,0.15)',borderColor:'var(--accent)',color:'var(--accent)'}:{})}}>{f==='All'?'All':`${FE[f]} ${f}`}</button>)}
          <div style={{marginLeft:'auto',fontSize:12,color:'var(--text-muted)'}}>{fil.length} posts</div>
        </div>
        {Object.entries(wks).map(([wk,wp])=>(
          <div key={wk} style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',marginBottom:10}}>Week {wk} — {WT[+wk-1]||`Phase ${wk}`}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(188px,1fr))',gap:10}}>
              {wp.map(p=><PostCard key={p.id} post={p} pillars={pillars} selected={sel?.id===p.id} onClick={()=>{setSel(sel?.id===p.id?null:p);setDtab('brief')}}/>)}
            </div>
          </div>
        ))}
        {!posts.length&&<div style={{textAlign:'center',padding:'80px 20px',color:'var(--text-muted)'}}><div style={{fontSize:48,marginBottom:12}}>📅</div><div style={{fontSize:15,color:'var(--text-secondary)',marginBottom:6}}>No content yet</div><div style={{fontSize:13}}>Click ✨ Generate — or use 🔥 Viral to find a topic first</div></div>}
      </div>
      {sel&&(
        <div style={{position:'sticky',top:80}}>
          <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-hover)',borderRadius:16,overflow:'hidden'}}>
            <div style={{padding:'15px 18px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:9}}>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <span className={`badge ${FS[sel.format]}`}>{FE[sel.format]} {sel.format}</span>
                  <span className={`badge ${PS[pillars.indexOf(sel.pillar)%4]}`}>{sel.pillar}</span>
                  <span className="badge" style={{background:'var(--bg-elevated)',color:'var(--text-secondary)'}}>Day {sel.day}</span>
                  {sel.priority>=5&&<span className="badge" style={{background:'rgba(245,158,11,0.15)',color:'#fbbf24'}}>★ Priority</span>}
                </div>
                <button onClick={()=>setSel(null)} className="btn-ghost" style={{padding:'4px 9px',fontSize:12}}>✕</button>
              </div>
              <div style={{fontSize:14,fontWeight:600,lineHeight:1.4,marginBottom:3}}>{sel.title}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>{sel.post_date}</div>
            </div>
            <div style={{display:'flex',borderBottom:'1px solid var(--border)'}}>
              {(['brief','script','prompt'] as const).map(t=>(
                <button key={t} onClick={()=>setDtab(t)} style={{flex:1,padding:'9px',fontSize:12,fontWeight:500,border:'none',cursor:'pointer',background:dtab===t?'var(--bg-elevated)':'transparent',color:dtab===t?'var(--text-primary)':'var(--text-muted)',borderBottom:dtab===t?'2px solid var(--accent)':'2px solid transparent'}}>
                  {t==='brief'?'📋 Brief':t==='script'?'🎬 Script':'🤖 AI Prompt'}
                </button>
              ))}
            </div>
            <div style={{padding:'14px 18px',maxHeight:480,overflowY:'auto'}}>
              {dtab==='brief'&&<div style={{display:'grid',gap:12}}>
                {sel.hook&&<div><div className="section-label">Hook</div><div style={{fontSize:13,color:'var(--accent)',fontStyle:'italic',lineHeight:1.6}}>"{sel.hook}"</div></div>}
                {sel.content_brief&&<div><div className="section-label">Content Brief</div><div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}>{sel.content_brief}</div></div>}
                {sel.cta&&<div><div className="section-label">CTA</div><div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}>{sel.cta}</div></div>}
                {sel.hashtags&&<div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><div className="section-label" style={{margin:0}}>Hashtags</div><button onClick={()=>copy(sel.hashtags,'ht')} style={{fontSize:10,color:cp==='ht'?'#34d399':'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>{cp==='ht'?'✓ Copied':'Copy'}</button></div>
                  <div style={{fontSize:12,color:'#3b82f6',lineHeight:1.8}}>{sel.hashtags}</div>
                </div>}
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6}}>
                  {[['Reach',sel.reach_target],['Saves',sel.saves_target],['Shares',sel.shares_target],['Cmts',sel.comments_target],['Plays',sel.plays_target]].map(([l,v])=>(
                    <div key={l as string} style={{background:'var(--bg-elevated)',borderRadius:8,padding:'7px 4px',textAlign:'center'}}><div style={{fontSize:12,fontWeight:600}}>{((v as number)||0).toLocaleString()}</div><div style={{fontSize:9,color:'var(--text-muted)',marginTop:2}}>{l as string}</div></div>
                  ))}
                </div>
              </div>}
              {dtab==='script'&&(()=>{
                const sc=loadedScripts[sel.id]?.script||sel.script
                return sc?<><div style={{display:'flex',justifyContent:'flex-end',marginBottom:9}}><button onClick={()=>copy(sc,'sc')} className="btn-ghost" style={{fontSize:11,padding:'5px 12px'}}>{cp==='sc'?'✓ Copied':'Copy script'}</button></div><div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.8,background:'var(--bg-elevated)',borderRadius:10,padding:12,whiteSpace:'pre-wrap',fontFamily:'monospace'}}>{sc}</div></>
                :<div style={{textAlign:'center',padding:'30px 20px',color:'var(--text-muted)'}}>
                  <div style={{fontSize:32,marginBottom:10}}>📝</div>
                  <div style={{fontSize:13,marginBottom:16,color:'var(--text-secondary)'}}>Script loads on demand — click below to generate</div>
                  {scriptErr&&<div style={{color:'#f87171',fontSize:12,marginBottom:12,padding:'8px 12px',background:'rgba(248,113,113,0.1)',borderRadius:8}}>⚠️ {scriptErr}</div>}
                  <button onClick={()=>loadScript(sel)} disabled={loadingScript} className="btn-primary" style={{padding:'9px 20px',fontSize:13}}>
                    {loadingScript?'⚙️ Generating script…':'🎬 Generate Script'}
                  </button>
                  {loadingScript&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:10}}>~5 seconds…</div>}
                </div>
              })()}
              {dtab==='prompt'&&(()=>{
                const pr=loadedScripts[sel.id]?.ai_prompt||sel.ai_prompt
                return pr?<><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}><div style={{fontSize:12,color:'var(--text-muted)'}}>Paste into Midjourney / DALL-E / Firefly</div><button onClick={()=>copy(pr,'pr')} className="btn-ghost" style={{fontSize:11,padding:'5px 12px'}}>{cp==='pr'?'✓ Copied':'Copy'}</button></div><div style={{fontSize:12,color:'#fbbf24',lineHeight:1.7,background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10,padding:12}}>{pr}</div></>
                :<div style={{textAlign:'center',padding:'30px 20px',color:'var(--text-muted)'}}>
                  <div style={{fontSize:32,marginBottom:10}}>🤖</div>
                  <div style={{fontSize:13,marginBottom:16,color:'var(--text-secondary)'}}>AI prompt loads on demand — generate the script first</div>
                  <button onClick={()=>loadScript(sel)} disabled={loadingScript} className="btn-primary" style={{padding:'9px 20px',fontSize:13}}>
                    {loadingScript?'⚙️ Generating…':'🤖 Generate AI Prompt'}
                  </button>
                </div>
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TrackerView ────────────────────────────────────────────────────────────
function TrackerView({posts}:{posts:Post[]}){
  const [act,setAct]=useState<Record<string,Record<string,number>>>({})
  const upd=(pid:string,f:string,v:string)=>setAct(p=>({...p,[pid]:{...(p[pid]||{}),[f]:+v}}))
  const ms=['reach','saves','shares','comments']
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[['Total posts',posts.length],['Reach/mo',`${(posts.reduce((s,p)=>s+p.reach_target,0)/1000).toFixed(0)}K`],['Saves/mo',`${(posts.reduce((s,p)=>s+p.saves_target,0)/1000).toFixed(1)}K`],['Filled',`${Object.keys(act).length}/${posts.length}`]].map(([l,v])=>(
          <div key={l as string} className="metric-card"><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>{l as string}</div><div style={{fontSize:20,fontWeight:700}}>{v as string|number}</div></div>
        ))}
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>{['Day','Format','Title','T:Reach','A:Reach','%','T:Saves','A:Saves','%','T:Shares','A:Shares','%','T:Cmts','A:Cmts','%','Score'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'center',fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',whiteSpace:'nowrap',fontWeight:600}}>{h}</th>)}</tr></thead>
          <tbody>
            {posts.map(post=>{
              const a=act[post.id]||{}
              const tgt:Record<string,number>={reach:post.reach_target,saves:post.saves_target,shares:post.shares_target,comments:post.comments_target}
              const scores=ms.map(m=>pct(a[m]||0,tgt[m])).filter(x=>x!==null) as number[]
              const avg=scores.length?Math.round(scores.reduce((s,x)=>s+x,0)/scores.length):null
              return(
                <tr key={post.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'8px 6px',color:'var(--text-muted)',fontSize:12,textAlign:'center'}}>D{post.day}</td>
                  <td style={{padding:'8px 6px'}}><span className={`badge ${FS[post.format]}`} style={{fontSize:10}}>{post.format}</span></td>
                  <td style={{padding:'8px 6px',fontSize:12,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.title}</td>
                  {ms.map(m=>{const t=tgt[m];const p=pct(a[m]||0,t);return[
                    <td key={`t${m}`} style={{padding:'6px',textAlign:'center',fontSize:12,color:'rgba(59,130,246,0.7)'}}>{t.toLocaleString()}</td>,
                    <td key={`a${m}`} style={{padding:'4px 6px'}}><input type="number" min="0" placeholder="0" value={a[m]||''} onChange={e=>upd(post.id,m,e.target.value)} style={{width:62,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-primary)',padding:'4px 6px',borderRadius:6,fontSize:12,outline:'none',textAlign:'center'}}/></td>,
                    <td key={`p${m}`} style={{padding:'6px',textAlign:'center',fontSize:12,color:pc(p),fontWeight:600}}>{p!==null?`${p}%`:'—'}</td>
                  ]}).flat()}
                  <td style={{padding:'8px 6px'}}>{avg!==null?<div style={{display:'flex',alignItems:'center',gap:6}}><div className="progress-bar" style={{width:44}}><div className="progress-fill" style={{width:`${Math.min(avg,100)}%`,background:pc(avg)}}/></div><span style={{fontSize:12,color:pc(avg),fontWeight:600}}>{avg}%</span></div>:<span style={{color:'var(--text-muted)',fontSize:12}}>—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!posts.length&&<div style={{textAlign:'center',padding:'80px 20px',color:'var(--text-muted)'}}><div style={{fontSize:48,marginBottom:12}}>📊</div><div style={{fontSize:14}}>Generate a content plan to start tracking</div></div>}
    </div>
  )
}

// ─── PillarView ─────────────────────────────────────────────────────────────
function PillarView({posts,pillars}:{posts:Post[];pillars:string[]}){
  const tot=posts.length||1
  const fmts=['Reel','Carousel','Long-form']
  function avg(arr:Post[],k:keyof Post){return arr.length?Math.round(arr.reduce((s,p)=>s+(p[k] as number),0)/arr.length):0}
  return(
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Content Pillars</div>
        {pillars.length?pillars.map((p,i)=>{const c=posts.filter(x=>x.pillar===p).length;const pt=Math.round(c/tot*100);return(
          <div key={p} style={{marginBottom:11}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:13,color:'var(--text-secondary)'}}>{p}</span><span style={{fontSize:12,color:PC[i%4],fontWeight:600}}>{c} - {pt}%</span></div><div className="progress-bar"><div className="progress-fill" style={{width:pt+'%',background:PC[i%4]}}/></div></div>
        )}):(<div style={{color:'var(--text-muted)',fontSize:13}}>Generate a plan to see pillars</div>)}
      </div>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Format Mix</div>
        {fmts.map((f,i)=>{const c=posts.filter(x=>x.format===f).length;const pt=Math.round(c/tot*100);const cl=['#3b82f6','#10b981','#f59e0b'][i];return(
          <div key={f} style={{marginBottom:11}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:13,color:'var(--text-secondary)'}}>{FE[f]} {f}</span><span style={{fontSize:12,color:cl,fontWeight:600}}>{c} - {pt}%</span></div><div className="progress-bar"><div className="progress-fill" style={{width:pt+'%',background:cl}}/></div></div>
        )})}
        <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-muted)',display:'grid',gap:5}}>
          {[['Reels','~40%','Reach'],['Carousels','~40%','Saves'],['Long-form','~20%','Authority']].map(([lbl,pct2,role2])=>(
            <div key={lbl} style={{display:'flex',gap:8}}><span style={{minWidth:76}}>{lbl}</span><span style={{minWidth:36,color:'var(--accent)'}}>{pct2}</span><span>{role2}</span></div>
          ))}
        </div>
      </div>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Avg Targets by Pillar</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr>{['Pillar','Reach','Saves','Shares','Cmts'].map(h=><th key={h} style={{padding:'5px 7px',textAlign:h==='Pillar'?'left':'center',fontSize:10,color:'var(--text-muted)',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
          <tbody>{pillars.map((pl,i)=>{const pp=posts.filter(x=>x.pillar===pl);return(
            <tr key={pl} style={{borderTop:'1px solid var(--border)'}}><td style={{padding:'6px 7px'}}><span style={{fontSize:11,padding:'2px 7px',borderRadius:20,background:`${PC[i%4]}22`,color:PC[i%4],fontWeight:600}}>{pl}</span></td>
            {(['reach_target','saves_target','shares_target','comments_target'] as const).map(k=><td key={k} style={{padding:'6px 7px',textAlign:'center',color:'var(--text-secondary)'}}>{avg(pp,k).toLocaleString()}</td>)}</tr>
          )})}</tbody>
        </table>
      </div>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Posting Cadence</div>
        {[['Tuesday','Reel','🎬','#3b82f6','Reach & discovery'],['Thursday','Carousel','🖼️','#10b981','Saves & profile visits'],['Saturday','Long-form','📹','#f59e0b','Authority & watch time']].map(([day,fmt,emoji,clr,role])=>(
          <div key={day as string} style={{display:'flex',gap:12,alignItems:'center',padding:'11px 0',borderBottom:'1px solid var(--border)'}}>
            <div style={{width:38,height:38,borderRadius:9,background:`${clr}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{emoji}</div>
            <div><div style={{fontSize:13,fontWeight:500}}>{day} — {fmt}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{role}</div></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── StrategyView ───────────────────────────────────────────────────────────
function StrategyView({posts,meta}:{posts:Post[];meta:Record<string,string>}){
  const p5=posts.filter(p=>p.priority===5)
  const bw:Record<number,Post[]>={}
  posts.forEach(p=>{if(!bw[p.week])bw[p.week]=[];bw[p.week].push(p)})
  return(
    <div style={{display:'grid',gap:18}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[['Posts',posts.length],['Posts/week',3],['Reach/mo',`${(posts.reduce((s,p)=>s+p.reach_target,0)/1000).toFixed(0)}K`],['Saves/mo',`${(posts.reduce((s,p)=>s+p.saves_target,0)/1000).toFixed(1)}K`],['Reels',posts.filter(p=>p.format==='Reel').length],['Carousels',posts.filter(p=>p.format==='Carousel').length],['Long-form',posts.filter(p=>p.format==='Long-form').length],['P5 posts',p5.length]].map(([l,v])=>(
          <div key={l as string} className="metric-card"><div style={{fontSize:20,fontWeight:700}}>{v as string|number}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{l as string}</div></div>
        ))}
      </div>
      {meta.strategy&&<div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:9}}>📌 Channel Strategy</div><div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7}}>{meta.strategy}</div></div>}
      {meta.hook_formula&&<div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:12}}>🎯 Hook Formula</div>
        {[['Belief →','Lead with what the audience believes','#3b82f6'],['Break it →','Show why it costs them time/opportunity','#e94560'],['Truth →','Give the answer that makes them follow','#10b981']].map(([s,d,c])=>(
          <div key={s as string} style={{display:'flex',gap:12,padding:'8px 12px',background:'var(--bg-elevated)',borderRadius:8,marginBottom:7,borderLeft:`3px solid ${c}`}}><span style={{fontSize:11,fontWeight:700,color:c as string,whiteSpace:'nowrap',paddingTop:2,minWidth:60}}>{s}</span><span style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.5}}>{d as string}</span></div>
        ))}
        <div style={{marginTop:9,padding:'9px 12px',background:'rgba(233,69,96,0.08)',border:'1px solid rgba(233,69,96,0.2)',borderRadius:8,fontSize:12,color:'var(--text-secondary)',fontStyle:'italic'}}>"{meta.hook_formula}"</div>
      </div>}
      <div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:12}}>📋 Weekly Breakdown</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {Object.entries(bw).map(([wk,wp])=>(
            <div key={wk} style={{background:'var(--bg-elevated)',borderRadius:10,padding:'11px 14px'}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Week {wk}</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:7}}>{wp.length} posts</div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{wp.slice(0,4).map(p=><span key={p.id} className={`badge ${FS[p.format]}`} style={{fontSize:9}}>{FE[p.format]} {p.format}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
      {p5.length>0&&<div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:11}}>🔥 Priority Posts</div>
        {p5.slice(0,6).map(post=>(
          <div key={post.id} style={{display:'flex',gap:11,alignItems:'center',padding:'8px 11px',background:'var(--bg-elevated)',borderRadius:8,marginBottom:7}}>
            <div style={{width:32,height:32,borderRadius:8,background:'rgba(233,69,96,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--accent)',flexShrink:0}}>D{post.day}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.title}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{post.post_date} · {post.format}</div></div>
            <span className={`badge ${FS[post.format]}`} style={{fontSize:10}}>{FE[post.format]}</span>
          </div>
        ))}
      </div>}
    </div>
  )
}

// ─── ViralView — state in Dashboard for background execution ─────────────────
function ViralView({patterns,insight,loading,error,onFind,onUseTopic}:{patterns:ViralPattern[];insight:string;loading:boolean;error:string;onFind:()=>void;onUseTopic:(t:string)=>void}){
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div><div style={{fontSize:16,fontWeight:600,marginBottom:4}}>🔥 Viral Content Finder</div><div style={{fontSize:13,color:'var(--text-secondary)'}}>Discover what&apos;s working in your niche — click to generate content for it.</div></div>
        <button className="btn-primary" onClick={onFind} disabled={loading}>{loading?'⚙️ Analysing…':patterns.length>0?'🔄 Refresh':'🔍 Find Viral'}</button>
      </div>
      {error&&<div style={{color:'#f87171',padding:'10px 14px',background:'rgba(248,113,113,0.1)',borderRadius:8,marginBottom:14,fontSize:13}}>⚠️ {error}</div>}
      {loading&&<div style={{textAlign:'center',padding:'60px 20px'}}><div style={{fontSize:40,marginBottom:12}}>🔥</div><div style={{fontSize:14,color:'var(--text-secondary)',marginBottom:6}}>Analysing viral patterns…</div><div style={{fontSize:12,color:'var(--text-muted)'}}>~10 sec — switch tabs freely, this runs in background</div></div>}
      {insight&&!loading&&<div style={{background:'rgba(233,69,96,0.08)',border:'1px solid rgba(233,69,96,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}><span style={{color:'var(--accent)',fontWeight:600}}>Key insight: </span>{insight}</div>}
      {!loading&&patterns.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:13}}>
        {patterns.map((p,i)=>(
          <div key={i} className="card" style={{position:'relative'}}>
            <div style={{position:'absolute',top:13,right:13,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:`${RC[p.reach_potential]||'#888'}22`,color:RC[p.reach_potential]||'#888',border:`1px solid ${RC[p.reach_potential]||'#888'}44`}}>{p.reach_potential}</div>
            <div style={{display:'flex',gap:6,marginBottom:9}}>
              <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'var(--bg-elevated)',color:'var(--text-secondary)'}}>{FE[p.format]||'📱'} {p.format}</span>
              <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:`${TC[p.trigger]||'#888'}22`,color:TC[p.trigger]||'var(--text-muted)'}}>{p.trigger}</span>
            </div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6,lineHeight:1.4,paddingRight:65}}>{p.example_title}</div>
            <div style={{fontSize:12,color:'var(--accent)',fontStyle:'italic',marginBottom:7,lineHeight:1.5}}>"{p.hook}"</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:13,lineHeight:1.5}}>{p.reason}</div>
            <button onClick={()=>onUseTopic(p.example_title)} style={{width:'100%',padding:'7px',background:'rgba(233,69,96,0.1)',border:'1px solid rgba(233,69,96,0.3)',borderRadius:8,color:'var(--accent)',fontSize:12,fontWeight:600,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(233,69,96,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(233,69,96,0.1)'}>
              ✨ Generate content for this topic
            </button>
          </div>
        ))}
      </div>}
      {!loading&&!patterns.length&&<div style={{textAlign:'center',padding:'80px 20px',color:'var(--text-muted)'}}><div style={{fontSize:52,marginBottom:14}}>🔥</div><div style={{fontSize:15,color:'var(--text-secondary)',marginBottom:22}}>Find what&apos;s going viral in your niche right now</div><button className="btn-primary" onClick={onFind} style={{padding:'10px 24px'}}>🔍 Find Viral Content</button></div>}
    </div>
  )
}

// ─── AuditView — state in Dashboard for background execution ─────────────────
function AuditView({audit,loading,error,onRun}:{audit:AuditResult|null;loading:boolean;error:string;onRun:()=>void}){
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div><div style={{fontSize:16,fontWeight:600,marginBottom:4}}>📋 Channel Audit</div><div style={{fontSize:13,color:'var(--text-secondary)'}}>AI-powered strategy deep dive — gaps, scores, and growth levers.</div></div>
        <button className="btn-primary" onClick={onRun} disabled={loading}>{loading?'⚙️ Auditing…':audit?'🔄 Re-audit':'📋 Run Audit'}</button>
      </div>
      {error&&<div style={{color:'#f87171',padding:'10px 14px',background:'rgba(248,113,113,0.1)',borderRadius:8,marginBottom:14,fontSize:13}}>⚠️ {error}</div>}
      {loading&&<div style={{textAlign:'center',padding:'80px 20px'}}><div style={{fontSize:40,marginBottom:14}}>📋</div><div style={{fontSize:14,color:'var(--text-secondary)',marginBottom:6}}>Running channel audit…</div><div style={{fontSize:12,color:'var(--text-muted)'}}>~10 sec — switch tabs freely, this runs in background</div></div>}
      {!loading&&audit&&<div style={{display:'grid',gap:15}}>
        <div className="card" style={{display:'flex',gap:18,alignItems:'center'}}>
          <div style={{width:68,height:68,borderRadius:'50%',border:`4px solid ${audit.overall_score>=8?'#34d399':audit.overall_score>=6?'#fbbf24':'#f87171'}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:700,color:audit.overall_score>=8?'#34d399':audit.overall_score>=6?'#fbbf24':'#f87171'}}>{audit.overall_score}</div>
            <div style={{fontSize:9,color:'var(--text-muted)'}}>/ 10</div>
          </div>
          <div><div style={{fontSize:13,fontWeight:600,marginBottom:5}}>Overall Assessment</div><div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7}}>{audit.summary}</div></div>
        </div>
        <div className="card">
          <div style={{fontSize:13,fontWeight:600,marginBottom:11}}>Recommended Content Mix</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:9}}>
            {[['🎬 Reels',audit.content_mix?.reel??40],['🖼️ Carousels',audit.content_mix?.carousel??40],['📹 Long-form',audit.content_mix?.longform??20]].map(([l,v])=>(
              <div key={l as string} style={{background:'var(--bg-elevated)',borderRadius:8,padding:9,textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:'var(--accent)'}}>{v}%</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{l as string}</div></div>
            ))}
          </div>
          <div style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.5}}>{audit.content_mix?.reasoning||''}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
          <div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:11,color:'#34d399'}}>✅ Working</div>{(audit.whats_working||[]).map((item,i)=><div key={i} style={{display:'flex',gap:7,padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:12,color:'var(--text-secondary)'}}><span style={{color:'#34d399',flexShrink:0}}>→</span>{item}</div>)}</div>
          <div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:11,color:'#f87171'}}>❌ Missing</div>{(audit.whats_missing||[]).map((item,i)=><div key={i} style={{display:'flex',gap:7,padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:12,color:'var(--text-secondary)'}}><span style={{color:'#f87171',flexShrink:0}}>→</span>{item}</div>)}</div>
        </div>
        <div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:11}}>🚀 Top Improvements</div>
          {(audit.top_improvements||[]).map((item,i)=>(
            <div key={i} style={{display:'flex',gap:11,padding:'8px 0',borderBottom:'1px solid var(--border)',alignItems:'flex-start'}}>
              <div style={{width:21,height:21,borderRadius:'50%',background:'rgba(233,69,96,0.15)',color:'var(--accent)',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>{i+1}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{item.action}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{item.reason}</div></div>
              <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:`${IC[item.impact]||'#888'}22`,color:IC[item.impact]||'#888',flexShrink:0}}>{item.impact}</span>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
          <div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:9}}>🎯 Hook Formula</div><div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.7,background:'rgba(233,69,96,0.06)',padding:'9px 12px',borderRadius:8,borderLeft:'3px solid var(--accent)',fontStyle:'italic'}}>"{audit.hook_formula}"</div><div style={{fontSize:13,fontWeight:600,marginBottom:5,marginTop:13}}>📅 Cadence</div><div style={{fontSize:12,color:'var(--text-secondary)'}}>{audit.posting_frequency}</div></div>
          <div className="card"><div style={{fontSize:13,fontWeight:600,marginBottom:11}}>📈 Growth Levers</div>{(audit.growth_levers||[]).map((l,i)=><div key={i} style={{display:'flex',gap:9,padding:'6px 0',borderBottom:i<audit.growth_levers.length-1?'1px solid var(--border)':'none',fontSize:12,color:'var(--text-secondary)',alignItems:'flex-start'}}><span style={{color:'var(--accent)',fontWeight:700,flexShrink:0}}>{i+1}.</span>{l}</div>)}</div>
        </div>
      </div>}
      {!loading&&!audit&&<div style={{textAlign:'center',padding:'80px 20px',color:'var(--text-muted)'}}><div style={{fontSize:52,marginBottom:14}}>📋</div><div style={{fontSize:15,color:'var(--text-secondary)',marginBottom:20}}>Get a full AI strategy audit with gaps, scores, and growth levers</div><button className="btn-primary" onClick={onRun} style={{padding:'10px 24px'}}>📋 Run Channel Audit</button></div>}
    </div>
  )
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
type Tab='calendar'|'tracker'|'pillars'|'strategy'|'viral'|'audit'
const TABS:{ key:Tab; label:string }[]=[
  {key:'calendar',label:'📅 Calendar'},{key:'tracker',label:'📊 Tracker'},
  {key:'pillars',label:'🔍 Pillars'},{key:'strategy',label:'🎯 Strategy'},
  {key:'viral',label:'🔥 Viral'},{key:'audit',label:'📋 Audit'},
]

export default function Dashboard(){
  const [channels,setChannels]=useState<Channel[]>([])
  const [active,setActive]=useState<Channel|null>(null)
  const [posts,setPosts]=useState<Post[]>([])
  const [pillars,setPillars]=useState<string[]>([])
  const [meta,setMeta]=useState<Record<string,string>>({})
  const [tab,setTab]=useState<Tab>('calendar')
  const [apiKey,setApiKey]=useState('')
  const [loading,setLoading]=useState(true)
  const [postsLoading,setPostsLoading]=useState(false)

  // Viral + audit state lives here so switching tabs doesn't reset them
  const [viralP,setViralP]=useState<ViralPattern[]>([])
  const [viralI,setViralI]=useState('')
  const [viralL,setViralL]=useState(false)
  const [viralE,setViralE]=useState('')
  const [audit,setAudit]=useState<AuditResult|null>(null)
  const [auditL,setAuditL]=useState(false)
  const [auditE,setAuditE]=useState('')

  const [showGen,setShowGen]=useState(false)
  const [showAdd,setShowAdd]=useState(false)
  const [showSet,setShowSet]=useState(false)
  const [genTopic,setGenTopic]=useState('')

  useEffect(()=>{setApiKey(localStorage.getItem('anthropic_api_key')||'');loadChannels()},[])

  const loadPosts=useCallback(async(cid:string)=>{
    setPostsLoading(true)
    try{const d=await af(`/api/posts?channelId=${cid}`);const p:Post[]=Array.isArray(d)?d:[];setPosts(p);setPillars([...new Set(p.map(x=>x.pillar))].filter(Boolean))}
    catch(e){console.error('loadPosts',e)}
    finally{setLoading(false);setPostsLoading(false)}
  },[])

  async function loadChannels(){
    setLoading(true)
    try{
      const d=await af('/api/channels');const chs:Channel[]=Array.isArray(d)?d:[];setChannels(chs)
      if(chs.length>0){const sid=localStorage.getItem('active_channel_id');const ta=chs.find(c=>c.id===sid)||chs[0];setActive(ta);await loadPosts(ta.id)}
      else setLoading(false)
    }catch(e){console.error('loadChannels',e);setLoading(false)}
  }

  function switchChannel(ch:Channel){setActive(ch);setPosts([]);setPillars([]);setMeta({});localStorage.setItem('active_channel_id',ch.id);loadPosts(ch.id)}
  async function deleteChannel(id:string){
    if(!confirm('Remove this channel?'))return
    await af('/api/channels',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    const u=channels.filter(c=>c.id!==id);setChannels(u)
    if(active?.id===id){localStorage.removeItem('active_channel_id');u.length>0?switchChannel(u[0]):(setActive(null),setPosts([]),setPillars([]))}
  }
  function onChannelAdded(ch:Channel){setChannels(p=>[...p,ch]);setShowAdd(false);switchChannel(ch)}
  function onGenerated(np:Post[],nm:Record<string,string>){setPosts(np);setMeta(nm);setPillars([...new Set(np.map(x=>x.pillar))].filter(Boolean));setShowGen(false);setGenTopic('');setTab('calendar')}
  function saveKey(k:string){setApiKey(k);localStorage.setItem('anthropic_api_key',k)}
  function useViralTopic(t:string){setGenTopic(t);setShowGen(true)}

  async function findViral(){
    if(!active||!apiKey)return setViralE(!apiKey?'Add API key in ⚙️ Settings':'No channel selected')
    setViralL(true);setViralE('')
    try{const d=await af('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'viral',niche:active.niche,handle:active.handle,objective:active.objective,audience:active.audience,apiKey})});setViralP(d.viral_patterns||[]);setViralI(d.insight||'')}
    catch(e:unknown){setViralE(e instanceof Error?e.message:'Failed')}
    finally{setViralL(false)}
  }

  async function runAudit(){
    if(!active||!apiKey)return setAuditE(!apiKey?'Add API key in ⚙️ Settings':'No channel selected')
    setAuditL(true);setAuditE('')
    try{const d=await af('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'audit',handle:active.handle,niche:active.niche,objective:active.objective,audience:active.audience,apiKey})});setAudit(d)}
    catch(e:unknown){setAuditE(e instanceof Error?e.message:'Failed')}
    finally{setAuditL(false)}
  }

  return(
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <nav style={{background:'var(--bg-surface)',borderBottom:'1px solid var(--border)',padding:'0 18px',height:56,display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:30}}>
        <div style={{fontSize:16,fontWeight:700,whiteSpace:'nowrap'}}><span style={{color:'var(--accent)'}}>Content</span>Dash</div>
        <AccountSwitcher channels={channels} active={active} onSwitch={switchChannel} onAddManual={()=>setShowAdd(true)} onDelete={deleteChannel}/>
        <div style={{flex:1}}/>
        <div style={{display:'flex',gap:2,overflowX:'auto'}}>
          {TABS.map(t=><button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)} style={{fontSize:12,padding:'7px 13px',whiteSpace:'nowrap'}}>{t.label}</button>)}
        </div>
        <div style={{flex:1}}/>
        <button className="btn-primary" onClick={()=>active?setShowGen(true):setShowAdd(true)} style={{whiteSpace:'nowrap',fontSize:13}}>✨ Generate</button>
        <button className="btn-ghost" onClick={()=>setShowSet(true)} style={{padding:'7px 10px'}}>⚙️</button>
      </nav>

      {active&&<div style={{background:'var(--bg-surface)',borderBottom:'1px solid var(--border)',padding:'5px 18px',display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:active.color,flexShrink:0}}/>
        <div style={{fontSize:12,color:'var(--text-secondary)',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{color:'var(--text-primary)',fontWeight:500}}>{active.name}</span>
          {active.handle&&<span>{active.handle}</span>}
          {active.niche&&<><span style={{color:'var(--text-muted)'}}>·</span><span>{active.niche}</span></>}
          <span style={{color:'var(--text-muted)'}}>·</span><span>{posts.length} posts</span>
          {active.ig_account&&<span style={{color:'#34d399',fontSize:11}}>● Instagram live</span>}
          {viralL&&tab!=='viral'&&<span style={{fontSize:11,color:'#f59e0b'}}>🔥 Viral loading…</span>}
          {auditL&&tab!=='audit'&&<span style={{fontSize:11,color:'#f59e0b'}}>📋 Audit loading…</span>}
        </div>
      </div>}

      <main style={{flex:1,padding:'20px',maxWidth:1440,width:'100%',margin:'0 auto'}}>
        {loading?<div style={{display:'grid',gap:12}}>{[140,110,110].map((h,i)=><Sh key={i} h={h}/>)}</div>
        :!active?<div style={{textAlign:'center',padding:'100px 20px'}}>
          <div style={{fontSize:52,marginBottom:14}}>📱</div>
          <div style={{fontSize:22,fontWeight:600,marginBottom:7}}>Welcome to ContentDash</div>
          <div style={{fontSize:14,color:'var(--text-secondary)',marginBottom:30}}>Add your first channel to start</div>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="btn-ig" onClick={()=>window.location.href='/login'} style={{padding:'12px 24px',fontSize:14}}>📷 Connect Instagram</button>
            <button className="btn-ghost" onClick={()=>setShowAdd(true)} style={{padding:'12px 24px',fontSize:14}}>Add manually</button>
          </div>
        </div>
        :postsLoading?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(188px,1fr))',gap:10}}>{[...Array(9)].map((_,i)=><Sh key={i} h={130}/>)}</div>
        :<>
          {tab==='calendar'&&active&&<CalendarView posts={posts} pillars={pillars} apiKey={apiKey} channel={active}/>}
          {tab==='tracker'&&<TrackerView posts={posts}/>}
          {tab==='pillars'&&<PillarView posts={posts} pillars={pillars}/>}
          {tab==='strategy'&&<StrategyView posts={posts} meta={meta}/>}
          {tab==='viral'&&<ViralView patterns={viralP} insight={viralI} loading={viralL} error={viralE} onFind={findViral} onUseTopic={useViralTopic}/>}
          {tab==='audit'&&<AuditView audit={audit} loading={auditL} error={auditE} onRun={runAudit}/>}
        </>}
      </main>

      {showGen&&active&&<GenerateModal channel={active} apiKey={apiKey} initialKeyword={genTopic} onClose={()=>{setShowGen(false);setGenTopic('')}} onDone={onGenerated}/>}
      {showAdd&&<AddChannelModal onClose={()=>setShowAdd(false)} onAdded={onChannelAdded}/>}
      {showSet&&<SettingsModal apiKey={apiKey} onSave={saveKey} onClose={()=>setShowSet(false)}/>}
    </div>
  )
}
