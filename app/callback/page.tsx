'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackInner() {
  const params = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const error = params.get('error')
    const success = params.get('success')
    const username = params.get('username')

    if (error) {
      setStatus('error')
      setMessage(decodeURIComponent(error))
    } else if (success) {
      setStatus('success')
      setMessage(`@${username} connected successfully!`)
      setTimeout(() => { window.location.href = '/' }, 2000)
    } else {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }, [params])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <div style={{ textAlign:'center', padding:40 }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize:40, marginBottom:16 }}>⚙️</div>
            <div style={{ fontSize:16, color:'var(--text-secondary)' }}>Connecting your account…</div>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
            <div style={{ fontSize:16, fontWeight:600 }}>{message}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:8 }}>Redirecting to dashboard…</div>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize:40, marginBottom:16 }}>❌</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#f87171' }}>Connection failed</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:8, marginBottom:20 }}>{message}</div>
            <button className="btn-primary" onClick={() => window.location.href = '/login'}>Try again</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return <Suspense><CallbackInner /></Suspense>
}
