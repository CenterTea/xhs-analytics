import { useMemo } from 'react'
import type { Post, AccountStats } from '../../types'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Badge from '../ui/Badge'
import { getBenchmark, mapCategoryToBenchmark } from '../../utils/benchmark'
import { classifyContent } from '../../utils/content-classifier'

interface FanAnalysisDetailProps {
  posts: Post[]
  stats: AccountStats
}

export default function FanAnalysisDetail({ posts, stats }: FanAnalysisDetailProps) {
  // 动态匹配 benchmark，与 Dashboard 保持一致
  const titles = posts.map(p => p.title).filter(Boolean)
  const classification = classifyContent(titles)
  const firstReal = classification.categories.find(c => c.name !== '其他话题')
  const benchmarkMatch = firstReal ? mapCategoryToBenchmark(firstReal.name) : { categoryId: 'default', categoryName: '通用' }
  const benchmark = getBenchmark(benchmarkMatch.categoryId, 500)

  const followerStability = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
    )
    const growthRates = sorted.map((p) => p.followConversionRate)
    const avg = growthRates.reduce((s, r) => s + r, 0) / growthRates.length
    const variance = growthRates.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / growthRates.length
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0

    if (cv < 0.5) return {
      level: 'stable' as const,
      text: '涨粉转化率（Follow Conversion Rate）的变异系数较低——每篇帖子的涨粉表现比较均衡，内容质量稳定，系统对你的账号有稳定的预期。\n\n说人话：每篇涨粉都差不多，说明你是靠谱的创作者，系统愿意稳定给你推流。',
    }
    if (cv < 1.0) return {
      level: 'moderate' as const,
      text: '涨粉转化率存在一定波动——有的帖子涨粉多有的普通，说明存在"爆款"与"常规款"的差异。\n\n说人话：时好时坏，有时候发一篇涨很多，有时候发完没啥反应。去找找那些涨粉多的帖子做对了什么。',
    }
    return {
      level: 'volatile' as const,
      text: '涨粉转化率波动较大——各篇帖子之间的涨粉效果差距明显，内容表现不够稳定。\n\n说人话：涨粉像坐过山车。建议重点研究那几篇涨粉多的帖子，把它们的成功点复制出来。',
    }
  }, [posts])

  const fanValue = useMemo(() => {
    const interactionScore =
      benchmark.avgInteractionRate > 0 ? stats.avgInteractionRate / benchmark.avgInteractionRate : 0
    const growthScore =
      benchmark.avgFollowConversionRate > 0 ? stats.avgFollowConversionRate / benchmark.avgFollowConversionRate : 0
    // 原始比值：1.0 = 与同类持平 → 映射到 60 分及格
    const rawRatio = interactionScore * 0.5 + growthScore * 0.5
    const score = Math.round(Math.min(100, Math.max(10, rawRatio * 60)))

    if (score >= 85) return {
      score,
      text: '粉丝互动活跃度和涨粉转化率远高于同类均值——粉丝不仅愿意跟你互动，还愿意关注你。这种粉丝商业价值最高，后续变现时接受度和转化率都会更高。\n\n说人话：你的粉丝挺值钱的！不光爱跟你互动，还愿意关注你。这种粉丝以后你推荐什么他们都更可能买单。',
    }
    if (score >= 60) return {
      score,
      text: '粉丝互动和增长表现处于正常水平，与同类账号基本持平。\n\n说人话：正常水平，跟大部分人差不多。保持住就行。',
    }
    return {
      score,
      text: '粉丝互动意愿和关注意愿均低于同类均值——内容可能缺乏足够的"个人吸引力"，粉丝看的是内容而不是你这个人。\n\n说人话：粉丝不太"粘"你。他们可能是为了某篇内容来的，而不是为了你。试着在内容里多一点个人的东西——你的风格、态度、个性。',
    }
  }, [stats, benchmark])

  const contentMatch = useMemo(() => {
    const topicCounts: Record<string, number> = {}
    posts.forEach((p) => {
      p.topics?.forEach((t) => topicCounts[t] = (topicCounts[t] || 0) + 1)
    })
    const totalTopics = Object.values(topicCounts).reduce((s, c) => s + c, 0)
    const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]
    if (!topTopic) return { match: 0, text: '数据还不足，多发几篇后再来看。' }
    const concentration = topTopic[1] / totalTopics
    const match = Math.round(concentration * 100)

    if (match >= 60) return {
      match,
      text: `核心话题「${topTopic[0]}」占比超过 ${match}%，内容-粉丝匹配度高——粉丝很清楚关注你能获得什么。这种"人设清晰"的账号在后续变现时粉丝接受度更高，因为他们就是为了这个方向关注你的。\n\n说人话：你的粉丝很清楚你是做什么的。这很重要——后面你推荐相关产品的时候，粉丝会觉得"这符合你的人设"而不是"你怎么开始打广告了"。`,
    }
    if (match >= 40) return {
      match,
      text: `主要话题「${topTopic[0]}」有一定聚焦度，但仍有部分内容偏离了核心方向——可以进一步收窄定位。`,
    }
    return {
      match,
      text: '内容话题较分散，粉丝对你账号的认知可能比较模糊。如果粉丝不清楚"你到底做什么"，关注的意愿也会打折扣。这就是为什么有些号粉丝不少但变现困难——粉丝不是冲"你这个人"来的。',
    }
  }, [posts])

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">粉丝增长分析</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400">涨粉数量</p>
            <p className={`text-xl font-bold ${stats.netFollowerGrowth >= 0 ? 'text-green-600' : 'text-red-400'}`}>
              {stats.netFollowerGrowth >= 0 ? '+' : ''}{stats.netFollowerGrowth}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">平均涨粉率</p>
            <p className="text-xl font-bold text-gray-900">{(stats.avgFollowConversionRate * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">增长趋势</p>
            <p className={`text-xl font-bold ${
              stats.fanGrowthTrend > 0.05 ? 'text-green-600' : stats.fanGrowthTrend > -0.05 ? 'text-yellow-600' : 'text-red-500'
            }`}>
              {stats.fanGrowthTrend > 0.05 ? '↑ 上升' : stats.fanGrowthTrend > -0.05 ? '→ 平稳' : '↓ 下降'}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">增长稳定性（变异系数 CV）</span>
            <Badge variant={
              followerStability.level === 'stable' ? 'great' : followerStability.level === 'moderate' ? 'normal' : 'poor'
            }>
              {followerStability.level === 'stable' ? '稳定' : followerStability.level === 'moderate' ? '有波动' : '波动大'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 whitespace-pre-line">{followerStability.text}</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">粉丝价值评估</h3>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-3xl font-bold text-gray-900">{fanValue.score}</span>
          <span className="text-gray-400 text-sm mb-1">/ 100</span>
        </div>
        <ProgressBar
          value={fanValue.score}
          max={100}
          color={fanValue.score >= 85 ? 'bg-green-500' : fanValue.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
        />
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{fanValue.text}</p>

        {/* 得分依据 */}
        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 得分计算方式</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>得分 = (互动率比值 × 50% + 涨粉率比值 × 50%) × 60</p>
            <p>• 互动率比值 = 你的平均互动率 ({stats.avgInteractionRate > 0 ? (stats.avgInteractionRate * 100).toFixed(1) : '0'}%) ÷ 同类均值 ({(benchmark.avgInteractionRate * 100).toFixed(1)}%) = {(benchmark.avgInteractionRate > 0 ? stats.avgInteractionRate / benchmark.avgInteractionRate : 0).toFixed(2)}</p>
            <p>• 涨粉率比值 = 你的平均涨粉率 ({stats.avgFollowConversionRate > 0 ? (stats.avgFollowConversionRate * 100).toFixed(2) : '0'}%) ÷ 同类均值 ({(benchmark.avgFollowConversionRate * 100).toFixed(2)}%) = {(benchmark.avgFollowConversionRate > 0 ? stats.avgFollowConversionRate / benchmark.avgFollowConversionRate : 0).toFixed(2)}</p>
            <p className="text-gray-400 mt-1">60分为及格线（与同类持平），≥85分优异，{'<'}60分需改进</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">粉丝-内容匹配度</h3>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-3xl font-bold text-gray-900">{contentMatch.match}</span>
          <span className="text-gray-400 text-sm mb-1">/ 100</span>
        </div>
        <ProgressBar
          value={contentMatch.match}
          max={100}
          color={contentMatch.match >= 60 ? 'bg-green-500' : contentMatch.match >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
        />
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{contentMatch.text}</p>

        {/* 得分依据 */}
        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 得分计算方式</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>匹配度 = 核心话题帖子数 ÷ 总帖子数 × 100</p>
            <p>• 识别你所有帖子中出现频率最高的话题作为核心话题</p>
            <p>• 计算包含该话题的帖子占比</p>
            <p className="text-gray-400 mt-1">60分为及格线：≥60%（高度聚焦），40-60%（有一定聚焦），{'<'}40%（话题分散）</p>
          </div>
        </div>

        <div className="mt-3 bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>为什么这个指标重要？</strong> 匹配度高 = 吸引的粉丝与内容定位一致 = 变现时粉丝不会觉得"你怎么变了"。匹配度低可能出现"虚假繁荣"——粉丝数看着多但推荐/带货时转化率很低，因为粉丝根本不是冲着你这个方向来的。
          </p>
        </div>
      </Card>
    </div>
  )
}
