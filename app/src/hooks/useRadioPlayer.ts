import Hls from 'hls.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SPECTRUM_BAR_COUNT,
  computeSpectrumLevels,
  fillAnalyserFrequency,
  getSomaChannelId,
  loadSoundparkDeepNowPlaying,
  resolvePlayableStreamUrl,
  toAbsoluteUrl,
  type SomaChannelsResponse,
} from '../app/audio'
import { atlasData, type AtlasNode, type AtlasStation } from '../data/atlas'

type UseRadioPlayerArgs = {
  selectedNode: AtlasNode | null
  initialNormalizationEnabled: boolean
  initialNormalizationAggression: number
}

export function useRadioPlayer({
  selectedNode,
  initialNormalizationEnabled,
  initialNormalizationAggression,
}: UseRadioPlayerArgs) {
  const AUTO_GAIN_TARGET_RMS = 0.18
  const AUTO_GAIN_SILENCE_THRESHOLD = 0.02
  const AUTO_GAIN_MIN = 0.72
  const AUTO_GAIN_MAX = 1.85
  const AUTO_GAIN_ATTACK = 0.22
  const AUTO_GAIN_RELEASE = 0.035

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const meterAnalyserRef = useRef<AnalyserNode | null>(null)
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const compressorRef = useRef<DynamicsCompressorNode | null>(null)
  const autoGainRef = useRef<GainNode | null>(null)
  const outputGainRef = useRef<GainNode | null>(null)
  const normalizationEnabledRef = useRef(initialNormalizationEnabled)
  const normalizationAggressionRef = useRef(initialNormalizationAggression)
  const waveformFrameRef = useRef<number | null>(null)
  const lastSpectrumCommitRef = useRef(0)
  const spectrumLevelsRef = useRef<number[] | null>(null)

  const [currentStationId, setCurrentStationId] = useState<string | null>(null)
  const [loadingStationId, setLoadingStationId] = useState<string | null>(null)
  const [currentGenre, setCurrentGenre] = useState('')
  const [currentName, setCurrentName] = useState('')
  const [currentTrackTitle, setCurrentTrackTitle] = useState('')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(75)
  const [normalizationEnabled, setNormalizationEnabled] = useState(initialNormalizationEnabled)
  const [normalizationAggression, setNormalizationAggression] = useState(initialNormalizationAggression)
  const [spectrumLevels, setSpectrumLevels] = useState<number[] | null>(null)

  const waveformState: 'idle' | 'loading' | 'playing' = loadingStationId ? 'loading' : playing ? 'playing' : 'idle'

  function clearCurrentStream() {
    hlsRef.current?.destroy()
    hlsRef.current = null
    autoGainRef.current?.gain.setValueAtTime(1, audioContextRef.current?.currentTime ?? 0)
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
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume()
      if (!mediaSourceRef.current) mediaSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
      if (!analyserRef.current) {
        const meterAnalyser = audioContextRef.current.createAnalyser()
        meterAnalyser.fftSize = 1024
        meterAnalyser.smoothingTimeConstant = 0.12

        const compressor = audioContextRef.current.createDynamicsCompressor()
        compressor.threshold.value = -22
        compressor.knee.value = 18
        compressor.ratio.value = 3
        compressor.attack.value = 0.008
        compressor.release.value = 0.22

        const autoGain = audioContextRef.current.createGain()
        autoGain.gain.value = 1

        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.48

        const outputGain = audioContextRef.current.createGain()
        outputGain.gain.value = volume / 100

        mediaSourceRef.current.connect(meterAnalyser)
        mediaSourceRef.current.connect(compressor)
        compressor.connect(autoGain)
        autoGain.connect(analyser)
        analyser.connect(outputGain)
        outputGain.connect(audioContextRef.current.destination)

        meterAnalyserRef.current = meterAnalyser
        compressorRef.current = compressor
        autoGainRef.current = autoGain
        outputGainRef.current = outputGain
        analyserRef.current = analyser
        audioRef.current.volume = 1
      }
      return true
    } catch {
      analyserRef.current = null
      meterAnalyserRef.current = null
      compressorRef.current = null
      autoGainRef.current = null
      outputGainRef.current = null
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

  async function playStation(station: AtlasStation) {
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
        void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false)).finally(() => setLoadingStationId(null))
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

  useEffect(() => {
    normalizationEnabledRef.current = normalizationEnabled
  }, [normalizationEnabled])

  useEffect(() => {
    normalizationAggressionRef.current = normalizationAggression
  }, [normalizationAggression])

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.crossOrigin = 'anonymous'
    }
    if (outputGainRef.current && audioContextRef.current) {
      outputGainRef.current.gain.setTargetAtTime(volume / 100, audioContextRef.current.currentTime, 0.03)
      audioRef.current.volume = 1
      return
    }
    audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => {
    const compressor = compressorRef.current
    const audioContext = audioContextRef.current
    if (!compressor || !audioContext) return

    const time = audioContext.currentTime
    if (normalizationEnabled) {
      compressor.threshold.setTargetAtTime(-22, time, 0.05)
      compressor.knee.setTargetAtTime(18, time, 0.05)
      compressor.ratio.setTargetAtTime(3, time, 0.05)
    } else {
      compressor.threshold.setTargetAtTime(0, time, 0.05)
      compressor.knee.setTargetAtTime(0, time, 0.05)
      compressor.ratio.setTargetAtTime(1, time, 0.05)
    }
  }, [normalizationEnabled])

  useEffect(() => {
    const autoGain = autoGainRef.current
    const audioContext = audioContextRef.current
    if (!autoGain || !audioContext) return
    if (!normalizationEnabled) {
      autoGain.gain.setTargetAtTime(1, audioContext.currentTime, 0.06)
    }
  }, [normalizationEnabled])

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
    if (!playing || !analyserRef.current || !meterAnalyserRef.current) {
      spectrumLevelsRef.current = null
      lastSpectrumCommitRef.current = 0
      setSpectrumLevels(null)
      if (waveformFrameRef.current) cancelAnimationFrame(waveformFrameRef.current)
      waveformFrameRef.current = null
      return
    }

    const analyser = analyserRef.current
    const meterAnalyser = meterAnalyserRef.current
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    const waveformData = new Uint8Array(meterAnalyser.fftSize)
    const SPECTRUM_COMMIT_MS = 1000 / 18

    function spectrumChanged(nextLevels: number[] | null, prevLevels: number[] | null) {
      if (nextLevels === null || prevLevels === null) return nextLevels !== prevLevels
      if (nextLevels.length !== prevLevels.length) return true
      for (let i = 0; i < nextLevels.length; i += 1) {
        if (Math.abs(nextLevels[i] - prevLevels[i]) > 0.025) return true
      }
      return false
    }

    const tick = () => {
      fillAnalyserFrequency(analyser, freqData)
      const levels = computeSpectrumLevels(freqData, SPECTRUM_BAR_COUNT)
      const maxLevel = Math.max(...levels)
      const nextLevels = maxLevel > 0.02 ? levels : null
      const now = performance.now()
      if (now - lastSpectrumCommitRef.current >= SPECTRUM_COMMIT_MS && spectrumChanged(nextLevels, spectrumLevelsRef.current)) {
        spectrumLevelsRef.current = nextLevels
        lastSpectrumCommitRef.current = now
        setSpectrumLevels(nextLevels)
      }

      const autoGain = autoGainRef.current
      const audioContext = audioContextRef.current
      if (autoGain && audioContext) {
        meterAnalyser.getByteTimeDomainData(waveformData)

        let sumSquares = 0
        for (let i = 0; i < waveformData.length; i++) {
          const sample = (waveformData[i] - 128) / 128
          sumSquares += sample * sample
        }

        const rms = Math.sqrt(sumSquares / waveformData.length)
        const aggression = normalizationAggressionRef.current / 100
        const targetRms = AUTO_GAIN_TARGET_RMS * (0.7 + aggression * 0.85)
        const minGain = 1 - (1 - AUTO_GAIN_MIN) * Math.min(1, aggression * 1.2)
        const maxGain = 1 + (AUTO_GAIN_MAX * 1.75 - 1) * aggression
        const computedTargetGain =
          rms < AUTO_GAIN_SILENCE_THRESHOLD ? 1 : Math.max(minGain, Math.min(maxGain, targetRms / rms))
        const targetGain = normalizationEnabledRef.current ? computedTargetGain : 1
        const currentGain = autoGain.gain.value
        const smoothing = targetGain < currentGain ? AUTO_GAIN_ATTACK : AUTO_GAIN_RELEASE
        const nextGain = currentGain + (targetGain - currentGain) * smoothing

        autoGain.gain.setValueAtTime(nextGain, audioContext.currentTime)
      }

      waveformFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      if (waveformFrameRef.current) cancelAnimationFrame(waveformFrameRef.current)
      waveformFrameRef.current = null
    }
  }, [playing, currentStationId])

  useEffect(() => {
    const channelId = currentStationId ? getSomaChannelId(currentStationId) : undefined
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
    const interval = window.setInterval(() => void loadNowPlaying(), 20000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [currentStationId])

  const currentStation = useMemo(() => (currentStationId ? atlasData.stationMap[currentStationId] : undefined), [currentStationId])

  return {
    analyserRef,
    currentGenre,
    currentName,
    currentStation,
    currentStationId,
    currentTrackTitle,
    loadingStationId,
    playStation,
    playing,
    spectrumLevels,
    stopAudio,
    toggleAudio,
    volume,
    waveformState,
    normalizationEnabled,
    normalizationAggression,
    setNormalizationEnabled,
    setNormalizationAggression,
    setVolume,
  }
}
