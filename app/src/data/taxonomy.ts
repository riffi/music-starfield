export type TaxonomyRoot =
  | 'ambient_newage'
  | 'electronic'
  | 'rock'
  | 'pop'
  | 'hiphop'
  | 'rnb_soul_funk'
  | 'jazz'
  | 'classical'
  | 'metal'
  | 'punk_hardcore'
  | 'folk_country_world'
  | 'latin'
  | 'reggae_ska_dub'
  | 'blues'
  | 'soundtrack_stage'
  | 'instrumental'
  | 'experimental_noise'

export type TaxonKind = 'genre' | 'style' | 'descriptor' | 'form' | 'instrument' | 'period'

export type RelationKind = 'parent_of' | 'related_to' | 'influenced_by' | 'fusion_of'

export type StyleTaxon = {
  id: string
  name: string
  root: TaxonomyRoot
  kind: TaxonKind
  level: 1 | 2 | 3
  parentId?: string
  aliases?: string[]
  isAtlasVisible?: boolean
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
  primaryStyleId: string
  secondaryStyleIds?: string[]
  descriptorIds?: string[]
}

export const rootColors: Record<TaxonomyRoot, string> = {
  ambient_newage: '#d4a853',
  electronic: '#5a90d4',
  rock: '#c94848',
  pop: '#ff7aa2',
  hiphop: '#a96c3e',
  rnb_soul_funk: '#d96f3d',
  jazz: '#9c5ad4',
  classical: '#7fd1c8',
  metal: '#8b8f9b',
  punk_hardcore: '#f05a50',
  folk_country_world: '#88b36b',
  latin: '#f29f4b',
  reggae_ska_dub: '#7bbd5d',
  blues: '#4c78c9',
  soundtrack_stage: '#c8a970',
  instrumental: '#8fb7a3',
  experimental_noise: '#7a68c7',
}

export const styleTaxonomy: StyleTaxon[] = [
  { id: 'ambient', name: 'Ambient & New Age', root: 'ambient_newage', kind: 'genre', level: 1, isAtlasVisible: true },
  { id: 'electronic', name: 'Electronic', root: 'electronic', kind: 'genre', level: 1, isAtlasVisible: true },
  { id: 'rock', name: 'Rock', root: 'rock', kind: 'genre', level: 1, isAtlasVisible: true },
  { id: 'pop', name: 'Pop', root: 'pop', kind: 'genre', level: 1 },
  { id: 'hiphop', name: 'Hip-Hop', root: 'hiphop', kind: 'genre', level: 1 },
  { id: 'rnbsoulfunk', name: 'R&B, Soul & Funk', root: 'rnb_soul_funk', kind: 'genre', level: 1 },
  { id: 'jazz', name: 'Jazz', root: 'jazz', kind: 'genre', level: 1, isAtlasVisible: true },
  { id: 'classical', name: 'Classical', root: 'classical', kind: 'genre', level: 1, isAtlasVisible: true },
  { id: 'instrumental', name: 'Instrumental', root: 'instrumental', kind: 'genre', level: 1, isAtlasVisible: true },
  { id: 'metal', name: 'Metal', root: 'metal', kind: 'genre', level: 1 },
  { id: 'punkhardcore', name: 'Punk & Hardcore', root: 'punk_hardcore', kind: 'genre', level: 1 },
  { id: 'folkcountryworld', name: 'Folk, Country & World', root: 'folk_country_world', kind: 'genre', level: 1 },
  { id: 'latin', name: 'Latin', root: 'latin', kind: 'genre', level: 1 },
  { id: 'reggaeskadub', name: 'Reggae, Ska & Dub', root: 'reggae_ska_dub', kind: 'genre', level: 1 },
  { id: 'blues', name: 'Blues', root: 'blues', kind: 'genre', level: 1 },
  { id: 'soundtrackstage', name: 'Soundtrack & Stage', root: 'soundtrack_stage', kind: 'genre', level: 1 },
  { id: 'experimentalnoise', name: 'Experimental & Noise', root: 'experimental_noise', kind: 'genre', level: 1 },

  { id: 'newage', name: 'New Age', root: 'ambient_newage', kind: 'genre', level: 2, parentId: 'ambient', isAtlasVisible: true },
  { id: 'darkambient', name: 'Dark Ambient', root: 'ambient_newage', kind: 'style', level: 2, parentId: 'ambient', isAtlasVisible: true },
  { id: 'spaceambient', name: 'Space Ambient', root: 'ambient_newage', kind: 'style', level: 2, parentId: 'ambient', isAtlasVisible: true },

  { id: 'house', name: 'House', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'techno', name: 'Techno', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'trance', name: 'Trance', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'eurodance', name: 'Eurodance', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'ukgarage', name: 'UK Garage', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'breaks', name: 'Breaks', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'drumandbass', name: 'Drum & Bass', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'downtempo', name: 'Downtempo', root: 'electronic', kind: 'genre', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'chillout', name: 'Chillout', root: 'electronic', kind: 'descriptor', level: 2, parentId: 'electronic', isAtlasVisible: true },
  { id: 'lounge', name: 'Lounge', root: 'electronic', kind: 'descriptor', level: 2, parentId: 'electronic', isAtlasVisible: true },

  { id: 'hardrock', name: 'Hard Rock', root: 'rock', kind: 'genre', level: 2, parentId: 'rock', isAtlasVisible: true },
  { id: 'alternativerock', name: 'Alternative Rock', root: 'rock', kind: 'genre', level: 2, parentId: 'rock', isAtlasVisible: true },
  { id: 'indierock', name: 'Indie Rock', root: 'rock', kind: 'genre', level: 2, parentId: 'rock', isAtlasVisible: true },
  { id: 'postrock', name: 'Post-Rock', root: 'rock', kind: 'genre', level: 2, parentId: 'rock', isAtlasVisible: true },

  { id: 'synthpop', name: 'Synthpop', root: 'pop', kind: 'genre', level: 2, parentId: 'pop' },
  { id: 'indiepop', name: 'Indie Pop', root: 'pop', kind: 'genre', level: 2, parentId: 'pop' },
  { id: 'dancepop', name: 'Dance-Pop', root: 'pop', kind: 'genre', level: 2, parentId: 'pop' },

  { id: 'instrumentalhiphop', name: 'Instrumental Hip-Hop', root: 'hiphop', kind: 'genre', level: 2, parentId: 'hiphop' },
  { id: 'trap', name: 'Trap', root: 'hiphop', kind: 'genre', level: 2, parentId: 'hiphop' },
  { id: 'boombap', name: 'Boom Bap', root: 'hiphop', kind: 'genre', level: 2, parentId: 'hiphop' },

  { id: 'rnb', name: 'R&B', root: 'rnb_soul_funk', kind: 'genre', level: 2, parentId: 'rnbsoulfunk' },
  { id: 'neosoul', name: 'Neo Soul', root: 'rnb_soul_funk', kind: 'genre', level: 2, parentId: 'rnbsoulfunk' },
  { id: 'funk', name: 'Funk', root: 'rnb_soul_funk', kind: 'genre', level: 2, parentId: 'rnbsoulfunk' },
  { id: 'soul', name: 'Soul', root: 'rnb_soul_funk', kind: 'genre', level: 2, parentId: 'rnbsoulfunk' },

  { id: 'smoothjazz', name: 'Smooth Jazz', root: 'jazz', kind: 'genre', level: 2, parentId: 'jazz', isAtlasVisible: true },
  { id: 'nujazz', name: 'Nu Jazz', root: 'jazz', kind: 'genre', level: 2, parentId: 'jazz', isAtlasVisible: true },
  { id: 'latinjazz', name: 'Latin Jazz', root: 'jazz', kind: 'genre', level: 2, parentId: 'jazz' },

  { id: 'piano', name: 'Piano', root: 'instrumental', kind: 'instrument', level: 2, parentId: 'instrumental', isAtlasVisible: true },
  { id: 'opera', name: 'Opera', root: 'classical', kind: 'form', level: 2, parentId: 'classical' },
  { id: 'baroque', name: 'Baroque', root: 'classical', kind: 'period', level: 2, parentId: 'classical' },

  { id: 'heavymetal', name: 'Heavy Metal', root: 'metal', kind: 'genre', level: 2, parentId: 'metal' },
  { id: 'doommetal', name: 'Doom Metal', root: 'metal', kind: 'genre', level: 2, parentId: 'metal' },
  { id: 'blackmetal', name: 'Black Metal', root: 'metal', kind: 'genre', level: 2, parentId: 'metal' },

  { id: 'punk', name: 'Punk', root: 'punk_hardcore', kind: 'genre', level: 2, parentId: 'punkhardcore' },
  { id: 'postpunk', name: 'Post-Punk', root: 'punk_hardcore', kind: 'genre', level: 2, parentId: 'punkhardcore' },
  { id: 'hardcore', name: 'Hardcore', root: 'punk_hardcore', kind: 'genre', level: 2, parentId: 'punkhardcore' },

  { id: 'folk', name: 'Folk', root: 'folk_country_world', kind: 'genre', level: 2, parentId: 'folkcountryworld' },
  { id: 'country', name: 'Country', root: 'folk_country_world', kind: 'genre', level: 2, parentId: 'folkcountryworld', isAtlasVisible: true },
  { id: 'world', name: 'World', root: 'folk_country_world', kind: 'genre', level: 2, parentId: 'folkcountryworld' },

  { id: 'samba', name: 'Samba', root: 'latin', kind: 'genre', level: 2, parentId: 'latin' },
  { id: 'bossanova', name: 'Bossa Nova', root: 'latin', kind: 'genre', level: 2, parentId: 'latin', isAtlasVisible: true },

  { id: 'reggae', name: 'Reggae', root: 'reggae_ska_dub', kind: 'genre', level: 2, parentId: 'reggaeskadub', isAtlasVisible: true },
  { id: 'dub', name: 'Dub', root: 'reggae_ska_dub', kind: 'genre', level: 2, parentId: 'reggaeskadub' },
  { id: 'ska', name: 'Ska', root: 'reggae_ska_dub', kind: 'genre', level: 2, parentId: 'reggaeskadub' },

  { id: 'electricblues', name: 'Electric Blues', root: 'blues', kind: 'genre', level: 2, parentId: 'blues' },
  { id: 'bluesrock', name: 'Blues Rock', root: 'blues', kind: 'genre', level: 2, parentId: 'blues' },

  { id: 'soundtrack', name: 'Soundtrack', root: 'soundtrack_stage', kind: 'genre', level: 2, parentId: 'soundtrackstage' },
  { id: 'musical', name: 'Musical', root: 'soundtrack_stage', kind: 'form', level: 2, parentId: 'soundtrackstage' },

  { id: 'industrial', name: 'Industrial', root: 'experimental_noise', kind: 'genre', level: 2, parentId: 'experimentalnoise' },
  { id: 'noise', name: 'Noise', root: 'experimental_noise', kind: 'genre', level: 2, parentId: 'experimentalnoise' },
  { id: 'drone', name: 'Drone', root: 'experimental_noise', kind: 'genre', level: 2, parentId: 'experimentalnoise' },

  { id: 'deephouse', name: 'Deep House', root: 'electronic', kind: 'genre', level: 3, parentId: 'house', isAtlasVisible: true },
  { id: 'proghouse', name: 'Progressive House', root: 'electronic', kind: 'genre', level: 3, parentId: 'house', isAtlasVisible: true },
  { id: 'techhouse', name: 'Tech House', root: 'electronic', kind: 'genre', level: 3, parentId: 'house', aliases: ['tech-house'], isAtlasVisible: true },
  { id: 'tropicalhouse', name: 'Tropical House', root: 'electronic', kind: 'genre', level: 3, parentId: 'house', isAtlasVisible: true },
  { id: 'industrialtech', name: 'Industrial Techno', root: 'electronic', kind: 'genre', level: 3, parentId: 'techno', isAtlasVisible: true },
  { id: 'minimaltech', name: 'Minimal Techno', root: 'electronic', kind: 'genre', level: 3, parentId: 'techno', isAtlasVisible: true },
  { id: 'futuregarage', name: 'Future Garage', root: 'electronic', kind: 'genre', level: 3, parentId: 'ukgarage', isAtlasVisible: true },
  { id: 'dubstep', name: 'Dubstep', root: 'electronic', kind: 'genre', level: 3, parentId: 'ukgarage', isAtlasVisible: true },
  { id: 'liquidfunk', name: 'Liquid Funk', root: 'electronic', kind: 'genre', level: 3, parentId: 'drumandbass', isAtlasVisible: true },
  { id: 'triphop', name: 'Trip-Hop', root: 'electronic', kind: 'genre', level: 3, parentId: 'downtempo', isAtlasVisible: true },
  { id: 'psybient', name: 'Psybient', root: 'ambient_newage', kind: 'genre', level: 3, parentId: 'ambient', isAtlasVisible: true },
  { id: 'vocalchillout', name: 'Vocal Chillout', root: 'electronic', kind: 'descriptor', level: 3, parentId: 'chillout', isAtlasVisible: true },
  { id: 'lofihiphop', name: 'Lo-Fi Hip-Hop', root: 'hiphop', kind: 'genre', level: 3, parentId: 'instrumentalhiphop' },
  { id: 'lofichill', name: 'Lo-Fi Chill', root: 'electronic', kind: 'descriptor', level: 3, parentId: 'chillout', aliases: ['lo-fi chill'], isAtlasVisible: true },

  { id: 'shoegaze', name: 'Shoegaze', root: 'rock', kind: 'genre', level: 3, parentId: 'indierock', isAtlasVisible: true },
  { id: 'dreampop', name: 'Dream Pop', root: 'pop', kind: 'genre', level: 3, parentId: 'indiepop', isAtlasVisible: true },
  { id: 'arenarock', name: 'Arena Rock', root: 'rock', kind: 'genre', level: 3, parentId: 'hardrock', isAtlasVisible: true },

  { id: 'contemjazz', name: 'Contemporary Jazz', root: 'jazz', kind: 'genre', level: 3, parentId: 'smoothjazz', isAtlasVisible: true },
  { id: 'acidjazz', name: 'Acid Jazz', root: 'jazz', kind: 'genre', level: 3, parentId: 'nujazz', isAtlasVisible: true },
  { id: 'neosouljazz', name: 'Neo Soul Jazz', root: 'jazz', kind: 'genre', level: 3, parentId: 'nujazz', isAtlasVisible: true },
  { id: 'cafejazz', name: 'Cafe Jazz', root: 'jazz', kind: 'descriptor', level: 3, parentId: 'smoothjazz', isAtlasVisible: true },
]

export const styleRelations: StyleRelation[] = [
  { id: 'ambient-parent-newage', sourceId: 'ambient', targetId: 'newage', kind: 'parent_of' },
  { id: 'ambient-parent-darkambient', sourceId: 'ambient', targetId: 'darkambient', kind: 'parent_of' },
  { id: 'ambient-parent-spaceambient', sourceId: 'ambient', targetId: 'spaceambient', kind: 'parent_of' },
  { id: 'ambient-parent-psybient', sourceId: 'ambient', targetId: 'psybient', kind: 'parent_of' },

  { id: 'electronic-parent-house', sourceId: 'electronic', targetId: 'house', kind: 'parent_of' },
  { id: 'electronic-parent-techno', sourceId: 'electronic', targetId: 'techno', kind: 'parent_of' },
  { id: 'electronic-parent-trance', sourceId: 'electronic', targetId: 'trance', kind: 'parent_of' },
  { id: 'electronic-parent-eurodance', sourceId: 'electronic', targetId: 'eurodance', kind: 'parent_of' },
  { id: 'electronic-parent-ukgarage', sourceId: 'electronic', targetId: 'ukgarage', kind: 'parent_of' },
  { id: 'electronic-parent-breaks', sourceId: 'electronic', targetId: 'breaks', kind: 'parent_of' },
  { id: 'electronic-parent-drumandbass', sourceId: 'electronic', targetId: 'drumandbass', kind: 'parent_of' },
  { id: 'electronic-parent-downtempo', sourceId: 'electronic', targetId: 'downtempo', kind: 'parent_of' },
  { id: 'electronic-parent-chillout', sourceId: 'electronic', targetId: 'chillout', kind: 'parent_of' },
  { id: 'electronic-parent-lounge', sourceId: 'electronic', targetId: 'lounge', kind: 'parent_of' },

  { id: 'rock-parent-hardrock', sourceId: 'rock', targetId: 'hardrock', kind: 'parent_of' },
  { id: 'rock-parent-alternativerock', sourceId: 'rock', targetId: 'alternativerock', kind: 'parent_of' },
  { id: 'rock-parent-indierock', sourceId: 'rock', targetId: 'indierock', kind: 'parent_of' },
  { id: 'rock-parent-postrock', sourceId: 'rock', targetId: 'postrock', kind: 'parent_of' },

  { id: 'pop-parent-synthpop', sourceId: 'pop', targetId: 'synthpop', kind: 'parent_of' },
  { id: 'pop-parent-indiepop', sourceId: 'pop', targetId: 'indiepop', kind: 'parent_of' },
  { id: 'pop-parent-dancepop', sourceId: 'pop', targetId: 'dancepop', kind: 'parent_of' },
  { id: 'indiepop-parent-dreampop', sourceId: 'indiepop', targetId: 'dreampop', kind: 'parent_of' },

  { id: 'hiphop-parent-instrumentalhiphop', sourceId: 'hiphop', targetId: 'instrumentalhiphop', kind: 'parent_of' },
  { id: 'hiphop-parent-trap', sourceId: 'hiphop', targetId: 'trap', kind: 'parent_of' },
  { id: 'hiphop-parent-boombap', sourceId: 'hiphop', targetId: 'boombap', kind: 'parent_of' },
  { id: 'instrumentalhiphop-parent-lofihiphop', sourceId: 'instrumentalhiphop', targetId: 'lofihiphop', kind: 'parent_of' },

  { id: 'rnbsoulfunk-parent-rnb', sourceId: 'rnbsoulfunk', targetId: 'rnb', kind: 'parent_of' },
  { id: 'rnbsoulfunk-parent-neosoul', sourceId: 'rnbsoulfunk', targetId: 'neosoul', kind: 'parent_of' },
  { id: 'rnbsoulfunk-parent-funk', sourceId: 'rnbsoulfunk', targetId: 'funk', kind: 'parent_of' },
  { id: 'rnbsoulfunk-parent-soul', sourceId: 'rnbsoulfunk', targetId: 'soul', kind: 'parent_of' },

  { id: 'jazz-parent-smoothjazz', sourceId: 'jazz', targetId: 'smoothjazz', kind: 'parent_of' },
  { id: 'jazz-parent-nujazz', sourceId: 'jazz', targetId: 'nujazz', kind: 'parent_of' },
  { id: 'jazz-parent-latinjazz', sourceId: 'jazz', targetId: 'latinjazz', kind: 'parent_of' },

  { id: 'instrumental-parent-piano', sourceId: 'instrumental', targetId: 'piano', kind: 'parent_of' },
  { id: 'classical-parent-opera', sourceId: 'classical', targetId: 'opera', kind: 'parent_of' },
  { id: 'classical-parent-baroque', sourceId: 'classical', targetId: 'baroque', kind: 'parent_of' },

  { id: 'metal-parent-heavymetal', sourceId: 'metal', targetId: 'heavymetal', kind: 'parent_of' },
  { id: 'metal-parent-doommetal', sourceId: 'metal', targetId: 'doommetal', kind: 'parent_of' },
  { id: 'metal-parent-blackmetal', sourceId: 'metal', targetId: 'blackmetal', kind: 'parent_of' },

  { id: 'punkhardcore-parent-punk', sourceId: 'punkhardcore', targetId: 'punk', kind: 'parent_of' },
  { id: 'punkhardcore-parent-postpunk', sourceId: 'punkhardcore', targetId: 'postpunk', kind: 'parent_of' },
  { id: 'punkhardcore-parent-hardcore', sourceId: 'punkhardcore', targetId: 'hardcore', kind: 'parent_of' },

  { id: 'folkcountryworld-parent-folk', sourceId: 'folkcountryworld', targetId: 'folk', kind: 'parent_of' },
  { id: 'folkcountryworld-parent-country', sourceId: 'folkcountryworld', targetId: 'country', kind: 'parent_of' },
  { id: 'folkcountryworld-parent-world', sourceId: 'folkcountryworld', targetId: 'world', kind: 'parent_of' },

  { id: 'latin-parent-samba', sourceId: 'latin', targetId: 'samba', kind: 'parent_of' },
  { id: 'latin-parent-bossanova', sourceId: 'latin', targetId: 'bossanova', kind: 'parent_of' },

  { id: 'reggaeskadub-parent-reggae', sourceId: 'reggaeskadub', targetId: 'reggae', kind: 'parent_of' },
  { id: 'reggaeskadub-parent-dub', sourceId: 'reggaeskadub', targetId: 'dub', kind: 'parent_of' },
  { id: 'reggaeskadub-parent-ska', sourceId: 'reggaeskadub', targetId: 'ska', kind: 'parent_of' },

  { id: 'blues-parent-electricblues', sourceId: 'blues', targetId: 'electricblues', kind: 'parent_of' },
  { id: 'blues-parent-bluesrock', sourceId: 'blues', targetId: 'bluesrock', kind: 'parent_of' },

  { id: 'soundtrackstage-parent-soundtrack', sourceId: 'soundtrackstage', targetId: 'soundtrack', kind: 'parent_of' },
  { id: 'soundtrackstage-parent-musical', sourceId: 'soundtrackstage', targetId: 'musical', kind: 'parent_of' },

  { id: 'experimentalnoise-parent-industrial', sourceId: 'experimentalnoise', targetId: 'industrial', kind: 'parent_of' },
  { id: 'experimentalnoise-parent-noise', sourceId: 'experimentalnoise', targetId: 'noise', kind: 'parent_of' },
  { id: 'experimentalnoise-parent-drone', sourceId: 'experimentalnoise', targetId: 'drone', kind: 'parent_of' },

  { id: 'house-parent-deephouse', sourceId: 'house', targetId: 'deephouse', kind: 'parent_of' },
  { id: 'house-parent-proghouse', sourceId: 'house', targetId: 'proghouse', kind: 'parent_of' },
  { id: 'house-parent-techhouse', sourceId: 'house', targetId: 'techhouse', kind: 'parent_of' },
  { id: 'house-parent-tropicalhouse', sourceId: 'house', targetId: 'tropicalhouse', kind: 'parent_of' },
  { id: 'techno-parent-industrialtech', sourceId: 'techno', targetId: 'industrialtech', kind: 'parent_of' },
  { id: 'techno-parent-minimaltech', sourceId: 'techno', targetId: 'minimaltech', kind: 'parent_of' },
  { id: 'ukgarage-parent-futuregarage', sourceId: 'ukgarage', targetId: 'futuregarage', kind: 'parent_of' },
  { id: 'ukgarage-parent-dubstep', sourceId: 'ukgarage', targetId: 'dubstep', kind: 'parent_of' },
  { id: 'drumandbass-parent-liquidfunk', sourceId: 'drumandbass', targetId: 'liquidfunk', kind: 'parent_of' },
  { id: 'downtempo-parent-triphop', sourceId: 'downtempo', targetId: 'triphop', kind: 'parent_of' },
  { id: 'chillout-parent-vocalchillout', sourceId: 'chillout', targetId: 'vocalchillout', kind: 'parent_of' },
  { id: 'chillout-parent-lofichill', sourceId: 'chillout', targetId: 'lofichill', kind: 'parent_of' },
  { id: 'indierock-parent-shoegaze', sourceId: 'indierock', targetId: 'shoegaze', kind: 'parent_of' },
  { id: 'hardrock-parent-arenarock', sourceId: 'hardrock', targetId: 'arenarock', kind: 'parent_of' },
  { id: 'smoothjazz-parent-contemjazz', sourceId: 'smoothjazz', targetId: 'contemjazz', kind: 'parent_of' },
  { id: 'nujazz-parent-acidjazz', sourceId: 'nujazz', targetId: 'acidjazz', kind: 'parent_of' },
  { id: 'nujazz-parent-neosouljazz', sourceId: 'nujazz', targetId: 'neosouljazz', kind: 'parent_of' },
  { id: 'smoothjazz-parent-cafejazz', sourceId: 'smoothjazz', targetId: 'cafejazz', kind: 'parent_of' },

  { id: 'ambient-related-newage', sourceId: 'ambient', targetId: 'newage', kind: 'related_to' },
  { id: 'spaceambient-influenced-psybient', sourceId: 'spaceambient', targetId: 'psybient', kind: 'influenced_by' },
  { id: 'darkambient-related-postrock', sourceId: 'darkambient', targetId: 'postrock', kind: 'related_to' },
  { id: 'futuregarage-related-chillout', sourceId: 'futuregarage', targetId: 'chillout', kind: 'related_to' },
  { id: 'futuregarage-related-triphop', sourceId: 'futuregarage', targetId: 'triphop', kind: 'related_to' },
  { id: 'futuregarage-influenced-breaks', sourceId: 'futuregarage', targetId: 'breaks', kind: 'influenced_by' },
  { id: 'dubstep-related-drumandbass', sourceId: 'dubstep', targetId: 'drumandbass', kind: 'related_to' },
  { id: 'dubstep-influenced-breaks', sourceId: 'dubstep', targetId: 'breaks', kind: 'influenced_by' },
  { id: 'triphop-fusion-nujazz', sourceId: 'triphop', targetId: 'nujazz', kind: 'fusion_of' },
  { id: 'chillout-related-downtempo', sourceId: 'chillout', targetId: 'downtempo', kind: 'related_to' },
  { id: 'dreampop-related-shoegaze', sourceId: 'dreampop', targetId: 'shoegaze', kind: 'related_to' },
  { id: 'bossanova-influenced-jazz', sourceId: 'bossanova', targetId: 'jazz', kind: 'influenced_by' },
  { id: 'bossanova-fusion-latinjazz', sourceId: 'bossanova', targetId: 'latinjazz', kind: 'fusion_of' },
  { id: 'lofihiphop-influenced-downtempo', sourceId: 'lofihiphop', targetId: 'downtempo', kind: 'influenced_by' },
]

export const stationBindings: StationBinding[] = [
  {
    id: 'drone-zone',
    name: 'SomaFM: Drone Zone',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'darkambient',
    secondaryStyleIds: ['ambient'],
  },
  {
    id: 'deep-space-one',
    name: 'SomaFM: Deep Space One',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'spaceambient',
    secondaryStyleIds: ['ambient', 'psybient'],
  },
  {
    id: 'space-station',
    name: 'SomaFM: Space Station',
    streamUrl: 'https://ice1.somafm.com/spacestation-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'spaceambient',
  },
  {
    id: 'new-age-radiopotok',
    name: 'New Age',
    streamUrl: 'https://ic1.radiosignal.one/r8-mp3',
    countryLabel: 'RU',
    bitrateLabel: '192k',
    primaryStyleId: 'newage',
  },
  {
    id: 'new-age-radioheart',
    name: 'New Age Radio',
    streamUrl: 'https://a7.radioheart.ru:9044/newageradio',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    primaryStyleId: 'newage',
  },
  {
    id: 'record-ambient',
    name: 'Рекорд Эмбиент',
    streamUrl: 'https://radiorecord.hostingradio.ru/ambient96.aacp',
    countryLabel: 'RU',
    bitrateLabel: '96k',
    primaryStyleId: 'ambient',
    secondaryStyleIds: ['darkambient'],
  },
  {
    id: 'mission-control',
    name: 'SomaFM: Mission Control',
    streamUrl: 'https://ice1.somafm.com/missioncontrol-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'spaceambient',
  },
  {
    id: 'groove-salad',
    name: 'SomaFM: Groove Salad',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'downtempo',
    secondaryStyleIds: ['triphop'],
    descriptorIds: ['chillout'],
  },
  {
    id: 'lush',
    name: 'SomaFM: Lush',
    streamUrl: 'https://ice1.somafm.com/lush-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'dreampop',
  },
  {
    id: 'house-station-live',
    name: 'House Station Live',
    streamUrl: 'https://c2.radioboss.fm:8224/320k.mp3',
    countryLabel: 'US',
    bitrateLabel: '320k',
    primaryStyleId: 'proghouse',
    secondaryStyleIds: ['house', 'electronic'],
  },
  {
    id: 'hirschmilch-progressive-house',
    name: 'Hirschmilch - Progressive House',
    streamUrl: 'https://hirschmilch.de:7001/prog-house.mp3',
    countryLabel: 'DE',
    bitrateLabel: '128k',
    primaryStyleId: 'proghouse',
    secondaryStyleIds: ['techhouse'],
  },
  {
    id: 'beat-blender',
    name: 'SomaFM: Beat Blender',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'downtempo',
    secondaryStyleIds: ['electronic'],
    descriptorIds: ['chillout'],
  },
  {
    id: 'record-chillout',
    name: 'Рекорд Чилаут',
    streamUrl: 'https://radiorecord.hostingradio.ru/chil96.aacp',
    countryLabel: 'RU',
    bitrateLabel: '96k',
    primaryStyleId: 'downtempo',
    descriptorIds: ['chillout'],
  },
  {
    id: 'record-dubstep',
    name: 'Рекорд Дабстеп',
    streamUrl: 'https://radiorecord.hostingradio.ru/dub96.aacp',
    countryLabel: 'RU',
    bitrateLabel: '96k',
    primaryStyleId: 'dubstep',
  },
  {
    id: 'ural-sound',
    name: 'Ural Sound',
    streamUrl: 'https://5.restream.one/1392_1',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    primaryStyleId: 'deephouse',
  },
  {
    id: 'deep-one',
    name: 'Deep One',
    streamUrl: 'https://stream.deep1.ru/deep1mp3',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    primaryStyleId: 'deephouse',
  },
  {
    id: 'soundpark-deep',
    name: 'SOUNDPARK DEEP',
    streamUrl: 'https://h.getradio.me/spdeep/hls.m3u8',
    countryLabel: 'RU',
    bitrateLabel: 'HLS',
    primaryStyleId: 'deephouse',
  },
  {
    id: 'techno-fm',
    name: 'Techno.FM',
    streamUrl: 'https://stream.techno.fm/radio1-320k.mp3',
    countryLabel: 'US',
    bitrateLabel: '320k',
    primaryStyleId: 'techno',
    secondaryStyleIds: ['minimaltech', 'industrialtech'],
  },
  {
    id: 'puls-radio-trance',
    name: 'Trance (Puls Radio)',
    streamUrl: 'https://icecast.pulsradio.com/pulstranceHD.mp3',
    countryLabel: 'FR',
    bitrateLabel: '192k',
    primaryStyleId: 'trance',
  },
  {
    id: 'anima-amoris-trance',
    name: 'Trance (Anima Amoris)',
    streamUrl: 'https://amoris.sknt.ru/trance',
    countryLabel: 'RU',
    bitrateLabel: '160k',
    primaryStyleId: 'trance',
  },
  {
    id: '90s-eurodance',
    name: '90s Eurodance',
    streamUrl: 'http://listen1.myradio24.com:9000/5967',
    countryLabel: 'RU',
    bitrateLabel: '192k',
    primaryStyleId: 'eurodance',
  },
  {
    id: 'ffh-eurodance',
    name: 'Eurodance (FFH Radio)',
    streamUrl: 'https://mp3.ffh.de/ffhchannels/hqeurodance.mp3',
    countryLabel: 'DE',
    bitrateLabel: '128k',
    primaryStyleId: 'eurodance',
  },
  {
    id: 'tropical-house-nrg',
    name: 'Tropical House (NRG Radio)',
    streamUrl: 'https://pub0101.101.ru/stream/pro/aac/64/364',
    countryLabel: 'RU',
    bitrateLabel: '64k',
    primaryStyleId: 'tropicalhouse',
  },
  {
    id: 'tropical-house-sunshine-live',
    name: 'Tropical House (Sunshine Live)',
    streamUrl: 'https://stream.sunshine-live.de/tropicalhouse/mp3-192/homepage/',
    countryLabel: 'DE',
    bitrateLabel: '192k',
    primaryStyleId: 'tropicalhouse',
  },
  {
    id: 'hearme-future-garage',
    name: 'Future Garage',
    streamUrl: 'https://radio.hearme.fm:8324/stream',
    countryLabel: 'UK',
    bitrateLabel: 'MP3',
    primaryStyleId: 'futuregarage',
  },
  {
    id: 'atmfm-breaks',
    name: 'Atm.Fm',
    streamUrl: 'http://station-sound.ru:8000/pt-2',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    primaryStyleId: 'breaks',
  },
  {
    id: 'bassdrive',
    name: 'Bassdrive',
    streamUrl: 'http://ice.bassdrive.net:80/stream',
    countryLabel: 'UK',
    bitrateLabel: '128k',
    primaryStyleId: 'drumandbass',
  },
  {
    id: 'liquid-dnb-station',
    name: 'Liquid DnB Station',
    streamUrl: 'http://95.47.244.172:8000/live',
    countryLabel: 'UA',
    bitrateLabel: 'MP3',
    primaryStyleId: 'liquidfunk',
  },
  {
    id: 'radio-art-vocal-lounge',
    name: 'Radio Art - Vocal Lounge',
    streamUrl: 'https://live.radioart.com/fVocal_lounge.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'lounge',
  },
  {
    id: 'record-summer-lounge',
    name: 'Summer Lounge (Радио Рекорд)',
    streamUrl: 'https://hls-01-radiorecord.hostingradio.ru/record-summerlounge/playlist.m3u8',
    countryLabel: 'RU',
    bitrateLabel: 'HLS',
    primaryStyleId: 'lounge',
  },
  {
    id: 'record-lofi',
    name: 'Lo-Fi (Радио Рекорд)',
    streamUrl: 'https://hls-01-radiorecord.hostingradio.ru/record-lofi/playlist.m3u8',
    countryLabel: 'RU',
    bitrateLabel: 'HLS',
    primaryStyleId: 'lofichill',
    secondaryStyleIds: ['lounge'],
    descriptorIds: ['chillout'],
  },
  {
    id: 'radio-art-vocal-chillout',
    name: 'Radio Art - Vocal Chillout',
    streamUrl: 'https://live.radioart.com/fVocal_chillout.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'downtempo',
    descriptorIds: ['vocalchillout'],
  },
  {
    id: 'hearme-vocal-chillout',
    name: 'Vocal Chillout',
    streamUrl: 'https://radio.hearme.fm:8106/stream',
    countryLabel: 'UK',
    bitrateLabel: 'MP3',
    primaryStyleId: 'downtempo',
    descriptorIds: ['vocalchillout'],
  },
  {
    id: 'symphony-fm',
    name: 'Симфония FM',
    streamUrl: 'https://radiorecord.hostingradio.ru/symph96.aacp',
    countryLabel: 'RU',
    bitrateLabel: '96k',
    primaryStyleId: 'classical',
  },
  {
    id: 'orfey',
    name: 'Орфей',
    streamUrl: 'https://orfeyfm.hostingradio.ru:8034/orfeyfm128.mp3',
    countryLabel: 'RU',
    bitrateLabel: '128k',
    primaryStyleId: 'classical',
  },
  {
    id: 'whisperings-solo-piano',
    name: 'Whisperings: Solo Piano',
    streamUrl: 'https://pianosolo.streamguys1.com/live',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'piano',
  },
  {
    id: 'indie-pop-rocks',
    name: 'SomaFM: Indie Pop Rocks',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'indiepop',
    secondaryStyleIds: ['dreampop'],
  },
  {
    id: 'digitalis',
    name: 'SomaFM: Digitalis',
    streamUrl: 'https://ice1.somafm.com/digitalis-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'alternativerock',
    secondaryStyleIds: ['rock', 'indierock'],
  },
  {
    id: 'hard-rock-star-fm',
    name: 'Hard Rock (STAR FM)',
    streamUrl: 'https://stream.starfm.de/hardrock/mp3-128/webseite',
    countryLabel: 'DE',
    bitrateLabel: '128k',
    primaryStyleId: 'hardrock',
  },
  {
    id: 'hard-rock-heaven',
    name: 'Hard Rock Heaven',
    streamUrl: 'http://hydra.cdnstream.com/1521_128',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'hardrock',
  },
  {
    id: 'n5md-radio',
    name: 'SomaFM: n5MD Radio',
    streamUrl: 'https://ice1.somafm.com/n5md-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'postrock',
    secondaryStyleIds: ['shoegaze'],
  },
  {
    id: 'underground-80s',
    name: 'SomaFM: Underground 80s',
    streamUrl: 'https://ice1.somafm.com/u80s-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'alternativerock',
  },
  {
    id: 'sonic-universe',
    name: 'SomaFM: Sonic Universe',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'nujazz',
    secondaryStyleIds: ['jazz', 'neosouljazz'],
  },
  {
    id: 'smooth-jazz-global',
    name: 'SmoothJazz.com Global Radio',
    streamUrl: 'https://smoothjazz.cdnstream1.com/2585_128.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'smoothjazz',
    secondaryStyleIds: ['contemjazz'],
  },
  {
    id: 'smooth-jazz-r668',
    name: 'Смут Джаз (Smooth Jazz)',
    streamUrl: 'https://smoothjazz.cdnstream1.com/2585_128.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'smoothjazz',
  },
  {
    id: 'smooth-lounge',
    name: 'SmoothLounge.com',
    streamUrl: 'https://smoothjazz.cdnstream1.com/2586_128.mp3',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'acidjazz',
    descriptorIds: ['cafejazz'],
  },
  {
    id: 'bossa',
    name: 'SomaFM: Bossa Beyond',
    streamUrl: 'https://ice1.somafm.com/bossa-128-aac',
    countryLabel: 'US',
    bitrateLabel: '128k',
    primaryStyleId: 'bossanova',
    descriptorIds: ['cafejazz'],
  },
  {
    id: 'record-latina',
    name: 'Latina Dance',
    streamUrl: 'https://hls-01-radiorecord.hostingradio.ru/record-latina/playlist.m3u8',
    countryLabel: 'RU',
    bitrateLabel: 'HLS',
    primaryStyleId: 'latin',
  },
  {
    id: 'vibration-latina',
    name: 'Vibration Latina',
    streamUrl: 'https://vibration.stream2net.eu/vibracion-latina.mp3',
    countryLabel: 'FR',
    bitrateLabel: '128k',
    primaryStyleId: 'latin',
  },
  {
    id: 'country-108',
    name: 'Country 108',
    streamUrl: 'http://icepool.silvacast.com/COUNTRY108.mp3',
    countryLabel: 'DE',
    bitrateLabel: '128k',
    primaryStyleId: 'country',
  },
  {
    id: 'rautemusik-country',
    name: 'Country (Rautemusik FM)',
    streamUrl: 'https://country-high.rautemusik.fm/',
    countryLabel: 'DE',
    bitrateLabel: '192k',
    primaryStyleId: 'country',
  },
  {
    id: 'gotradio-reggae-rasta-roots',
    name: 'Reggae Rasta & Roots (GotRadio)',
    streamUrl: 'https://pureplay.cdnstream1.com/6051_128.mp3',
    countryLabel: 'JM',
    bitrateLabel: '128k',
    primaryStyleId: 'reggae',
  },
]
