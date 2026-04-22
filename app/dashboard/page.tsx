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
  const txt=(await res.text()).trim()
  try{
    const d=JSON.parse(txt)
    if(!res.ok)throw new Error(d.error||`Error ${res.status}`)
    return d
  }catch(e){
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
    try{
      const d=await af('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'suggest',channelId:channel.id,niche:channel.niche,objective:obj,audience:aud,apiKey})})
      if(d.error)throw new Error(d.error as string)
      setSuggs(d.suggestions||[])
    }catch(e:unknown){setErr(e instanceof Error?e.message:'Failed')}
    finally{setSuggesting(false)}
  }

  async function generate(){
    if(!apiKey)return setErr('Add API key in ⚙️ Settings first')
    setLoading(true);setErr('')
    const steps=['Picking best topics…','Writing hooks…','Building calendar…','Adding hashtags…','Almost done…']
    let i=0;const iv=setInterval(()=>setProg(steps[Math.min(i++,4)]),2000)
    try{
      const plan=await af('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'generate',channelName:channel.name,objective:obj,audience:aud,keyword:kw||'',duration:dur,quickMode:true,apiKey})})
      if(plan.error)throw new Error(plan.error as string)
      const saved=await af('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:{channel_id:channel.id,keyword:kw||channel.niche,duration:dur},posts:plan.posts,channelId:channel.id,strategy:plan.strategy||'',hook_formula:plan.hook_formula||''})})
      onDone(saved.posts,{strategy:plan.strategy||'',hook_formula:plan.hook_formula||'',pillars:(plan.pillars||[]).join(', ')})
    }catch(e:unknown){setErr(e instanceof Error?e.message:'Failed — try again')}
    finally{clearInterval(iv);setLoading(false);setProg('')}
  }

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:600}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div><div style={{fontSize:18,fontWeight:600}}>✨ Generate Content Plan</div><div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>for <span style={{color:'var(--accent)'}}>{channel.name}</span></div></div>
          <button className="btn-ghost" onClick={onClose} style={{padding:'6px 10px'}}>✕</button>
        </div>
        <div style={{display:'grid',gap:14}}>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div className="section-label" style={{margin:0}}>Topic <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:10}}>(optional — leave blank 
