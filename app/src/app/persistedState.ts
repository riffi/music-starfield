import { atlasData } from '../data/atlas'

const APP_STORAGE_KEY = 'music-galaxy.state'
const APP_STORAGE_VERSION = 1
const LEGACY_NORMALIZATION_ENABLED_STORAGE_KEY = 'music-galaxy.normalization.enabled'
const LEGACY_NORMALIZATION_AGGRESSION_STORAGE_KEY = 'music-galaxy.normalization.aggression'

export type PersistedAppState = {
  version: number
  audio: {
    normalizationEnabled: boolean
    normalizationAggression: number
    fadeInMs: number
    fadeOutMs: number
  }
  graph: {
    selectedNodeId: string | null
    panelOpen: boolean
    expandedNodeIds: string[]
  }
}

const DEFAULT_PERSISTED_APP_STATE: PersistedAppState = {
  version: APP_STORAGE_VERSION,
  audio: {
    normalizationEnabled: false,
    normalizationAggression: 55,
    fadeInMs: 160,
    fadeOutMs: 140,
  },
  graph: {
    selectedNodeId: null,
    panelOpen: false,
    expandedNodeIds: [],
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getParentId(nodeId: string) {
  return atlasData.nodeMap[nodeId]?.parentId ?? null
}

function getRootId(nodeId: string) {
  let cursor: string | null = nodeId
  let lastId: string | null = null

  while (cursor) {
    lastId = cursor
    cursor = getParentId(cursor)
  }

  return lastId
}

function getNodeDepth(nodeId: string) {
  return atlasData.nodeMap[nodeId]?.level ?? 0
}

function nodeExists(nodeId: string) {
  return !!atlasData.nodeMap[nodeId]
}

function nodeHasChildren(nodeId: string) {
  return (atlasData.childMap[nodeId]?.length ?? 0) > 0
}

function getExpandablePath(nodeId: string) {
  const path: string[] = []
  let cursor: string | null = nodeId

  while (cursor) {
    if (nodeHasChildren(cursor)) path.push(cursor)
    cursor = getParentId(cursor)
  }

  return path.reverse()
}

function getVisibilityAncestorPath(nodeId: string) {
  const path: string[] = []
  let cursor = getParentId(nodeId)

  while (cursor) {
    if (nodeHasChildren(cursor)) path.push(cursor)
    cursor = getParentId(cursor)
  }

  return path.reverse()
}

function normalizeExpandedCandidates(expandedNodeIds: unknown) {
  if (!Array.isArray(expandedNodeIds)) return []

  const uniqueIds = new Set<string>()
  for (const item of expandedNodeIds) {
    if (typeof item !== 'string') continue
    if (!nodeExists(item)) continue
    uniqueIds.add(item)
  }

  return [...uniqueIds]
}

function pickExpandedAnchor(candidateIds: string[], selectedNodeId: string | null) {
  if (!candidateIds.length) return null

  if (!selectedNodeId) {
    return [...candidateIds].sort((left, right) => getNodeDepth(right) - getNodeDepth(left))[0] ?? null
  }

  const selectedRootId = getRootId(selectedNodeId)
  const sameRootCandidates = candidateIds.filter((candidateId) => getRootId(candidateId) === selectedRootId)
  const rankedCandidates = (sameRootCandidates.length ? sameRootCandidates : candidateIds)
    .sort((left, right) => getNodeDepth(right) - getNodeDepth(left))

  for (const candidateId of rankedCandidates) {
    const candidatePath = new Set(getExpandablePath(candidateId))
    const selectedPath = getExpandablePath(selectedNodeId)
    const selectedVisibleOnCandidatePath = selectedPath.every((pathId) => candidatePath.has(pathId))
    if (selectedVisibleOnCandidatePath) return candidateId
  }

  return null
}

function sanitizeAudioState(audioState: unknown) {
  const fallback = DEFAULT_PERSISTED_APP_STATE.audio
  if (!isRecord(audioState)) return fallback

  const normalizationEnabled = typeof audioState.normalizationEnabled === 'boolean'
    ? audioState.normalizationEnabled
    : fallback.normalizationEnabled

  const rawAggression = typeof audioState.normalizationAggression === 'number'
    ? audioState.normalizationAggression
    : fallback.normalizationAggression

  const rawFadeInMs = typeof audioState.fadeInMs === 'number'
    ? audioState.fadeInMs
    : fallback.fadeInMs

  const rawFadeOutMs = typeof audioState.fadeOutMs === 'number'
    ? audioState.fadeOutMs
    : fallback.fadeOutMs

  return {
    normalizationEnabled,
    normalizationAggression: Math.max(0, Math.min(100, Math.round(rawAggression))),
    fadeInMs: Math.max(0, Math.min(600, Math.round(rawFadeInMs))),
    fadeOutMs: Math.max(0, Math.min(600, Math.round(rawFadeOutMs))),
  }
}

function sanitizeGraphState(graphState: unknown) {
  const fallback = DEFAULT_PERSISTED_APP_STATE.graph
  if (!isRecord(graphState)) return fallback

  const selectedNodeId = typeof graphState.selectedNodeId === 'string' && nodeExists(graphState.selectedNodeId)
    ? graphState.selectedNodeId
    : null

  const expandedCandidates = normalizeExpandedCandidates(graphState.expandedNodeIds)
  const expandedAnchorId = pickExpandedAnchor(expandedCandidates, selectedNodeId)
  const expandedNodeIds = Array.from(new Set([
    ...(expandedAnchorId ? getExpandablePath(expandedAnchorId) : []),
    ...(selectedNodeId ? getVisibilityAncestorPath(selectedNodeId) : []),
  ]))

  return {
    selectedNodeId,
    panelOpen: Boolean(selectedNodeId) && graphState.panelOpen === true,
    expandedNodeIds,
  }
}

function readLegacyAudioState() {
  if (typeof window === 'undefined') return DEFAULT_PERSISTED_APP_STATE.audio

  const rawEnabled = window.localStorage.getItem(LEGACY_NORMALIZATION_ENABLED_STORAGE_KEY)
  const rawAggression = window.localStorage.getItem(LEGACY_NORMALIZATION_AGGRESSION_STORAGE_KEY)

  return sanitizeAudioState({
    normalizationEnabled: rawEnabled === 'true' ? true : rawEnabled === 'false' ? false : undefined,
    normalizationAggression: rawAggression ? Number.parseInt(rawAggression, 10) : undefined,
  })
}

export function readPersistedAppState(): PersistedAppState {
  if (typeof window === 'undefined') return DEFAULT_PERSISTED_APP_STATE

  const rawValue = window.localStorage.getItem(APP_STORAGE_KEY)
  if (!rawValue) {
    return {
      ...DEFAULT_PERSISTED_APP_STATE,
      audio: readLegacyAudioState(),
    }
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (!isRecord(parsed)) return DEFAULT_PERSISTED_APP_STATE

    return {
      version: APP_STORAGE_VERSION,
      audio: sanitizeAudioState(parsed.audio),
      graph: sanitizeGraphState(parsed.graph),
    }
  } catch {
    return DEFAULT_PERSISTED_APP_STATE
  }
}

export function writePersistedAppState(state: PersistedAppState) {
  if (typeof window === 'undefined') return

  const sanitizedState: PersistedAppState = {
    version: APP_STORAGE_VERSION,
    audio: sanitizeAudioState(state.audio),
    graph: sanitizeGraphState(state.graph),
  }

  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(sanitizedState))
  window.localStorage.removeItem(LEGACY_NORMALIZATION_ENABLED_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_NORMALIZATION_AGGRESSION_STORAGE_KEY)
}
