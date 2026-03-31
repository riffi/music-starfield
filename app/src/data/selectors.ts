import { atlasData, type AtlasNode, type AtlasStation } from './atlas'
import { styleTaxonomy } from './taxonomy'

const BREAKBEAT_CLUSTER_ID = 'breakbeat'
const CLUB_CLUSTER_ID = 'club'
const STYLE_PARENT_BY_ID = Object.fromEntries(styleTaxonomy.map((taxon) => [taxon.id, taxon.parentId])) as Record<string, string | undefined>
const STYLE_NAME_BY_ID = Object.fromEntries(styleTaxonomy.map((taxon) => [taxon.id, taxon.name])) as Record<string, string>
const ATLAS_PARENT_OVERRIDES: Record<string, string | undefined> = {
  breaks: BREAKBEAT_CLUSTER_ID,
  drumandbass: BREAKBEAT_CLUSTER_ID,
  atmosphericbreaks: BREAKBEAT_CLUSTER_ID,
  liquidfunk: BREAKBEAT_CLUSTER_ID,
  [BREAKBEAT_CLUSTER_ID]: 'electronic',
  house: CLUB_CLUSTER_ID,
  techno: CLUB_CLUSTER_ID,
  deephouse: CLUB_CLUSTER_ID,
  proghouse: CLUB_CLUSTER_ID,
  techhouse: CLUB_CLUSTER_ID,
  tropicalhouse: CLUB_CLUSTER_ID,
  industrialtech: CLUB_CLUSTER_ID,
  minimaltech: CLUB_CLUSTER_ID,
  [CLUB_CLUSTER_ID]: 'electronic',
}

function walkStyleAncestors(seed: string | undefined, into: Set<string>) {
  let id = seed
  while (id) {
    into.add(id)
    id = ATLAS_PARENT_OVERRIDES[id] ?? STYLE_PARENT_BY_ID[id]
  }
}

export function stationMatchesNode(station: AtlasStation, nodeId: string) {
  const matchedIds = new Set<string>()
  walkStyleAncestors(station.primaryStyleId, matchedIds)
  for (const sid of station.secondaryStyleIds) walkStyleAncestors(sid, matchedIds)
  for (const did of station.descriptorIds) walkStyleAncestors(did, matchedIds)
  return matchedIds.has(nodeId)
}

/**
 * Node ids that should pulse while this station plays: matches how the user reached the station on the graph.
 * If `selectedNodeId` matches the station (same rule as the side panel), pulse that node's branch only.
 * Otherwise union ancestor chains for primary, secondary, and descriptor styles (e.g. descriptor under Chillout + primary under Downtempo).
 */
export function pulseNodeIdsForPlayingStation(station: AtlasStation | undefined, selectedNodeId: string | null): Set<string> {
  const next = new Set<string>()
  if (!station) return next

  if (selectedNodeId && stationMatchesNode(station, selectedNodeId)) {
    walkStyleAncestors(selectedNodeId, next)
    return next
  }

  walkStyleAncestors(station.primaryStyleId, next)
  for (const sid of station.secondaryStyleIds) walkStyleAncestors(sid, next)
  for (const did of station.descriptorIds) walkStyleAncestors(did, next)
  return next
}

/** Root (L1) → … → leaf, along atlas parentId. */
function orderedPathRootToLeaf(leafId: string): string[] {
  const chain: string[] = []
  let id: string | undefined = leafId
  while (id) {
    const node: AtlasNode | undefined = atlasData.nodeMap[id]
    if (!node) break
    chain.push(id)
    id = node.parentId
  }
  return chain.reverse()
}

/**
 * Directed edge keys `parentId>childId` for the path from L1 to the playing context leaf
 * (selected node when it matches the station, else deepest node in the pulse set).
 */
export function computeRadioFlowEdgeKeys(station: AtlasStation | undefined, selectedNodeId: string | null, playing: boolean): Set<string> {
  const keys = new Set<string>()
  if (!playing || !station) return keys

  let leaf: string | null = null
  if (selectedNodeId && stationMatchesNode(station, selectedNodeId)) {
    leaf = selectedNodeId
  } else {
    const pulse = pulseNodeIdsForPlayingStation(station, selectedNodeId)
    let bestLv = 0
    for (const pid of pulse) {
      const node: AtlasNode | undefined = atlasData.nodeMap[pid]
      if (node && node.level >= bestLv) {
        bestLv = node.level
        leaf = pid
      }
    }
  }

  if (!leaf) return keys
  const path = orderedPathRootToLeaf(leaf)
  for (let i = 0; i < path.length - 1; i++) {
    keys.add(`${path[i]}>${path[i + 1]}`)
  }
  return keys
}

export function resolveStyleName(styleId: string) {
  if (styleId === BREAKBEAT_CLUSTER_ID) return 'Breakbeat'
  if (styleId === CLUB_CLUSTER_ID) return 'Club'
  return atlasData.nodeMap[styleId]?.name ?? STYLE_NAME_BY_ID[styleId] ?? styleId
}

export function getStationStyleLabels(station: AtlasStation) {
  return {
    primary: resolveStyleName(station.primaryStyleId),
    related: station.secondaryStyleIds.map(resolveStyleName),
    descriptors: station.descriptorIds.map(resolveStyleName),
  }
}
