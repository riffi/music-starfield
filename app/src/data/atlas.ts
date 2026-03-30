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
  styleIds: string[]
}

const nodes: AtlasNode[] = styleTaxonomy.map((taxon) => ({
  id: taxon.id,
  name: taxon.name,
  level: taxon.level,
  parentId: taxon.parentId,
  color: rootColors[taxon.root],
}))

const links: AtlasLink[] = styleRelations.map((relation) => ({
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
  styleIds: binding.styleIds,
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
