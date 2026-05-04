interface LogoProps { skipIntro: boolean }

export function Logo({ skipIntro }: LogoProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '38%',
      left: '50%',
      textAlign: 'center',
      width: '92vw',
      display: 'flex',
      justifyContent: 'center',
      transform: skipIntro ? 'translate(-50%, -50%)' : undefined,
      opacity: skipIntro ? 1 : undefined,
      animation: skipIntro ? undefined : 'tsGlitchIn 0.9s 3.85s both',
    }}>
      <svg
        viewBox="0 0 1080 183"
        style={{ display: 'block', maxWidth: '92vw', height: 'auto' }}
      >
        <defs>
          <linearGradient id="ts-g-orange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f07030" />
            <stop offset="45%"  stopColor="#e05418" />
            <stop offset="100%" stopColor="#8a2e08" />
          </linearGradient>
          <linearGradient id="ts-g-white" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f4f0e4" />
            <stop offset="50%"  stopColor="#e0dcd0" />
            <stop offset="100%" stopColor="#b8b4a4" />
          </linearGradient>
          <filter id="ts-f-drop">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.9" />
          </filter>
          <filter id="ts-f-orange-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feColorMatrix in="b" type="matrix"
              values="1 0.3 0 0 0  0.25 0.1 0 0 0  0 0 0 0 0  0 0 0 0.55 0" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Δ — orange gradient + glow, pulsing */}
        <text
          x="10" y="148"
          fontFamily="'Saira Condensed', sans-serif"
          fontWeight={900} fontSize={110}
          fill="url(#ts-g-orange)"
          filter="url(#ts-f-orange-glow)"
          style={{ animation: 'tsLogoGlow 4s ease-in-out infinite' }}
        >Δ</text>

        {/* COVERT OPERATIONS */}
        <text
          x="112" y="148"
          fontFamily="'Saira Condensed', sans-serif"
          fontWeight={900} fontSize={110}
          letterSpacing={-2}
          fill="url(#ts-g-white)"
          filter="url(#ts-f-drop)"
        >COVERT OPERATIONS</text>

        {/* orange rule (Variant 1) */}
        <rect x="112" y="157" width="956" height="2" fill="#e05418" opacity={0.8} />

        {/* tagline */}
        <text
          x="114" y="177"
          fontFamily="'DM Sans', sans-serif"
          fontWeight={500} fontSize={11}
          letterSpacing={5}
          fill="#e05418"
        >ELIMINATE · INFILTRATE · DOMINATE</text>
      </svg>
    </div>
  )
}
