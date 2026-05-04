import { useEffect, useState } from 'react'
import { Particles }     from './Particles'
import { BootSequence }  from './BootSequence'
import { Logo }          from './Logo'
import { Menu }          from './Menu'

// Persists across remounts — set to true after the first intro plays
let introShown = false

export function TitleScreen() {
  // Capture once at mount — prevents re-renders from flipping this mid-animation
  const [skipIntro] = useState(() =>
    introShown || new URLSearchParams(window.location.search).get('skipIntro') === '1'
  )

  useEffect(() => {
    introShown = true
  }, [])
  const chromeFade = skipIntro ? undefined : 'tsFadeIn 1s 4.4s both'
  const stampFade  = skipIntro ? undefined : 'tsFadeIn 1s 4.5s both'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', animation: 'menuFadeIn 0.35s cubic-bezier(0.2,0.8,0.3,1) both' }}>

      {/* ── background ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(30,36,20,0.95) 0%, rgba(8,9,6,1) 65%)',
      }} />

      {/* ── fog layers ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '30%', height: 120,
        background: 'linear-gradient(0deg, transparent, rgba(30,40,18,0.12), transparent)',
        pointerEvents: 'none', opacity: 0,
        animation: 'tsFogDrift 22s ease-in-out infinite 0s',
        ['--fog-op' as string]: '0.08',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '45%', height: 100,
        background: 'linear-gradient(0deg, transparent, rgba(20,30,12,0.08), transparent)',
        pointerEvents: 'none', opacity: 0,
        animation: 'tsFogDrift 18s ease-in-out infinite -8s',
        ['--fog-op' as string]: '0.06',
      }} />

      {/* ── vignette ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
      }} />

      {/* ── top edge orange glow ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(224,84,24,0.8), transparent)',
      }} />

      {/* ── particles (always live) ── */}
      <Particles />

      {/* ── boot sequence ── */}
      {!skipIntro && <BootSequence />}

      {/* ── corner brackets ── */}
      <div style={{
        position: 'absolute', top: 20, left: 24,
        width: 28, height: 28,
        borderTop: '1.5px solid #8a9a62', borderLeft: '1.5px solid #8a9a62',
        opacity: skipIntro ? 0.5 : 0,
        animation: chromeFade,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 20, right: 24,
        width: 28, height: 28,
        borderTop: '1.5px solid #8a9a62', borderRight: '1.5px solid #8a9a62',
        opacity: skipIntro ? 0.5 : 0,
        animation: chromeFade,
        pointerEvents: 'none',
      }} />

      {/* ── classification stamps ── */}
      <div style={{
        position: 'absolute', top: 22, left: 64,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
        color: 'rgba(106,112,72,0.5)',
        opacity: skipIntro ? 1 : 0,
        animation: stampFade,
        pointerEvents: 'none',
      }}>CLASSIFIED</div>
      <div style={{
        position: 'absolute', top: 36, left: 64,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(106,112,72,0.35)',
        opacity: skipIntro ? 1 : 0,
        animation: stampFade,
        pointerEvents: 'none',
      }}>© 2026 Loona! Designs</div>
      <div style={{
        position: 'absolute', top: 22, right: 64,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
        color: 'rgba(106,112,72,0.5)',
        opacity: skipIntro ? 1 : 0,
        animation: stampFade,
        pointerEvents: 'none',
      }}>TOP SECRET // CO-Δ-0.1.0-ALPHA</div>

      {/* ── logo ── */}
      <Logo skipIntro={skipIntro} />

      {/* ── menu ── */}
      <Menu skipIntro={skipIntro} />


    </div>
  )
}
