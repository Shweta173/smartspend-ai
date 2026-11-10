import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts'
import { useState } from 'react'
import type { CategoryBreakdown } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Props {
  data: CategoryBreakdown[]
  height?: number
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-semibold">
        {payload.category_name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
        {formatCurrency(value)}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" dominantBaseline="middle" className="fill-primary text-xs font-medium">
        {formatPercent(percent * 100)}
      </text>
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
      <Sector
        cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 12}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
    </g>
  )
}

export function CategoryPieChart({ data, height = 220 }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
        No spending data for this period
      </div>
    )
  }

  return (
    <div className="flex gap-6 items-center">
      <div className="shrink-0" style={{ width: 180, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={55} outerRadius={80}
              dataKey="total"
              nameKey="category_name"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.category_color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        {data.slice(0, 6).map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 cursor-pointer group"
            onMouseEnter={() => setActiveIndex(i)}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.category_color }} />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate flex-1">
              {item.category_name}
            </span>
            <span className="text-xs font-medium tabular-nums text-foreground whitespace-nowrap">
              {formatPercent(item.percent, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
