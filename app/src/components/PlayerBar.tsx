import { type CSSProperties, type RefObject, useEffect, useState } from 'react'
import { PL_DECO_IDLE_HEIGHTS } from '../app/audio'

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

function StopIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.5 4.5h7v7h-7z" fill="currentColor" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6.6 1.9h2.8l.4 1.5c.3.1.7.2 1 .4l1.4-.7 1.4 1.4-.7 1.4c.2.3.3.7.4 1l1.5.4v2.8l-1.5.4c-.1.3-.2.7-.4 1l.7 1.4-1.4 1.4-1.4-.7c-.3.2-.7.3-1 .4l-.4 1.5H6.6l-.4-1.5c-.3-.1-.7-.2-1-.4l-1.4.7-1.4-1.4.7-1.4c-.2-.3-.3-.7-.4-1l-1.5-.4V6.7l1.5-.4c.1-.3.2-.7.4-1l-.7-1.4L3.8 2.5l1.4.7c.3-.2.7-.3 1-.4l.4-1.5Zm1.4 3.7a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z" fill="currentColor" />
    </svg>
  )
}

type PlayerBarProps = {
  orreryRef: RefObject<SVGCircleElement | null>
  currentGenre: string
  currentName: string
  currentTrackTitle: string
  spectrumLevels: number[] | null
  waveformState: 'idle' | 'loading' | 'playing'
  playing: boolean
  loading: boolean
  volume: number
  normalizationEnabled: boolean
  normalizationAggression: number
  onToggleAudio: () => void
  onStopAudio: () => void
  onVolumeChange: (value: number) => void
  onNormalizationEnabledChange: (value: boolean) => void
  onNormalizationAggressionChange: (value: number) => void
}

export function PlayerBar({
  orreryRef,
  currentGenre,
  currentName,
  currentTrackTitle,
  spectrumLevels,
  waveformState,
  playing,
  loading,
  volume,
  normalizationEnabled,
  normalizationAggression,
  onToggleAudio,
  onStopAudio,
  onVolumeChange,
  onNormalizationEnabledChange,
  onNormalizationAggressionChange,
}: PlayerBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!settingsOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen])

  const loudnessModeLabel =
    normalizationAggression < 34 ? 'Gentle' : normalizationAggression < 68 ? 'Balanced' : 'Strong'

  return (
    <>
      {settingsOpen ? <button className="player-settings-backdrop" type="button" aria-label="Close sound settings" onClick={() => setSettingsOpen(false)} /> : null}
      {settingsOpen ? (
        <div className="player-settings-modal" role="dialog" aria-modal="true" aria-label="Sound settings">
          <div className="player-settings-scanline" aria-hidden="true" />
          <div className="player-settings-corners" aria-hidden="true" />
          <div className="player-settings-head">
            <div>
              <div className="player-settings-kicker">Sound Settings</div>
              <div className="player-settings-title">Station Volume</div>
            </div>
            <button className="player-settings-close" type="button" aria-label="Close sound settings" onClick={() => setSettingsOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <div className="player-settings-copy">
            Keep quiet and loud stations closer to the same listening level.
          </div>
          <label className={`player-settings-toggle${normalizationEnabled ? ' on' : ''}`}>
            <input type="checkbox" checked={normalizationEnabled} onChange={(event) => onNormalizationEnabledChange(event.target.checked)} />
            <span className="player-settings-toggle-copy">
              <span className="player-settings-toggle-title">Even out station loudness</span>
              <span className="player-settings-toggle-text">Useful when one station sounds much louder or quieter than another.</span>
            </span>
          </label>
          <div className={`player-settings-range${normalizationEnabled ? '' : ' disabled'}`}>
            <div className="player-settings-range-head">
              <span>Balancing strength</span>
              <strong>{loudnessModeLabel}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={normalizationAggression}
              disabled={!normalizationEnabled}
              onChange={(event) => onNormalizationAggressionChange(Number(event.target.value))}
            />
            <div className="player-settings-range-scale" aria-hidden="true">
              <span>Natural</span>
              <span>Balanced</span>
              <span>Level</span>
            </div>
          </div>
        </div>
      ) : null}
      <div id="player">
        <div className="player-grid" aria-hidden="true" />
        <div className="player-corners" aria-hidden="true" />
        <div className="pl-orrery">
          <svg viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg" id="orrery-svg">
            <circle cx="23" cy="23" r="20" fill="none" stroke="rgba(212,168,83,0.12)" strokeWidth="0.8" />
            <circle cx="23" cy="23" r="13" fill="none" stroke="rgba(212,168,83,0.18)" strokeWidth="0.8" />
            <line x1="23" y1="3" x2="23" y2="43" stroke="rgba(212,168,83,0.1)" strokeWidth="0.5" />
            <line x1="3" y1="23" x2="43" y2="23" stroke="rgba(212,168,83,0.1)" strokeWidth="0.5" />
            <line x1="8.4" y1="8.4" x2="37.6" y2="37.6" stroke="rgba(212,168,83,0.07)" strokeWidth="0.5" />
            <line x1="37.6" y1="8.4" x2="8.4" y2="37.6" stroke="rgba(212,168,83,0.07)" strokeWidth="0.5" />
            <circle cx="23" cy="23" r="4" fill="rgba(212,168,83,0.15)" stroke="rgba(212,168,83,0.5)" strokeWidth="0.8" id="orrery-star" ref={orreryRef} />
          </svg>
        </div>
        <div className="pl-info">
          <div className="pl-headerline">
            <div id="pl-genre">{currentGenre}</div>
          </div>
          <div id="pl-name">{currentName ? <span>{currentName}</span> : <span className="pl-idle">Select a star to begin transmission…</span>}</div>
          {currentTrackTitle ? <div id="pl-track">Now Playing: {currentTrackTitle}</div> : null}
        </div>
        <div className="pl-visual">
          <div className="pl-signal">Signal / Live Relay</div>
          <div className={`pl-wave ${spectrumLevels ? 'pl-wave-real' : `pl-wave-${waveformState}`}`} aria-hidden="true">
            {spectrumLevels ? (
              <div className="pl-spectrum">
                {spectrumLevels.map((value, index) => {
                  const height = Math.round(Math.max(6, Math.min(100, 6 + value * 118)))
                  return <div key={index} className="pl-spectrum-bar" style={{ height: `${height}%` }} />
                })}
              </div>
            ) : (
              <div className="pl-spectrum pl-spectrum-deco">
                {PL_DECO_IDLE_HEIGHTS.map((height, index) => (
                  <div
                    key={index}
                    className="pl-spectrum-bar"
                    style={{ height: `${height}%`, ['--pl-bar-i' as string]: String(index) } as CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="pl-ctrls">
          <button className={`cbtn${playing ? ' on' : ''}${loading ? ' loading' : ''}`} id="cb-pause" title="Pause / Resume" onClick={onToggleAudio}>
            {loading ? <span className="btn-spinner" /> : playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="cbtn" id="cb-stop" title="Stop" onClick={onStopAudio}>
            <StopIcon />
          </button>
          <button
            className={`cbtn cbtn-settings${settingsOpen ? ' on' : ''}`}
            type="button"
            title="Sound Settings"
            aria-label="Open sound settings"
            onClick={() => setSettingsOpen((value) => !value)}
          >
            <SettingsIcon />
          </button>
        </div>
        <div className="vol-wrap">
          <span className="vol-ico">Gain</span>
          <input type="range" id="vol" min="0" max="100" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} />
        </div>
      </div>
    </>
  )
}
