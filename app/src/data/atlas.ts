import { rootColors, stationBindings, styleRelations, styleTaxonomy, type RelationKind } from './taxonomy'

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
  relationType: RelationKind
}

export type AtlasStation = {
  id: string
  name: string
  streamUrl: string
  countryLabel: string
  bitrateLabel: string
  primaryStyleId: string
  secondaryStyleIds: string[]
  descriptorIds: string[]
}

const BREAKBEAT_CLUSTER_ID = 'breakbeat'
const BREAKBEAT_CLUSTER_CHILDREN = new Set(['breaks', 'drumandbass', 'atmosphericbreaks', 'liquidfunk'])
const CLUB_CLUSTER_ID = 'club'
const CLUB_CLUSTER_CHILDREN = new Set(['house', 'techno', 'deephouse', 'proghouse', 'techhouse', 'tropicalhouse', 'industrialtech', 'minimaltech'])
const ATLAS_OMIT_NODE_IDS = new Set(['house'])

const taxonomyById = Object.fromEntries(styleTaxonomy.map((taxon) => [taxon.id, taxon])) as Record<string, (typeof styleTaxonomy)[number]>
const visibleIds = new Set(styleTaxonomy.filter((taxon) => taxon.isAtlasVisible).map((taxon) => taxon.id))

for (const taxon of styleTaxonomy) {
  if (!visibleIds.has(taxon.id)) continue
  let cursor = taxon.parentId
  while (cursor) {
    visibleIds.add(cursor)
    cursor = taxonomyById[cursor]?.parentId
  }
}

const visibleTaxonomy = styleTaxonomy.filter((taxon) => visibleIds.has(taxon.id) && !ATLAS_OMIT_NODE_IDS.has(taxon.id))

const nodes: AtlasNode[] = [
  {
    id: BREAKBEAT_CLUSTER_ID,
    name: 'Breakbeat',
    level: 2,
    parentId: 'electronic',
    color: rootColors.electronic,
  },
  {
    id: CLUB_CLUSTER_ID,
    name: 'Club',
    level: 2,
    parentId: 'electronic',
    color: rootColors.electronic,
  },
  ...visibleTaxonomy.map((taxon) => ({
    id: taxon.id,
    name: taxon.name,
    level: BREAKBEAT_CLUSTER_CHILDREN.has(taxon.id) || CLUB_CLUSTER_CHILDREN.has(taxon.id) ? 3 : taxon.level,
    parentId: BREAKBEAT_CLUSTER_CHILDREN.has(taxon.id)
      ? BREAKBEAT_CLUSTER_ID
      : CLUB_CLUSTER_CHILDREN.has(taxon.id)
        ? CLUB_CLUSTER_ID
        : taxon.parentId,
    color: rootColors[taxon.root],
  })),
]

const links: AtlasLink[] = styleRelations
  .filter((relation) => visibleIds.has(relation.sourceId) && visibleIds.has(relation.targetId))
  .map((relation) => ({
  id: relation.id,
  sourceId: BREAKBEAT_CLUSTER_CHILDREN.has(relation.sourceId)
    ? BREAKBEAT_CLUSTER_ID
    : CLUB_CLUSTER_CHILDREN.has(relation.sourceId)
      ? CLUB_CLUSTER_ID
      : relation.sourceId,
  targetId: BREAKBEAT_CLUSTER_CHILDREN.has(relation.targetId)
    ? BREAKBEAT_CLUSTER_ID
    : CLUB_CLUSTER_CHILDREN.has(relation.targetId)
      ? CLUB_CLUSTER_ID
      : relation.targetId,
  relationType: relation.kind,
  }))
  .filter((relation) => relation.sourceId !== relation.targetId)
  .filter((relation) => nodes.some((node) => node.id === relation.sourceId) && nodes.some((node) => node.id === relation.targetId))

const stations: AtlasStation[] = stationBindings.map((binding) => ({
  id: binding.id,
  name: binding.name,
  streamUrl: binding.streamUrl,
  countryLabel: binding.countryLabel,
  bitrateLabel: binding.bitrateLabel,
  primaryStyleId: binding.primaryStyleId,
  secondaryStyleIds: binding.secondaryStyleIds ?? [],
  descriptorIds: binding.descriptorIds ?? [],
}))

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
