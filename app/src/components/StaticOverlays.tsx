export function StaticOverlays() {
  return (
    <>
      <div id="hints">
        <div>✦ Click a constellation to reveal stars</div>
        <div>✦ Click again to collapse</div>
        <div>✦ Click any star for radio stations</div>
        <div>✦ Drag &amp; scroll to navigate</div>
      </div>

      <svg id="compass" width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(212,168,83,0.8)" strokeWidth="0.7" />
        <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(212,168,83,0.5)" strokeWidth="0.5" strokeDasharray="2 4" />
        <polygon points="30,4 33,28 30,32 27,28" fill="rgba(212,168,83,0.9)" />
        <polygon points="30,56 33,32 30,28 27,32" fill="rgba(212,168,83,0.4)" />
        <polygon points="4,30 28,27 32,30 28,33" fill="rgba(212,168,83,0.4)" />
        <polygon points="56,30 32,27 28,30 32,33" fill="rgba(212,168,83,0.3)" />
        <circle cx="30" cy="30" r="3" fill="rgba(212,168,83,0.8)" />
        <circle cx="30" cy="30" r="1.5" fill="rgba(212,168,83,1)" />
        <text x="30" y="19" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.9)" fontFamily="Orbitron, sans-serif">N</text>
        <text x="30" y="52" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.6)" fontFamily="Orbitron, sans-serif">S</text>
        <text x="7" y="33" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.6)" fontFamily="Orbitron, sans-serif">W</text>
        <text x="53" y="33" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.6)" fontFamily="Orbitron, sans-serif">E</text>
      </svg>
    </>
  )
}
