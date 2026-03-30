export type AtlasNode = {
  id: string
  name: string
  level: 1 | 2 | 3
  parentId?: string
  color: string
}

export type AtlasLink = {
  id: string
  sourceId: string
  targetId: string
  relationType: 'parent_of' | 'related_to'
}

export type AtlasStation = {
  id: string
  name: string
  streamUrl: string
  countryLabel: string
  bitrateLabel: string
  styleIds: string[]
}

const colors = {
  relax: '#d1a351',
  electronic: '#5a90d4',
  rock: '#c85757',
  jazz: '#9564d9',
} as const

const nodes: AtlasNode[] = [
  { id: 'relax', name: 'Relax', level: 1, color: colors.relax },
  { id: 'electronic', name: 'Electronic', level: 1, color: colors.electronic },
  { id: 'rock', name: 'Rock', level: 1, color: colors.rock },
  { id: 'jazz', name: 'Jazz', level: 1, color: colors.jazz },

  { id: 'ambient', name: 'Ambient', level: 2, parentId: 'relax', color: colors.relax },
  { id: 'chillout', name: 'Chillout', level: 2, parentId: 'relax', color: colors.relax },
  { id: 'newage', name: 'New Age', level: 2, parentId: 'relax', color: colors.relax },
  { id: 'sleepmusic', name: 'Sleep Music', level: 2, parentId: 'relax', color: colors.relax },

  { id: 'house', name: 'House', level: 2, parentId: 'electronic', color: colors.electronic },
  { id: 'techno', name: 'Techno', level: 2, parentId: 'electronic', color: colors.electronic },
  { id: 'drumandbass', name: 'Drum & Bass', level: 2, parentId: 'electronic', color: colors.electronic },
  { id: 'triphop', name: 'Trip-Hop', level: 2, parentId: 'electronic', color: colors.electronic },

  { id: 'indierock', name: 'Indie Rock', level: 2, parentId: 'rock', color: colors.rock },
  { id: 'alternative', name: 'Alternative', level: 2, parentId: 'rock', color: colors.rock },
  { id: 'postrock', name: 'Post-Rock', level: 2, parentId: 'rock', color: colors.rock },

  { id: 'smoothjazz', name: 'Smooth Jazz', level: 2, parentId: 'jazz', color: colors.jazz },
  { id: 'nujazz', name: 'Nu Jazz', level: 2, parentId: 'jazz', color: colors.jazz },
  { id: 'bossanova', name: 'Bossa Nova', level: 2, parentId: 'jazz', color: colors.jazz },

  { id: 'vocalchill', name: 'Vocal Chillout', level: 3, parentId: 'chillout', color: colors.relax },
  { id: 'lofi', name: 'Lo-Fi Chill', level: 3, parentId: 'chillout', color: colors.relax },
  { id: 'psybient', name: 'Psybient', level: 3, parentId: 'chillout', color: colors.relax },
  { id: 'darkambient', name: 'Dark Ambient', level: 3, parentId: 'ambient', color: colors.relax },
  { id: 'spaceambient', name: 'Space Ambient', level: 3, parentId: 'ambient', color: colors.relax },

  { id: 'deephouse', name: 'Deep House', level: 3, parentId: 'house', color: colors.electronic },
  { id: 'proghouse', name: 'Progressive House', level: 3, parentId: 'house', color: colors.electronic },
  { id: 'industrialtech', name: 'Industrial Techno', level: 3, parentId: 'techno', color: colors.electronic },
  { id: 'minimaltech', name: 'Minimal Techno', level: 3, parentId: 'techno', color: colors.electronic },
  { id: 'downtempo', name: 'Downtempo', level: 3, parentId: 'triphop', color: colors.electronic },
  { id: 'bristolsound', name: 'Bristol Sound', level: 3, parentId: 'triphop', color: colors.electronic },

  { id: 'shoegaze', name: 'Shoegaze', level: 3, parentId: 'indierock', color: colors.rock },
  { id: 'dreampop', name: 'Dream Pop', level: 3, parentId: 'indierock', color: colors.rock },

  { id: 'contemjazz', name: 'Contemporary Jazz', level: 3, parentId: 'smoothjazz', color: colors.jazz },
  { id: 'cafejazz', name: 'Cafe Jazz', level: 3, parentId: 'smoothjazz', color: colors.jazz },
  { id: 'acidjazz', name: 'Acid Jazz', level: 3, parentId: 'nujazz', color: colors.jazz },
  { id: 'neosouljazz', name: 'Neo Soul Jazz', level: 3, parentId: 'nujazz', color: colors.jazz },
]

const links: AtlasLink[] = nodes
  .filter((node) => node.parentId)
  .map((node) => ({
    id: `${node.parentId}-${node.id}`,
    sourceId: node.parentId!,
    targetId: node.id,
    relationType: 'parent_of' as const,
  }))

links.push(
  { id: 'ambient-postrock', sourceId: 'ambient', targetId: 'postrock', relationType: 'related_to' },
  { id: 'triphop-nujazz', sourceId: 'triphop', targetId: 'nujazz', relationType: 'related_to' },
  { id: 'dreampop-vocalchill', sourceId: 'dreampop', targetId: 'vocalchill', relationType: 'related_to' },
  { id: 'darkambient-spaceambient', sourceId: 'darkambient', targetId: 'spaceambient', relationType: 'related_to' },
  { id: 'deephouse-downtempo', sourceId: 'deephouse', targetId: 'downtempo', relationType: 'related_to' },
  { id: 'acidjazz-bristolsound', sourceId: 'acidjazz', targetId: 'bristolsound', relationType: 'related_to' },
)

const stations: AtlasStation[] = [
  {
    id: 'groove-salad',
    name: 'SomaFM: Groove Salad',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['relax', 'triphop', 'psybient', 'downtempo'],
  },
  {
    id: 'lush',
    name: 'SomaFM: Lush',
    streamUrl: 'https://ice1.somafm.com/lush-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['relax', 'chillout', 'vocalchill', 'dreampop'],
  },
  {
    id: 'electronic-pioneers',
    name: 'DI.FM: Electronic Pioneers',
    streamUrl: 'https://pub7.di.fm/di_electronicpioneers',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['electronic'],
  },
  {
    id: 'indie-pop-rocks',
    name: 'SomaFM: Indie Pop Rocks',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['rock', 'indierock'],
  },
  {
    id: 'sonic-universe',
    name: 'SomaFM: Sonic Universe',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['jazz', 'contemjazz', 'neosouljazz'],
  },
  {
    id: 'drone-zone',
    name: 'SomaFM: Drone Zone',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['ambient', 'darkambient', 'postrock', 'shoegaze'],
  },
  {
    id: 'deep-space-one',
    name: 'SomaFM: Deep Space One',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['ambient', 'spaceambient'],
  },
  {
    id: 'di-chillout',
    name: 'DI.FM: Chillout',
    streamUrl: 'https://pub7.di.fm/di_chillout',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['chillout', 'triphop', 'downtempo'],
  },
  {
    id: 'space-station',
    name: 'SomaFM: Space Station',
    streamUrl: 'https://ice1.somafm.com/spacestation-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['newage', 'spaceambient'],
  },
  {
    id: 'suburbs-of-goa',
    name: 'SomaFM: Suburbs of Goa',
    streamUrl: 'https://ice1.somafm.com/suburbsofgoa-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['sleepmusic', 'lofi'],
  },
  {
    id: 'di-house',
    name: 'DI.FM: House',
    streamUrl: 'https://pub7.di.fm/di_house',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['house'],
  },
  {
    id: 'beat-blender',
    name: 'SomaFM: Beat Blender',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['house', 'nujazz'],
  },
  {
    id: 'di-techno',
    name: 'DI.FM: Techno',
    streamUrl: 'https://pub7.di.fm/di_techno',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['techno', 'industrialtech'],
  },
  {
    id: 'di-drumandbass',
    name: 'DI.FM: Drum & Bass',
    streamUrl: 'https://pub7.di.fm/di_drumandbass',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['drumandbass'],
  },
  {
    id: 'underground-80s',
    name: 'SomaFM: Underground 80s',
    streamUrl: 'https://ice1.somafm.com/u80s-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['alternative'],
  },
  {
    id: 'illinois-lounge',
    name: 'SomaFM: Illinois Street Lounge',
    streamUrl: 'https://ice1.somafm.com/illstreet-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['smoothjazz', 'acidjazz', 'bristolsound'],
  },
  {
    id: 'secret-agent',
    name: 'SomaFM: Secret Agent',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['bossanova', 'cafejazz'],
  },
  {
    id: 'di-chillout-dreams',
    name: 'DI.FM: Chillout Dreams',
    streamUrl: 'https://pub7.di.fm/di_chillout_dreams',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['lofi'],
  },
  {
    id: 'di-deep-house',
    name: 'DI.FM: Deep House',
    streamUrl: 'https://pub7.di.fm/di_deephouse',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['deephouse'],
  },
  {
    id: 'di-progressive-house',
    name: 'DI.FM: Progressive House',
    streamUrl: 'https://pub7.di.fm/di_progressivehouse',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['proghouse'],
  },
  {
    id: 'di-minimal',
    name: 'DI.FM: Minimal',
    streamUrl: 'https://pub7.di.fm/di_minimal',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['minimaltech'],
  },
]

const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<string, AtlasNode>
const stationMap = Object.fromEntries(stations.map((station) => [station.id, station])) as Record<string, AtlasStation>
const childMap = nodes.reduce<Record<string, AtlasNode[]>>((acc, node) => {
  if (!node.parentId) return acc
  acc[node.parentId] ??= []
  acc[node.parentId].push(node)
  return acc
}, {})

export const atlasData = {
  roots: nodes.filter((node) => node.level === 1),
  nodes,
  links,
  stations,
  nodeMap,
  stationMap,
  childMap,
}
