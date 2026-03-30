import type { AtlasNode } from '../data/atlas'

type AppHeaderProps = {
  roots: AtlasNode[]
}

export function AppHeader({ roots }: AppHeaderProps) {
  return (
    <div id="hdr">
      <div className="hdr-center">
        <div className="hdr-title">✦ Celestial Atlas of Sound ✦</div>
        <div className="hdr-sub">A stellar cartography of music genres &amp; radio transmissions</div>
      </div>
      <div className="legend">
        {roots.map((root) => (
          <div key={root.id} className="legend-item">
            <div className="legend-dot" style={{ background: root.color, boxShadow: `0 0 6px ${root.color}` }} />
            <span style={{ color: 'var(--text-dim)' }}>{root.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
