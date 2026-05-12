import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface TrafficSourceProps {
  trafficSources: {
    recommend: number
    search: number
    following: number
    profile: number
    other: number
  }
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6b7280']
const LABELS: Record<string, string> = {
  recommend: '推荐流',
  search: '搜索',
  following: '关注',
  profile: '个人主页',
  other: '其他',
}

export default function TrafficSource({ trafficSources }: TrafficSourceProps) {
  const data = Object.entries(trafficSources)
    .filter(([, v]) => v > 0)
    .map(([key, value], i) => ({
      name: LABELS[key] ?? key,
      value,
      color: COLORS[i],
    }))

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return <p className="text-gray-400 text-sm">暂无流量来源数据</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val) =>
                `${Number(val).toLocaleString()}（${((Number(val) / total) * 100).toFixed(1)}%）`
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-sm text-gray-700">{d.name}</span>
            </div>
            <span className="text-sm text-gray-600">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
