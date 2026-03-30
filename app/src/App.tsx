import * as d3 from 'd3'
import Hls from 'hls.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { atlasData } from './data/atlas'

type RefNode = {
  id: string
  name: string
  level: 1 | 2 | 3
  parent: string | null
  stations: {
    name: string
    url: string
    country: string
    bitrate: string
  }[]
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  index?: number
  vx?: number
  vy?: number
}

type RefLink = {
  source: string | RefNode
  target: string | RefNode
}

const COLORS = {
  ambient: '#d4a853',
  electronic: '#5a90d4',
  rock: '#c94848',
  jazz: '#9c5ad4',
  classical: '#7fd1c8',
} as const

const levelLabels = {
  1: 'Major Constellation',
  2: 'Star System',
  3: 'Stellar Body',
} as const

const SOMAFM_CHANNELS: Record<string, string> = {
  'drone-zone': 'dronezone',
  'deep-space-one': 'deepspaceone',
  'space-station': 'spacestation',
  'mission-control': 'missioncontrol',
  'groove-salad': 'groovesalad',
  lush: 'lush',
  'beat-blender': 'beatblender',
  'indie-pop-rocks': 'indiepop',
  digitalis: 'digitalis',
  'n5md-radio': 'n5md',
  'underground-80s': 'u80s',
  'sonic-universe': 'sonicuniverse',
  bossa: 'bossa',
}

type SomaChannelsResponse = {
  channels?: {
    id: string
    lastPlaying?: string
  }[]
}

async function loadSoundparkDeepNowPlaying() {
  const masterResponse = await fetch('https://h.getradio.me/spdeep/hls.m3u8')
  if (!masterResponse.ok) throw new Error(`Soundpark master returned ${masterResponse.status}`)

  const masterText = await masterResponse.text()
  const variantPath = masterText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'))

  if (!variantPath) return ''

  const mediaUrl = new URL(variantPath, masterResponse.url).toString()
  const mediaResponse = await fetch(mediaUrl)
  if (!mediaResponse.ok) throw new Error(`Soundpark media returned ${mediaResponse.status}`)

  const mediaText = await mediaResponse.text()
  const extInfLines = mediaText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('#EXTINF:'))

  const lastLine = extInfLines.at(-1)
  if (!lastLine) return ''

  const separatorIndex = lastLine.indexOf(',')
  if (separatorIndex === -1) return ''

  return lastLine.slice(separatorIndex + 1).trim()
}

function App() {
  const graphRef = useRef<SVGSVGElement | null>(null)
  const starfieldRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const orreryRef = useRef<SVGCircleElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const viewportRef = useRef({ x: 0, y: 0, k: 1, focusX: 0, focusY: 0 })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [hovered, setHovered] = useState<{
    name: string
    level: string
    stationCount: number
    hint: string
    x: number
    y: number
  } | null>(null)
  const [currentStationId, setCurrentStationId] = useState<string | null>(null)
  const [loadingStationId, setLoadingStationId] = useState<string | null>(null)
  const [currentGenre, setCurrentGenre] = useState('')
  const [currentName, setCurrentName] = useState('')
  const [currentTrackTitle, setCurrentTrackTitle] = useState('')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(75)

  const selectedNode = useMemo(() => (selectedId ? atlasData.nodeMap[selectedId] : null), [selectedId])

  const referenceNodes = useMemo<RefNode[]>(() => {
    return atlasData.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      level: node.level,
      parent: node.parentId ?? null,
      stations: atlasData.stations
        .filter((station) => station.styleIds.includes(node.id))
        .map((station) => ({
          name: station.name,
          url: station.streamUrl,
          country: station.countryLabel === 'US' ? '🇺🇸 US' : station.countryLabel,
          bitrate: station.bitrateLabel,
        })),
    }))
  }, [])

  useEffect(() => {
    const canvas = starfieldRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!canvas || !ctx) return
    const canvasEl = canvas
    const context = ctx

    let width = 0
    let height = 0
    let stars: { x: number; y: number; r: number; op: number; spd: number; ph: number; col: string; depth: number; glow: number }[] = []
    let nebulae: { x: number; y: number; r: number; color: string; alpha: number; drift: number }[] = []
    let t = 0

    function resize() {
      width = canvasEl.width = window.innerWidth
      height = canvasEl.height = window.innerHeight
    }

    function init() {
      stars = []
      nebulae = []

      for (let i = 0; i < 6; i += 1) {
        nebulae.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 220 + 160,
          color: Math.random() > 0.5 ? '70,110,210' : Math.random() > 0.5 ? '120,70,180' : '210,150,80',
          alpha: Math.random() * 0.07 + 0.03,
          drift: Math.random() * 0.15 + 0.05,
        })
      }

      for (let i = 0; i < 520; i += 1) {
        const depth = Math.random() * 1.2 + 0.35
        const radius = Math.random() > 0.92 ? Math.random() * 1.8 + 1.2 : Math.random() * 1.1 + 0.12
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: radius,
          op: Math.random() * 0.65 + 0.12,
          spd: Math.random() * 0.008 + 0.002,
          ph: Math.random() * Math.PI * 2,
          col: Math.random() > 0.9 ? '255,224,170' : Math.random() > 0.62 ? '170,185,255' : '235,238,255',
          depth,
          glow: radius > 1.1 ? Math.random() * 12 + 10 : 0,
        })
      }
    }

    function draw() {
      context.clearRect(0, 0, width, height)
      const gradient = context.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.72)
      gradient.addColorStop(0, 'rgba(10,16,36,1)')
      gradient.addColorStop(0.55, 'rgba(5,9,22,1)')
      gradient.addColorStop(1, 'rgba(2,4,12,1)')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)
      t += 0.008

      for (const nebula of nebulae) {
        const nx = nebula.x + viewportRef.current.x * nebula.drift * 0.02
        const ny = nebula.y + viewportRef.current.y * nebula.drift * 0.02
        const pulse = Math.sin(t * nebula.drift + nebula.x * 0.0015) * 0.5 + 0.5
        const g = context.createRadialGradient(nx, ny, 0, nx, ny, nebula.r)
        g.addColorStop(0, `rgba(${nebula.color},${nebula.alpha * (0.7 + pulse * 0.45)})`)
        g.addColorStop(0.45, `rgba(${nebula.color},${nebula.alpha * 0.28})`)
        g.addColorStop(1, `rgba(${nebula.color},0)`)
        context.fillStyle = g
        context.fillRect(nx - nebula.r, ny - nebula.r, nebula.r * 2, nebula.r * 2)
      }

      for (const star of stars) {
        const tw = Math.sin(t * star.spd * 12 + star.ph) * 0.5 + 0.5
        const opacity = star.op * (0.35 + 0.65 * tw)
        const depth = star.depth
        const viewportShiftX = viewportRef.current.x * depth * 0.025
        const viewportShiftY = viewportRef.current.y * depth * 0.025
        const focusX = viewportRef.current.focusX || width * 0.5
        const focusY = viewportRef.current.focusY || height * 0.5
        const bgScale = 1 + (viewportRef.current.k - 1) * (0.035 + depth * 0.03)
        const scaledX = focusX + (star.x - focusX) * bgScale
        const scaledY = focusY + (star.y - focusY) * bgScale
        const px = scaledX + viewportShiftX
        const py = scaledY + viewportShiftY

        if (star.glow > 0) {
          const glow = context.createRadialGradient(px, py, 0, px, py, star.glow)
          glow.addColorStop(0, `rgba(${star.col},${opacity * 0.22})`)
          glow.addColorStop(0.35, `rgba(${star.col},${opacity * 0.08})`)
          glow.addColorStop(1, `rgba(${star.col},0)`)
          context.fillStyle = glow
          context.fillRect(px - star.glow, py - star.glow, star.glow * 2, star.glow * 2)
        }

        context.beginPath()
        context.arc(px, py, star.r, 0, Math.PI * 2)
        context.fillStyle = `rgba(${star.col},${opacity})`
        context.fill()

        if (star.r > 1.35) {
          context.strokeStyle = `rgba(${star.col},${opacity * 0.28})`
          context.lineWidth = 0.35
          context.beginPath()
          context.moveTo(px - star.r * 3, py)
          context.lineTo(px + star.r * 3, py)
          context.moveTo(px, py - star.r * 3)
          context.lineTo(px, py + star.r * 3)
          context.stroke()
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    const onResize = () => {
      resize()
      init()
    }

    resize()
    init()
    draw()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

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
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
      audioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    const channelId = currentStationId ? SOMAFM_CHANNELS[currentStationId] : undefined
    const isSoundparkDeep = currentStationId === 'soundpark-deep'

    if (!channelId && !isSoundparkDeep) {
      setCurrentTrackTitle('')
      return
    }

    let cancelled = false

    async function loadNowPlaying() {
      try {
        if (channelId) {
          const response = await fetch('https://somafm.com/channels.json')
          if (!response.ok) throw new Error(`SomaFM returned ${response.status}`)
          const data = (await response.json()) as SomaChannelsResponse
          const channel = data.channels?.find((item) => item.id === channelId)
          if (!cancelled) setCurrentTrackTitle(channel?.lastPlaying?.trim() ?? '')
          return
        }

        if (isSoundparkDeep) {
          const trackTitle = await loadSoundparkDeepNowPlaying()
          if (!cancelled) setCurrentTrackTitle(trackTitle)
        }
      } catch {
        if (!cancelled) setCurrentTrackTitle('')
      }
    }

    void loadNowPlaying()
    const interval = window.setInterval(() => {
      void loadNowPlaying()
    }, 20000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [currentStationId])

  useEffect(() => {
    const svgEl = graphRef.current
    if (!svgEl) return

    const nodes = referenceNodes.map((node) => ({ ...node }))
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<string, RefNode>
    const links: RefLink[] = nodes.filter((node) => node.parent).map((node) => ({ source: node.parent!, target: node.id }))

    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const width = () => svgEl.clientWidth
    const height = () => svgEl.clientHeight

    const defs = svg.append('defs')
    ;['glow3', 'glow6', 'glow10'].forEach((id, index) => {
      const filter = defs
        .append('filter')
        .attr('id', id)
        .attr('x', '-80%')
        .attr('y', '-80%')
        .attr('width', '260%')
        .attr('height', '260%')
      filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', [3, 6, 10][index]).attr('result', 'blur')
      const merge = filter.append('feMerge')
      merge.append('feMergeNode').attr('in', 'blur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')
    })

    const g = svg.append('g')
    const linkG = g.append('g')
    const nodeG = g.append('g')
    const labelG = g.append('g')
    const expanded = new Set<string>()

    function getL1(node: RefNode) {
      if (node.level === 1) return node.id
      if (node.level === 2) return node.parent
      if (node.level === 3) return node.parent ? nodeMap[node.parent]?.parent ?? null : null
      return null
    }

    function nodeColor(node: RefNode) {
      const key = getL1(node) as keyof typeof COLORS | null
      return key ? COLORS[key] : COLORS.ambient
    }

    function nr(node: RefNode) {
      return node.level === 1 ? 27 : node.level === 2 ? 16 : 9
    }

    function getVisible() {
      const visibleNodes = nodes.filter((node) => {
        if (node.level === 1) return true
        if (node.level === 2) return !!node.parent && expanded.has(node.parent)
        if (node.level === 3 && node.parent) {
          const parent = nodeMap[node.parent]
          return !!parent && !!parent.parent && expanded.has(parent.parent) && expanded.has(node.parent)
        }
        return false
      })

      const ids = new Set(visibleNodes.map((node) => node.id))
      const visibleLinks = links.filter((link) => {
        const source = typeof link.source === 'object' ? link.source.id : link.source
        const target = typeof link.target === 'object' ? link.target.id : link.target
        return ids.has(source) && ids.has(target)
      })

      return { visibleNodes, visibleLinks }
    }

    const simulation = d3
      .forceSimulation<RefNode>()
      .force(
        'link',
        d3
          .forceLink<RefNode, RefLink>()
          .id((d) => d.id)
          .distance((d) => {
            const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
            return source?.level === 1 ? 130 : source?.level === 2 ? 85 : 60
          })
          .strength(0.7),
      )
      .force('charge', d3.forceManyBody<RefNode>().strength((d) => (d.level === 1 ? -350 : d.level === 2 ? -160 : -80)))
      .force('collision', d3.forceCollide<RefNode>().radius((d) => nr(d) + 22))
      .force('center', d3.forceCenter())

    simulation.on('tick', () => {
      linkG
        .selectAll<SVGLineElement, d3.SimulationLinkDatum<RefNode>>('line.edge')
        .attr('x1', (d) => (d.source as RefNode).x ?? 0)
        .attr('y1', (d) => (d.source as RefNode).y ?? 0)
        .attr('x2', (d) => (d.target as RefNode).x ?? 0)
        .attr('y2', (d) => (d.target as RefNode).y ?? 0)

      nodeG.selectAll<SVGGElement, RefNode>('g.nd').attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      labelG
        .selectAll<SVGTextElement, RefNode>('text.lbl')
        .attr('x', (d) => d.x ?? 0)
        .attr('y', (d) => d.y ?? 0)
    })

    function deselect() {
      nodeG
        .selectAll<SVGGElement, RefNode>('g.nd')
        .select<SVGCircleElement>('circle.nbody')
        .attr('stroke-width', (d) => (d.level === 1 ? 2 : 1.5))
        .attr('fill', (d) => `${nodeColor(d)}20`)
      setSelectedId(null)
    }

    function highlight(id: string) {
      nodeG
        .selectAll<SVGGElement, RefNode>('g.nd')
        .select<SVGCircleElement>('circle.nbody')
        .attr('stroke-width', (d) => (d.id === id ? (d.level === 1 ? 3 : 2.5) : d.level === 1 ? 2 : 1.5))
        .attr('fill', (d) => (d.id === id ? `${nodeColor(d)}44` : `${nodeColor(d)}20`))
    }

    function refreshPanel(node: RefNode) {
      setSelectedId(node.id)
      setPanelOpen(true)
    }

    function collapseAll(id: string) {
      expanded.delete(id)
      nodes.filter((node) => node.parent === id).forEach((node) => collapseAll(node.id))
    }

    function clickNode(node: RefNode) {
      const hasKids = nodes.some((item) => item.parent === node.id)
      if (hasKids) {
        if (expanded.has(node.id)) collapseAll(node.id)
        else expanded.add(node.id)
        update(false)
      }
      highlight(node.id)
      refreshPanel(node)
    }

    function update(initial: boolean) {
      const { visibleNodes, visibleLinks } = getVisible()
      simulation.force('center', d3.forceCenter(width() / 2, height() / 2))

      visibleNodes.forEach((node) => {
        if (node.x === undefined || node.y === undefined) {
          const parent = node.parent ? nodeMap[node.parent] : null
          node.x = parent?.x !== undefined ? parent.x + (Math.random() - 0.5) * 50 : width() / 2 + (Math.random() - 0.5) * 180
          node.y = parent?.y !== undefined ? parent.y + (Math.random() - 0.5) * 50 : height() / 2 + (Math.random() - 0.5) * 180
        }
      })

      const linkSelection = linkG.selectAll<SVGLineElement, RefLink>('line.edge').data(visibleLinks, (d) => {
        const source = typeof d.source === 'object' ? d.source.id : d.source
        const target = typeof d.target === 'object' ? d.target.id : d.target
        return `${source}>${target}`
      })

      linkSelection
        .enter()
        .append('line')
        .attr('class', 'edge')
        .style('stroke', (d) => {
          const target = typeof d.target === 'object' ? d.target : nodeMap[d.target]
          return nodeColor(target)
        })
        .style('stroke-opacity', 0.22)
        .style('stroke-width', (d) => {
          const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
          return source.level === 1 ? 1.4 : 0.9
        })
        .style('stroke-dasharray', (d) => {
          const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
          return source.level === 1 ? '5,5' : '2,5'
        })
        .style('opacity', 0)
        .transition()
        .duration(450)
        .style('opacity', 1)

      linkSelection.exit().transition().duration(300).style('opacity', 0).remove()

      const nodeSelection = nodeG.selectAll<SVGGElement, RefNode>('g.nd').data(visibleNodes, (d) => d.id)

      const entered = nodeSelection
        .enter()
        .append('g')
        .attr('class', 'nd')
        .attr('transform', (d) => {
          const parent = d.parent ? nodeMap[d.parent] : null
          const px = parent?.x ?? width() / 2
          const py = parent?.y ?? height() / 2
          return `translate(${px + (Math.random() - 0.5) * 30},${py + (Math.random() - 0.5) * 30})`
        })
        .style('opacity', 0)
        .style('cursor', 'pointer')
        .call(
          d3
            .drag<SVGGElement, RefNode>()
            .on('start', (event, d) => {
              event.sourceEvent.stopPropagation()
              if (!event.active) simulation.alphaTarget(0.3).restart()
              d.fx = d.x
              d.fy = d.y
            })
            .on('drag', (event, d) => {
              d.fx = event.x
              d.fy = event.y
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0)
              d.fx = null
              d.fy = null
            }),
        )
        .on('click', (event, d) => {
          event.stopPropagation()
          clickNode(d)
        })
        .on('mouseover', (event, d) => {
          const hasKids = nodes.some((item) => item.parent === d.id)
          setHovered({
            name: d.name,
            level: levelLabels[d.level],
            stationCount: d.stations.length,
            hint: hasKids ? (expanded.has(d.id) ? '↙ Click to collapse' : '↗ Click to expand') : '● Click for stations',
            x: event.clientX + 14,
            y: event.clientY - 10,
          })
        })
        .on('mousemove', (event) => {
          setHovered((prev) => (prev ? { ...prev, x: event.clientX + 14, y: event.clientY - 10 } : prev))
        })
        .on('mouseout', () => setHovered(null))

      entered
        .append('circle')
        .attr('class', 'gring')
        .attr('r', (d) => nr(d) * 1.9)
        .attr('fill', 'none')
        .attr('stroke', (d) => nodeColor(d))
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 0.2)
        .attr('filter', (d) => (d.level === 1 ? 'url(#glow10)' : d.level === 2 ? 'url(#glow6)' : 'url(#glow3)'))

      entered
        .filter((d) => d.level === 1)
        .append('circle')
        .attr('r', (d) => nr(d) * 1.35)
        .attr('fill', 'none')
        .attr('stroke', (d) => nodeColor(d))
        .attr('stroke-width', 0.6)
        .attr('stroke-opacity', 0.4)
        .attr('filter', 'url(#glow6)')

      entered
        .append('circle')
        .attr('class', 'nbody')
        .attr('r', (d) => nr(d))
        .attr('fill', (d) => `${nodeColor(d)}20`)
        .attr('stroke', (d) => nodeColor(d))
        .attr('stroke-width', (d) => (d.level === 1 ? 2 : 1.5))
        .attr('filter', (d) => (d.level === 1 ? 'url(#glow6)' : 'url(#glow3)'))

      entered
        .filter((d) => d.level <= 2)
        .append('circle')
        .attr('class', 'ncore')
        .attr('r', (d) => nr(d) * 0.38)
        .attr('fill', (d) => nodeColor(d))
        .attr('filter', 'url(#glow3)')

      entered
        .filter((d) => d.level === 1)
        .each(function (d) {
          const gg = d3.select(this)
          const s = nr(d) * 0.75
          gg.append('line').attr('x1', -s).attr('y1', 0).attr('x2', s).attr('y2', 0).attr('stroke', nodeColor(d)).attr('stroke-width', 0.8).attr('stroke-opacity', 0.55)
          gg.append('line').attr('x1', 0).attr('y1', -s).attr('x2', 0).attr('y2', s).attr('stroke', nodeColor(d)).attr('stroke-width', 0.8).attr('stroke-opacity', 0.55)
          gg
            .append('line')
            .attr('x1', -s * 0.65)
            .attr('y1', -s * 0.65)
            .attr('x2', s * 0.65)
            .attr('y2', s * 0.65)
            .attr('stroke', nodeColor(d))
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.3)
          gg
            .append('line')
            .attr('x1', s * 0.65)
            .attr('y1', -s * 0.65)
            .attr('x2', -s * 0.65)
            .attr('y2', s * 0.65)
            .attr('stroke', nodeColor(d))
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.3)
        })

      entered.transition().duration(500).style('opacity', 1)

      const labelSelection = labelG.selectAll<SVGTextElement, RefNode>('text.lbl').data(visibleNodes, (d) => d.id)

      labelSelection
        .enter()
        .append('text')
        .attr('class', 'lbl')
        .style('font-family', "'Cinzel', serif")
        .style('font-size', (d) => (d.level === 1 ? '13px' : d.level === 2 ? '10px' : '9px'))
        .style('font-weight', (d) => (d.level === 1 ? '600' : '400'))
        .style('fill', (d) => (d.level === 1 ? nodeColor(d) : '#b8a888'))
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .style('letter-spacing', (d) => (d.level === 1 ? '.1em' : '.04em'))
        .attr('dy', (d) => nr(d) + (d.level === 1 ? 20 : d.level === 2 ? 14 : 12))
        .text((d) => d.name)
        .style('opacity', 0)
        .transition()
        .duration(500)
        .style('opacity', 1)

      labelSelection.exit().transition().duration(300).style('opacity', 0).remove()
      nodeSelection.exit().transition().duration(300).style('opacity', 0).remove()

      simulation.nodes(visibleNodes)
      const linkForce = simulation.force<d3.ForceLink<RefNode, RefLink>>('link')
      linkForce?.links(visibleLinks)
      simulation.alpha(initial ? 1 : 0.4).restart()
    }

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3.5])
      .on('zoom', (event) => {
        let focusX = width() * 0.5
        let focusY = height() * 0.5

        const sourceEvent = event.sourceEvent as MouseEvent | WheelEvent | PointerEvent | undefined
        if (sourceEvent && 'clientX' in sourceEvent && 'clientY' in sourceEvent) {
          const rect = svgEl.getBoundingClientRect()
          focusX = sourceEvent.clientX - rect.left
          focusY = sourceEvent.clientY - rect.top
        }

        viewportRef.current = {
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
          focusX,
          focusY,
        }
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoomBehavior)
    svg.on('click.bg', () => {
      setPanelOpen(false)
      deselect()
    })

    update(true)

    const timeout = window.setTimeout(() => {
      svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1).translate(-width() / 2, -height() / 2))
    }, 100)

    const onResize = () => {
      simulation.force('center', d3.forceCenter(width() / 2, height() / 2))
      simulation.alpha(0.1).restart()
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('resize', onResize)
      simulation.stop()
      svg.on('.zoom', null)
      svg.on('click.bg', null)
    }
  }, [referenceNodes])

  const panelStations = useMemo(() => {
    if (!selectedNode) return []
    return atlasData.stations.filter((station) => station.styleIds.includes(selectedNode.id))
  }, [selectedNode])

  function clearCurrentStream() {
    hlsRef.current?.destroy()
    hlsRef.current = null

    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.removeAttribute('src')
    audioRef.current.load()
  }

  async function startStream(streamUrl: string) {
    if (!audioRef.current) return false

    clearCurrentStream()

    const isHlsStream = streamUrl.includes('.m3u8')
    if (isHlsStream) {
      if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        audioRef.current.src = streamUrl
      } else if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(streamUrl)
        hls.attachMedia(audioRef.current)
        hlsRef.current = hls
      } else {
        return false
      }
    } else {
      audioRef.current.src = streamUrl
    }

    try {
      await audioRef.current.play()
      return true
    } catch {
      return false
    }
  }

  async function playStation(station: (typeof panelStations)[number]) {
    if (!audioRef.current || !selectedNode) return

    if (currentStationId === station.id) {
      if (audioRef.current.paused) {
        setLoadingStationId(station.id)
        void audioRef.current
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false))
          .finally(() => setLoadingStationId(null))
      } else {
        audioRef.current.pause()
        setPlaying(false)
      }
      return
    }

    setLoadingStationId(station.id)
    setCurrentStationId(station.id)
    setCurrentGenre(selectedNode.name)
    setCurrentName(station.name)
    setCurrentTrackTitle('')
    const started = await startStream(station.streamUrl)
    setPlaying(started)
    setLoadingStationId(null)
  }

  function stopAudio() {
    if (!audioRef.current) return
    clearCurrentStream()
    setLoadingStationId(null)
    setCurrentStationId(null)
    setCurrentGenre('')
    setCurrentName('')
    setCurrentTrackTitle('')
    setPlaying(false)
  }

  function toggleAudio() {
    if (!audioRef.current || !currentStationId) return
    if (audioRef.current.paused) {
      void audioRef.current.play()
      setPlaying(true)
    } else {
      audioRef.current.pause()
      setPlaying(false)
    }
  }

  return (
    <>
      <canvas id="starfield" ref={starfieldRef} />

      <div id="hdr">
        <div className="hdr-center">
          <div className="hdr-title">✦ Celestial Atlas of Sound ✦</div>
          <div className="hdr-sub">A stellar cartography of music genres &amp; radio transmissions</div>
        </div>
        <div className="legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--ambient)', boxShadow: '0 0 6px var(--ambient)' }} /><span style={{ color: 'var(--text-dim)' }}>Ambient</span></div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--electronic)', boxShadow: '0 0 6px var(--electronic)' }} /><span style={{ color: 'var(--text-dim)' }}>Electronic</span></div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--rock)', boxShadow: '0 0 6px var(--rock)' }} /><span style={{ color: 'var(--text-dim)' }}>Rock</span></div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--jazz)', boxShadow: '0 0 6px var(--jazz)' }} /><span style={{ color: 'var(--text-dim)' }}>Jazz</span></div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--classical)', boxShadow: '0 0 6px var(--classical)' }} /><span style={{ color: 'var(--text-dim)' }}>Classical</span></div>
        </div>
      </div>

      <svg id="graph-svg" ref={graphRef} />

      <div id="panel" className={panelOpen ? 'open' : ''}>
        <div id="panel-hdr">
          <div id="p-level">{selectedNode ? levelLabels[selectedNode.level] : 'Constellation'}</div>
          <div id="p-name">{selectedNode?.name ?? 'Genre'}</div>
          <button id="p-close" title="Close" onClick={() => setPanelOpen(false)}>✕</button>
        </div>
        <div id="p-body">
          {!selectedNode ? null : panelStations.length ? (
            <>
              {atlasData.childMap[selectedNode.id]?.length ? (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 14, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--gold)' }}>✦</span> Contains {atlasData.childMap[selectedNode.id].length} sub-genre{atlasData.childMap[selectedNode.id].length !== 1 ? 's' : ''}. Click the star to expand.
                </div>
              ) : null}
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
                Radio Transmissions
              </div>
              {panelStations.map((station) => {
                const active = currentStationId === station.id
                const loading = loadingStationId === station.id
                return (
                  <div key={station.id} className={`s-card${active ? ' playing' : ''}`}>
                    <div className="s-name">{station.name}</div>
                    <div className="s-meta">
                      <span className="s-country">{station.countryLabel === 'US' ? '🇺🇸 US' : station.countryLabel}</span>
                      <span className="s-br">{station.bitrateLabel}</span>
                    </div>
                    <button className={`pbtn${active ? ' on' : ''}${loading ? ' loading' : ''}`} onClick={() => void playStation(station)}>
                      {loading ? <span className="btn-spinner" /> : active && playing ? '⏸' : '▶'}
                    </button>
                  </div>
                )
              })}
            </>
          ) : selectedNode ? (
            <div className="empty">No transmissions charted.</div>
          ) : null}
        </div>
      </div>

      <div id="tip" className={hovered ? 'show' : ''} style={hovered ? { left: hovered.x, top: hovered.y } : undefined}>
        <div id="tt-name">{hovered?.name}</div>
        <div id="tt-lv">{hovered?.level}</div>
        <div id="tt-st">{hovered ? `${hovered.stationCount} radio transmission${hovered.stationCount !== 1 ? 's' : ''}` : ''}</div>
        <div id="tt-hint">{hovered?.hint}</div>
      </div>

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
        <div className="pl-bars" id="pl-bars">
          <div className={`bar${playing ? ' on' : ''}`} />
          <div className={`bar${playing ? ' on' : ''}`} />
          <div className={`bar${playing ? ' on' : ''}`} />
          <div className={`bar${playing ? ' on' : ''}`} />
          <div className={`bar${playing ? ' on' : ''}`} />
        </div>
        <div className="pl-ctrls">
          <button className={`cbtn${playing ? ' on' : ''}${loadingStationId ? ' loading' : ''}`} id="cb-pause" title="Pause / Resume" onClick={toggleAudio}>
            {loadingStationId ? <span className="btn-spinner" /> : playing ? '⏸' : '▶'}
          </button>
          <button className="cbtn" id="cb-stop" title="Stop" onClick={stopAudio}>⏹</button>
        </div>
        <div className="vol-wrap">
          <span className="vol-ico">♪</span>
          <input type="range" id="vol" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </div>
      </div>

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
        <text x="30" y="19" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.9)" fontFamily="Cinzel,serif">N</text>
        <text x="30" y="52" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.6)" fontFamily="Cinzel,serif">S</text>
        <text x="7" y="33" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.6)" fontFamily="Cinzel,serif">W</text>
        <text x="53" y="33" textAnchor="middle" fontSize="6" fill="rgba(212,168,83,0.6)" fontFamily="Cinzel,serif">E</text>
      </svg>
    </>
  )
}

export default App
