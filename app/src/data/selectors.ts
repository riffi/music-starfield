import { atlasData, type AtlasNode, type AtlasStation } from './atlas'
import { styleTaxonomy } from './taxonomy'

const BREAKBEAT_CLUSTER_ID = 'breakbeat'
const CLUB_CLUSTER_ID = 'club'
const STYLE_PARENT_BY_ID = Object.fromEntries(styleTaxonomy.map((taxon) => [taxon.id, taxon.parentId])) as Record<string, string | undefined>
const STYLE_NAME_BY_ID = Object.fromEntries(styleTaxonomy.map((taxon) => [taxon.id, taxon.name])) as Record<string, string>
const ATLAS_PARENT_OVERRIDES: Record<string, string | undefined> = {
  breaks: BREAKBEAT_CLUSTER_ID,
  drumandbass: BREAKBEAT_CLUSTER_ID,
  [BREAKBEAT_CLUSTER_ID]: 'electronic',
  house: CLUB_CLUSTER_ID,
  techno: CLUB_CLUSTER_ID,
  vocalchillout: 'chillout',
  [CLUB_CLUSTER_ID]: 'electronic',
}

function walkStyleAncestors(seed: string | undefined, into: Set<string>) {
  let id = seed
  while (id) {
    into.add(id)
    id = ATLAS_PARENT_OVERRIDES[id] ?? STYLE_PARENT_BY_ID[id]
  }
}

function orderedStylePathToRoot(seed: string | undefined) {
  const chain: string[] = []
  let id = seed
  while (id) {
    chain.push(id)
    id = ATLAS_PARENT_OVERRIDES[id] ?? STYLE_PARENT_BY_ID[id]
  }
  return chain
}

export function stationMatchesNode(station: AtlasStation, nodeId: string) {
  const matchedIds = new Set<string>()
  walkStyleAncestors(station.primaryStyleId, matchedIds)
  for (const sid of station.secondaryStyleIds) walkStyleAncestors(sid, matchedIds)
  for (const did of station.descriptorIds) walkStyleAncestors(did, matchedIds)
  return matchedIds.has(nodeId)
}

function stationContextPath(station: AtlasStation, selectedNodeId: string | null) {
  const primaryPath = orderedStylePathToRoot(station.primaryStyleId)
  const candidatePaths = [
    primaryPath,
    ...station.secondaryStyleIds.map((sid) => orderedStylePathToRoot(sid)),
    ...station.descriptorIds.map((did) => orderedStylePathToRoot(did)),
  ].filter((path) => path.length)

  if (selectedNodeId) {
    const matchedPath = candidatePaths.find((path) => path.includes(selectedNodeId))
    if (matchedPath) return matchedPath
  }

  if (primaryPath.length) return primaryPath

  const secondaryPath = candidatePaths.slice(1, 1 + station.secondaryStyleIds.length).flat()
  if (secondaryPath.length) return secondaryPath

  return candidatePaths.slice(1 + station.secondaryStyleIds.length).flat()
}

/**
 * Node ids that should pulse while this station plays: matches how the user reached the station on the graph.
 * If `selectedNodeId` matches the station (same rule as the side panel), pulse that node's branch only.
 * Otherwise union ancestor chains for primary, secondary, and descriptor styles (e.g. descriptor under Chillout + primary under Downtempo).
 */
export function pulseNodeIdsForPlayingStation(station: AtlasStation | undefined, selectedNodeId: string | null): Set<string> {
  const next = new Set<string>()
  if (!station) return next

  for (const id of stationContextPath(station, selectedNodeId)) {
    next.add(id)
  }
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

  const contextPath = stationContextPath(station, selectedNodeId)
  const leaf = contextPath[0] ?? null

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
