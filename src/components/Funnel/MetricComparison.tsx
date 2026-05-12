import type { Post } from '../../types'
import { getBenchmark } from '../../utils/benchmark'
import Badge from '../ui/Badge'

interface MetricComparisonProps {
  post: Post
}

export default function MetricComparison({ post }: MetricComparisonProps) {
  const benchmark = getBenchmark('default', 500)

  const metrics: {
    label: string
    absolute: string
    rate: number
    rateLabel: string
    benchmarkRate: number
  }[] = [
    {
      label: '点赞',
      absolute: post.likes.toLocaleString(),
      rate: post.likeRate,
      rateLabel: '点赞率',
      benchmarkRate: benchmark.avgLikeRate,
    },
    {
      label: '收藏',
      absolute: post.saves.toLocaleString(),
      rate: post.saveRate,
      rateLabel: '收藏率',
      benchmarkRate: benchmark.avgSaveRate,
    },
    {
      label: '评论',
      absolute: post.comments.toLocaleString(),
      rate: post.commentRate,
      rateLabel: '评论率',
      benchmarkRate: benchmark.avgCommentRate,
    },
    {
      label: '转发',
      absolute: post.shares.toLocaleString(),
      rate: post.shareRate,
      rateLabel: '转发率',
      benchmarkRate: benchmark.avgShareRate,
    },
    {
      label: '封面点击',
      absolute: '-',
      rate: post.coverCTR,
      rateLabel: '点击率',
      benchmarkRate: benchmark.avgCoverCTR,
    },
    {
      label: '完播/读完',
      absolute: '-',
      rate: post.completionRate ?? 0,
      rateLabel: '完播率',
      benchmarkRate: benchmark.avgCompletionRate,
    },
    {
      label: '涨粉',
      absolute: post.newFollowers.toLocaleString(),
      rate: post.followConversionRate,
      rateLabel: '涨粉率',
      benchmarkRate: benchmark.avgFollowConversionRate,
    },
    {
      label: '有效评论',
      absolute: `${post.effectiveComments}/${post.comments}`,
      rate: post.effectiveCommentRate,
      rateLabel: '有效评论率',
      benchmarkRate: benchmark.avgEffectiveCommentRate,
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-100">
            <th className="pb-2 font-medium">指标</th>
            <th className="pb-2 font-medium">绝对值</th>
            <th className="pb-2 font-medium">你的比率</th>
            <th className="pb-2 font-medium">同类目均值</th>
            <th className="pb-2 font-medium">差值</th>
            <th className="pb-2 font-medium">评级</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const diff =
              m.benchmarkRate > 0
                ? (m.rate - m.benchmarkRate) / m.benchmarkRate
                : 0
            const rating: 'great' | 'normal' | 'poor' =
              diff > 0.5 ? 'great' : diff >= -0.3 ? 'normal' : 'poor'

            return (
              <tr key={m.label} className="border-b border-gray-50">
                <td className="py-3 font-medium text-gray-800">{m.label}</td>
                <td className="py-3 text-gray-600">{m.absolute}</td>
                <td className="py-3 text-gray-900 font-medium">
                  {(m.rate * 100).toFixed(2)}%
                </td>
                <td className="py-3 text-gray-500">
                  {(m.benchmarkRate * 100).toFixed(2)}%
                </td>
                <td
                  className={`py-3 font-medium ${
                    diff >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {diff >= 0 ? '+' : ''}
                  {(diff * 100).toFixed(1)}%
                </td>
                <td className="py-3">
                  <Badge variant={rating}>
                    {rating === 'great' ? '优秀' : rating === 'normal' ? '一般' : '需改进'}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
