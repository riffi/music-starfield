import type { RelationKind } from './taxonomy'
import { stationBindings } from './stations'
import { rootColors, styleTaxonomy } from './styles'

export type AtlasNode = {
  id: string
  name: string
  level: 1 | 2 | 3 | 4
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
  description?: string
  countryLabel: string
  bitrateLabel: string
  primaryStyleId: string
  secondaryStyleIds: string[]
  descriptorIds: string[]
}

const BREAKBEAT_CLUSTER_ID = 'breakbeat'
const BREAKBEAT_CLUSTER_CHILDREN = new Set(['breaks', 'drumandbass'])
const CLUB_CLUSTER_ID = 'club'
const CLUB_CLUSTER_CHILDREN = new Set(['house', 'techno'])
const L4_PARENT_OVERRIDES: Partial<Record<(typeof styleTaxonomy)[number]['id'], string>> = {
  vocalchillout: 'chillout',
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
  ...visibleTaxonomy.map((taxon) => {
    const atlasParentId = L4_PARENT_OVERRIDES[taxon.id] ?? (
      BREAKBEAT_CLUSTER_CHILDREN.has(taxon.id)
        ? BREAKBEAT_CLUSTER_ID
        : CLUB_CLUSTER_CHILDREN.has(taxon.id)
          ? CLUB_CLUSTER_ID
          : taxon.parentId
    )
    const level: AtlasNode['level'] = BREAKBEAT_CLUSTER_CHILDREN.has(taxon.id)
      ? 3
      : taxon.level === 3 && taxon.parentId && BREAKBEAT_CLUSTER_CHILDREN.has(taxon.parentId)
        ? 4
      : CLUB_CLUSTER_CHILDREN.has(taxon.id)
        ? 3
        : taxon.level === 3 && taxon.parentId && CLUB_CLUSTER_CHILDREN.has(taxon.parentId)
          ? 4
          : L4_PARENT_OVERRIDES[taxon.id]
            ? 4
          : taxon.level

    return {
      id: taxon.id,
      name: taxon.name,
      level,
      parentId: atlasParentId,
      color: rootColors[taxon.root],
    }
  }),
]

const links: AtlasLink[] = nodes
  .filter((node) => node.parentId)
  .map((node) => ({
    id: `${node.parentId}-parent-${node.id}`,
    sourceId: node.parentId!,
    targetId: node.id,
    relationType: 'parent_of' as const,
  }))

const stations: AtlasStation[] = stationBindings.map((binding) => ({
  id: binding.id,
  name: binding.name,
  streamUrl: binding.streamUrl,
  description: binding.description,
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
