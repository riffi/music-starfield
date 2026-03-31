import { memo } from 'react'
import { getStationStyleLabels } from '../data/selectors'
import type { AtlasNode, AtlasStation } from '../data/atlas'
import { levelLabels } from '../app/constants'

function SparkIcon() {
  return (
    <svg className="panel-inline-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.5 9.5 6.5 14.5 8 9.5 9.5 8 14.5 6.5 9.5 1.5 8 6.5 6.5 8 1.5Z" fill="currentColor" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4 12 12M12 4 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 3.5h2.5v9H5zM8.5 3.5H11v9H8.5z" fill="currentColor" />
    </svg>
  )
}

type SidePanelProps = {
  open: boolean
  hasPlayer: boolean
  selectedNode: AtlasNode | null
  panelStations: AtlasStation[]
  childCount: number
  currentStationId: string | null
  loadingStationId: string | null
  playing: boolean
  onClose: () => void
  onPlayStation: (station: AtlasStation) => void
}

function SidePanelComponent({
  open,
  hasPlayer,
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
    <div id="panel" className={`${open ? 'open' : ''}${hasPlayer ? ' has-player' : ''}`}>
      <div id="panel-hdr">
        <div className="panel-scanline" aria-hidden="true" />
        <div className="panel-corners" aria-hidden="true" />
        <div className="panel-hdr-meta">
          <span id="p-level">{selectedNode ? levelLabels[selectedNode.level] : 'Constellation'}</span>
          <span className="panel-hdr-code">Sector / {selectedNode?.id ?? 'awaiting-lock'}</span>
        </div>
        <div id="p-name">{selectedNode?.name ?? 'Genre'}</div>
        <button id="p-close" title="Close" aria-label="Close panel" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div id="p-body">
        {!selectedNode ? null : panelStations.length ? (
          <>
            {childCount ? (
              <div className="panel-note">
                <span className="panel-note-icon" aria-hidden="true">
                  <SparkIcon />
                </span>
                <span>Contains {childCount} sub-genre{childCount !== 1 ? 's' : ''}. Click the star to expand.</span>
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
                      {loading ? <span className="btn-spinner" /> : active && playing ? <PauseIcon /> : <PlayIcon />}
                    </button>
                  </div>
                  {station.description ? (
                    <div className="s-taxonomy">
                      <span className="s-taxonomy-row">{station.description}</span>
                    </div>
                  ) : null}
                  <div className="s-taxonomy">
                    <span className="s-taxonomy-row">Primary: {styleLabels.primary}</span>
                    {styleLabels.related.length ? <span className="s-taxonomy-row">Related: {styleLabels.related.join(' • ')}</span> : null}
                    {styleLabels.descriptors.length ? <span className="s-taxonomy-row">Descriptors: {styleLabels.descriptors.join(' • ')}</span> : null}
                  </div>
                  <div className="s-meta">
                    <span className="s-country">{station.countryLabel}</span>
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

export const SidePanel = memo(SidePanelComponent, (prev, next) => (
  prev.open === next.open &&
  prev.hasPlayer === next.hasPlayer &&
  prev.selectedNode === next.selectedNode &&
  prev.panelStations === next.panelStations &&
  prev.childCount === next.childCount &&
  prev.currentStationId === next.currentStationId &&
  prev.loadingStationId === next.loadingStationId &&
  prev.playing === next.playing
))
