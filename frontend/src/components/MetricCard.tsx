import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

export interface MetricCardProps {
  title: string
  value: string
  tooltip: string
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, tooltip }) => (
  <div className="border rounded-md p-3">
    <div className="flex items-center gap-1.5">
      <span className="text-xs opacity-70">{title}</span>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            aria-label={`Info about ${title}`}
          >
            ⓘ
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            collisionPadding={12}
            className="max-w-[250px] px-3 py-2 text-sm text-white bg-[#1f2937] shadow-lg rounded-md z-50"
          >
            {tooltip}
            <Tooltip.Arrow className="fill-[#1f2937]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
)
