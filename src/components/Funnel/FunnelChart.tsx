import type { Post } from '../../types'
import { getBenchmark } from '../../utils/benchmark'

interface FunnelChartProps {
  post: Post
}

// 莫兰迪色系
const morandi = {
  top: 'bg-[#C4A882]',      // 暖灰褐
  upper: 'bg-[#B8A9C9]',    // 灰紫
  mid: 'bg-[#9BA4B5]',      // 灰蓝
  bottom: 'bg-[#A8A4A0]',   // 暖灰
}

export default function FunnelChart({ post }: FunnelChartProps) {
  const benchmark = getBenchmark('default', 500)

  const steps = [
    {
      label: '曝光量',
      value: post.impressions,
      color: morandi.top,
      rate: '-',
      benchmarkRate: '-',
    },
    {
      label: '阅读量',
      value: post.views,
      color: morandi.upper,
      rate: `封面点击率 ${(post.coverCTR * 100).toFixed(1)}%`,
      benchmarkRate: `均值 ${(benchmark.avgCoverCTR * 100).toFixed(1)}%`,
    },
    {
      label: '互动量',
      value: post.likes + post.saves + post.comments + post.shares,
      color: morandi.mid,
      rate: `互动率 ${(post.interactionRate * 100).toFixed(1)}%`,
      benchmarkRate: `均值 ${(benchmark.avgInteractionRate * 100).toFixed(1)}%`,
    },
    {
      label: '涨粉',
      value: post.newFollowers,
      color: morandi.bottom,
      rate: `涨粉率 ${(post.followConversionRate * 100).toFixed(2)}%`,
      benchmarkRate: `均值 ${(benchmark.avgFollowConversionRate * 100).toFixed(2)}%`,
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
          <div key={step.label} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-right">
              <p className="text-sm font-medium text-gray-700">{step.label}</p>
            </div>
            <div className="flex-1 relative">
              <div
                className={`h-10 ${step.color} rounded-r-lg flex items-center justify-end pr-3 min-w-[60px] transition-all duration-700`}
                style={{ width: `${Math.max(widthPct, 3)}%` }}
              >
                <span className="text-white text-sm font-semibold">{displayVal}</span>
              </div>
            </div>
            <div className="w-28 shrink-0 text-left">
              <p className="text-xs text-gray-500">{step.rate}</p>
              <p className="text-xs text-gray-400">{step.benchmarkRate}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="w-5 text-center shrink-0">
                <span className="text-gray-300 text-xs">↓</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
