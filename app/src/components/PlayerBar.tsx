import { type CSSProperties, type RefObject } from 'react'
import { PL_DECO_IDLE_HEIGHTS } from '../app/audio'

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
  onToggleAudio: () => void
  onStopAudio: () => void
  onVolumeChange: (value: number) => void
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
  onToggleAudio,
  onStopAudio,
  onVolumeChange,
}: PlayerBarProps) {
  return (
    <div id="player">
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
        <div id="pl-genre">{currentGenre}</div>
        <div id="pl-name">{currentName ? <span>{currentName}</span> : <span className="pl-idle">Select a star to begin transmission…</span>}</div>
        {currentTrackTitle ? <div id="pl-track">Now Playing: {currentTrackTitle}</div> : null}
      </div>
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
      <div className="pl-ctrls">
        <button className={`cbtn${playing ? ' on' : ''}${loading ? ' loading' : ''}`} id="cb-pause" title="Pause / Resume" onClick={onToggleAudio}>
          {loading ? <span className="btn-spinner" /> : playing ? '⏸' : '▶'}
        </button>
        <button className="cbtn" id="cb-stop" title="Stop" onClick={onStopAudio}>⏹</button>
      </div>
      <div className="vol-wrap">
        <span className="vol-ico">♪</span>
        <input type="range" id="vol" min="0" max="100" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} />
      </div>
    </div>
  )
}
