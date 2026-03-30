import { useEffect, type MutableRefObject, type RefObject } from 'react'
import { fillAnalyserFrequency } from '../app/audio'
import type { AudioLevels, ViewportState } from '../app/types'

type Star = { x: number; y: number; r: number; op: number; spd: number; ph: number; col: string; depth: number; glow: number }
type Nebula = { x: number; y: number; r: number; color: string; alpha: number; drift: number }
type MilkyWayStar = { x: number; y: number; r: number; op: number; ph: number }
type ShootingStar = { x: number; y: number; vx: number; vy: number; spd: number; len: number; alpha: number; col: string }

type UseStarfieldArgs = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  analyserRef: MutableRefObject<AnalyserNode | null>
  audioDataRef: MutableRefObject<AudioLevels>
  viewportRef: MutableRefObject<ViewportState>
}

export function useStarfield({ canvasRef, analyserRef, audioDataRef, viewportRef }: UseStarfieldArgs) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const canvasEl = canvas
    const context = ctx

    let width = 0
    let height = 0
    let frameId: number | null = null
    let stars: Star[] = []
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

    function placeStar(star: Pick<Star, 'x' | 'y'>, radialBias = Math.random()) {
      const cx = width * 0.5
      const cy = height * 0.5
      const angle = Math.random() * Math.PI * 2
      const maxRadius = Math.hypot(width, height) * 0.68
      const minRadius = Math.min(width, height) * 0.08
      const radius = minRadius + radialBias * (maxRadius - minRadius)

      star.x = cx + Math.cos(angle) * radius
      star.y = cy + Math.sin(angle) * radius
    }

    function respawnStarNearCore(star: Pick<Star, 'x' | 'y'>) {
      const cx = width * 0.5
      const cy = height * 0.5
      const angle = Math.random() * Math.PI * 2
      const minSide = Math.min(width, height)
      const spawnInner = minSide * 0.06
      const spawnOuter = minSide * 0.38
      const spawnBias = Math.random() ** 0.8
      const spawnRadius = spawnInner + spawnBias * (spawnOuter - spawnInner)

      star.x = cx + Math.cos(angle) * spawnRadius
      star.y = cy + Math.sin(angle) * spawnRadius
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
        const star: Star = {
          x: 0,
          y: 0,
          r: radius,
          op: Math.random() * 0.65 + 0.12,
          spd: Math.random() * 0.008 + 0.002,
          ph: Math.random() * Math.PI * 2,
          col: Math.random() > 0.9 ? '255,224,170' : Math.random() > 0.62 ? '170,185,255' : '235,238,255',
          depth,
          glow: radius > 1.1 ? Math.random() * 12 + 10 : 0,
        }
        placeStar(star, Math.random() ** 0.55)
        stars.push(star)
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
        for (let fi = 0; fi < freqData.length; fi++) sum += freqData[fi]
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

      const mwAngle = -0.35
      const mwCx = width * 0.5
      const mwCy = height * 0.45
      const mwPerpX = Math.sin(mwAngle)
      const mwPerpY = -Math.cos(mwAngle)
      const mwHalf = height * 0.19
      const mwGrad = context.createLinearGradient(mwCx + mwPerpX * mwHalf, mwCy + mwPerpY * mwHalf, mwCx - mwPerpX * mwHalf, mwCy - mwPerpY * mwHalf)
      mwGrad.addColorStop(0, 'rgba(92,130,230,0)')
      mwGrad.addColorStop(0.22, 'rgba(92,130,230,0.028)')
      mwGrad.addColorStop(0.5, 'rgba(132,176,255,0.084)')
      mwGrad.addColorStop(0.78, 'rgba(92,130,230,0.032)')
      mwGrad.addColorStop(1, 'rgba(92,130,230,0)')
      context.fillStyle = mwGrad
      context.fillRect(0, 0, width, height)

      for (const star of milkyWayStars) {
        context.beginPath()
        context.arc(star.x, star.y, star.r * 1.18, 0, Math.PI * 2)
        context.fillStyle = `rgba(205,222,255,${star.op * 0.98})`
        context.fill()
      }

      for (const nebula of nebulae) {
        const nx = nebula.x + viewportRef.current.x * nebula.drift * 0.02
        const ny = nebula.y + viewportRef.current.y * nebula.drift * 0.02
        const pulse = Math.sin(t * nebula.drift + nebula.x * 0.0015) * 0.5 + 0.5
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
        const cx = width * 0.5
        const cy = height * 0.5
        const dx = star.x - cx
        const dy = star.y - cy
        const dist = Math.hypot(dx, dy) || 1
        const ux = dx / dist
        const uy = dy / dist
        const flightSpeed = 0.03 + star.depth * 0.05 + audioEnergy * 0.012 + audioBass * 0.008
        star.x += ux * flightSpeed
        star.y += uy * flightSpeed

        if (star.x < -80 || star.x > width + 80 || star.y < -80 || star.y > height + 80) {
          respawnStarNearCore(star)
        }

        const tw = Math.sin(t * star.spd * 55 + star.ph) * 0.5 + 0.5
        const tw2 = star.r > 1.1 ? Math.sin(t * star.spd * 34 + star.ph * 1.7) * 0.5 + 0.5 : tw
        const twBlend = tw * 0.78 + tw2 * 0.22
        const opacity = star.op * (0.52 + 0.22 * twBlend)
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
        const pr = star.r > 0.8 ? star.r * (0.94 + 0.04 * twBlend) : star.r

        if (star.glow > 0) {
          const glowR = star.glow * (0.9 + 0.08 * twBlend)
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

      for (let si = shootingStars.length - 1; si >= 0; si--) {
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
        const ssGrad = context.createLinearGradient(tailX, tailY, star.x, star.y)
        ssGrad.addColorStop(0, `rgba(${star.col},0)`)
        ssGrad.addColorStop(0.7, `rgba(${star.col},${star.alpha * 0.4})`)
        ssGrad.addColorStop(1, `rgba(${star.col},${star.alpha})`)
        context.beginPath()
        context.moveTo(tailX, tailY)
        context.lineTo(star.x, star.y)
        context.strokeStyle = ssGrad
        context.lineWidth = 1.6
        context.stroke()
        const headGlow = context.createRadialGradient(star.x, star.y, 0, star.x, star.y, 5)
        headGlow.addColorStop(0, `rgba(${star.col},${star.alpha})`)
        headGlow.addColorStop(1, `rgba(${star.col},0)`)
        context.beginPath()
        context.arc(star.x, star.y, 5, 0, Math.PI * 2)
        context.fillStyle = headGlow
        context.fill()
      }

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
