'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface WeekBucket {
  week: string
  count: number
}

interface SessionChartProps {
  data: WeekBucket[]
}

const SESSION_COLOR = '#f97316'

export function SessionChart({ data }: SessionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">
        No sessions logged yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }}
          cursor={{ fill: '#f4f4f5' }}
          formatter={(value) => [`${value} session${value !== 1 ? 's' : ''}`, '']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? SESSION_COLOR : '#e4e4e7'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
