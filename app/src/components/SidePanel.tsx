import { getStationStyleLabels } from '../data/selectors'
import type { AtlasNode, AtlasStation } from '../data/atlas'
import { levelLabels } from '../app/constants'

type SidePanelProps = {
  open: boolean
  selectedNode: AtlasNode | null
  panelStations: AtlasStation[]
  childCount: number
  currentStationId: string | null
  loadingStationId: string | null
  playing: boolean
  onClose: () => void
  onPlayStation: (station: AtlasStation) => void
}

export function SidePanel({
  open,
  selectedNode,
  panelStations,
  childCount,
  currentStationId,
  loadingStationId,
  playing,
  onClose,
  onPlayStation,
}: SidePanelProps) {
  return (
    <div id="panel" className={open ? 'open' : ''}>
      <div id="panel-hdr">
        <div className="panel-scanline" aria-hidden="true" />
        <div className="panel-corners" aria-hidden="true" />
        <div className="panel-hdr-meta">
          <span id="p-level">{selectedNode ? levelLabels[selectedNode.level] : 'Constellation'}</span>
          <span className="panel-hdr-code">Sector / {selectedNode?.id ?? 'awaiting-lock'}</span>
        </div>
        <div id="p-name">{selectedNode?.name ?? 'Genre'}</div>
        <button id="p-close" title="Close" onClick={onClose}>✕</button>
      </div>
      <div id="p-body">
        {!selectedNode ? null : panelStations.length ? (
          <>
            {childCount ? (
              <div className="panel-note">
                <span style={{ color: 'var(--gold)' }}>✦</span> Contains {childCount} sub-genre{childCount !== 1 ? 's' : ''}. Click the star to expand.
              </div>
            ) : null}
            <div className="panel-section-label">
              Radio Transmissions
            </div>
            {panelStations.map((station) => {
              const active = currentStationId === station.id
              const loading = loadingStationId === station.id
              const styleLabels = getStationStyleLabels(station)
              return (
                <div key={station.id} className={`s-card${active ? ' playing' : ''}`}>
                  <div className="s-card-chrome" aria-hidden="true" />
                  <div className="s-card-grid" aria-hidden="true" />
                  <div className="s-head">
                    <div className="s-name">{station.name}</div>
                    <button className={`pbtn${active ? ' on' : ''}${loading ? ' loading' : ''}`} onClick={() => onPlayStation(station)}>
                      {loading ? <span className="btn-spinner" /> : active && playing ? '⏸' : '▶'}
                    </button>
                  </div>
                  <div className="s-taxonomy">
                    <span className="s-taxonomy-row">Primary: {styleLabels.primary}</span>
                    {styleLabels.related.length ? <span className="s-taxonomy-row">Related: {styleLabels.related.join(' • ')}</span> : null}
                    {styleLabels.descriptors.length ? <span className="s-taxonomy-row">Descriptors: {styleLabels.descriptors.join(' • ')}</span> : null}
                  </div>
                  <div className="s-meta">
                    <span className="s-country">{station.countryLabel === 'US' ? '🇺🇸 US' : station.countryLabel}</span>
                    <span className="s-br">{station.bitrateLabel}</span>
                  </div>
                </div>
              )
            })}
          </>
        ) : selectedNode ? (
          <div className="empty">No transmissions charted.</div>
        ) : null}
      </div>
    </div>
  )
}
