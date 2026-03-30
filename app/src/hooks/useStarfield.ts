import { useEffect, type MutableRefObject, type RefObject } from 'react'
import { fillAnalyserFrequency } from '../app/audio'
import type { AudioLevels, ViewportState } from '../app/types'

type StarLayer = 0 | 1 | 2

type BackgroundStar = {
  x: number
  y: number
  r: number
  op: number
  ph: number
  col: string
  layer: StarLayer
  glow: number
  driftX: number
  driftY: number
}

type Nebula = {
  x: number
  y: number
  r: number
  color: string
  alpha: number
  drift: number
}

type MilkyWayStar = { x: number; y: number; r: number; op: number; ph: number }
type FlightStar = { x: number; y: number; r: number; op: number; ph: number; col: string; depth: number; glow: number }
type ShootingStar = { x: number; y: number; vx: number; vy: number; spd: number; len: number; alpha: number; col: string }

type UseStarfieldArgs = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  analyserRef: MutableRefObject<AnalyserNode | null>
  audioDataRef: MutableRefObject<AudioLevels>
  viewportRef: MutableRefObject<ViewportState>
}

function toRgba(color: string, alpha: number) {
  if (!color.startsWith('#')) return color
  const hex = color.slice(1)
  const normalized = hex.length === 3 ? hex.split('').map((part) => `${part}${part}`).join('') : hex
  const value = Number.parseInt(normalized, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export function useStarfield({ canvasRef, analyserRef, audioDataRef, viewportRef }: UseStarfieldArgs) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const canvasEl = canvas
    const ctx = context

    let width = 0
    let height = 0
    let frameId: number | null = null
    let stars: BackgroundStar[] = []
    let flightStars: FlightStar[] = []
    let nebulae: Nebula[] = []
    let milkyWayStars: MilkyWayStar[] = []
    let shootingStars: ShootingStar[] = []
    let nextShootAt = 0
    let t = 0
    let freqData: Uint8Array | null = null

    function resize() {
      width = canvasEl.width = window.innerWidth
      height = canvasEl.height = window.innerHeight
    }

    function init() {
      stars = []
      flightStars = []
      nebulae = []
      milkyWayStars = []
      shootingStars = []
      nextShootAt = 4

      const layerCounts: Record<StarLayer, number> = { 0: 140, 1: 210, 2: 280 }
      const layerOpacity: Record<StarLayer, [number, number]> = {
        0: [0.2, 0.5],
        1: [0.16, 0.42],
        2: [0.12, 0.32],
      }

      for (const layer of [0, 1, 2] as const) {
        for (let i = 0; i < layerCounts[layer]; i += 1) {
          const bright = Math.random() > (layer === 0 ? 0.82 : layer === 1 ? 0.92 : 0.97)
          const [minOp, maxOp] = layerOpacity[layer]
          const star: BackgroundStar = {
            x: (Math.random() - 0.1) * width * 1.2,
            y: (Math.random() - 0.1) * height * 1.2,
            r: bright ? Math.random() * 1.8 + (layer === 0 ? 1.2 : 0.8) : Math.random() * (layer === 0 ? 1.2 : 0.85) + 0.08,
            op: minOp + Math.random() * (maxOp - minOp),
            ph: Math.random() * Math.PI * 2,
            col: bright ? (Math.random() > 0.55 ? '255,226,180' : '196,216,255') : Math.random() > 0.64 ? '182,201,255' : '234,238,255',
            layer,
            glow: bright ? Math.random() * (layer === 0 ? 18 : 10) + (layer === 0 ? 12 : 6) : 0,
            driftX: (Math.random() - 0.5) * (layer === 0 ? 0.016 : layer === 1 ? 0.01 : 0.005),
            driftY: (Math.random() - 0.5) * (layer === 0 ? 0.012 : layer === 1 ? 0.008 : 0.004),
          }
          stars.push(star)
        }
      }

      for (let i = 0; i < 5; i += 1) {
        nebulae.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 220 + 180,
          color: Math.random() > 0.52 ? '70,110,210' : Math.random() > 0.5 ? '110,82,170' : '210,150,80',
          alpha: Math.random() * 0.055 + 0.022,
          drift: Math.random() * 0.12 + 0.03,
        })
      }

      for (let i = 0; i < 180; i += 1) {
        const depth = Math.random() * 1.2 + 0.35
        const angle = Math.random() * Math.PI * 2
        const spawnRadius = Math.min(width, height) * (0.05 + Math.random() * 0.18)
        flightStars.push({
          x: width * 0.5 + Math.cos(angle) * spawnRadius,
          y: height * 0.5 + Math.sin(angle) * spawnRadius,
          r: Math.random() > 0.9 ? Math.random() * 1.6 + 1.0 : Math.random() * 0.95 + 0.12,
          op: Math.random() * 0.5 + 0.1,
          ph: Math.random() * Math.PI * 2,
          col: Math.random() > 0.88 ? '255,224,170' : Math.random() > 0.58 ? '170,185,255' : '235,238,255',
          depth,
          glow: Math.random() > 0.9 ? Math.random() * 12 + 10 : 0,
        })
      }

      const mwAngle = -0.35
      const mwCx = width * 0.5
      const mwCy = height * 0.45
      for (let i = 0; i < 360; i += 1) {
        const along = (Math.random() - 0.5) * Math.sqrt(width * width + height * height) * 0.98
        const perp = (Math.random() + Math.random() + Math.random() - 1.5) * height * 0.09
        milkyWayStars.push({
          x: mwCx + along * Math.cos(mwAngle) - perp * Math.sin(mwAngle),
          y: mwCy + along * Math.sin(mwAngle) + perp * Math.cos(mwAngle),
          r: Math.random() * 0.48 + 0.1,
          op: Math.random() * 0.22 + 0.04,
          ph: Math.random() * Math.PI * 2,
        })
      }
    }

    function drawBackgroundGradient(audioEnergy: number) {
      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.72)
      gradient.addColorStop(0, 'rgba(10,16,36,1)')
      gradient.addColorStop(0.55, 'rgba(5,9,22,1)')
      gradient.addColorStop(1, 'rgba(2,4,12,1)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.18, width * 0.5, height * 0.5, Math.max(width, height) * 0.74)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, `rgba(0,0,0,${0.34 + audioEnergy * 0.08})`)
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)
    }

    function drawMilkyWay() {
      const mwAngle = -0.35
      const mwCx = width * 0.5
      const mwCy = height * 0.45
      const mwPerpX = Math.sin(mwAngle)
      const mwPerpY = -Math.cos(mwAngle)
      const mwHalf = height * 0.19
      const mwGrad = ctx.createLinearGradient(mwCx + mwPerpX * mwHalf, mwCy + mwPerpY * mwHalf, mwCx - mwPerpX * mwHalf, mwCy - mwPerpY * mwHalf)
      mwGrad.addColorStop(0, 'rgba(92,130,230,0)')
      mwGrad.addColorStop(0.22, 'rgba(92,130,230,0.026)')
      mwGrad.addColorStop(0.5, 'rgba(132,176,255,0.078)')
      mwGrad.addColorStop(0.78, 'rgba(92,130,230,0.03)')
      mwGrad.addColorStop(1, 'rgba(92,130,230,0)')
      ctx.fillStyle = mwGrad
      ctx.fillRect(0, 0, width, height)

      for (const star of milkyWayStars) {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r * 1.18, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(205,222,255,${star.op * 0.98})`
        ctx.fill()
      }
    }

    function drawAmbientNebulae(audioBass: number, audioEnergy: number) {
      for (const nebula of nebulae) {
        const nx = nebula.x + viewportRef.current.x * nebula.drift * 0.016
        const ny = nebula.y + viewportRef.current.y * nebula.drift * 0.016
        const pulse = Math.sin(t * nebula.drift + nebula.x * 0.0015) * 0.5 + 0.5
        const audioR = nebula.r * (1 + audioBass * 0.38)
        const audioAlpha = nebula.alpha * (0.72 + pulse * 0.32 + audioEnergy * 0.36)
        const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, audioR)
        gradient.addColorStop(0, `rgba(${nebula.color},${Math.min(audioAlpha, 0.42)})`)
        gradient.addColorStop(0.45, `rgba(${nebula.color},${nebula.alpha * (0.18 + audioEnergy * 0.1)})`)
        gradient.addColorStop(1, `rgba(${nebula.color},0)`)
        ctx.fillStyle = gradient
        ctx.fillRect(nx - audioR, ny - audioR, audioR * 2, audioR * 2)
      }
    }

    function drawActiveRootNebula(audioBass: number, audioEnergy: number) {
      const { activeRootId, activeRootColor, activeRootX, activeRootY, activeRootGlow, x, y, k } = viewportRef.current
      if (!activeRootId || !activeRootColor || activeRootGlow <= 0) return

      const screenX = activeRootX * k + x
      const screenY = activeRootY * k + y
      const radius = (180 + Math.sin(t * 0.8) * 10 + audioBass * 44 + audioEnergy * 18) * k

      const outer = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius * 1.55)
      outer.addColorStop(0, toRgba(activeRootColor, 0.16 + audioEnergy * 0.04))
      outer.addColorStop(0.34, toRgba(activeRootColor, 0.06 + audioBass * 0.03))
      outer.addColorStop(1, toRgba(activeRootColor, 0))
      ctx.fillStyle = outer
      ctx.fillRect(screenX - radius * 1.55, screenY - radius * 1.55, radius * 3.1, radius * 3.1)

      const inner = ctx.createRadialGradient(screenX + radius * 0.08, screenY - radius * 0.04, 0, screenX, screenY, radius * 0.9)
      inner.addColorStop(0, toRgba(activeRootColor, 0.12 + audioBass * 0.04))
      inner.addColorStop(0.52, toRgba(activeRootColor, 0.032))
      inner.addColorStop(1, toRgba(activeRootColor, 0))
      ctx.fillStyle = inner
      ctx.fillRect(screenX - radius, screenY - radius, radius * 2, radius * 2)
    }

    function drawParallaxStars(audioEnergy: number) {
      const layerShift = [
        { shift: 0.008, scale: 0.018 },
        { shift: 0.017, scale: 0.028 },
        { shift: 0.03, scale: 0.038 },
      ] as const
      const focusX = viewportRef.current.focusX || width * 0.5
      const focusY = viewportRef.current.focusY || height * 0.5

      for (const star of stars) {
        const layerMeta = layerShift[star.layer]
        star.x += star.driftX
        star.y += star.driftY
        if (star.x < -width * 0.12) star.x = width * 1.08
        else if (star.x > width * 1.08) star.x = -width * 0.12
        if (star.y < -height * 0.12) star.y = height * 1.08
        else if (star.y > height * 1.08) star.y = -height * 0.12
        const twinkle = Math.sin(t * (0.48 + star.layer * 0.14) + star.ph) * 0.5 + 0.5
        const px = star.x + viewportRef.current.x * layerMeta.shift
        const py = star.y + viewportRef.current.y * layerMeta.shift
        const scale = 1 + (viewportRef.current.k - 1) * layerMeta.scale
        const sx = focusX + (px - focusX) * scale
        const sy = focusY + (py - focusY) * scale
        const opacity = star.op * (0.6 + twinkle * 0.28 + audioEnergy * 0.05)
        const radius = star.r * (0.96 + twinkle * 0.05)

        if (star.glow > 0) {
          const glowR = star.glow * (0.82 + twinkle * 0.08)
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR)
          glow.addColorStop(0, `rgba(${star.col},${opacity * 0.18})`)
          glow.addColorStop(0.4, `rgba(${star.col},${opacity * 0.06})`)
          glow.addColorStop(1, `rgba(${star.col},0)`)
          ctx.fillStyle = glow
          ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2)
        }

        ctx.beginPath()
        ctx.arc(sx, sy, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${star.col},${opacity})`
        ctx.fill()

        if (star.layer === 0 && star.r > 1.4) {
          ctx.strokeStyle = `rgba(${star.col},${opacity * 0.2})`
          ctx.lineWidth = 0.28
          ctx.beginPath()
          ctx.moveTo(sx - star.r * 2.5, sy)
          ctx.lineTo(sx + star.r * 2.5, sy)
          ctx.moveTo(sx, sy - star.r * 2.5)
          ctx.lineTo(sx, sy + star.r * 2.5)
          ctx.stroke()
        }
      }
    }

    function respawnFlightStar(star: FlightStar) {
      const angle = Math.random() * Math.PI * 2
      const spawnInner = Math.min(width, height) * 0.05
      const spawnOuter = Math.min(width, height) * 0.22
      const spawnRadius = spawnInner + Math.random() * (spawnOuter - spawnInner)
      star.x = width * 0.5 + Math.cos(angle) * spawnRadius
      star.y = height * 0.5 + Math.sin(angle) * spawnRadius
    }

    function drawFlightStars(audioBass: number, audioEnergy: number) {
      const focusX = viewportRef.current.focusX || width * 0.5
      const focusY = viewportRef.current.focusY || height * 0.5
      for (const star of flightStars) {
        const dx = star.x - width * 0.5
        const dy = star.y - height * 0.5
        const dist = Math.hypot(dx, dy) || 1
        const ux = dx / dist
        const uy = dy / dist
        const flightSpeed = 0.028 + star.depth * 0.048 + audioEnergy * 0.01 + audioBass * 0.008
        star.x += ux * flightSpeed
        star.y += uy * flightSpeed

        if (star.x < -80 || star.x > width + 80 || star.y < -80 || star.y > height + 80) {
          respawnFlightStar(star)
        }

        const tw = Math.sin(t * (0.7 + star.depth * 0.12) + star.ph) * 0.5 + 0.5
        const opacity = star.op * (0.5 + 0.22 * tw)
        const viewportShiftX = viewportRef.current.x * star.depth * 0.022
        const viewportShiftY = viewportRef.current.y * star.depth * 0.022
        const bgScale = 1 + (viewportRef.current.k - 1) * (0.03 + star.depth * 0.026)
        const sx = focusX + (star.x - focusX) * bgScale + viewportShiftX
        const sy = focusY + (star.y - focusY) * bgScale + viewportShiftY
        const radius = star.r > 0.8 ? star.r * (0.94 + 0.05 * tw) : star.r

        if (star.glow > 0) {
          const glowR = star.glow * (0.88 + 0.08 * tw)
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR)
          glow.addColorStop(0, `rgba(${star.col},${opacity * 0.22})`)
          glow.addColorStop(0.35, `rgba(${star.col},${opacity * 0.08})`)
          glow.addColorStop(1, `rgba(${star.col},0)`)
          ctx.fillStyle = glow
          ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2)
        }

        ctx.beginPath()
        ctx.arc(sx, sy, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${star.col},${opacity})`
        ctx.fill()
      }
    }

    function drawShootingStars() {
      if (shootingStars.length < 2 && t > nextShootAt) {
        const fromTop = Math.random() > 0.42
        const sx = fromTop ? Math.random() * width * 0.9 : Math.random() < 0.5 ? -10 : width + 10
        const sy = fromTop ? -10 : Math.random() * height * 0.55
        const angle = fromTop
          ? Math.PI * 0.15 + Math.random() * 0.4
          : sx < 0 ? Math.PI * 0.05 + Math.random() * 0.3 : Math.PI - Math.PI * 0.05 - Math.random() * 0.3
        const spd = Math.random() * 9 + 7
        shootingStars.push({
          x: sx,
          y: sy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          spd,
          len: Math.random() * 100 + 60,
          alpha: 0.9,
          col: Math.random() > 0.6 ? '255,242,200' : '210,228,255',
        })
        nextShootAt = t + Math.random() * 5 + 2
      }

      for (let si = shootingStars.length - 1; si >= 0; si -= 1) {
        const star = shootingStars[si]
        star.x += star.vx
        star.y += star.vy
        star.alpha -= 0.0085

        if (star.alpha <= 0 || star.x > width + 140 || star.y > height + 140 || star.x < -140) {
          shootingStars.splice(si, 1)
          continue
        }

        const invSpd = star.spd > 0 ? 1 / star.spd : 1
        const tailX = star.x - star.vx * invSpd * star.len
        const tailY = star.y - star.vy * invSpd * star.len
        const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y)
        gradient.addColorStop(0, `rgba(${star.col},0)`)
        gradient.addColorStop(0.7, `rgba(${star.col},${star.alpha * 0.4})`)
        gradient.addColorStop(1, `rgba(${star.col},${star.alpha})`)
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(star.x, star.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.6
        ctx.stroke()
        const headGlow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 5)
        headGlow.addColorStop(0, `rgba(${star.col},${star.alpha})`)
        headGlow.addColorStop(1, `rgba(${star.col},0)`)
        ctx.beginPath()
        ctx.arc(star.x, star.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = headGlow
        ctx.fill()
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      t += 0.008

      let audioBass = 0
      let audioEnergy = 0
      const liveAnalyser = analyserRef.current
      if (liveAnalyser) {
        if (!freqData || freqData.length !== liveAnalyser.frequencyBinCount) {
          freqData = new Uint8Array(liveAnalyser.frequencyBinCount)
        }
        fillAnalyserFrequency(liveAnalyser, freqData)
        audioBass = (freqData[0] * 0.55 + freqData[1] * 0.3 + freqData[2] * 0.15) / 255
        let sum = 0
        for (let fi = 0; fi < freqData.length; fi += 1) sum += freqData[fi]
        audioEnergy = sum / (freqData.length * 255)
        audioDataRef.current = {
          bass: audioDataRef.current.bass * 0.18 + audioBass * 0.82,
          energy: audioDataRef.current.energy * 0.22 + audioEnergy * 0.78,
        }
      } else {
        audioDataRef.current = {
          bass: audioDataRef.current.bass * 0.94,
          energy: audioDataRef.current.energy * 0.94,
        }
      }
      audioBass = audioDataRef.current.bass
      audioEnergy = audioDataRef.current.energy

      drawBackgroundGradient(audioEnergy)
      drawMilkyWay()
      drawAmbientNebulae(audioBass, audioEnergy)
      drawActiveRootNebula(audioBass, audioEnergy)
      drawParallaxStars(audioEnergy)
      drawFlightStars(audioBass, audioEnergy)
      drawShootingStars()

      frameId = requestAnimationFrame(draw)
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
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [analyserRef, audioDataRef, canvasRef, viewportRef])
}
