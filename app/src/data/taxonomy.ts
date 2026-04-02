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
  description?: string
  countryLabel: string
  bitrateLabel: string
  primaryStyleId: string
  secondaryStyleIds?: string[]
  descriptorIds?: string[]
}

export { rootColors, styleRelations, styleTaxonomy } from './styles'
export { stationBindings } from './stations'
