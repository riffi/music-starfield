import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { HoverTooltip } from './components/HoverTooltip'
import { PlayerBar } from './components/PlayerBar'
import { SearchOverlay, type SearchResult } from './components/SearchOverlay'
import { SidePanel } from './components/SidePanel'
import { StaticOverlays } from './components/StaticOverlays'
import type { HoveredNode, RefNode } from './app/types'
import { atlasData } from './data/atlas'
import { getStationStyleLabels, orderedPathRootToLeaf, resolveStationContextPath, stationMatchesNode } from './data/selectors'
import { useAtlasGraph } from './hooks/useAtlasGraph'
import { useRadioPlayer } from './hooks/useRadioPlayer'
import { useStarfield } from './hooks/useStarfield'

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function scoreSearchTerm(label: string, query: string) {
  const normalizedLabel = normalizeSearchValue(label)
  if (!normalizedLabel || !query) return 0
  if (normalizedLabel === query) return 120
  if (normalizedLabel.startsWith(query)) return 88
  if (normalizedLabel.includes(query)) return 64
  const queryParts = query.split(/\s+/).filter(Boolean)
  if (queryParts.length && queryParts.every((part) => normalizedLabel.includes(part))) return 44
  return 0
}

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
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [hovered, setHovered] = useState<HoveredNode | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredSearchResultId, setHoveredSearchResultId] = useState<string | null>(null)

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
  const normalizedSearchQuery = useMemo(() => normalizeSearchValue(searchQuery), [searchQuery])

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!normalizedSearchQuery) return []

    const nodeResults = atlasData.nodes
      .map((node) => {
        const score = scoreSearchTerm(node.name, normalizedSearchQuery)
        if (!score) return null
        return {
          id: `node:${node.id}`,
          type: 'node' as const,
          group: 'Styles' as const,
          title: node.name,
          subtitle: `Level ${node.level} style node`,
          pathIds: orderedPathRootToLeaf(node.id),
          score: score + (5 - node.level) * 3,
        }
      })
      .filter(Boolean) as SearchResult[]

    const stationResults = atlasData.stations
      .map((station) => {
        const styleLabels = getStationStyleLabels(station)
        const styleSummary = [styleLabels.primary, ...styleLabels.related, ...styleLabels.descriptors].join(' ')
        const nameScore = scoreSearchTerm(station.name, normalizedSearchQuery)
        const styleScore = scoreSearchTerm(styleSummary, normalizedSearchQuery)
        const descriptionScore = station.description ? scoreSearchTerm(station.description, normalizedSearchQuery) : 0
        const score = Math.max(nameScore, styleScore * 0.88, descriptionScore * 0.7)
        if (!score) return null
        const contextPath = resolveStationContextPath(station, null)
        const leafId = contextPath[0]
        if (!leafId) return null
        return {
          id: `station:${station.id}`,
          type: 'station' as const,
          group: 'Stations' as const,
          title: station.name,
          subtitle: `${styleLabels.primary} / ${station.countryLabel}`,
          pathIds: orderedPathRootToLeaf(leafId),
          score: score + 4,
        }
      })
      .filter(Boolean) as SearchResult[]

    return [...nodeResults, ...stationResults]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.title.localeCompare(b.title))
      .slice(0, 8)
  }, [normalizedSearchQuery])

  const hoveredSearchResult = useMemo(
    () => searchResults.find((result) => result.id === hoveredSearchResultId) ?? null,
    [hoveredSearchResultId, searchResults],
  )
  const searchMatchedIds = useMemo(
    () => [...new Set(searchResults.flatMap((result) => result.pathIds))],
    [searchResults],
  )
  const searchPreviewPathIds = hoveredSearchResult?.pathIds ?? []

  const player = useRadioPlayer({
    selectedNode,
    initialNormalizationEnabled: false,
    initialNormalizationAggression: 55,
  })

  const graph = useAtlasGraph({
    referenceNodes,
    currentStationId: player.currentStationId,
    playing: player.playing,
    volume: player.volume,
    audioDataRef,
    viewportRef,
    expandedIds,
    setExpandedIds,
    selectedId,
    setSelectedId,
    setPanelOpen,
    setHovered,
    searchActive: searchOpen && !!normalizedSearchQuery,
    searchMatchedIds,
    searchPreviewPathIds,
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

  useEffect(() => {
    if (!normalizedSearchQuery) setHoveredSearchResultId(null)
  }, [normalizedSearchQuery])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchQuery('')
        setHoveredSearchResultId(null)
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function revealPath(pathIds: string[]) {
    if (!pathIds.length) return
    const expandableAncestors = pathIds.slice(0, -1).filter((id) => (atlasData.childMap[id]?.length ?? 0) > 0)
    setExpandedIds(expandableAncestors)
  }

  function handleSelectSearchResult(result: SearchResult) {
    revealPath(result.pathIds)
    setSelectedId(result.pathIds[result.pathIds.length - 1] ?? null)
    setPanelOpen(true)
    setSearchQuery('')
    setHoveredSearchResultId(null)
    setSearchOpen(false)
  }

  return (
    <>
      <canvas id="starfield" ref={starfieldRef} />
      <AppHeader searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((value) => !value)} />
      <SearchOverlay
        open={searchOpen}
        query={searchQuery}
        active={!!normalizedSearchQuery}
        results={searchResults}
        onQueryChange={setSearchQuery}
        onHoverResult={(result) => setHoveredSearchResultId(result?.id ?? null)}
        onSelectResult={handleSelectSearchResult}
      />
      <svg id="graph-svg" ref={graph.graphRef} />
      <SidePanel
        open={panelOpen}
        hasPlayer={!!player.currentStationId}
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
          normalizationEnabled={player.normalizationEnabled}
          normalizationAggression={player.normalizationAggression}
          onToggleAudio={player.toggleAudio}
          onStopAudio={player.stopAudio}
          onVolumeChange={player.setVolume}
          onNormalizationEnabledChange={player.setNormalizationEnabled}
          onNormalizationAggressionChange={player.setNormalizationAggression}
        />
      ) : null}
      <StaticOverlays />
    </>
  )
}

export default App
