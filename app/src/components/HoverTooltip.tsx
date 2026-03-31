import { memo } from 'react'
import type { HoveredNode } from '../app/types'

type HoverTooltipProps = {
  hovered: HoveredNode | null
}

export const HoverTooltip = memo(function HoverTooltip({ hovered }: HoverTooltipProps) {
  return (
    <div id="tip" className={hovered ? 'show' : ''} style={hovered ? { left: hovered.x, top: hovered.y } : undefined}>
      <div id="tt-name">{hovered?.name}</div>
      <div id="tt-lv">{hovered?.level}</div>
      <div id="tt-st">{hovered ? `${hovered.stationCount} radio transmission${hovered.stationCount !== 1 ? 's' : ''}` : ''}</div>
      <div id="tt-hint">{hovered?.hint}</div>
    </div>
  )
})
