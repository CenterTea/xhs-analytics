interface MetricCardProps {
  label: string
  value: number | string
  subtitle?: string
  avgPerPost?: string
  percentile?: string
}

export default function MetricCard({ label, value, subtitle, avgPerPost, percentile }: MetricCardProps) {
  const displayValue =
    typeof value === 'number'
      ? value >= 10000
        ? `${(value / 10000).toFixed(1)}万`
        : value >= 1000
        ? `${(value / 1000).toFixed(1)}k`
        : value.toLocaleString()
      : value

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {avgPerPost && (
          <span className="text-xs text-gray-400">平均 {avgPerPost}/篇</span>
        )}
        {percentile && (
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {percentile}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
