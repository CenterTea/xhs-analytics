import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Post } from '../../types'

interface TrendChartProps {
  posts: Post[]
}

export default function TrendChart({ posts }: TrendChartProps) {
  const data = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) =>
        new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
    )
    return sorted.map((p) => ({
      date: p.publishDate.slice(5), // MM-DD
      曝光量: p.impressions,
      阅读量: p.views,
      互动量: p.likes + p.saves + p.comments + p.shares,
      涨粉: p.newFollowers,
    }))
  }, [posts])

  if (data.length === 0) {
    return <p className="text-gray-400 text-sm">暂无数据</p>
  }

  return (
    <div className="h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 13,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="曝光量"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="阅读量"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="互动量"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="涨粉"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
