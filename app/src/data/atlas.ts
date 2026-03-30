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

const visibleTaxonomy = styleTaxonomy.filter((taxon) => visibleIds.has(taxon.id))

const nodes: AtlasNode[] = visibleTaxonomy.map((taxon) => ({
  id: taxon.id,
  name: taxon.name,
  level: taxon.level,
  parentId: taxon.parentId,
  color: rootColors[taxon.root],
}))

const links: AtlasLink[] = styleRelations
  .filter((relation) => visibleIds.has(relation.sourceId) && visibleIds.has(relation.targetId))
  .map((relation) => ({
  id: relation.id,
  sourceId: relation.sourceId,
  targetId: relation.targetId,
  relationType: relation.kind,
  }))

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
