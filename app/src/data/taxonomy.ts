export type TaxonomyRoot = 'ambient' | 'electronic' | 'rock' | 'jazz'

export type RelationKind = 'parent_of' | 'related_to' | 'influenced_by' | 'fusion_of'

export type StyleTaxon = {
  id: string
  name: string
  root: TaxonomyRoot
  level: 1 | 2 | 3
  parentId?: string
}

export type StyleRelation = {
  id: string
  sourceId: string
  targetId: string
  kind: RelationKind
}

export type StationBinding = {
  id: string
  name: string
  streamUrl: string
  countryLabel: string
  bitrateLabel: string
  styleIds: string[]
}

export const rootColors: Record<TaxonomyRoot, string> = {
  ambient: '#d4a853',
  electronic: '#5a90d4',
  rock: '#c94848',
  jazz: '#9c5ad4',
}

export const styleTaxonomy: StyleTaxon[] = [
  { id: 'ambient', name: 'Ambient', root: 'ambient', level: 1 },
  { id: 'electronic', name: 'Electronic', root: 'electronic', level: 1 },
  { id: 'rock', name: 'Rock', root: 'rock', level: 1 },
  { id: 'jazz', name: 'Jazz', root: 'jazz', level: 1 },

  { id: 'newage', name: 'New Age', root: 'ambient', level: 2, parentId: 'ambient' },
  { id: 'darkambient', name: 'Dark Ambient', root: 'ambient', level: 2, parentId: 'ambient' },
  { id: 'spaceambient', name: 'Space Ambient', root: 'ambient', level: 2, parentId: 'ambient' },

  { id: 'house', name: 'House', root: 'electronic', level: 2, parentId: 'electronic' },
  { id: 'techno', name: 'Techno', root: 'electronic', level: 2, parentId: 'electronic' },
  { id: 'drumandbass', name: 'Drum & Bass', root: 'electronic', level: 2, parentId: 'electronic' },
  { id: 'triphop', name: 'Trip-Hop', root: 'electronic', level: 2, parentId: 'electronic' },
  { id: 'chillout', name: 'Chillout', root: 'electronic', level: 2, parentId: 'electronic' },
  { id: 'lounge', name: 'Lounge', root: 'electronic', level: 2, parentId: 'electronic' },

  { id: 'hardrock', name: 'Hard Rock', root: 'rock', level: 2, parentId: 'rock' },
  { id: 'alternativerock', name: 'Alternative Rock', root: 'rock', level: 2, parentId: 'rock' },
  { id: 'indierock', name: 'Indie Rock', root: 'rock', level: 2, parentId: 'rock' },
  { id: 'postrock', name: 'Post-Rock', root: 'rock', level: 2, parentId: 'rock' },

  { id: 'smoothjazz', name: 'Smooth Jazz', root: 'jazz', level: 2, parentId: 'jazz' },
  { id: 'nujazz', name: 'Nu Jazz', root: 'jazz', level: 2, parentId: 'jazz' },
  { id: 'bossanova', name: 'Bossa Nova', root: 'jazz', level: 2, parentId: 'jazz' },

  { id: 'deephouse', name: 'Deep House', root: 'electronic', level: 3, parentId: 'house' },
  { id: 'proghouse', name: 'Progressive House', root: 'electronic', level: 3, parentId: 'house' },
  { id: 'industrialtech', name: 'Industrial Techno', root: 'electronic', level: 3, parentId: 'techno' },
  { id: 'minimaltech', name: 'Minimal Techno', root: 'electronic', level: 3, parentId: 'techno' },
  { id: 'liquidfunk', name: 'Liquid Funk', root: 'electronic', level: 3, parentId: 'drumandbass' },
  { id: 'downtempo', name: 'Downtempo', root: 'electronic', level: 3, parentId: 'chillout' },
  { id: 'vocalchillout', name: 'Vocal Chillout', root: 'electronic', level: 3, parentId: 'chillout' },
  { id: 'psybient', name: 'Psybient', root: 'electronic', level: 3, parentId: 'chillout' },
  { id: 'lofi', name: 'Lo-Fi Chill', root: 'electronic', level: 3, parentId: 'chillout' },

  { id: 'shoegaze', name: 'Shoegaze', root: 'rock', level: 3, parentId: 'indierock' },
  { id: 'dreampop', name: 'Dream Pop', root: 'rock', level: 3, parentId: 'alternativerock' },
  { id: 'arenarock', name: 'Arena Rock', root: 'rock', level: 3, parentId: 'hardrock' },

  { id: 'contemjazz', name: 'Contemporary Jazz', root: 'jazz', level: 3, parentId: 'smoothjazz' },
  { id: 'acidjazz', name: 'Acid Jazz', root: 'jazz', level: 3, parentId: 'nujazz' },
  { id: 'neosouljazz', name: 'Neo Soul Jazz', root: 'jazz', level: 3, parentId: 'nujazz' },
  { id: 'cafejazz', name: 'Cafe Jazz', root: 'jazz', level: 3, parentId: 'bossanova' },
]

export const styleRelations: StyleRelation[] = [
  { id: 'ambient-parent-newage', sourceId: 'ambient', targetId: 'newage', kind: 'parent_of' },
  { id: 'ambient-parent-darkambient', sourceId: 'ambient', targetId: 'darkambient', kind: 'parent_of' },
  { id: 'ambient-parent-spaceambient', sourceId: 'ambient', targetId: 'spaceambient', kind: 'parent_of' },

  { id: 'electronic-parent-house', sourceId: 'electronic', targetId: 'house', kind: 'parent_of' },
  { id: 'electronic-parent-techno', sourceId: 'electronic', targetId: 'techno', kind: 'parent_of' },
  { id: 'electronic-parent-drumandbass', sourceId: 'electronic', targetId: 'drumandbass', kind: 'parent_of' },
  { id: 'electronic-parent-triphop', sourceId: 'electronic', targetId: 'triphop', kind: 'parent_of' },
  { id: 'electronic-parent-chillout', sourceId: 'electronic', targetId: 'chillout', kind: 'parent_of' },
  { id: 'electronic-parent-lounge', sourceId: 'electronic', targetId: 'lounge', kind: 'parent_of' },

  { id: 'rock-parent-hardrock', sourceId: 'rock', targetId: 'hardrock', kind: 'parent_of' },
  { id: 'rock-parent-alternativerock', sourceId: 'rock', targetId: 'alternativerock', kind: 'parent_of' },
  { id: 'rock-parent-indierock', sourceId: 'rock', targetId: 'indierock', kind: 'parent_of' },
  { id: 'rock-parent-postrock', sourceId: 'rock', targetId: 'postrock', kind: 'parent_of' },

  { id: 'jazz-parent-smoothjazz', sourceId: 'jazz', targetId: 'smoothjazz', kind: 'parent_of' },
  { id: 'jazz-parent-nujazz', sourceId: 'jazz', targetId: 'nujazz', kind: 'parent_of' },
  { id: 'jazz-parent-bossanova', sourceId: 'jazz', targetId: 'bossanova', kind: 'parent_of' },

  { id: 'house-parent-deephouse', sourceId: 'house', targetId: 'deephouse', kind: 'parent_of' },
  { id: 'house-parent-proghouse', sourceId: 'house', targetId: 'proghouse', kind: 'parent_of' },
  { id: 'techno-parent-industrialtech', sourceId: 'techno', targetId: 'industrialtech', kind: 'parent_of' },
  { id: 'techno-parent-minimaltech', sourceId: 'techno', targetId: 'minimaltech', kind: 'parent_of' },
  { id: 'drumandbass-parent-liquidfunk', sourceId: 'drumandbass', targetId: 'liquidfunk', kind: 'parent_of' },
  { id: 'chillout-parent-downtempo', sourceId: 'chillout', targetId: 'downtempo', kind: 'parent_of' },
  { id: 'chillout-parent-vocalchillout', sourceId: 'chillout', targetId: 'vocalchillout', kind: 'parent_of' },
  { id: 'chillout-parent-psybient', sourceId: 'chillout', targetId: 'psybient', kind: 'parent_of' },
  { id: 'chillout-parent-lofi', sourceId: 'chillout', targetId: 'lofi', kind: 'parent_of' },

  { id: 'indierock-parent-shoegaze', sourceId: 'indierock', targetId: 'shoegaze', kind: 'parent_of' },
  { id: 'alternativerock-parent-dreampop', sourceId: 'alternativerock', targetId: 'dreampop', kind: 'parent_of' },
  { id: 'hardrock-parent-arenarock', sourceId: 'hardrock', targetId: 'arenarock', kind: 'parent_of' },

  { id: 'smoothjazz-parent-contemjazz', sourceId: 'smoothjazz', targetId: 'contemjazz', kind: 'parent_of' },
  { id: 'nujazz-parent-acidjazz', sourceId: 'nujazz', targetId: 'acidjazz', kind: 'parent_of' },
  { id: 'nujazz-parent-neosouljazz', sourceId: 'nujazz', targetId: 'neosouljazz', kind: 'parent_of' },
  { id: 'bossanova-parent-cafejazz', sourceId: 'bossanova', targetId: 'cafejazz', kind: 'parent_of' },

  { id: 'ambient-related-newage', sourceId: 'ambient', targetId: 'newage', kind: 'related_to' },
  { id: 'spaceambient-influenced-psybient', sourceId: 'spaceambient', targetId: 'psybient', kind: 'influenced_by' },
  { id: 'darkambient-related-postrock', sourceId: 'darkambient', targetId: 'postrock', kind: 'related_to' },
  { id: 'triphop-fusion-nujazz', sourceId: 'triphop', targetId: 'nujazz', kind: 'fusion_of' },
  { id: 'chillout-related-downtempo', sourceId: 'chillout', targetId: 'downtempo', kind: 'related_to' },
  { id: 'dreampop-related-shoegaze', sourceId: 'dreampop', targetId: 'shoegaze', kind: 'related_to' },
  { id: 'bossanova-influenced-smoothjazz', sourceId: 'bossanova', targetId: 'smoothjazz', kind: 'influenced_by' },
]

export const stationBindings: StationBinding[] = [
  {
    id: 'drone-zone',
    name: 'SomaFM: Drone Zone',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['ambient', 'darkambient'],
  },
  {
    id: 'deep-space-one',
    name: 'SomaFM: Deep Space One',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['ambient', 'spaceambient', 'psybient'],
  },
  {
    id: 'space-station',
    name: 'SomaFM: Space Station',
    streamUrl: 'https://ice1.somafm.com/spacestation-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['spaceambient'],
  },
  {
    id: 'new-age-radiopotok',
    name: 'New Age',
    streamUrl: 'https://ic1.radiosignal.one/r8-mp3',
    countryLabel: 'RU',
    bitrateLabel: '192k',
    styleIds: ['newage'],
  },
  {
    id: 'new-age-radioheart',
    name: 'New Age Radio',
    streamUrl: 'https://a7.radioheart.ru:9044/newageradio',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    styleIds: ['newage'],
  },
  {
    id: 'mission-control',
    name: 'SomaFM: Mission Control',
    streamUrl: 'https://ice1.somafm.com/missioncontrol-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['spaceambient'],
  },
  {
    id: 'groove-salad',
    name: 'SomaFM: Groove Salad',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['chillout', 'downtempo', 'triphop'],
  },
  {
    id: 'lush',
    name: 'SomaFM: Lush',
    streamUrl: 'https://ice1.somafm.com/lush-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['dreampop'],
  },
  {
    id: 'house-station-live',
    name: 'House Station Live',
    streamUrl: 'https://c2.radioboss.fm:8224/320k.mp3',
    countryLabel: 'US',
    bitrateLabel: '320k',
    styleIds: ['electronic', 'house', 'proghouse'],
  },
  {
    id: 'beat-blender',
    name: 'SomaFM: Beat Blender',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['electronic', 'chillout', 'downtempo'],
  },
  {
    id: 'ural-sound',
    name: 'Ural Sound',
    streamUrl: 'https://5.restream.one/1392_1',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    styleIds: ['deephouse'],
  },
  {
    id: 'deep-one',
    name: 'Deep One',
    streamUrl: 'https://stream.deep1.ru/deep1mp3',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    styleIds: ['deephouse'],
  },
  {
    id: 'soundpark-deep',
    name: 'SOUNDPARK DEEP',
    streamUrl: 'https://h.getradio.me/spdeep/hls.m3u8',
    countryLabel: 'RU',
    bitrateLabel: 'HLS',
    styleIds: ['deephouse'],
  },
  {
    id: 'techno-fm',
    name: 'Techno.FM',
    streamUrl: 'https://stream.techno.fm/radio1-320k.mp3',
    countryLabel: 'US',
    bitrateLabel: '320k',
    styleIds: ['techno', 'minimaltech', 'industrialtech'],
  },
  {
    id: 'bassdrive',
    name: 'Bassdrive',
    streamUrl: 'http://ice.bassdrive.net:80/stream',
    countryLabel: 'UK',
    bitrateLabel: '128k',
    styleIds: ['drumandbass'],
  },
  {
    id: 'liquid-dnb-station',
    name: 'Liquid DnB Station',
    streamUrl: 'http://95.47.244.172:8000/live',
    countryLabel: 'UA',
    bitrateLabel: 'MP3',
    styleIds: ['liquidfunk'],
  },
  {
    id: 'radio-art-vocal-lounge',
    name: 'Radio Art - Vocal Lounge',
    streamUrl: 'https://live.radioart.com/fVocal_lounge.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['lounge'],
  },
  {
    id: 'radio-art-vocal-chillout',
    name: 'Radio Art - Vocal Chillout',
    streamUrl: 'https://live.radioart.com/fVocal_chillout.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['vocalchillout'],
  },
  {
    id: 'indie-pop-rocks',
    name: 'SomaFM: Indie Pop Rocks',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['indierock', 'dreampop'],
  },
  {
    id: 'digitalis',
    name: 'SomaFM: Digitalis',
    streamUrl: 'https://ice1.somafm.com/digitalis-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['rock', 'alternativerock', 'indierock'],
  },
  {
    id: 'n5md-radio',
    name: 'SomaFM: n5MD Radio',
    streamUrl: 'https://ice1.somafm.com/n5md-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['postrock', 'shoegaze'],
  },
  {
    id: 'underground-80s',
    name: 'SomaFM: Underground 80s',
    streamUrl: 'https://ice1.somafm.com/u80s-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['alternativerock'],
  },
  {
    id: 'sonic-universe',
    name: 'SomaFM: Sonic Universe',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['jazz', 'nujazz', 'neosouljazz'],
  },
  {
    id: 'smooth-jazz-global',
    name: 'SmoothJazz.com Global Radio',
    streamUrl: 'https://smoothjazz.cdnstream1.com/2585_128.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['smoothjazz', 'contemjazz'],
  },
  {
    id: 'smooth-lounge',
    name: 'SmoothLounge.com',
    streamUrl: 'https://smoothjazz.cdnstream1.com/2586_128.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['acidjazz', 'cafejazz'],
  },
  {
    id: 'bossa',
    name: 'SomaFM: Bossa Beyond',
    streamUrl: 'https://ice1.somafm.com/bossa-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    styleIds: ['bossanova', 'cafejazz'],
  },
]
