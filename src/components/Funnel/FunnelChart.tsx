import type { Post } from '../../types'
import { getBenchmark } from '../../utils/benchmark'

interface FunnelChartProps {
  post: Post
}

// 莫兰迪色系
const morandi = {
  top: 'bg-[#C4A882]',
  upper: 'bg-[#B8A9C9]',
  mid: 'bg-[#9BA4B5]',
  bottom: 'bg-[#A8A4A0]',
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
      explanation: '你的内容被推荐系统推送给多少人',
    },
    {
      label: '阅读量',
      value: post.views,
      color: morandi.upper,
      rate: `封面点击率 ${(post.coverCTR * 100).toFixed(1)}%`,
      benchmarkRate: `均值 ${(benchmark.avgCoverCTR * 100).toFixed(1)}%`,
      explanation: '看到你的封面后，有多少人被吸引点击进来',
    },
    {
      label: '互动量',
      value: post.likes + post.saves + post.comments + post.shares,
      color: morandi.mid,
      rate: `互动率 ${(post.interactionRate * 100).toFixed(1)}%`,
      benchmarkRate: `均值 ${(benchmark.avgInteractionRate * 100).toFixed(1)}%`,
      explanation: '看完内容后，有多少人愿意点赞/收藏/评论/分享',
    },
    {
      label: '涨粉',
      value: post.newFollowers,
      color: morandi.bottom,
      rate: `涨粉率 ${(post.followConversionRate * 100).toFixed(2)}%`,
      benchmarkRate: `均值 ${(benchmark.avgFollowConversionRate * 100).toFixed(2)}%`,
      explanation: '觉得内容有价值，关注你成为粉丝的比例',
    },
  ]

  // 以曝光量为基准（100%），其他层按比例显示
  const baseValue = post.impressions || 1
  const getRelativeWidth = (value: number) => {
    const pct = (value / baseValue) * 100
    // 最小显示3%，不然太小的数值看不见
    return Math.max(pct, 3)
  }

  return (
    <div className="space-y-4">
      {/* 漏斗图 - 以曝光量为100%基准 */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const displayVal =
            step.value >= 10000
              ? `${(step.value / 10000).toFixed(1)}万`
              : step.value.toLocaleString()
          const barWidth = getRelativeWidth(step.value)

          return (
            <div key={step.label} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-right">
                <p className="text-sm font-medium text-gray-700">{step.label}</p>
              </div>
              <div className="flex-1 relative">
                {/* 背景条（100%基准） */}
                <div className="h-10 bg-gray-100 rounded-lg relative overflow-hidden">
                  {/* 实际数据条 - 相对于曝光量的比例 */}
                  <div
                    className={`absolute left-0 top-0 h-full ${step.color} flex items-center justify-end pr-3 transition-all duration-700`}
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-white text-sm font-semibold whitespace-nowrap">
                      {displayVal}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-28 shrink-0 text-left">
                <p className="text-xs text-gray-900 font-medium">{step.rate}</p>
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

    </div>
  )
}
