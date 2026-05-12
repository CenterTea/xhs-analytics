interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercent?: boolean
  color?: string
}

export default function ProgressBar({
  value,
  max,
  label,
  showPercent = true,
  color = 'bg-red-500',
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          {showPercent && <span>{pct.toFixed(1)}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
