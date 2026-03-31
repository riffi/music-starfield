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

const PROXIED_STATIONS = new Set(['hearme-future-garage', 'hearme-vocal-chillout', 'atmfm-breaks', 'ural-sound', 'puls-radio-trance', '90s-eurodance', 'liquid-dnb-station'])

export type SomaChannelsResponse = {
  channels?: {
    id: string
    lastPlaying?: string
  }[]
}

export const SPECTRUM_BAR_COUNT = 28

export const PL_DECO_IDLE_HEIGHTS: readonly number[] = Array.from({ length: SPECTRUM_BAR_COUNT }, (_, i) => {
  const t = i / Math.max(SPECTRUM_BAR_COUNT - 1, 1)
  const blend = 0.24 + 0.11 * Math.sin(t * Math.PI * 2.4) + 0.07 * Math.sin(t * Math.PI * 4.8 + 1.1)
  return Math.round(Math.max(14, Math.min(44, blend * 100)))
})

export function getSomaChannelId(stationId: string) {
  return SOMAFM_CHANNELS[stationId]
}

export function fillAnalyserFrequency(analyser: AnalyserNode, out: Uint8Array) {
  analyser.getByteFrequencyData(out as Parameters<AnalyserNode['getByteFrequencyData']>[0])
}

export function computeSpectrumLevels(freqData: Uint8Array, barCount: number): number[] {
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

export function resolvePlayableStreamUrl(stationId: string, streamUrl: string) {
  if (!PROXIED_STATIONS.has(stationId)) return streamUrl
  return `/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`
}

export function toAbsoluteUrl(url: string) {
  return new URL(url, window.location.href).toString()
}

export async function loadSoundparkDeepNowPlaying() {
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
