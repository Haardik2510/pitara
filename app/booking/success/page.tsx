'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { TicketData } from '@/app/types'
import gsap from 'gsap'

const DigitalTicket = dynamic(()=>import('@/components/tickets/DigitalTicket'),{ssr:false})

function SuccessContent() {
  const params=useSearchParams(), ref=params.get('ref')
  const [ticket,  setTicket]  = useState<TicketData|null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(()=>{
    if (!ref) { setError('No booking reference found.'); setLoading(false); return }
    let attempts=0
    const poll=async()=>{
      try {
        const res=await fetch(`/api/bookings/by-ref?ref=${encodeURIComponent(ref)}`)
        const data=await res.json()
        if (data.ticket) {
          setTicket(data.ticket); setLoading(false)
          setTimeout(()=>{ for(let i=0;i<24;i++) setTimeout(()=>confetti(),i*60) },200)
        } else if (attempts<10) { attempts++; setTimeout(poll,1500) }
        else { setError('Booking confirmation is taking longer than expected. Your payment was received — check your email or contact us with ref: '+ref); setLoading(false) }
      } catch { setError('Could not load booking details.'); setLoading(false) }
    }
    poll()
  },[ref])

  const confetti=()=>{
    const p=document.createElement('div'), cols=['#FFE100','#CC3A00','#f5eed8','#18196D'], sz=6+Math.random()*10
    p.style.cssText=`position:fixed;left:${Math.random()*100}vw;top:-20px;width:${sz}px;height:${sz}px;background:${cols[Math.floor(Math.random()*4)]};pointer-events:none;z-index:9000;`
    document.body.appendChild(p)
    gsap.to(p,{y:window.innerHeight+40,x:(Math.random()-.5)*200,rotation:Math.random()*720,duration:2+Math.random()*2,ease:'power1.in',onComplete:()=>p.remove()})
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--navy-deep)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px clamp(16px,5vw,60px)'}}>
      <div style={{position:'fixed',top:0,left:'47%',width:'6%',height:'140%',clipPath:'polygon(20% 0,80% 0,100% 100%,0% 100%)',background:'rgba(255,225,0,.025)',pointerEvents:'none',animation:'beamFlicker 5s ease-in-out infinite'}} />
      {loading && (
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(28px,5vw,52px)',color:'var(--yellow)',letterSpacing:6,marginBottom:20}}>Confirming Your Seat…</div>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,background:'var(--orange)',borderRadius:'50%',animation:`pulse 1s ease-in-out ${i*.2}s infinite`}}/>)}
          </div>
        </div>
      )}
      {!loading&&error&&(
        <div style={{textAlign:'center',maxWidth:520}}>
          <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:'var(--orange)',letterSpacing:4,marginBottom:16}}>SOMETHING WENT WRONG</p>
          <p style={{fontFamily:"'Inter',sans-serif",color:'var(--cream)',opacity:.8,lineHeight:1.7,marginBottom:24}}>{error}</p>
          <a href="/" style={{color:'var(--yellow)',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:3}}>← Return to PITARA</a>
        </div>
      )}
      {!loading&&ticket&&(
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:32,maxWidth:800,width:'100%'}}>
          <div style={{textAlign:'center'}}>
            <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:6,color:'var(--orange)',marginBottom:10}}>✦ BOOKING CONFIRMED ✦</p>
            <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(36px,7vw,80px)',color:'var(--yellow)',lineHeight:1,textShadow:'3px 3px 0 var(--orange)'}}>PITARA KHUL<br/>CHUKA HAI!</h1>
            <p style={{fontFamily:"'Oswald',sans-serif",fontWeight:500,fontSize:'clamp(14px,2vw,20px)',color:'var(--cream)',marginTop:12,opacity:.85}}>Your seat is reserved. See you in the dark.</p>
          </div>
          <DigitalTicket ticket={ticket}/>
          <a href="/" className="btn-outline" style={{fontSize:13,textDecoration:'none'}}>← Back to PITARA</a>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.5);opacity:1}}`}</style>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'var(--navy-deep)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Bebas Neue',sans-serif",color:'var(--yellow)',fontSize:32,letterSpacing:6}}>Loading…</span></div>}>
      <SuccessContent/>
    </Suspense>
  )
}
