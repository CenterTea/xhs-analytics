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

  const followerStability = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
    )
    const growthRates = sorted.map((p) => p.followConversionRate)
    const avg = growthRates.reduce((s, r) => s + r, 0) / growthRates.length
    const variance =
      growthRates.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / growthRates.length
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0

    if (cv < 0.5) return { level: 'stable' as const, text: '每篇涨粉都差不多，说明你的内容质量很稳定。这是好事——系统知道你是靠谱的创作者。' }
    if (cv < 1.0) return { level: 'moderate' as const, text: '有些帖子涨粉好有些一般，有"爆款"和"普通款"的区别。去找找那些涨粉多的帖子做对了什么。' }
    return { level: 'volatile' as const, text: '涨粉不太稳定，有时候很猛有时候基本不涨。建议重点研究那几篇涨粉多的帖子，复制它们的成功点。' }
  }, [posts])

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

    if (score > 120) return { score: Math.min(100, score), text: '你的粉丝质量很不错！不光愿意跟你互动，还会主动关注你。这种粉丝最值钱——以后你推荐什么他们都更可能买单。' }
    if (score > 80) return { score, text: '粉丝质量在正常水平，跟同类账号差不多。保持住就行，慢慢来。' }
    return { score, text: '粉丝的互动意愿和关注意愿都比同类型账号低一些。可能你的内容缺少一点"个人魅力"——让粉丝不只是看内容，而是喜欢你这个人。' }
  }, [stats, benchmark])

  const contentMatch = useMemo(() => {
    const topicCounts: Record<string, number> = {}
    posts.forEach((p) => {
      p.topics?.forEach((t) => topicCounts[t] = (topicCounts[t] || 0) + 1)
    })
    const totalTopics = Object.values(topicCounts).reduce((s, c) => s + c, 0)
    const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]

    if (!topTopic) return { match: 0, text: '数据还不太够，多发几篇再来看。' }

    const concentration = topTopic[1] / totalTopics
    const match = Math.round(concentration * 100)

    if (match > 60) return { match, text: `你的内容基本都围绕「${topTopic[0]}」这个方向，粉丝很清楚关注你能得到什么。这种"人设清晰"的账号，后面变现的时候粉丝接受度更高——因为他们就是为了这个关注你的。` }
    if (match > 35) return { match, text: `大部分内容在「${topTopic[0]}」方向，但也有一些偏离。可以再收一收，让粉丝对你的印象更聚焦。` }
    return { match, text: '你发的内容话题有点散。粉丝可能不太清楚"你到底是做什么的"。如果粉丝对你的印象是模糊的，那他们关注的欲望也会模糊。' }
  }, [posts])

  return (
    <div className="space-y-6">
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
            <p className="text-xs text-gray-400">流失（估算）</p>
            <p className="text-xl font-bold text-red-400">
              -{fanStickiness.newVsLostFollowers.lost}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">增长趋势</p>
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
                ? '↑ 向上走'
                : stats.fanGrowthTrend > -0.05
                ? '→ 平稳'
                : '↓ 往下掉'}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">增长稳不稳定？</span>
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
                ? '挺稳定'
                : followerStability.level === 'moderate'
                ? '有时波动'
                : '不太稳'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">{followerStability.text}</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">你的粉丝值不值钱？</h3>
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

      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">粉丝眼里的你，够不够清晰？</h3>
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
            <strong>为什么这个重要？</strong>如果粉丝对你的印象是模糊的，那他们关注的意愿也会模糊。清晰=信任=后面你推荐东西他们愿意买。模糊="这人到底做啥的？"然后就取关了。这就是为什么有些号粉丝挺多但赚不到钱——粉丝不是冲"你这个人"来的。
          </p>
        </div>
      </Card>
    </div>
  )
}
