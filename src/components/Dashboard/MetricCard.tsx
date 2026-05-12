interface MetricCardProps {
  label: string
  value: number | string
  subtitle?: string
}

export default function MetricCard({ label, value, subtitle }: MetricCardProps) {
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
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
