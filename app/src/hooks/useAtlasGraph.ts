import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { TAU, levelLabels } from '../app/constants'
import type { AudioLevels, HoveredNode, RefLink, RefNode, ViewportState } from '../app/types'
import { atlasData } from '../data/atlas'
import { computeRadioFlowEdgeKeys, pulseNodeIdsForPlayingStation } from '../data/selectors'

type UseAtlasGraphArgs = {
  referenceNodes: RefNode[]
  currentStationId: string | null
  playing: boolean
  audioDataRef: React.MutableRefObject<AudioLevels>
  viewportRef: React.MutableRefObject<ViewportState>
  expandedIds: string[]
  setExpandedIds: React.Dispatch<React.SetStateAction<string[]>>
  selectedId: string | null
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
  setHovered: React.Dispatch<React.SetStateAction<HoveredNode | null>>
}

export function useAtlasGraph({
  referenceNodes,
  currentStationId,
  playing,
  audioDataRef,
  viewportRef,
  expandedIds,
  setExpandedIds,
  selectedId,
  setSelectedId,
  setPanelOpen,
  setHovered,
}: UseAtlasGraphArgs) {
  const graphRef = useRef<SVGSVGElement | null>(null)
  const pulseFrameRef = useRef<number | null>(null)
  const stationPulseIdsRef = useRef<Set<string>>(new Set())
  const flowEdgeKeysRef = useRef<Set<string>>(new Set())
  const expandedIdsRef = useRef<Set<string>>(new Set(expandedIds))

  useEffect(() => {
    expandedIdsRef.current = new Set(expandedIds)
  }, [expandedIds])

  function isLeafLevel(level: RefNode['level']) {
    return level >= 3
  }

  function nodeRadius(level: RefNode['level'], rootRadius?: number) {
    if (level === 1) return rootRadius ?? 27
    if (level === 2) return 15
    if (level === 3) return 6
    return 4.6
  }

  function nodeStrokeWidth(level: RefNode['level']) {
    if (level === 1) return 2
    if (level === 2) return 1.5
    if (level === 3) return 1.1
    return 0.95
  }

  function nodeHighlightStrokeWidth(level: RefNode['level']) {
    if (level === 1) return 3.6
    if (level === 2) return 3.1
    if (level === 3) return 2.2
    return 1.8
  }

  function orbitStrength(level: RefNode['level']) {
    if (level === 1) return 0.3
    if (level === 2) return 0.76
    if (level === 3) return 0.68
    return 0.62
  }

  function expandableOrbitRadius(level: RefNode['level'], baseRadius: number) {
    if (level === 1) return baseRadius * 1.3
    if (level === 2) return baseRadius * 1.42
    if (level === 3) return baseRadius * 2.08
    return baseRadius * 2.24
  }

  function withAlpha(color: string, alpha: number) {
    const parsed = d3.color(color)
    if (!parsed) return color
    parsed.opacity = alpha
    return parsed.formatRgb()
  }

  useEffect(() => {
    const station = playing && currentStationId ? atlasData.stationMap[currentStationId] : undefined
    stationPulseIdsRef.current = pulseNodeIdsForPlayingStation(station, selectedId)
    flowEdgeKeysRef.current = computeRadioFlowEdgeKeys(station, selectedId, playing)
  }, [playing, currentStationId, selectedId])

  useEffect(() => {
    let pt = 0
    const tick = () => {
      pt += 0.014
      const svgEl = graphRef.current
      if (svgEl) {
        const { bass, energy } = audioDataRef.current
        const pulseIds = stationPulseIdsRef.current
        const pulseActive = pulseIds.size > 0
        const audioRingBoost = 1 + bass * 0.34 + energy * 0.12
        const audioOpacityBoost = bass * 0.18 + energy * 0.08
        const branchPresenceBoost = pulseActive ? 1.015 : 1

        d3.select(svgEl).selectAll<SVGGElement, RefNode>('g.nd').each(function (d, i) {
          const grp = d3.select(this)
          const baseR = d.level === 1 ? 27 : d.level === 2 ? 16 : d.level === 3 ? 9 : 7
          const phase = i * 0.62
          const pulseThis = pulseIds.size > 0 && pulseIds.has(d.id)

          if (!pulseThis) {
            grp.select('circle.gring-halo').attr('opacity', 0)
            grp.select('circle.gring-rim').attr('opacity', 0)
            if (d.level === 1) {
              grp.select('circle.gring-mid-halo').attr('opacity', 0)
              grp.select('circle.gring-mid-rim').attr('opacity', 0)
            }
            if (d.level <= 2) grp.select('circle.ncore').attr('r', baseR * 0.38)
            if (isLeafLevel(d.level)) {
              grp.select('circle.nbody').attr('r', baseR)
              grp.select('circle.ncold').attr('r', baseR * (d.level === 3 ? 0.42 : 0.34))
            }
            return
          }

          const ringFreq = d.level === 1 ? 0.42 : d.level === 2 ? 0.58 : d.level === 3 ? 0.76 : 0.88
          const ringWave = Math.abs(Math.sin(pt * ringFreq + phase))
          const levelRingAmplitude = d.level === 1 ? 0.07 : d.level === 2 ? 0.16 : d.level === 3 ? 0.15 : 0.13
          const levelHaloBase = d.level === 1 ? 0.09 : d.level === 2 ? 0.13 : d.level === 3 ? 0.12 : 0.1
          const levelHaloWave = d.level === 1 ? 0.05 : d.level === 2 ? 0.11 : d.level === 3 ? 0.1 : 0.08
          const levelHaloAudio = d.level === 1 ? 0.18 : d.level === 2 ? 0.44 : d.level === 3 ? 0.38 : 0.3
          const levelHaloCap = d.level === 1 ? 0.24 : d.level === 2 ? 0.46 : d.level === 3 ? 0.4 : 0.32
          const levelRimBase = d.level === 1 ? 0.065 : d.level === 2 ? 0.09 : d.level === 3 ? 0.082 : 0.07
          const levelRimWave = d.level === 1 ? 0.03 : d.level === 2 ? 0.072 : d.level === 3 ? 0.06 : 0.05
          const levelRimAudio = d.level === 1 ? 0.075 : d.level === 2 ? 0.22 : d.level === 3 ? 0.18 : 0.15
          const levelRimCap = d.level === 1 ? 0.13 : d.level === 2 ? 0.28 : d.level === 3 ? 0.24 : 0.2
          const ringScale = (1 + ringWave * levelRingAmplitude) * audioRingBoost * branchPresenceBoost
          const haloFillOp = Math.min(levelHaloBase + ringWave * levelHaloWave + audioOpacityBoost * levelHaloAudio, levelHaloCap)
          const rimStrokeOp = Math.min(levelRimBase + ringWave * levelRimWave + audioOpacityBoost * levelRimAudio, levelRimCap)

          grp.select('circle.gring-halo').attr('opacity', 1).attr('r', baseR * 1.42 * ringScale).attr('fill-opacity', haloFillOp)
          grp.select('circle.gring-rim').attr('opacity', 1).attr('r', baseR * 1.7 * ringScale).attr('stroke-opacity', rimStrokeOp)

          if (d.level === 1) {
            const midHalo = Math.min(haloFillOp * 0.98, 0.2)
            const midRim = Math.min(rimStrokeOp * 1.02, 0.13)
            grp.select('circle.gring-mid-halo').attr('opacity', 1).attr('r', baseR * 1.1 * ringScale).attr('fill-opacity', midHalo)
            grp.select('circle.gring-mid-rim').attr('opacity', 1).attr('r', baseR * 1.28 * ringScale).attr('stroke-opacity', midRim)
          }

          if (d.level <= 2) {
            const audioCore = 1 + bass * (d.level === 1 ? 0.17 : 0.34) + energy * (d.level === 1 ? 0.035 : 0.08)
            const coreScale = (1 + Math.sin(pt * 1.62 + phase + Math.PI * 0.3) * (d.level === 1 ? 0.14 : 0.26)) * audioCore
            grp.select('circle.ncore').attr('r', baseR * 0.38 * coreScale)
          }

          if (isLeafLevel(d.level)) {
            const bodyScale = 1 + Math.sin(pt * 1.02 + phase) * 0.18 + bass * 0.08 + energy * 0.1
            grp.select('circle.nbody').attr('r', baseR * bodyScale)
            grp.select('circle.ncold').attr('r', baseR * (d.level === 3 ? 0.42 : 0.34) * (1 + energy * 0.08))
          }
        })

        const flowKeys = flowEdgeKeysRef.current
        const flowActive = flowKeys.size > 0
        d3.select(svgEl).selectAll<SVGLineElement, RefLink>('line.edge').each(function (d) {
          const src = typeof d.source === 'object' ? d.source : null
          const tgt = typeof d.target === 'object' ? d.target : null
          if (!src || !tgt) return
          const key = `${src.id}>${tgt.id}`
          const line = d3.select(this)
          if (flowActive && flowKeys.has(key)) {
            line.style('stroke-dasharray', src.level === 1 ? '7,10' : '4,8').style('stroke-dashoffset', '0').style('stroke-opacity', String(Math.min(0.34, 0.14 + audioOpacityBoost * 0.18))).style('stroke-width', String(src.level === 1 ? 1.55 : 1.02))
          } else {
            line.style('stroke-dasharray', src.level === 1 ? '5,5' : '2,5').style('stroke-dashoffset', null).style('stroke-opacity', '0.22').style('stroke-width', String(src.level === 1 ? 1.4 : 0.9))
          }
        })
        d3.select(svgEl).selectAll<SVGLineElement, RefLink>('line.edge-flow').each(function (d) {
          const src = typeof d.source === 'object' ? d.source : null
          const tgt = typeof d.target === 'object' ? d.target : null
          if (!src || !tgt) return
          const key = `${src.id}>${tgt.id}`
          const line = d3.select(this)
          if (flowActive && flowKeys.has(key)) {
            const ln = this as SVGLineElement
            const len = ln.getTotalLength() || 48
            const dashLen = Math.max(src.level === 1 ? 22 : 16, len * (src.level === 1 ? 0.18 : 0.14))
            const gapLen = Math.max(src.level === 1 ? 34 : 24, len * 0.9)
            const period = dashLen + gapLen
            const flowOff = (pt * (src.level === 1 ? 62 : 54)) % period
            const flowOpacity = Math.min(0.92, 0.34 + bass * 0.34 + energy * 0.22)
            const flowWidth = (src.level === 1 ? 2.6 : 1.8) + bass * 0.7 + energy * 0.3
            line.style('stroke-dasharray', `${dashLen} ${gapLen}`).style('stroke-dashoffset', String(-flowOff)).style('stroke-opacity', String(flowOpacity)).style('stroke-width', String(flowWidth))
          } else {
            line.style('stroke-dasharray', null).style('stroke-dashoffset', null).style('stroke-opacity', '0').style('stroke-width', '0')
          }
        })
      }
      pulseFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      if (pulseFrameRef.current) cancelAnimationFrame(pulseFrameRef.current)
    }
  }, [audioDataRef])

  useEffect(() => {
    const svgEl = graphRef.current
    if (!svgEl) return
    const nodes = referenceNodes.map((node) => ({ ...node }))
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<string, RefNode>
    const links: RefLink[] = nodes.filter((node) => node.parent).map((node) => ({ source: node.parent!, target: node.id }))
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()
    const width = () => svgEl.clientWidth
    const height = () => svgEl.clientHeight
    const childrenByParent = nodes.reduce<Record<string, RefNode[]>>((acc, node) => {
      if (!node.parent) return acc
      acc[node.parent] ??= []
      acc[node.parent].push(node)
      return acc
    }, {})
    const rootNodes = nodes.filter((node) => node.level === 1)
    const rootWeightById = new Map<string, number>()
    const rootRadiusById = new Map<string, number>()

    const defs = svg.append('defs')
    ;['glow3', 'glow6', 'glow10'].forEach((id, index) => {
      const filter = defs.append('filter').attr('id', id).attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%')
      filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', [3, 6, 10][index]).attr('result', 'blur')
      const merge = filter.append('feMerge')
      merge.append('feMergeNode').attr('in', 'blur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')
    })
    ;['pulseHalo3', 'pulseHalo6', 'pulseHalo10'].forEach((id, index) => {
      const dev = [5, 8, 12][index]
      const filter = defs.append('filter').attr('id', id).attr('x', '-100%').attr('y', '-100%').attr('width', '320%').attr('height', '320%').attr('color-interpolation-filters', 'sRGB')
      filter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', dev).attr('result', 'blur')
      filter.append('feMerge').append('feMergeNode').attr('in', 'blur')
    })
    const flowGlow = defs.append('filter').attr('id', 'flowGlow').attr('x', '-120%').attr('y', '-120%').attr('width', '340%').attr('height', '340%').attr('color-interpolation-filters', 'sRGB')
    flowGlow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 3.2).attr('result', 'blur')
    flowGlow.append('feMerge').append('feMergeNode').attr('in', 'blur')

    const g = svg.append('g')
    const constellationG = g.append('g')
    const linkG = g.append('g')
    const flowG = g.append('g')
    const nodeG = g.append('g')
    const labelG = g.append('g')
    const expanded = expandedIdsRef.current
    let previousGraphActiveRootId: string | null = null
    let previousGraphActiveLevel2Id: string | null = null

    function getL1(node: RefNode) {
      let cursor: RefNode | undefined = node
      while (cursor && cursor.level !== 1 && cursor.parent) {
        cursor = nodeMap[cursor.parent]
      }
      return cursor?.level === 1 ? cursor : null
    }
    function distributeOffset(index: number, total: number) {
      if (total <= 1) return 0
      return (index / (total - 1) - 0.5) * 2
    }
    function nodeColor(node: RefNode) {
      return getL1(node)?.color ?? node.color
    }
    function nodeBelongsToRoot(node: RefNode, rootId: string) {
      return getL1(node)?.id === rootId
    }
    function hasChildren(node: RefNode) {
      return (childrenByParent[node.id]?.length ?? 0) > 0
    }
    function getActiveRootId() {
      const expandedRoots = rootNodes.filter((root) => expanded.has(root.id))
      return expandedRoots.length === 1 ? expandedRoots[0].id : null
    }
    function getActiveLevel2Id(activeRootId: string | null) {
      if (!activeRootId) return null
      const expandedLevel2 = (childrenByParent[activeRootId] ?? []).filter((node) => node.level === 2 && expanded.has(node.id))
      return expandedLevel2.length === 1 ? expandedLevel2[0].id : null
    }
    function nr(node: RefNode) {
      return nodeRadius(node.level, rootRadiusById.get(node.id))
    }
    function level3ColdColor(node: RefNode) {
      const rootColor = getL1(node)?.color ?? '#a8cfff'
      return d3.interpolateRgb(rootColor, '#cfe2ff')(0.72)
    }
    function getVisible() {
      function isVisibleBranch(node: RefNode) {
        let cursor: RefNode | undefined = node
        while (cursor && cursor.level > 1) {
          if (!cursor.parent) return false
          const parent: RefNode | undefined = nodeMap[cursor.parent]
          if (!parent || !expanded.has(parent.id)) return false
          cursor = parent
        }
        return true
      }

      const visibleNodes = nodes.filter((node) => {
        if (node.level === 1) return true
        return isVisibleBranch(node)
      })
      const ids = new Set(visibleNodes.map((node) => node.id))
      const visibleLinks = links.filter((link) => {
        const source = typeof link.source === 'object' ? link.source.id : link.source
        const target = typeof link.target === 'object' ? link.target.id : link.target
        return ids.has(source) && ids.has(target)
      })
      return { visibleNodes, visibleLinks }
    }
    function buildConstellationLinks(visibleNodes: RefNode[]) {
      const visibleIds = new Set(visibleNodes.map((node) => node.id))
      const constellationLinks: RefLink[] = []

      for (const root of rootNodes) {
        const visibleLevel2 = (childrenByParent[root.id] ?? []).filter((node) => visibleIds.has(node.id))
        for (let i = 0; i < visibleLevel2.length - 1; i += 1) {
          constellationLinks.push({ source: visibleLevel2[i].id, target: visibleLevel2[i + 1].id })
        }
      }

      for (const [parentId, siblings] of Object.entries(childrenByParent)) {
        const parent = nodeMap[parentId]
        if (!parent || parent.level < 2 || !visibleIds.has(parent.id)) continue
        const visibleChildren = siblings.filter((node) => visibleIds.has(node.id))
        for (let i = 0; i < visibleChildren.length - 1; i += 1) {
          constellationLinks.push({ source: visibleChildren[i].id, target: visibleChildren[i + 1].id })
        }
      }

      return constellationLinks
    }
    function placeChildFan(parent: RefNode, parentX: number, parentY: number, anchorX: number, anchorY: number, sectorSpan: number, siblingCount: number, visibleIds: Set<string>) {
      const childNodes = (childrenByParent[parent.id] ?? []).filter((child) => visibleIds.has(child.id))
      const childCount = childNodes.length
      if (childCount === 0) return [] as { id: string; x: number; y: number }[]
      const anchorDistance = Math.hypot(parentX - anchorX, parentY - anchorY)
      const orbitBase = parent.level === 2 ? Math.max(74, anchorDistance * 0.44) : Math.max(58, anchorDistance * 0.46)
      const pairOrbitBoost = childCount === 2 ? (parent.level === 2 ? 20 : 12) : 0
      const childOrbit = orbitBase + pairOrbitBoost + Math.max(0, childCount - 2) * (parent.level === 2 ? 10 : 7) + Math.max(0, siblingCount - 4) * 2
      const branchAngle = Math.atan2(parentY - anchorY, parentX - anchorX)
      const branchDirX = Math.cos(branchAngle)
      const branchDirY = Math.sin(branchAngle)
      const centerX = width() / 2
      const centerY = height() / 2
      const outwardX = parentX - centerX
      const outwardY = parentY - centerY
      const outwardAngle = Math.atan2(outwardY || branchDirY, outwardX || branchDirX)
      const outwardDirX = Math.cos(outwardAngle)
      const outwardDirY = Math.sin(outwardAngle)
      const outwardTanX = Math.cos(outwardAngle + Math.PI / 2)
      const outwardTanY = Math.sin(outwardAngle + Math.PI / 2)
      const childSpan = Math.min(parent.level === 2 ? Math.PI * 0.78 : Math.PI * 0.58, Math.max(sectorSpan * (parent.level === 2 ? 0.58 : 0.48), 0.26 + childCount * 0.12))
      let childTangentLimit = Math.tan(childSpan / 2) * childOrbit * (parent.level === 2 ? 0.86 : 0.8)
      const childRadius = parent.level === 2 ? 9 : 7
      const minGap = childRadius * 2 + (parent.level === 2 ? 52 : 32)
      if (childCount > 1) childTangentLimit = Math.max(childTangentLimit, (minGap * (childCount - 1)) / 2)
      return childNodes.map((child, childIndex) => {
        const offset = childCount === 1
          ? 0
          : childCount === 2
            ? childIndex === 0 ? -0.62 : 0.62
            : distributeOffset(childIndex, childNodes.length)
        const branchSpread = childTangentLimit * offset
        return {
          id: child.id,
          x: parentX + outwardDirX * childOrbit + outwardTanX * branchSpread,
          y: parentY + outwardDirY * childOrbit + outwardTanY * branchSpread,
        }
      })
    }
    function collectSubtree(rootId: string) {
      const acc: RefNode[] = []
      const stack = [...(childrenByParent[rootId] ?? [])]
      while (stack.length > 0) {
        const next = stack.pop()
        if (!next) continue
        acc.push(next)
        const kids = childrenByParent[next.id]
        if (kids) stack.push(...kids)
      }
      return acc
    }
    function computeRootMetrics() {
      const weights = rootNodes.map((root) => {
        const subtree = collectSubtree(root.id)
        const level2Count = subtree.filter((node) => node.level === 2).length
        const level3Count = subtree.filter((node) => node.level === 3).length
        const level4Count = subtree.filter((node) => node.level === 4).length
        const stationFootprint = subtree.reduce((sum, node) => sum + Math.min(node.stations.length, node.level === 2 ? 3 : 2), 0)
        const rawWeight = 1 + level2Count * 1.2 + level3Count * 1.75 + level4Count * 1.1 + stationFootprint * 0.28
        return { id: root.id, weight: Math.sqrt(rawWeight) }
      })
      const minWeight = Math.min(...weights.map((entry) => entry.weight))
      const maxWeight = Math.max(...weights.map((entry) => entry.weight))
      for (const entry of weights) {
        rootWeightById.set(entry.id, entry.weight)
        const normalized = maxWeight > minWeight ? (entry.weight - minWeight) / (maxWeight - minWeight) : 0
        rootRadiusById.set(entry.id, 24 + normalized * 8)
      }
    }
    function computeRootLayout(activeRootId: string | null) {
      const focusBoost = activeRootId ? 1.7 : 1
      const gap = Math.min(0.14, TAU / Math.max(rootNodes.length * 14, 1))
      const totalGap = gap * rootNodes.length
      const availableArc = Math.max(TAU - totalGap, TAU * 0.7)
      let totalWeight = 0
      const weightedRoots = rootNodes.map((root) => {
        const weight = (rootWeightById.get(root.id) ?? 1) * (activeRootId && root.id === activeRootId ? focusBoost : 1)
        totalWeight += weight
        return { root, weight }
      })
      const layout = new Map<string, { angle: number; span: number }>()
      let cursor = -Math.PI / 2
      for (const { root, weight } of weightedRoots) {
        const span = availableArc * (weight / Math.max(totalWeight, 0.001))
        layout.set(root.id, { angle: cursor + span * 0.5, span })
        cursor += span + gap
      }
      return layout
    }
    function computeLevel2Span(rootSpan: number, childCount: number, isActiveRoot: boolean) {
      const densityFactor = Math.max(0.56, Math.min(1.32, 4 / Math.max(childCount, 1)))
      const baseSpan = rootSpan * (isActiveRoot ? 0.92 : 0.88) * densityFactor
      const minSpan = childCount <= 3 ? 0.78 : childCount <= 5 ? 0.58 : 0.42
      const activeFloor = childCount <= 3 ? 0.92 : childCount <= 5 ? 0.72 : 0.5
      return Math.min(Math.PI * 0.88, Math.max(baseSpan, isActiveRoot ? activeFloor : minSpan))
    }
    function computeTargets(visibleNodes: RefNode[], activeRootId: string | null) {
      const targets = new Map<string, { x: number; y: number }>()
      const visibleIds = new Set(visibleNodes.map((node) => node.id))
      const centerX = width() / 2
      const centerY = height() / 2
      const rootOrbit = Math.max(210, Math.min(width(), height()) * 0.34)
      const rootLayout = computeRootLayout(activeRootId)
      rootNodes.forEach((root) => {
        const rootMeta = rootLayout.get(root.id)
        if (!rootMeta) return
        const rootAngle = rootMeta.angle
        const rootX = centerX + Math.cos(rootAngle) * rootOrbit
        const rootY = centerY + Math.sin(rootAngle) * rootOrbit
        targets.set(root.id, { x: rootX, y: rootY })
        const level2Children = (childrenByParent[root.id] ?? []).filter((child) => visibleIds.has(child.id))
        const rootWeight = rootWeightById.get(root.id) ?? 1
        const isActiveRoot = activeRootId === root.id
        const baseLevel2Orbit = 166 + Math.max(0, level2Children.length - 4) * 16 + (rootWeight - 1) * 4 + (isActiveRoot ? 12 : 0)
        const rootDirX = Math.cos(rootAngle)
        const rootDirY = Math.sin(rootAngle)
        const rootTanX = Math.cos(rootAngle + Math.PI / 2)
        const rootTanY = Math.sin(rootAngle + Math.PI / 2)
        const level2Span = computeLevel2Span(rootMeta.span, level2Children.length, isActiveRoot)
        const level2TangentLimit = Math.tan(level2Span / 2) * baseLevel2Orbit * 0.96
        level2Children.forEach((child, childIndex) => {
          const level2Offset = distributeOffset(childIndex, level2Children.length)
          const tangentSpread = level2TangentLimit * level2Offset
          const childX = rootX + rootDirX * baseLevel2Orbit + rootTanX * tangentSpread
          const childY = rootY + rootDirY * baseLevel2Orbit + rootTanY * tangentSpread
          targets.set(child.id, { x: childX, y: childY })
          for (const p of placeChildFan(child, childX, childY, rootX, rootY, level2Span, level2Children.length, visibleIds)) {
            targets.set(p.id, { x: p.x, y: p.y })
            const grandchild = nodeMap[p.id]
            for (const q of placeChildFan(grandchild, p.x, p.y, childX, childY, level2Span * 0.84, (childrenByParent[child.id] ?? []).length, visibleIds)) {
              targets.set(q.id, { x: q.x, y: q.y })
            }
          }
        })
      })
      return { targets, rootLayout }
    }

    computeRootMetrics()

    const simulation = d3.forceSimulation<RefNode>().velocityDecay(0.42)
      .force('link', d3.forceLink<RefNode, RefLink>().id((d) => d.id).distance((d) => {
        const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
        if (!source) return 90
        if (source.level === 1) return 155 + Math.max(0, (childrenByParent[source.id]?.length ?? 0) - 4) * 20
        if (source.level === 2) return 118 + Math.max(0, (childrenByParent[source.id]?.length ?? 0) - 2) * 24
        if (source.level === 3) return 52 + Math.max(0, (childrenByParent[source.id]?.length ?? 0) - 2) * 16
        return 44
      }).strength((d) => {
        const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
        if (source?.level === 2) return 0.68
        if (source?.level === 3) return 0.74
        return 0.9
      }))
      .force('charge', d3.forceManyBody<RefNode>().strength((d) => (d.level === 1 ? -320 : d.level === 2 ? -140 : d.level === 3 ? -110 : -72)))
      .force('collision', d3.forceCollide<RefNode>().radius((d) => nr(d) + (d.level === 1 ? 34 : d.level === 2 ? 28 : d.level === 3 ? 30 : 16)).iterations(3))
      .force('center', d3.forceCenter())

    function syncGraphDom() {
      constellationG.selectAll<SVGLineElement, d3.SimulationLinkDatum<RefNode>>('line.edge-constellation').attr('x1', (d) => (d.source as RefNode).x ?? 0).attr('y1', (d) => (d.source as RefNode).y ?? 0).attr('x2', (d) => (d.target as RefNode).x ?? 0).attr('y2', (d) => (d.target as RefNode).y ?? 0)
      linkG.selectAll<SVGLineElement, d3.SimulationLinkDatum<RefNode>>('line.edge').attr('x1', (d) => (d.source as RefNode).x ?? 0).attr('y1', (d) => (d.source as RefNode).y ?? 0).attr('x2', (d) => (d.target as RefNode).x ?? 0).attr('y2', (d) => (d.target as RefNode).y ?? 0)
      flowG.selectAll<SVGLineElement, d3.SimulationLinkDatum<RefNode>>('line.edge-flow').attr('x1', (d) => (d.source as RefNode).x ?? 0).attr('y1', (d) => (d.source as RefNode).y ?? 0).attr('x2', (d) => (d.target as RefNode).x ?? 0).attr('y2', (d) => (d.target as RefNode).y ?? 0)
      nodeG.selectAll<SVGGElement, RefNode>('g.nd').attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      labelG.selectAll<SVGTextElement, RefNode>('text.lbl').attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0)
    }
    simulation.on('tick', syncGraphDom)

    function deselect() {
      nodeG.selectAll<SVGGElement, RefNode>('g.nd').select<SVGCircleElement>('circle.nbody').attr('stroke-width', (d) => nodeStrokeWidth(d.level)).attr('stroke-opacity', 1).attr('fill', (d) => (isLeafLevel(d.level) ? withAlpha(level3ColdColor(d), 0.13) : withAlpha(nodeColor(d), 0.13))).attr('stroke', (d) => (isLeafLevel(d.level) ? level3ColdColor(d) : nodeColor(d))).attr('filter', (d) => (d.level === 1 ? 'url(#glow6)' : 'url(#glow3)'))
      setSelectedId(null)
    }
    function highlight(id: string) {
      nodeG.selectAll<SVGGElement, RefNode>('g.nd').select<SVGCircleElement>('circle.nbody').attr('stroke-width', (d) => (d.id === id ? nodeHighlightStrokeWidth(d.level) : nodeStrokeWidth(d.level))).attr('stroke-opacity', (d) => (d.id === id ? 1 : 0.92)).attr('fill', (d) => {
        if (isLeafLevel(d.level)) return d.id === id ? withAlpha(level3ColdColor(d), 0.31) : withAlpha(level3ColdColor(d), 0.13)
        return d.id === id ? withAlpha(nodeColor(d), 0.45) : withAlpha(nodeColor(d), 0.13)
      }).attr('stroke', (d) => (isLeafLevel(d.level) ? level3ColdColor(d) : nodeColor(d))).attr('filter', (d) => (d.id !== id ? (d.level === 1 ? 'url(#glow6)' : 'url(#glow3)') : d.level === 1 ? 'url(#glow10)' : 'url(#glow6)'))
    }
    function refreshPanel(node: RefNode) {
      setSelectedId(node.id)
      setPanelOpen(true)
    }
    function collapseAll(id: string) {
      expanded.delete(id)
      nodes.filter((node) => node.parent === id).forEach((node) => collapseAll(node.id))
    }
    function collapseOtherRoots(activeRootId: string) { rootNodes.forEach((root) => { if (root.id !== activeRootId) collapseAll(root.id) }) }
    function collapseSiblingBranches(activeNodeId: string, parentId: string | null) {
      if (!parentId) return
      ;(childrenByParent[parentId] ?? []).forEach((child) => {
        if (child.id !== activeNodeId) collapseAll(child.id)
      })
    }
    function clickNode(node: RefNode) {
      const hasKids = nodes.some((item) => item.parent === node.id)
      const rootId = node.level === 1 ? node.id : getL1(node)?.id
      const shouldCollapseOtherRoots = !!rootId && (node.level === 1 || hasKids)
      if (hasKids) {
        if (expanded.has(node.id)) collapseAll(node.id)
        else {
          if (rootId) collapseOtherRoots(rootId)
          collapseSiblingBranches(node.id, node.parent)
          expanded.add(node.id)
        }
        setExpandedIds([...expanded])
        update(false)
      } else {
        if (shouldCollapseOtherRoots && rootId) {
          collapseOtherRoots(rootId)
          setExpandedIds([...expanded])
          update(false)
        }
        simulation.stop()
        simulation.alpha(0)
      }
      highlight(node.id)
      refreshPanel(node)
    }
    function update(initial: boolean, reason: 'layout' | 'resize' = 'layout') {
      if (!initial) simulation.stop()
      const { visibleNodes, visibleLinks } = getVisible()
      const constellationLinks = buildConstellationLinks(visibleNodes)
      const visibleIds = new Set(visibleNodes.map((n) => n.id))
      const activeRootId = getActiveRootId()
      const activeLevel2Id = getActiveLevel2Id(activeRootId)
      const { targets, rootLayout } = computeTargets(visibleNodes, activeRootId)
      const focusTargetChanged = initial || activeRootId !== previousGraphActiveRootId || activeLevel2Id !== previousGraphActiveLevel2Id
      const rootDimmingChanged = initial || activeRootId !== previousGraphActiveRootId
      previousGraphActiveRootId = activeRootId
      previousGraphActiveLevel2Id = activeLevel2Id
      const activeRootTarget = activeRootId ? targets.get(activeRootId) : null
      viewportRef.current = {
        ...viewportRef.current,
        activeRootId,
        activeRootColor: activeRootId ? nodeMap[activeRootId]?.color ?? null : null,
        activeRootX: activeRootTarget?.x ?? width() * 0.5,
        activeRootY: activeRootTarget?.y ?? height() * 0.5,
        activeRootGlow: activeRootId ? 1 : 0,
      }

      simulation.force('center', d3.forceCenter(width() / 2, height() / 2))
      simulation.force('orbit-x', d3.forceX<RefNode>((d) => targets.get(d.id)?.x ?? width() / 2).strength((d) => orbitStrength(d.level)))
      simulation.force('orbit-y', d3.forceY<RefNode>((d) => targets.get(d.id)?.y ?? height() / 2).strength((d) => orbitStrength(d.level)))

      visibleNodes.forEach((node) => {
        const target = targets.get(node.id)
        if (!target) return
        if (node.x === undefined || node.y === undefined || initial) {
          if (initial) {
            const jitter = node.level === 1 ? 18 : node.level === 2 ? 10 : node.level === 3 ? 4 : 2.5
            node.x = target.x + (Math.random() - 0.5) * jitter
            node.y = target.y + (Math.random() - 0.5) * jitter
          } else {
            const p = node.parent ? nodeMap[node.parent] : null
            node.x = p?.x != null && p?.y != null ? p.x : target.x
            node.y = p?.x != null && p?.y != null ? p.y : target.y
          }
        }
      })

      const linkSelection = linkG.selectAll<SVGLineElement, RefLink>('line.edge').data(visibleLinks, (d) => `${typeof d.source === 'object' ? d.source.id : d.source}>${typeof d.target === 'object' ? d.target.id : d.target}`)
      const enteredLinks = linkSelection.enter().append('line').attr('class', 'edge').style('stroke', (d) => nodeColor(typeof d.target === 'object' ? d.target : nodeMap[d.target])).style('stroke-opacity', 0.22).style('stroke-width', (d) => ((typeof d.source === 'object' ? d.source : nodeMap[d.source]).level === 1 ? 1.4 : 0.9)).style('stroke-linecap', 'round').style('stroke-dasharray', (d) => ((typeof d.source === 'object' ? d.source : nodeMap[d.source]).level === 1 ? '5,5' : '2,5')).style('opacity', 0).transition().duration(450).style('opacity', 1)
      const activeLinkSelection = linkSelection.merge(enteredLinks)
      linkSelection.exit().transition().duration(300).style('opacity', 0).remove()

      const constellationSelection = constellationG.selectAll<SVGLineElement, RefLink>('line.edge-constellation').data(constellationLinks, (d) => `${typeof d.source === 'object' ? d.source.id : d.source}>${typeof d.target === 'object' ? d.target.id : d.target}`)
      const enteredConstellations = constellationSelection.enter().append('line')
        .attr('class', 'edge-constellation')
        .style('stroke', (d) => {
          const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
          return d3.color(nodeColor(source))?.copy({ opacity: 0.3 }).formatRgb() ?? nodeColor(source)
        })
        .style('stroke-opacity', 0.1)
        .style('stroke-width', (d) => ((typeof d.source === 'object' ? d.source : nodeMap[d.source]).level === 2 ? 0.55 : 0.42))
        .style('stroke-linecap', 'round')
        .style('stroke-dasharray', '1.5,5.5')
        .style('opacity', 0)
        .transition()
        .duration(450)
        .style('opacity', 1)
      const activeConstellationSelection = constellationSelection.merge(enteredConstellations)
      constellationSelection.exit().transition().duration(260).style('opacity', 0).remove()

      const flowSelection = flowG.selectAll<SVGLineElement, RefLink>('line.edge-flow').data(visibleLinks, (d) => `${typeof d.source === 'object' ? d.source.id : d.source}>${typeof d.target === 'object' ? d.target.id : d.target}`)
      flowSelection.enter().append('line').attr('class', 'edge-flow').style('stroke', (d) => nodeColor(typeof d.target === 'object' ? d.target : nodeMap[d.target])).style('stroke-linecap', 'round').style('stroke-opacity', 0).style('stroke-width', 0).style('pointer-events', 'none').style('mix-blend-mode', 'screen').attr('filter', 'url(#flowGlow)')
      flowSelection.exit().transition().duration(220).style('stroke-opacity', 0).remove()

      const nodeSelection = nodeG.selectAll<SVGGElement, RefNode>('g.nd').data(visibleNodes, (d) => d.id)
      const entered = nodeSelection.enter().append('g').attr('class', 'nd').attr('transform', (d) => `translate(${d.x ?? width() / 2},${d.y ?? height() / 2})`).style('opacity', 0).style('cursor', 'pointer')
        .on('click', (event, d) => { event.stopPropagation(); clickNode(d) })
        .on('mouseover', function (event, d) {
          const hasKids = hasChildren(d)
          if (hasKids) {
            d3.select(this).select<SVGCircleElement>('circle.nexpand-orbit')
              .attr('stroke-opacity', 0.48)
              .attr('stroke-width', d.level === 1 ? 0.9 : 0.75)
          }
          setHovered({ name: d.name, level: levelLabels[d.level], stationCount: d.stations.length, hint: hasKids ? (expanded.has(d.id) ? '↙ Click to collapse' : '↗ Click to expand') : '● Click for stations', x: event.clientX + 14, y: event.clientY - 10 })
        })
        .on('mousemove', (event) => setHovered((prev) => (prev ? { ...prev, x: event.clientX + 14, y: event.clientY - 10 } : prev)))
        .on('mouseout', function (_, d) {
          if (hasChildren(d)) {
            d3.select(this).select<SVGCircleElement>('circle.nexpand-orbit')
              .attr('stroke-opacity', d.level === 1 ? 0.3 : 0.24)
              .attr('stroke-width', d.level === 1 ? 0.6 : 0.52)
          }
          setHovered(null)
        })

      entered.append('circle').attr('class', 'gring-halo').attr('r', (d) => nr(d) * 1.56).attr('fill', (d) => nodeColor(d)).attr('fill-opacity', 0.2).attr('stroke', 'none').attr('opacity', 0).attr('pointer-events', 'none').attr('filter', (d) => (d.level === 1 ? 'url(#pulseHalo10)' : d.level === 2 ? 'url(#pulseHalo6)' : 'url(#pulseHalo3)'))
      entered.append('circle').attr('class', 'gring-rim').attr('r', (d) => nr(d) * 1.9).attr('fill', 'none').attr('stroke', (d) => nodeColor(d)).attr('stroke-width', 0.32).attr('stroke-linecap', 'round').attr('stroke-opacity', 0.15).attr('opacity', 0).attr('pointer-events', 'none')
      entered.filter((d) => d.level === 1).append('circle').attr('class', 'gring-mid-halo').attr('r', (d) => nr(d) * 1.14).attr('fill', (d) => nodeColor(d)).attr('fill-opacity', 0.22).attr('stroke', 'none').attr('opacity', 0).attr('pointer-events', 'none').attr('filter', 'url(#pulseHalo6)')
      entered.filter((d) => d.level === 1).append('circle').attr('class', 'gring-mid-rim').attr('r', (d) => nr(d) * 1.35).attr('fill', 'none').attr('stroke', (d) => nodeColor(d)).attr('stroke-width', 0.28).attr('stroke-linecap', 'round').attr('stroke-opacity', 0.16).attr('opacity', 0).attr('pointer-events', 'none')
      entered.append('circle').attr('class', 'nbody').attr('r', (d) => nr(d)).attr('fill', (d) => (isLeafLevel(d.level) ? withAlpha(level3ColdColor(d), 0.13) : withAlpha(nodeColor(d), 0.13))).attr('stroke', (d) => (isLeafLevel(d.level) ? level3ColdColor(d) : nodeColor(d))).attr('stroke-width', (d) => nodeStrokeWidth(d.level)).attr('filter', (d) => (d.level === 1 ? 'url(#glow6)' : 'url(#glow3)'))
      entered.filter((d) => hasChildren(d)).append('circle').attr('class', 'nexpand-orbit').attr('r', (d) => expandableOrbitRadius(d.level, nr(d))).attr('fill', 'none').attr('stroke', (d) => nodeColor(d)).attr('stroke-opacity', (d) => (d.level === 1 ? 0.3 : 0.24)).attr('stroke-width', (d) => (d.level === 1 ? 0.6 : 0.52)).attr('stroke-dasharray', (d) => (d.level <= 2 ? '1.8,3.2' : '1.2,2.8')).attr('transform', 'rotate(-14)').attr('pointer-events', 'none')
      entered.filter((d) => d.level <= 2).append('circle').attr('class', 'ncore').attr('r', (d) => nr(d) * 0.38).attr('fill', (d) => nodeColor(d)).attr('filter', 'url(#glow3)')
      entered.filter((d) => d.level === 2).append('circle').attr('class', 'ncompanion').attr('cx', (d) => nr(d) * 0.52).attr('cy', (d) => -nr(d) * 0.24).attr('r', (d) => nr(d) * 0.22).attr('fill', (d) => d3.interpolateRgb(nodeColor(d), '#ffffff')(0.35)).attr('fill-opacity', 0.9).attr('filter', 'url(#glow3)').attr('pointer-events', 'none')
      entered.filter((d) => isLeafLevel(d.level)).append('circle').attr('class', 'ncold').attr('r', (d) => nr(d) * (d.level === 3 ? 0.42 : 0.34)).attr('fill', (d) => level3ColdColor(d)).attr('fill-opacity', (d) => (d.level === 3 ? 0.92 : 0.8)).attr('filter', 'url(#glow3)').attr('pointer-events', 'none')
      entered.filter((d) => d.level === 1).each(function (d) {
        const gg = d3.select(this)
        const s = nr(d) * 0.75
        gg.append('line').attr('x1', -s).attr('y1', 0).attr('x2', s).attr('y2', 0).attr('stroke', nodeColor(d)).attr('stroke-width', 0.8).attr('stroke-opacity', 0.55)
        gg.append('line').attr('x1', 0).attr('y1', -s).attr('x2', 0).attr('y2', s).attr('stroke', nodeColor(d)).attr('stroke-width', 0.8).attr('stroke-opacity', 0.55)
        gg.append('line').attr('x1', -s * 0.65).attr('y1', -s * 0.65).attr('x2', s * 0.65).attr('y2', s * 0.65).attr('stroke', nodeColor(d)).attr('stroke-width', 0.5).attr('stroke-opacity', 0.3)
        gg.append('line').attr('x1', s * 0.65).attr('y1', -s * 0.65).attr('x2', -s * 0.65).attr('y2', s * 0.65).attr('stroke', nodeColor(d)).attr('stroke-width', 0.5).attr('stroke-opacity', 0.3)
      })
      entered.transition().duration(500).style('opacity', 1)
      const activeNodeSelection = nodeSelection.merge(entered)

      const labelSelection = labelG.selectAll<SVGTextElement, RefNode>('text.lbl').data(visibleNodes, (d) => d.id)
      const enteredLabels = labelSelection.enter().append('text').attr('class', (d) => `lbl lbl-l${d.level}`).style('font-family', "'Orbitron', sans-serif").style('font-size', (d) => (d.level === 1 ? '13px' : d.level === 2 ? '10px' : d.level === 3 ? '9px' : '8px')).style('font-weight', (d) => (d.level === 1 ? '600' : d.level === 4 ? '400' : '500')).style('fill', (d) => (d.level === 1 ? nodeColor(d) : d.level === 4 ? 'rgba(184,168,136,.82)' : '#b8a888')).style('text-anchor', 'middle').style('pointer-events', 'none').style('letter-spacing', (d) => (d.level === 1 ? '.13em' : d.level === 4 ? '.045em' : '.07em')).attr('dy', (d) => nr(d) + (d.level === 1 ? 20 : d.level === 2 ? 14 : d.level === 3 ? 12 : 10)).text((d) => d.name).style('opacity', 0).transition().duration(500).style('opacity', 1)
      const activeLabelSelection = labelSelection.merge(enteredLabels)
      labelSelection.exit().transition().duration(300).style('opacity', 0).remove()
      nodeSelection.exit().transition().duration(300).style('opacity', 0).remove()

      const dimNodeOpacity = (d: RefNode) => !activeRootId ? 1 : nodeBelongsToRoot(d, activeRootId) ? 1 : d.level === 1 ? 0.34 : 0.12
      const dimLabelOpacity = (d: RefNode) => !activeRootId ? 1 : nodeBelongsToRoot(d, activeRootId) ? 1 : d.level === 1 ? 0.42 : 0.14
      const dimLinkOpacity = (d: RefLink) => {
        if (!activeRootId) return 1
        const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
        const target = typeof d.target === 'object' ? d.target : nodeMap[d.target]
        return nodeBelongsToRoot(source, activeRootId) && nodeBelongsToRoot(target, activeRootId) ? 1 : 0.1
      }
      const dimConstellationOpacity = (d: RefLink) => {
        if (!activeRootId) return 0.76
        const source = typeof d.source === 'object' ? d.source : nodeMap[d.source]
        const target = typeof d.target === 'object' ? d.target : nodeMap[d.target]
        return nodeBelongsToRoot(source, activeRootId) && nodeBelongsToRoot(target, activeRootId) ? 1 : 0.06
      }
      if (rootDimmingChanged) {
        activeConstellationSelection.transition().duration(420).style('opacity', (d) => dimConstellationOpacity(d))
        activeNodeSelection.transition().duration(420).style('opacity', (d) => dimNodeOpacity(d))
        activeLabelSelection.transition().duration(420).style('opacity', (d) => dimLabelOpacity(d))
        activeLinkSelection.transition().duration(420).style('opacity', (d) => dimLinkOpacity(d))
      } else {
        activeConstellationSelection.style('opacity', (d) => dimConstellationOpacity(d))
        activeNodeSelection.style('opacity', (d) => dimNodeOpacity(d))
        activeLabelSelection.style('opacity', (d) => dimLabelOpacity(d))
        activeLinkSelection.style('opacity', (d) => dimLinkOpacity(d))
      }

      if (selectedId && visibleIds.has(selectedId)) highlight(selectedId)

      simulation.nodes(visibleNodes)
      simulation.force<d3.ForceLink<RefNode, RefLink>>('link')?.links(visibleLinks)

      if (!initial && reason !== 'resize') {
        svg.interrupt('graphLayout')
        function applyDescendantLayout() {
          rootNodes.forEach((root) => {
            if (!visibleIds.has(root.id)) return
            const rootMeta = rootLayout.get(root.id)
            if (!rootMeta) return
            const rootX = root.x ?? targets.get(root.id)!.x
            const rootY = root.y ?? targets.get(root.id)!.y
            const level2Children = (childrenByParent[root.id] ?? []).filter((c) => visibleIds.has(c.id))
            const level2Span = computeLevel2Span(rootMeta.span, level2Children.length, activeRootId === root.id)
            for (const child of level2Children) {
              const cx = child.x ?? targets.get(child.id)!.x
              const cy = child.y ?? targets.get(child.id)!.y
              for (const p of placeChildFan(child, cx, cy, rootX, rootY, level2Span, level2Children.length, visibleIds)) {
                const level3Node = nodeMap[p.id]
                level3Node.x = p.x
                level3Node.y = p.y
                for (const q of placeChildFan(level3Node, p.x, p.y, cx, cy, level2Span * 0.84, (childrenByParent[child.id] ?? []).length, visibleIds)) {
                  const level4Node = nodeMap[q.id]
                  level4Node.x = q.x
                  level4Node.y = q.y
                }
              }
            }
          })
        }
        applyDescendantLayout()
        syncGraphDom()
        const startPos = new Map(visibleNodes.filter((d) => d.level <= 2).map((d) => [d.id, { x: d.x ?? targets.get(d.id)!.x, y: d.y ?? targets.get(d.id)!.y }] as const))
        svg.transition('graphLayout').duration(440).ease(d3.easeLinear).tween('graphLayout', () => (u: number) => {
          for (const d of visibleNodes) {
            if (d.level >= 3) continue
            const tgt = targets.get(d.id)!
            const s = startPos.get(d.id)!
            d.x = s.x + (tgt.x - s.x) * u
            d.y = s.y + (tgt.y - s.y) * u
          }
          applyDescendantLayout()
          syncGraphDom()
        }).on('end', () => {
          for (const d of visibleNodes) {
            const tgt = targets.get(d.id)!
            d.x = tgt.x
            d.y = tgt.y
            d.vx = 0
            d.vy = 0
          }
          simulation.alpha(0)
          syncGraphDom()
        })
      } else if (!initial) {
        for (const d of visibleNodes) {
          const tgt = targets.get(d.id)
          if (!tgt) continue
          d.x = tgt.x
          d.y = tgt.y
          d.vx = 0
          d.vy = 0
        }
        simulation.alpha(0)
        syncGraphDom()
      } else {
        simulation.alpha(1).restart()
      }

      const focusTransform = !activeRootId
        ? d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1).translate(-width() / 2, -height() / 2)
        : (() => {
            const level2Target = activeLevel2Id ? targets.get(activeLevel2Id) : null
            if (level2Target) {
              return d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1.28).translate(-level2Target.x, -level2Target.y)
            }
            const rootTarget = targets.get(activeRootId)
            if (!rootTarget) return d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1).translate(-width() / 2, -height() / 2)
            return d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1.18).translate(-rootTarget.x, -rootTarget.y)
          })()
      if (focusTargetChanged || reason === 'resize') {
        svg.transition().duration(initial ? 100 : reason === 'resize' ? 220 : 700).ease(d3.easeCubicOut).call(zoomBehavior.transform, focusTransform)
      }
    }

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3.5]).on('zoom', (event) => {
      let focusX = width() * 0.5
      let focusY = height() * 0.5
      const sourceEvent = event.sourceEvent as MouseEvent | WheelEvent | PointerEvent | undefined
      if (sourceEvent && 'clientX' in sourceEvent && 'clientY' in sourceEvent) {
        const rect = svgEl.getBoundingClientRect()
        focusX = sourceEvent.clientX - rect.left
        focusY = sourceEvent.clientY - rect.top
      }
      viewportRef.current = { ...viewportRef.current, x: event.transform.x, y: event.transform.y, k: event.transform.k, focusX, focusY }
      g.attr('transform', event.transform.toString())
    })

    svg.call(zoomBehavior)
    svg.on('click.bg', () => { setPanelOpen(false); deselect() })
    update(true)
    const timeout = window.setTimeout(() => {
      svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width() / 2, height() / 2).scale(1).translate(-width() / 2, -height() / 2))
    }, 100)
    let resizeFrame = 0
    const onResize = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0
        update(false, 'resize')
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      window.clearTimeout(timeout)
      window.removeEventListener('resize', onResize)
      simulation.stop()
      svg.on('.zoom', null)
      svg.on('click.bg', null)
    }
  }, [referenceNodes, setExpandedIds, setPanelOpen, setSelectedId, setHovered, viewportRef])

  return { graphRef }
}
