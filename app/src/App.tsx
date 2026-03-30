import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { HoverTooltip } from './components/HoverTooltip'
import { PlayerBar } from './components/PlayerBar'
import { SidePanel } from './components/SidePanel'
import { StaticOverlays } from './components/StaticOverlays'
import type { HoveredNode, RefNode } from './app/types'
import { atlasData } from './data/atlas'
import { stationMatchesNode } from './data/selectors'
import { useAtlasGraph } from './hooks/useAtlasGraph'
import { useRadioPlayer } from './hooks/useRadioPlayer'
import { useStarfield } from './hooks/useStarfield'

function App() {
  const starfieldRef = useRef<HTMLCanvasElement | null>(null)
  const orreryRef = useRef<SVGCircleElement | null>(null)
  const viewportRef = useRef({
    x: 0,
    y: 0,
    k: 1,
    focusX: 0,
    focusY: 0,
    activeRootId: null,
    activeRootColor: null,
    activeRootX: 0,
    activeRootY: 0,
    activeRootGlow: 0,
  })
  const audioDataRef = useRef({ bass: 0, energy: 0 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [hovered, setHovered] = useState<HoveredNode | null>(null)

  const referenceNodes = useMemo<RefNode[]>(() => {
    return atlasData.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      level: node.level,
      parent: node.parentId ?? null,
      color: node.color,
      stations: atlasData.stations
        .filter((station) => stationMatchesNode(station, node.id))
        .map((station) => ({
          name: station.name,
          url: station.streamUrl,
          country: station.countryLabel === 'US' ? '🇺🇸 US' : station.countryLabel,
          bitrate: station.bitrateLabel,
        })),
    }))
  }, [])

  const selectedNode = useMemo(() => (selectedId ? atlasData.nodeMap[selectedId] : null), [selectedId])
  const panelStations = useMemo(() => {
    if (!selectedNode) return []
    return atlasData.stations.filter((station) => stationMatchesNode(station, selectedNode.id))
  }, [selectedNode])

  const player = useRadioPlayer({ selectedNode })

  const graph = useAtlasGraph({
    referenceNodes,
    currentStationId: player.currentStationId,
    playing: player.playing,
    audioDataRef,
    viewportRef,
    selectedId,
    setSelectedId,
    setPanelOpen,
    setHovered,
  })

  useStarfield({
    canvasRef: starfieldRef,
    analyserRef: player.analyserRef,
    audioDataRef,
    viewportRef,
  })

  useEffect(() => {
    let angle = 0
    let frame = 0
    const node = orreryRef.current
    if (!node) return

    const animate = () => {
      angle += 0.015
      node.setAttribute('cx', String(23 + Math.cos(angle) * 9))
      node.setAttribute('cy', String(23 + Math.sin(angle) * 9))
      frame = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <>
      <canvas id="starfield" ref={starfieldRef} />
      <AppHeader />
      <svg id="graph-svg" ref={graph.graphRef} />
      <SidePanel
        open={panelOpen}
        selectedNode={selectedNode}
        panelStations={panelStations}
        childCount={selectedNode ? (atlasData.childMap[selectedNode.id]?.length ?? 0) : 0}
        currentStationId={player.currentStationId}
        loadingStationId={player.loadingStationId}
        playing={player.playing}
        onClose={() => setPanelOpen(false)}
        onPlayStation={(station) => void player.playStation(station)}
      />
      <HoverTooltip hovered={hovered} />
      {player.currentStationId ? (
        <PlayerBar
          orreryRef={orreryRef}
          currentGenre={player.currentGenre}
          currentName={player.currentName}
          currentTrackTitle={player.currentTrackTitle}
          spectrumLevels={player.spectrumLevels}
          waveformState={player.waveformState}
          playing={player.playing}
          loading={!!player.loadingStationId}
          volume={player.volume}
          onToggleAudio={player.toggleAudio}
          onStopAudio={player.stopAudio}
          onVolumeChange={player.setVolume}
        />
      ) : null}
      <StaticOverlays />
    </>
  )
}

export default App
