import * as d3 from 'd3'
import Hls from 'hls.js'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'
import { atlasData } from './data/atlas'
import {
  computeRadioFlowEdgeKeys,
  getStationStyleLabels,
  pulseNodeIdsForPlayingStation,
  stationMatchesNode,
} from './data/selectors'

type RefNode = {
  id: string
  name: string
  level: 1 | 2 | 3
  parent: string | null
  color: string
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

const TAU = Math.PI * 2

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

const PROXIED_STATIONS = new Set(['hearme-future-garage', 'hearme-vocal-chillout'])

type SomaChannelsResponse = {
  channels?: {
    id: string
    lastPlaying?: string
  }[]
}

const SPECTRUM_BAR_COUNT = 28

/** Static bar heights for idle / decorative spectrum (matches live bar count). */
const PL_DECO_IDLE_HEIGHTS: readonly number[] = Array.from({ length: SPECTRUM_BAR_COUNT }, (_, i) => {
  const t = i / Math.max(SPECTRUM_BAR_COUNT - 1, 1)
  const blend = 0.24 + 0.11 * Math.sin(t * Math.PI * 2.4) + 0.07 * Math.sin(t * Math.PI * 4.8 + 1.1)
  return Math.round(Math.max(14, Math.min(44, blend * 100)))
})

function fillAnalyserFrequency(analyser: AnalyserNode, out: Uint8Array) {
  analyser.getByteFrequencyData(out as Parameters<AnalyserNode['getByteFrequencyData']>[0])
}

/** Log-ish bin spacing: more resolution in bass, for inline EQ bars. */
function computeSpectrumLevels(freqData: Uint8Array, barCount: number): number[] {
  const lo = 2
  const hi = Math.min(freqData.length - 1, 100)
  const span = hi - lo
  const curve = 1.35
  const levels: number[] = []

  for (let i = 0; i < barCount; i++) {
    const f0 = lo + span * Math.pow(i / barCount, curve)
    const f1 = lo + span * Math.pow((i + 1) / barCount, curve)
    const from = Math.min(hi, Math.floor(f0))
    const to = Math.min(hi, Math.max(from, Math.floor(f1)))
    let peak = 0
    for (let j = from; j <= to; j++) peak = Math.max(peak, freqData[j])
    levels.push(peak / 255)
  }

  return levels
}

function resolvePlayableStreamUrl(stationId: string, streamUrl: string) {
  if (!PROXIED_STATIONS.has(stationId)) return streamUrl
  return `/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`
}

function toAbsoluteUrl(url: string) {
  return new URL(url, window.location.href).toString()
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
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const waveformFrameRef = useRef<number | null>(null)
  const pulseFrameRef = useRef<number | null>(null)
  const stationPulseIdsRef = useRef<Set<string>>(new Set())
  const flowEdgeKeysRef = useRef<Set<string>>(new Set())
  const audioDataRef = useRef({ bass: 0, energy: 0 })
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
  const [spectrumLevels, setSpectrumLevels] = useState<number[] | null>(null)

  const selectedNode = useMemo(() => (selectedId ? atlasData.nodeMap[selectedId] : null), [selectedId])

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
    let milkyWayStars: { x: number; y: number; r: number; op: number; ph: number }[] = []
    let shootingStars: { x: number; y: number; vx: number; vy: number; spd: number; len: number; alpha: number; col: string }[] = []
    let nextShootAt = 0
    let t = 0
    let freqData: Uint8Array | null = null

    function resize() {
      width = canvasEl.width = window.innerWidth
      height = canvasEl.height = window.innerHeight
    }

    function init() {
      stars = []
      nebulae = []
      milkyWayStars = []
      shootingStars = []
      nextShootAt = 4

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

      // Milky Way — diagonal band of dense faint stars
      const mwAngle = -0.35
      const mwCx = width * 0.5
      const mwCy = height * 0.45
      for (let i = 0; i < 400; i++) {
        const along = (Math.random() - 0.5) * Math.sqrt(width * width + height * height) * 0.98
        const perp = (Math.random() + Math.random() + Math.random() - 1.5) * height * 0.09
        milkyWayStars.push({
          x: mwCx + along * Math.cos(mwAngle) - perp * Math.sin(mwAngle),
          y: mwCy + along * Math.sin(mwAngle) + perp * Math.cos(mwAngle),
          r: Math.random() * 0.52 + 0.1,
          op: Math.random() * 0.24 + 0.05,
          ph: Math.random() * Math.PI * 2,
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

      // Sample Web Audio analyser (if music is playing)
      let audioBass = 0
      let audioEnergy = 0
      const liveAnalyser = analyserRef.current
      if (liveAnalyser) {
        if (!freqData || freqData.length !== liveAnalyser.frequencyBinCount) {
          freqData = new Uint8Array(liveAnalyser.frequencyBinCount)
        }
        fillAnalyserFrequency(liveAnalyser, freqData)
        // Bass = weighted sum of first 3 bins (0–516 Hz)
        audioBass = (freqData[0] * 0.55 + freqData[1] * 0.30 + freqData[2] * 0.15) / 255
        let sum = 0
        for (let fi = 0; fi < freqData.length; fi++) sum += freqData[fi]
        audioEnergy = sum / (freqData.length * 255)
        // Smooth the values to avoid jitter
        audioDataRef.current = {
          bass: audioDataRef.current.bass * 0.35 + audioBass * 0.65,
          energy: audioDataRef.current.energy * 0.35 + audioEnergy * 0.65,
        }
      } else {
        // Gentle decay when not playing
        audioDataRef.current = {
          bass: audioDataRef.current.bass * 0.94,
          energy: audioDataRef.current.energy * 0.94,
        }
      }
      audioBass = audioDataRef.current.bass
      audioEnergy = audioDataRef.current.energy

      // Milky Way — subtle diffuse band glow
      const mwAngle = -0.35
      const mwCx = width * 0.5
      const mwCy = height * 0.45
      const mwPerpX = Math.sin(mwAngle)
      const mwPerpY = -Math.cos(mwAngle)
      const mwHalf = height * 0.14
      const mwGrad = context.createLinearGradient(
        mwCx + mwPerpX * mwHalf, mwCy + mwPerpY * mwHalf,
        mwCx - mwPerpX * mwHalf, mwCy - mwPerpY * mwHalf,
      )
      mwGrad.addColorStop(0, 'rgba(80,120,220,0)')
      mwGrad.addColorStop(0.5, `rgba(110,150,255,${0.022 + Math.sin(t * 0.12) * 0.004})`)
      mwGrad.addColorStop(1, 'rgba(80,120,220,0)')
      context.fillStyle = mwGrad
      context.fillRect(0, 0, width, height)

      // Milky Way individual stars
      for (const mws of milkyWayStars) {
        const tw = Math.sin(t * 1.1 + mws.ph) * 0.5 + 0.5
        context.beginPath()
        context.arc(mws.x, mws.y, mws.r, 0, Math.PI * 2)
        context.fillStyle = `rgba(190,210,255,${mws.op * (0.5 + 0.5 * tw)})`
        context.fill()
      }

      for (const nebula of nebulae) {
        const nx = nebula.x + viewportRef.current.x * nebula.drift * 0.02
        const ny = nebula.y + viewportRef.current.y * nebula.drift * 0.02
        const pulse = Math.sin(t * nebula.drift + nebula.x * 0.0015) * 0.5 + 0.5
        // Bass expands the nebula radius; energy boosts its brightness
        const audioR = nebula.r * (1 + audioBass * 0.55)
        const audioAlpha = nebula.alpha * (0.7 + pulse * 0.45 + audioEnergy * 0.55)
        const g = context.createRadialGradient(nx, ny, 0, nx, ny, audioR)
        g.addColorStop(0, `rgba(${nebula.color},${Math.min(audioAlpha, 0.88)})`)
        g.addColorStop(0.45, `rgba(${nebula.color},${nebula.alpha * (0.28 + audioEnergy * 0.14)})`)
        g.addColorStop(1, `rgba(${nebula.color},0)`)
        context.fillStyle = g
        context.fillRect(nx - audioR, ny - audioR, audioR * 2, audioR * 2)
      }

      for (const star of stars) {
        // Primary twinkle: period 3–13 s (was 1.8–9 min with multiplier 12)
        const tw = Math.sin(t * star.spd * 480 + star.ph) * 0.5 + 0.5
        // Bright stars get a faint secondary shimmer at a slightly different rate
        const tw2 = star.r > 1.1 ? Math.sin(t * star.spd * 310 + star.ph * 1.7) * 0.5 + 0.5 : tw
        const twBlend = tw * 0.78 + tw2 * 0.22
        const opacity = star.op * (0.22 + 0.78 * twBlend) * (1 + audioEnergy * 0.28)
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

        // Radius pulses gently for brighter stars (±13%)
        const pr = star.r > 0.8 ? star.r * (0.87 + 0.13 * twBlend) : star.r

        if (star.glow > 0) {
          // Glow radius also breathes with the twinkle
          const glowR = star.glow * (0.72 + 0.28 * twBlend)
          const glow = context.createRadialGradient(px, py, 0, px, py, glowR)
          glow.addColorStop(0, `rgba(${star.col},${opacity * 0.26})`)
          glow.addColorStop(0.35, `rgba(${star.col},${opacity * 0.09})`)
          glow.addColorStop(1, `rgba(${star.col},0)`)
          context.fillStyle = glow
          context.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2)
        }

        context.beginPath()
        context.arc(px, py, pr, 0, Math.PI * 2)
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

      // Shooting stars — spawn one every 4–14 real seconds
      if (shootingStars.length < 2 && t > nextShootAt) {
        const fromTop = Math.random() > 0.42
        const sx = fromTop ? Math.random() * width * 0.9 : Math.random() < 0.5 ? -10 : width + 10
        const sy = fromTop ? -10 : Math.random() * height * 0.55
        const angle = fromTop
          ? Math.PI * 0.15 + Math.random() * 0.4
          : sx < 0 ? Math.PI * 0.05 + Math.random() * 0.3 : Math.PI - Math.PI * 0.05 - Math.random() * 0.3
        const spd = Math.random() * 9 + 7
        shootingStars.push({
          x: sx, y: sy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          spd,
          len: Math.random() * 100 + 60,
          alpha: 0.9,
          col: Math.random() > 0.6 ? '255,242,200' : '210,228,255',
        })
        nextShootAt = t + Math.random() * 5 + 2
      }

      for (let si = shootingStars.length - 1; si >= 0; si--) {
        const ss = shootingStars[si]
        ss.x += ss.vx
        ss.y += ss.vy
        ss.alpha -= 0.0085

        if (ss.alpha <= 0 || ss.x > width + 140 || ss.y > height + 140 || ss.x < -140) {
          shootingStars.splice(si, 1)
          continue
        }

        const invSpd = ss.spd > 0 ? 1 / ss.spd : 1
        const tailX = ss.x - ss.vx * invSpd * ss.len
        const tailY = ss.y - ss.vy * invSpd * ss.len
        const ssGrad = context.createLinearGradient(tailX, tailY, ss.x, ss.y)
        ssGrad.addColorStop(0, `rgba(${ss.col},0)`)
        ssGrad.addColorStop(0.7, `rgba(${ss.col},${ss.alpha * 0.4})`)
        ssGrad.addColorStop(1, `rgba(${ss.col},${ss.alpha})`)
        context.beginPath()
        context.moveTo(tailX, tailY)
        context.lineTo(ss.x, ss.y)
        context.strokeStyle = ssGrad
        context.lineWidth = 1.6
        context.stroke()
        // bright head
        const headGlow = context.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 5)
        headGlow.addColorStop(0, `rgba(${ss.col},${ss.alpha})`)
        headGlow.addColorStop(1, `rgba(${ss.col},0)`)
        context.beginPath()
        context.arc(ss.x, ss.y, 5, 0, Math.PI * 2)
        context.fillStyle = headGlow
        context.fill()
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
    const station = playing && currentStationId ? atlasData.stationMap[currentStationId] : undefined
    stationPulseIdsRef.current = pulseNodeIdsForPlayingStation(station, selectedId)
    flowEdgeKeysRef.current = computeRadioFlowEdgeKeys(station, selectedId, playing)
  }, [playing, currentStationId, selectedId])

  // Pulsing nodes — branch from selected graph node (if station matches it), else all style/descriptor paths
  useEffect(() => {
    let pt = 0

    const tick = () => {
      pt += 0.014
      const svgEl = graphRef.current
      if (svgEl) {
        const { bass, energy } = audioDataRef.current
        const pulseIds = stationPulseIdsRef.current
        const audioRingBoost = 1 + bass * 0.38 + energy * 0.14
        const audioOpacityBoost = bass * 0.22 + energy * 0.08

        d3.select(svgEl)
          .selectAll<SVGGElement, RefNode>('g.nd')
          .each(function (d, i) {
            const grp = d3.select(this)
            const baseR = d.level === 1 ? 27 : d.level === 2 ? 16 : 9
            const phase = i * 0.62
            const pulseThis = pulseIds.size > 0 && pulseIds.has(d.id)

            if (!pulseThis) {
              grp.select('circle.gring-halo').attr('opacity', 0)
              grp.select('circle.gring-rim').attr('opacity', 0)
              if (d.level === 1) {
                grp.select('circle.gring-mid-halo').attr('opacity', 0)
                grp.select('circle.gring-mid-rim').attr('opacity', 0)
              }
              if (d.level <= 2) grp.select('circle.ncore').attr('r', baseR * 0.38)
              if (d.level === 3) grp.select('circle.nbody').attr('r', baseR)
              return
            }

            const ringFreq = d.level === 1 ? 0.36 : d.level === 2 ? 0.5 : 0.68
            const ringScale = (1 + Math.sin(pt * ringFreq + phase) * 0.048) * audioRingBoost
            const haloFillOp = Math.min(0.14 + Math.abs(Math.sin(pt * 0.42 + phase)) * 0.09 + audioOpacityBoost * 0.32, 0.4)
            const rimStrokeOp = Math.min(0.09 + Math.abs(Math.sin(pt * 0.36 + phase + 0.6)) * 0.05 + audioOpacityBoost * 0.11, 0.2)

            grp.select('circle.gring-halo').attr('opacity', 1).attr('r', baseR * 1.56 * ringScale).attr('fill-opacity', haloFillOp)

            grp
              .select('circle.gring-rim')
              .attr('opacity', 1)
              .attr('r', baseR * 1.9 * ringScale)
              .attr('stroke-opacity', rimStrokeOp)

            if (d.level === 1) {
              const midHalo = Math.min(haloFillOp * 1.06, 0.42)
              const midRim = Math.min(rimStrokeOp * 1.08, 0.22)
              grp.select('circle.gring-mid-halo').attr('opacity', 1).attr('r', baseR * 1.14 * ringScale).attr('fill-opacity', midHalo)
              grp.select('circle.gring-mid-rim').attr('opacity', 1).attr('r', baseR * 1.35 * ringScale).attr('stroke-opacity', midRim)
            }

            if (d.level <= 2) {
              const audioCore = 1 + bass * 0.28
              const coreScale = (1 + Math.sin(pt * 1.45 + phase + Math.PI * 0.3) * 0.22) * audioCore
              grp.select('circle.ncore').attr('r', baseR * 0.38 * coreScale)
            }

            if (d.level === 3) {
              const bodyScale = 1 + Math.sin(pt * 0.88 + phase) * 0.11 + energy * 0.08
              grp.select('circle.nbody').attr('r', baseR * bodyScale)
            }
          })

        const flowKeys = flowEdgeKeysRef.current
        const flowActive = flowKeys.size > 0

        d3.select(svgEl)
          .selectAll<SVGLineElement, RefLink>('line.edge')
          .each(function (d) {
            const src = typeof d.source === 'object' ? d.source : null
            const tgt = typeof d.target === 'object' ? d.target : null
            if (!src || !tgt) return
            const key = `${src.id}>${tgt.id}`
            const line = d3.select(this)

            if (flowActive && flowKeys.has(key)) {
              const ln = this as SVGLineElement
              const len = ln.getTotalLength() || 48
              const dashLen = Math.max(9, len * 0.065)
              const gapLen = Math.max(11, len * 0.2)
              const period = dashLen + gapLen
              const flowOff = (pt * 44) % period
              line
                .style('stroke-dasharray', `${dashLen} ${gapLen}`)
                .style('stroke-dashoffset', String(-flowOff))
                .style('stroke-opacity', String(Math.min(0.78, 0.36 + audioOpacityBoost * 0.5)))
                .style('stroke-width', String(src.level === 1 ? 2.05 : 1.32))
            } else {
              line
                .style('stroke-dasharray', src.level === 1 ? '5,5' : '2,5')
                .style('stroke-dashoffset', null)
                .style('stroke-opacity', '0.22')
                .style('stroke-width', String(src.level === 1 ? 1.4 : 0.9))
            }
          })
      }
      pulseFrameRef.current = requestAnimationFrame(tick)
    }

    tick()
    return () => {
      if (pulseFrameRef.current) cancelAnimationFrame(pulseFrameRef.current)
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.crossOrigin = 'anonymous'
    }
    audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => {
    return () => {
      if (waveformFrameRef.current) cancelAnimationFrame(waveformFrameRef.current)
      hlsRef.current?.destroy()
      hlsRef.current = null
      audioRef.current?.pause()
      audioContextRef.current?.close()
    }
  }, [])

  useEffect(() => {
    if (!playing || !analyserRef.current) {
      setSpectrumLevels(null)
      if (waveformFrameRef.current) cancelAnimationFrame(waveformFrameRef.current)
      waveformFrameRef.current = null
      return
    }

    const analyser = analyserRef.current
    const freqData = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      fillAnalyserFrequency(analyser, freqData)
      const levels = computeSpectrumLevels(freqData, SPECTRUM_BAR_COUNT)
      const maxLevel = Math.max(...levels)
      setSpectrumLevels(maxLevel > 0.02 ? levels : null)

      waveformFrameRef.current = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      if (waveformFrameRef.current) cancelAnimationFrame(waveformFrameRef.current)
      waveformFrameRef.current = null
    }
  }, [playing, currentStationId])

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
    const childrenByParent = nodes.reduce<Record<string, RefNode[]>>((acc, node) => {
      if (!node.parent) return acc
      acc[node.parent] ??= []
      acc[node.parent].push(node)
      return acc
    }, {})
    const rootNodes = nodes.filter((node) => node.level === 1)

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

    /** Audio pulse: soft halo only (no sharp stroke merged on top). */
    ;['pulseHalo3', 'pulseHalo6', 'pulseHalo10'].forEach((id, index) => {
      const dev = [5, 8, 12][index]
      const filter = defs
        .append('filter')
        .attr('id', id)
        .attr('x', '-100%')
        .attr('y', '-100%')
        .attr('width', '320%')
        .attr('height', '320%')
        .attr('color-interpolation-filters', 'sRGB')
      filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', dev).attr('result', 'blur')
      filter.append('feMerge').append('feMergeNode').attr('in', 'blur')
    })

    const g = svg.append('g')
    const linkG = g.append('g')
    const nodeG = g.append('g')
    const labelG = g.append('g')
    const expanded = new Set<string>()

    function getL1(node: RefNode) {
      if (node.level === 1) return node
      if (node.level === 2) return node.parent ? nodeMap[node.parent] ?? null : null
      if (node.level === 3) return node.parent ? nodeMap[nodeMap[node.parent]?.parent ?? ''] ?? null : null
      return null
    }

    function clampSectorSpan(rootCount: number) {
      const naturalStep = TAU / Math.max(rootCount, 1)
      return Math.min(1.78, naturalStep * 0.88)
    }

    function distributeOffset(index: number, total: number) {
      if (total <= 1) return 0
      return (index / (total - 1) - 0.5) * 2
    }

    function nodeColor(node: RefNode) {
      return getL1(node)?.color ?? node.color
    }

    function nodeBelongsToRoot(node: RefNode, rootId: string) {
      return getL1(node)?.id === rootId
    }

    function getActiveRootId() {
      const expandedRoots = rootNodes.filter((root) => expanded.has(root.id))
      if (expandedRoots.length === 1) return expandedRoots[0].id
      return null
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

    function computeTargets(visibleNodes: RefNode[]) {
      const targets = new Map<string, { x: number; y: number }>()
      const visibleIds = new Set(visibleNodes.map((node) => node.id))
      const centerX = width() / 2
      const centerY = height() / 2
      const rootOrbit = Math.max(210, Math.min(width(), height()) * 0.34)
      // When a root is expanded, use its own count (1) so children get the full angular room
      const expandedRootCount = rootNodes.filter((r) => expanded.has(r.id)).length
      const sectorSpan = clampSectorSpan(expandedRootCount > 0 ? expandedRootCount : rootNodes.length)

      rootNodes.forEach((root, rootIndex) => {
        const rootAngle = -Math.PI / 2 + (rootIndex / Math.max(rootNodes.length, 1)) * TAU
        const rootX = centerX + Math.cos(rootAngle) * rootOrbit
        const rootY = centerY + Math.sin(rootAngle) * rootOrbit
        targets.set(root.id, { x: rootX, y: rootY })

        const level2Children = (childrenByParent[root.id] ?? []).filter((child) => visibleIds.has(child.id))
        const visibleGrandchildren = level2Children.reduce((sum, child) => sum + ((childrenByParent[child.id] ?? []).filter((grandchild) => visibleIds.has(grandchild.id)).length), 0)
        const level2Orbit = 172 + Math.max(0, level2Children.length - 4) * 20 + visibleGrandchildren * 6
        const rootDirX = Math.cos(rootAngle)
        const rootDirY = Math.sin(rootAngle)
        const rootTanX = Math.cos(rootAngle + Math.PI / 2)
        const rootTanY = Math.sin(rootAngle + Math.PI / 2)
        const level2TangentLimit = Math.tan(sectorSpan / 2) * level2Orbit * 0.96

        level2Children.forEach((child, childIndex) => {
          const level2Offset = distributeOffset(childIndex, level2Children.length)
          const tangentSpread = level2TangentLimit * level2Offset
          const childX = rootX + rootDirX * level2Orbit + rootTanX * tangentSpread
          const childY = rootY + rootDirY * level2Orbit + rootTanY * tangentSpread
          targets.set(child.id, { x: childX, y: childY })

          const level3Children = (childrenByParent[child.id] ?? []).filter((grandchild) => visibleIds.has(grandchild.id))
          const l3Count = level3Children.length
          const level3Orbit =
            120 + Math.max(0, l3Count - 2) * 22 + Math.max(0, level2Children.length - 5) * 5
          const branchAngle = Math.atan2(childY - rootY, childX - rootX)
          const branchDirX = Math.cos(branchAngle)
          const branchDirY = Math.sin(branchAngle)
          const branchTanX = Math.cos(branchAngle + Math.PI / 2)
          const branchTanY = Math.sin(branchAngle + Math.PI / 2)
          const level3Span = Math.min(
            Math.PI * 0.95,
            Math.max(sectorSpan * 0.88, 0.52 + l3Count * 0.24),
          )
          let level3TangentLimit = Math.tan(level3Span / 2) * level3Orbit * 0.94
          const l3Radius = 9
          const minL3Gap = l3Radius * 2 + 38
          if (l3Count > 1) {
            level3TangentLimit = Math.max(level3TangentLimit, (minL3Gap * (l3Count - 1)) / 2)
          }

          level3Children.forEach((grandchild, grandchildIndex) => {
            const offset = distributeOffset(grandchildIndex, level3Children.length)
            const branchSpread = level3TangentLimit * offset
            targets.set(grandchild.id, {
              x: childX + branchDirX * level3Orbit + branchTanX * branchSpread,
              y: childY + branchDirY * level3Orbit + branchTanY * branchSpread,
            })
          })
        })
      })

      return targets
    }

    const simulation = d3
      .forceSimulation<RefNode>()
      .velocityDecay(0.42)
      .force(
        'link',
        d3
          .forceLink<RefNode, RefLink>()
          .id((d) => d.id)
          .distance((d) => {
            const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
            if (!source) return 90
            if (source.level === 1) {
              const branchCount = childrenByParent[source.id]?.length ?? 0
              return 155 + Math.max(0, branchCount - 4) * 20
            }
            if (source.level === 2) {
              const leafCount = childrenByParent[source.id]?.length ?? 0
              return 118 + Math.max(0, leafCount - 2) * 24
            }
            return 60
          })
          .strength((d) => {
            const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
            return source?.level === 2 ? 1.08 : 0.9
          }),
      )
      .force('charge', d3.forceManyBody<RefNode>().strength((d) => (d.level === 1 ? -320 : d.level === 2 ? -140 : -110)))
      .force(
        'collision',
        d3
          .forceCollide<RefNode>()
          .radius((d) => nr(d) + (d.level === 1 ? 34 : d.level === 2 ? 28 : 30))
          .iterations(3),
      )
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

    function collapseOtherRoots(activeRootId: string) {
      rootNodes.forEach((root) => {
        if (root.id !== activeRootId) collapseAll(root.id)
      })
    }

    function clickNode(node: RefNode) {
      const hasKids = nodes.some((item) => item.parent === node.id)
      if (hasKids) {
        if (expanded.has(node.id)) collapseAll(node.id)
        else {
          const rootId = getL1(node)?.id
          if (rootId) collapseOtherRoots(rootId)
          expanded.add(node.id)
        }
        update(false)
      }
      highlight(node.id)
      refreshPanel(node)
    }

    function update(initial: boolean) {
      const { visibleNodes, visibleLinks } = getVisible()
      const targets = computeTargets(visibleNodes)
      const activeRootId = getActiveRootId()
      simulation.force('center', d3.forceCenter(width() / 2, height() / 2))
      simulation.force(
        'orbit-x',
        d3
          .forceX<RefNode>((d) => targets.get(d.id)?.x ?? width() / 2)
          .strength((d) => (d.level === 1 ? 0.3 : d.level === 2 ? 0.58 : 0.68)),
      )
      simulation.force(
        'orbit-y',
        d3
          .forceY<RefNode>((d) => targets.get(d.id)?.y ?? height() / 2)
          .strength((d) => (d.level === 1 ? 0.3 : d.level === 2 ? 0.58 : 0.68)),
      )

      visibleNodes.forEach((node) => {
        const target = targets.get(node.id)
        if (!target) return
        if (node.x === undefined || node.y === undefined || initial) {
          const jitter = node.level === 1 ? 18 : node.level === 2 ? 10 : 4
          node.x = target.x + (Math.random() - 0.5) * jitter
          node.y = target.y + (Math.random() - 0.5) * jitter
        }
      })

      const linkSelection = linkG.selectAll<SVGLineElement, RefLink>('line.edge').data(visibleLinks, (d) => {
        const source = typeof d.source === 'object' ? d.source.id : d.source
        const target = typeof d.target === 'object' ? d.target.id : d.target
        return `${source}>${target}`
      })

      const enteredLinks = linkSelection
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

      const activeLinkSelection = linkSelection.merge(enteredLinks)

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
        .attr('class', 'gring-halo')
        .attr('r', (d) => nr(d) * 1.56)
        .attr('fill', (d) => nodeColor(d))
        .attr('fill-opacity', 0.2)
        .attr('stroke', 'none')
        .attr('opacity', 0)
        .attr('pointer-events', 'none')
        .attr('filter', (d) => (d.level === 1 ? 'url(#pulseHalo10)' : d.level === 2 ? 'url(#pulseHalo6)' : 'url(#pulseHalo3)'))

      entered
        .append('circle')
        .attr('class', 'gring-rim')
        .attr('r', (d) => nr(d) * 1.9)
        .attr('fill', 'none')
        .attr('stroke', (d) => nodeColor(d))
        .attr('stroke-width', 0.32)
        .attr('stroke-linecap', 'round')
        .attr('stroke-opacity', 0.15)
        .attr('opacity', 0)
        .attr('pointer-events', 'none')

      entered
        .filter((d) => d.level === 1)
        .append('circle')
        .attr('class', 'gring-mid-halo')
        .attr('r', (d) => nr(d) * 1.14)
        .attr('fill', (d) => nodeColor(d))
        .attr('fill-opacity', 0.22)
        .attr('stroke', 'none')
        .attr('opacity', 0)
        .attr('pointer-events', 'none')
        .attr('filter', 'url(#pulseHalo6)')

      entered
        .filter((d) => d.level === 1)
        .append('circle')
        .attr('class', 'gring-mid-rim')
        .attr('r', (d) => nr(d) * 1.35)
        .attr('fill', 'none')
        .attr('stroke', (d) => nodeColor(d))
        .attr('stroke-width', 0.28)
        .attr('stroke-linecap', 'round')
        .attr('stroke-opacity', 0.16)
        .attr('opacity', 0)
        .attr('pointer-events', 'none')

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

      const activeNodeSelection = nodeSelection.merge(entered)

      const labelSelection = labelG.selectAll<SVGTextElement, RefNode>('text.lbl').data(visibleNodes, (d) => d.id)

      const enteredLabels = labelSelection
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

      const activeLabelSelection = labelSelection.merge(enteredLabels)

      labelSelection.exit().transition().duration(300).style('opacity', 0).remove()
      nodeSelection.exit().transition().duration(300).style('opacity', 0).remove()

      activeNodeSelection
        .transition()
        .duration(420)
        .style('opacity', (d) => {
          if (!activeRootId) return 1
          return nodeBelongsToRoot(d, activeRootId) ? 1 : d.level === 1 ? 0.34 : 0.12
        })

      activeLabelSelection
        .transition()
        .duration(420)
        .style('opacity', (d) => {
          if (!activeRootId) return 1
          return nodeBelongsToRoot(d, activeRootId) ? 1 : d.level === 1 ? 0.42 : 0.14
        })

      activeLinkSelection
        .transition()
        .duration(420)
        .style('opacity', (d) => {
          if (!activeRootId) return 1
          const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
          const target = typeof d.target === 'object' ? d.target : nodeMap[d.target]
          return nodeBelongsToRoot(source, activeRootId) && nodeBelongsToRoot(target, activeRootId) ? 1 : 0.1
        })

      simulation.nodes(visibleNodes)
      const linkForce = simulation.force<d3.ForceLink<RefNode, RefLink>>('link')
      linkForce?.links(visibleLinks)
      simulation.alpha(initial ? 1 : 0.4).restart()

      const focusTransform = (() => {
        if (!activeRootId) {
          return d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1).translate(-width() / 2, -height() / 2)
        }

        const rootTarget = targets.get(activeRootId)
        if (!rootTarget) {
          return d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1).translate(-width() / 2, -height() / 2)
        }

        const scale = 1.18
        return d3.zoomIdentity.translate(width() / 2, height() / 2).scale(scale).translate(-rootTarget.x, -rootTarget.y)
      })()

      svg
        .transition()
        .duration(initial ? 100 : 700)
        .ease(d3.easeCubicOut)
        .call(zoomBehavior.transform, focusTransform)
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
    return atlasData.stations.filter((station) => stationMatchesNode(station, selectedNode.id))
  }, [selectedNode])

  function clearCurrentStream() {
    hlsRef.current?.destroy()
    hlsRef.current = null

    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.removeAttribute('src')
    audioRef.current.load()
  }

  async function ensureAudioAnalyser() {
    if (!audioRef.current) return false

    try {
      if (!audioContextRef.current) {
        const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioContextCtor) return false
        audioContextRef.current = new AudioContextCtor()
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      if (!mediaSourceRef.current) {
        mediaSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
      }

      if (!analyserRef.current) {
        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.72
        mediaSourceRef.current.connect(analyser)
        analyser.connect(audioContextRef.current.destination)
        analyserRef.current = analyser
      }

      return true
    } catch {
      analyserRef.current = null
      setSpectrumLevels(null)
      return false
    }
  }

  async function startStream(streamUrl: string) {
    if (!audioRef.current) return false

    clearCurrentStream()
    audioRef.current.crossOrigin = 'anonymous'
    await ensureAudioAnalyser()

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
    const playableUrl = resolvePlayableStreamUrl(station.id, station.streamUrl)
    const currentAudioUrl = audioRef.current.currentSrc || audioRef.current.src
    const hasStaleStreamUrl = currentAudioUrl && toAbsoluteUrl(playableUrl) !== currentAudioUrl

    if (currentStationId === station.id) {
      if (hasStaleStreamUrl) {
        setLoadingStationId(station.id)
        setCurrentTrackTitle('')
        const restarted = await startStream(playableUrl)
        setPlaying(restarted)
        setLoadingStationId(null)
        return
      }

      if (audioRef.current.paused) {
        setLoadingStationId(station.id)
        void ensureAudioAnalyser()
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
    const started = await startStream(playableUrl)
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
      void ensureAudioAnalyser()
      void audioRef.current.play()
      setPlaying(true)
    } else {
      audioRef.current.pause()
      setPlaying(false)
    }
  }

  const waveformState = loadingStationId ? 'loading' : playing ? 'playing' : 'idle'

  return (
    <>
      <canvas id="starfield" ref={starfieldRef} />

      <div id="hdr">
        <div className="hdr-center">
          <div className="hdr-title">✦ Celestial Atlas of Sound ✦</div>
          <div className="hdr-sub">A stellar cartography of music genres &amp; radio transmissions</div>
        </div>
        <div className="legend">
          {atlasData.roots.map((root) => (
            <div key={root.id} className="legend-item">
              <div className="legend-dot" style={{ background: root.color, boxShadow: `0 0 6px ${root.color}` }} />
              <span style={{ color: 'var(--text-dim)' }}>{root.name}</span>
            </div>
          ))}
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
                const styleLabels = getStationStyleLabels(station)
                return (
                  <div key={station.id} className={`s-card${active ? ' playing' : ''}`}>
                    <div className="s-name">{station.name}</div>
                    <div className="s-taxonomy">
                      <span className="s-taxonomy-row">Primary: {styleLabels.primary}</span>
                      {styleLabels.related.length ? <span className="s-taxonomy-row">Related: {styleLabels.related.join(' • ')}</span> : null}
                      {styleLabels.descriptors.length ? <span className="s-taxonomy-row">Descriptors: {styleLabels.descriptors.join(' • ')}</span> : null}
                    </div>
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
        <div className={`pl-wave ${spectrumLevels ? 'pl-wave-real' : `pl-wave-${waveformState}`}`} aria-hidden="true">
          {spectrumLevels ? (
            <div className="pl-spectrum">
              {spectrumLevels.map((v, i) => {
                const h = Math.round(Math.max(6, Math.min(100, 6 + v * 118)))
                return <div key={i} className="pl-spectrum-bar" style={{ height: `${h}%` }} />
              })}
            </div>
          ) : (
            <div className="pl-spectrum pl-spectrum-deco">
              {PL_DECO_IDLE_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className="pl-spectrum-bar"
                  style={{ height: `${h}%`, ['--pl-bar-i' as string]: String(i) } as CSSProperties}
                />
              ))}
            </div>
          )}
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
