import type { Post } from '../../types'

interface FunnelChartProps {
  post: Post
}

export default function FunnelChart({ post }: FunnelChartProps) {
  const steps = [
    { label: '曝光量', value: post.impressions, color: 'bg-amber-400', rate: '-' },
    {
      label: '阅读量',
      value: post.views,
      color: 'bg-orange-400',
      rate: `${(post.coverCTR * 100).toFixed(1)}% 点击率`,
    },
    {
      label: '互动量',
      value: post.likes + post.saves + post.comments + post.shares,
      color: 'bg-red-400',
      rate: `${(post.interactionRate * 100).toFixed(1)}% 互动率`,
    },
    {
      label: '涨粉',
      value: post.newFollowers,
      color: 'bg-rose-500',
      rate: `${(post.followConversionRate * 100).toFixed(2)}% 转化率`,
    },
  ]

  const maxVal = Math.max(...steps.map((s) => s.value), 1)

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const widthPct = (step.value / maxVal) * 100
        const displayVal =
          step.value >= 10000
            ? `${(step.value / 10000).toFixed(1)}万`
            : step.value.toLocaleString()

        return (
          <div key={step.label} className="flex items-center gap-4">
            <div className="w-20 text-right">
              <p className="text-sm font-medium text-gray-700">{step.label}</p>
              <p className="text-xs text-gray-400">{step.rate}</p>
            </div>
            <div className="flex-1 relative">
              <div
                className={`h-10 ${step.color} rounded-r-lg flex items-center justify-end pr-3 min-w-[60px] transition-all duration-700`}
                style={{ width: `${Math.max(widthPct, 3)}%` }}
              >
                <span className="text-white text-sm font-semibold">{displayVal}</span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="w-6 text-center">
                <span className="text-gray-400 text-sm">↓</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
