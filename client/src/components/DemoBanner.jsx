import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DEMO_USERS, DEMO_PASSWORD } from '../demo/mockApi'

// Demo-only notice: lists the demo accounts on the auth pages.
// Renders nothing outside demo mode or once the user is logged in.
// Uses inline styles only, so it cannot clash with existing CSS class names.

const ROLE_LABEL = { student: 'Student', investor: 'Investor', doctor: 'Doctor', admin: 'Admin' }

export default function DemoBanner() {
  useLocation() // re-evaluate on every route change (e.g. right after login)
  const [hidden, setHidden] = useState(false)
  const [copied, setCopied] = useState('')

  if (import.meta.env.VITE_DEMO !== 'true') return null
  if (hidden || localStorage.getItem('token')) return null

  const copy = (text) => {
    try { navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopied(text)
    setTimeout(() => setCopied(''), 1200)
  }

  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 9999, width: 300, maxWidth: 'calc(100vw - 32px)',
      background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: 12,
      boxShadow: '0 10px 30px rgba(0,0,0,.35)', padding: 14, fontFamily: 'system-ui, sans-serif', fontSize: 13,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 14 }}>Demo mode</strong>
        <button onClick={() => setHidden(true)} aria-label="Close"
          style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ color: '#9ca3af', marginBottom: 10 }}>
        This is a demo with 4 accounts, one per role. Click a username to copy it.
      </div>
      {DEMO_USERS.map((d) => (
        <div key={d.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #1f2937' }}>
          <span style={{ color: '#d1d5db' }}>{ROLE_LABEL[d.role] || d.role}</span>
          <button onClick={() => copy(d.username)}
            style={{ background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}>
            {copied === d.username ? 'Copied ✓' : d.username}
          </button>
        </div>
      ))}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#d1d5db' }}>Password (all)</span>
        <button onClick={() => copy(DEMO_PASSWORD)}
          style={{ background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}>
          {copied === DEMO_PASSWORD ? 'Copied ✓' : DEMO_PASSWORD}
        </button>
      </div>
    </div>
  )
}
