import { useMemo } from 'react'
import type { Post, AccountStats } from '../../types'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Badge from '../ui/Badge'
import { getBenchmark } from '../../utils/benchmark'

interface FanAnalysisDetailProps {
  posts: Post[]
  stats: AccountStats
  fanStickiness: {
    score: number
    fanEngagementRate: number
    newVsLostFollowers: { gained: number; lost: number }
    assessment: string
    suggestion: string
  }
}

export default function FanAnalysisDetail({ posts, stats, fanStickiness }: FanAnalysisDetailProps) {
  const benchmark = getBenchmark('default', 500)

  // 粉丝增长稳定性
  const followerStability = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
    )
    const growthRates = sorted.map((p) => p.followConversionRate)
    const avg = growthRates.reduce((s, r) => s + r, 0) / growthRates.length
    const variance =
      growthRates.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / growthRates.length
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0

    if (cv < 0.5) return { level: 'stable' as const, text: '粉丝增长稳定，每篇帖子表现均衡' }
    if (cv < 1.0) return { level: 'moderate' as const, text: '粉丝增长有波动，存在爆款和普通帖子的差异' }
    return { level: 'volatile' as const, text: '粉丝增长波动较大，建议寻找爆款帖子的共性并复制' }
  }, [posts])

  // 粉丝价值评估
  const fanValue = useMemo(() => {
    const interactionScore =
      benchmark.avgInteractionRate > 0
        ? stats.avgInteractionRate / benchmark.avgInteractionRate
        : 0
    const growthScore =
      benchmark.avgFollowConversionRate > 0
        ? stats.avgFollowConversionRate / benchmark.avgFollowConversionRate
        : 0

    const score = Math.round((interactionScore * 0.5 + growthScore * 0.5) * 100)

    if (score > 120) return { score: Math.min(100, score), text: '粉丝互动活跃度和转化率均高于同类均值，粉丝质量高' }
    if (score > 80) return { score, text: '粉丝互动和增长表现正常，与同类账号持平' }
    return { score, text: '粉丝互动或增长低于同类均值，需要加强内容与粉丝的连接' }
  }, [stats, benchmark])

  // 粉丝画像与内容匹配度
  const contentMatch = useMemo(() => {
    const topicCounts: Record<string, number> = {}
    posts.forEach((p) => {
      p.topics?.forEach((t) => topicCounts[t] = (topicCounts[t] || 0) + 1)
    })
    const totalTopics = Object.values(topicCounts).reduce((s, c) => s + c, 0)
    const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]

    if (!topTopic) return { match: 0, text: '暂无足够数据判断' }

    const concentration = topTopic[1] / totalTopics
    const match = Math.round(concentration * 100)

    if (match > 60) return { match, text: `核心话题「${topTopic[0]}」占比高，粉丝知道关注你能获得什么——定位清晰` }
    if (match > 35) return { match, text: `主要话题「${topTopic[0]}」有一定聚焦度，但仍有分散——可进一步精简` }
    return { match, text: '内容话题较分散，粉丝可能不清楚你的核心定位' }
  }, [posts])

  return (
    <div className="space-y-6">
      {/* 粉丝增长趋势 */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">粉丝增长分析</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400">净增粉丝</p>
            <p className="text-xl font-bold text-green-600">
              +{stats.netFollowerGrowth}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">新增</p>
            <p className="text-xl font-bold text-gray-900">
              +{fanStickiness.newVsLostFollowers.gained}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">流失（估）</p>
            <p className="text-xl font-bold text-red-400">
              -{fanStickiness.newVsLostFollowers.lost}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">粉丝增长趋势</p>
            <p
              className={`text-xl font-bold ${
                stats.fanGrowthTrend > 0.05
                  ? 'text-green-600'
                  : stats.fanGrowthTrend > -0.05
                  ? 'text-yellow-600'
                  : 'text-red-500'
              }`}
            >
              {stats.fanGrowthTrend > 0.05
                ? '↑ 上升'
                : stats.fanGrowthTrend > -0.05
                ? '→ 平缓'
                : '↓ 下降'}
            </p>
          </div>
        </div>

        {/* 增长稳定性 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">增长稳定性</span>
            <Badge
              variant={
                followerStability.level === 'stable'
                  ? 'great'
                  : followerStability.level === 'moderate'
                  ? 'normal'
                  : 'poor'
              }
            >
              {followerStability.level === 'stable'
                ? '稳定'
                : followerStability.level === 'moderate'
                ? '有波动'
                : '波动大'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">{followerStability.text}</p>
        </div>
      </Card>

      {/* 粉丝价值评估 */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">粉丝价值评估</h3>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-3xl font-bold text-gray-900">{fanValue.score}</span>
          <span className="text-gray-400 text-sm mb-1">/ 100</span>
        </div>
        <ProgressBar
          value={fanValue.score}
          max={100}
          color={
            fanValue.score > 70
              ? 'bg-green-500'
              : fanValue.score > 40
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }
        />
        <p className="text-sm text-gray-600 mt-2">{fanValue.text}</p>
      </Card>

      {/* 内容匹配度 */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">粉丝-内容匹配度</h3>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-3xl font-bold text-gray-900">{contentMatch.match}</span>
          <span className="text-gray-400 text-sm mb-1">/ 100</span>
        </div>
        <ProgressBar
          value={contentMatch.match}
          max={100}
          color={
            contentMatch.match > 60
              ? 'bg-green-500'
              : contentMatch.match > 30
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }
        />
        <p className="text-sm text-gray-600 mt-2">{contentMatch.text}</p>
        <div className="mt-3 bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            内容-粉丝匹配度高 = 吸引的粉丝与你的内容定位一致，后续变现时粉丝的接受度更高。匹配度低可能导致"虚假繁荣"——粉丝多但变现困难。
          </p>
        </div>
      </Card>
    </div>
  )
}
