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

  // 所有条形长度一致（100%），重点展示转化率数据而非绝对数值差异

  return (
    <div className="space-y-4">
      {/* 术语解释 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">📖 漏斗各层含义</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          {steps.map((step) => (
            <div key={step.label} className="flex items-start gap-1.5">
              <span className={`w-2 h-2 rounded-full mt-0.5 ${step.color}`} />
              <span>
                <span className="font-medium">{step.label}:</span> {step.explanation}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 漏斗图 - 各层长度一致，重点展示转化率 */}
      <div className="space-y-3">
        {steps.map((step, i) => {
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
                {/* 条形长度一致（100%） */}
                <div className={`h-10 ${step.color} rounded-lg flex items-center justify-between px-3 transition-all duration-700`}>
                  <span className="text-white/80 text-xs">{step.label}</span>
                  <span className="text-white text-sm font-semibold whitespace-nowrap">
                    {displayVal}
                  </span>
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

      {/* 专业术语解释 */}
      <div className="mt-6 bg-amber-50 rounded-lg p-4 border border-amber-100">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">💡 这些术语是什么意思？</h4>
        <dl className="space-y-2 text-xs text-amber-800">
          <div>
            <dt className="font-medium">封面点击率（CTR）</dt>
            <dd>看到封面的人里，有多少人点击进来阅读。计算公式：阅读量 ÷ 曝光量。这是最重要的第一层筛选。</dd>
          </div>
          <div>
            <dt className="font-medium">互动率</dt>
            <dd>看完内容后，有多少人愿意互动（点赞+收藏+评论+分享）。计算公式：总互动数 ÷ 阅读量。反映内容质量。</dd>
          </div>
          <div>
            <dt className="font-medium">涨粉率</dt>
            <dd>看完内容后关注你的比例。计算公式：新增粉丝 ÷ 阅读量。反映内容的长期价值。</dd>
          </div>
          {post.avgWatchTime && (
            <div>
              <dt className="font-medium">人均观看时长</dt>
              <dd>每个人平均看了多久（秒）。时长越长，说明内容越能留住人。</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
