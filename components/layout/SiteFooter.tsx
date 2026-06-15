'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
const AdminPopup = dynamic(()=>import('@/components/admin/AdminPopup'),{ssr:false})

export default function SiteFooter() {
  const [showAdmin, setShowAdmin] = useState(false)
  return (
    <>
      <footer style={{ background:'var(--navy-dark)',borderTop:'2px solid rgba(255,225,0,.12)',padding:'40px clamp(16px,5vw,60px)',position:'relative' }}>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10,maxWidth:1000,margin:'0 auto' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(36px,7vw,60px)',color:'var(--yellow)',letterSpacing:10,textShadow:'3px 3px 0 var(--orange)' }}>PITARA</div>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:5,color:'var(--orange)',opacity:.7 }}>HIDDEN CINEMA · REAL ROOMS · REAL APPLAUSE</p>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'rgba(255,225,0,.2)',letterSpacing:3,marginTop:16 }}>© 2026 KHULA PITARA</p>
        </div>
        <button onClick={()=>setShowAdmin(true)} style={{ position:'absolute',bottom:14,right:20,background:'none',border:'none',color:'rgba(255,225,0,.12)',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:2,cursor:'pointer' }} aria-label="Admin access">
          Admin
        </button>
      </footer>
      {showAdmin && <AdminPopup onClose={()=>setShowAdmin(false)} />}
    </>
  )
}
