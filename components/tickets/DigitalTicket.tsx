'use client'
import { useEffect, useRef } from 'react'
import type { TicketData } from '@/app/types'

export default function DigitalTicket({ ticket }: { ticket: TicketData }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv=ref.current; if (!cv) return
    const ctx=cv.getContext('2d')!
    cv.width=680; cv.height=300
    ctx.fillStyle='#0a0b35'; ctx.fillRect(0,0,680,300)
    ctx.fillStyle='#18196D'; ctx.fillRect(0,0,200,300)
    ctx.fillStyle='#CC3A00'; ctx.fillRect(0,0,680,8)
    ctx.setLineDash([8,6]); ctx.strokeStyle='rgba(255,225,0,.2)'; ctx.lineWidth=1.5
    ctx.beginPath(); ctx.moveTo(200,0); ctx.lineTo(200,300); ctx.stroke()
    ctx.setLineDash([])
    for (let y=16;y<300;y+=24) { ctx.fillStyle='#0a0b35'; ctx.beginPath(); ctx.arc(200,y,5,0,Math.PI*2); ctx.fill() }
    // PITARA brand
    ctx.fillStyle='#FFE100'; ctx.font=`bold 36px 'Bebas Neue',sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.shadowColor='rgba(255,225,0,.3)'; ctx.shadowBlur=8; ctx.fillText('PITARA',100,115); ctx.shadowBlur=0
    ctx.fillStyle='#CC3A00'; ctx.font=`10px 'IBM Plex Mono',monospace`; ctx.fillText('HIDDEN CINEMA',100,140)
    ctx.fillStyle='rgba(255,225,0,.5)'; ctx.font=`9px 'IBM Plex Mono',monospace`; ctx.fillText(ticket.booking_reference,100,220)
    // Event details
    const rx=230
    ctx.fillStyle='#CC3A00'; ctx.font=`bold 10px 'IBM Plex Mono',monospace`; ctx.textAlign='left'; ctx.fillText('NOW SHOWING',rx,36)
    ctx.fillStyle='#FFE100'; ctx.font=`bold 28px 'Oswald',sans-serif`; ctx.fillText(ticket.screening_title.toUpperCase().slice(0,28),rx,72)
    const lines=[`${ticket.date}  ·  ${ticket.time}`,ticket.venue,ticket.user_name]
    lines.forEach((l,i) => { ctx.fillStyle='rgba(245,238,216,.8)'; ctx.font=`${i===0?'500':'400'} 13px 'Inter',sans-serif`; ctx.fillText(l,rx,102+i*22) })
    ctx.fillStyle='#FFE100'; ctx.font=`bold 22px 'Bebas Neue',sans-serif`; ctx.fillText(`₹${ticket.amount_paid}`,rx,180)
    // QR
    if (ticket.qr_code) {
      const img=new Image(); img.onload=()=>{ ctx.fillStyle='#fff'; ctx.fillRect(568,100,88,88); ctx.drawImage(img,572,104,80,80) }; img.src=ticket.qr_code
    }
    ctx.fillStyle='#CC3A00'; ctx.fillRect(0,292,680,8)
  }, [ticket])

  const dl = () => {
    const a=document.createElement('a'); a.href=ref.current!.toDataURL('image/png')
    a.download=`pitara-ticket-${ticket.booking_reference}.png`; a.click()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <canvas ref={ref} style={{ maxWidth:'100%', border:'1px solid rgba(255,225,0,.2)' }} />
      <button className="btn-outline" onClick={dl} style={{ fontSize:13 }}>↓ Download Ticket</button>
    </div>
  )
}
