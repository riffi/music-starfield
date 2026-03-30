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
}

export function useRadioPlayer({ selectedNode }: UseRadioPlayerArgs) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const waveformFrameRef = useRef<number | null>(null)

  const [currentStationId, setCurrentStationId] = useState<string | null>(null)
  const [loadingStationId, setLoadingStationId] = useState<string | null>(null)
  const [currentGenre, setCurrentGenre] = useState('')
  const [currentName, setCurrentName] = useState('')
  const [currentTrackTitle, setCurrentTrackTitle] = useState('')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(75)
  const [spectrumLevels, setSpectrumLevels] = useState<number[] | null>(null)

  const waveformState: 'idle' | 'loading' | 'playing' = loadingStationId ? 'loading' : playing ? 'playing' : 'idle'

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
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume()
      if (!mediaSourceRef.current) mediaSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
      if (!analyserRef.current) {
        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.48
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
    setVolume,
  }
}
