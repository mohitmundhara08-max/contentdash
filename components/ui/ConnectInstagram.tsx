export default function ConnectInstagram() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(131,58,180,0.12), rgba(253,29,29,0.12), rgba(252,176,69,0.12))',
      border: '1px solid rgba(253,29,29,0.2)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 16,
      marginBottom: 20,
    }}>
      <div style={{ fontSize: 28 }}>📷</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Connect Instagram for live metrics</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Link your Instagram Business account to pull real reach, saves, and engagement data automatically.
        </div>
      </div>
      <button
        className="btn-ig"
        onClick={() => window.location.href = '/login'}
        style={{ whiteSpace: 'nowrap', fontSize: 12, padding: '8px 16px' }}
      >
        Connect now
      </button>
    </div>
  )
}
