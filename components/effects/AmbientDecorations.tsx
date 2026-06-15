'use client'
const STARS = [
  {l:'4%',t:'12%',c:'✦',s:12,d:20},{l:'92%',t:'18%',c:'✧',s:16,d:26},
  {l:'3%',t:'50%',c:'★',s:13,d:22},{l:'94%',t:'44%',c:'✶',s:15,d:19},
  {l:'7%',t:'78%',c:'✸',s:11,d:24},{l:'88%',t:'72%',c:'✦',s:18,d:17},
]
const ARROWS = [
  {l:'4%',t:'30%',c:'↑',ay:-18,dur:2},{l:'93%',t:'25%',c:'↓',ay:18,dur:3},
  {l:'2%',t:'62%',c:'→',ay:-12,dur:2.5},{l:'95%',t:'60%',c:'←',ay:12,dur:2},
]
export default function AmbientDecorations() {
  return (
    <>
      {STARS.map((s,i)=>(
        <div key={i} aria-hidden style={{position:'fixed',left:s.l,top:s.t,fontSize:s.s,color:'rgba(255,225,0,.28)',pointerEvents:'none',zIndex:40,animation:`spinSlow ${s.d}s linear infinite`}}>{s.c}</div>
      ))}
      {ARROWS.map((a,i)=>(
        <div key={i} aria-hidden style={{position:'fixed',left:a.l,top:a.t,fontSize:20,color:'rgba(204,58,0,.4)',pointerEvents:'none',zIndex:40,animation:`arrowBounce ${a.dur}s ease-in-out infinite`,['--ay' as string]:`${a.ay}px`}}>{a.c}</div>
      ))}
      <style>{`
        @keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes arrowBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(var(--ay,-14px))}}
      `}</style>
    </>
  )
}
