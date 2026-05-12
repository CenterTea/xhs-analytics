import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ViewingPeriodsChartProps {
  viewingPeriods?: number[]
}

export default function ViewingPeriodsChart({ viewingPeriods }: ViewingPeriodsChartProps) {
  if (!viewingPeriods || viewingPeriods.length === 0) {
    return <p className="text-gray-400 text-sm">暂无观看时段数据</p>
  }

  const data = viewingPeriods.map((count, hour) => ({
    hour: `${hour}:00`,
    count,
    peak: count === Math.max(...viewingPeriods),
  }))

  const maxCount = Math.max(...viewingPeriods, 1)

  // 找出高峰时段
  const peakHours = viewingPeriods
    .map((count, hour) => ({ hour, count }))
    .filter((h) => h.count >= maxCount * 0.7)
    .sort((a, b) => b.count - a.count)

  const formatPeakSummary = () => {
    if (peakHours.length === 0) return ''
    const sorted = peakHours.sort((a, b) => a.hour - b.hour)
    return sorted
      .map((p) => `${p.hour}:00-${p.hour + 1}:00（${p.count}次）`)
      .join('、')
  }

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10 }}
              interval={2}
              stroke="#9ca3af"
            />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" hide />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(val) => [`${val} 次观看`, '观看量']}
              labelFormatter={(label) => `时段：${label}`}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.peak ? '#ef4444' : '#fca5a5'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {peakHours.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">观看高峰时段</p>
          <p className="text-xs text-blue-600">{formatPeakSummary()}</p>
          <p className="text-xs text-blue-500 mt-1">
            建议在这些时段前后发布新内容，以获得更好的初始流量。
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        横轴为一天 24 小时，纵轴为该时段的观看次数。红色柱为流量高峰。
      </p>
    </div>
  )
}
