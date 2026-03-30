import { atlasData, type AtlasStation } from './atlas'

export function stationMatchesNode(station: AtlasStation, nodeId: string) {
  return (
    station.primaryStyleId === nodeId ||
    station.secondaryStyleIds.includes(nodeId) ||
    station.descriptorIds.includes(nodeId)
  )
}

export function resolveStyleName(styleId: string) {
  return atlasData.nodeMap[styleId]?.name ?? styleId
}

export function getStationStyleLabels(station: AtlasStation) {
  return {
    primary: resolveStyleName(station.primaryStyleId),
    related: station.secondaryStyleIds.map(resolveStyleName),
    descriptors: station.descriptorIds.map(resolveStyleName),
  }
}
