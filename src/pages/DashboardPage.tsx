import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import MetricCard from '../components/Dashboard/MetricCard'
import TrendChart from '../components/Dashboard/TrendChart'
import PostRanking from '../components/Dashboard/PostRanking'
import FunnelChart from '../components/Funnel/FunnelChart'
import FunnelLayer from '../components/Funnel/FunnelLayer'
import InteractionAnalysis from '../components/Funnel/InteractionAnalysis'
import { Link } from 'react-router-dom'
import { getBenchmark, mapCategoryToBenchmark } from '../utils/benchmark'
import { getContentClassification } from '../utils/account-analyzer'
import type { Post } from '../types'

// 计算总量数据的百分位（基于平均单帖数据推算）
function calculateTotalPercentile(totalValue: number, postCount: number, benchmarkAvg: number): string {
  if (postCount === 0 || benchmarkAvg <= 0) return ''
  const avgPerPost = totalValue / postCount
  const ratio = avgPerPost / benchmarkAvg
  if (ratio >= 1.5) return '超过 80% 同类账号'
  if (ratio >= 1.2) return '超过 60% 同类账号'
  if (ratio >= 0.8) return '超过 40% 同类账号'
  if (ratio >= 0.5) return '超过 20% 同类账号'
  return '需继续提升'
}

export default function DashboardPage() {
  const { posts, accountStats, getDiagnosis } = useData()
  const navigate = useNavigate()
  const classification = getContentClassification(posts)
  const firstReal = classification.categories.find(c => c.name !== '其他话题')
  const benchmarkMatch = firstReal ? mapCategoryToBenchmark(firstReal.name) : { categoryId: 'default', categoryName: '通用' }
  const benchmark = getBenchmark(benchmarkMatch.categoryId, 500)
  const n = posts.length
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  if (!posts.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">还没有数据，请先上传</p>
        <button
          onClick={() => navigate('/')}
          className="text-red-500 hover:text-red-600 font-medium"
        >
          返回首页上传数据
        </button>
      </div>
    )
  }

  const diagnosis = selectedPost ? getDiagnosis?.(selectedPost) : null

  const avgImpressions = Math.round(posts.reduce((s, p) => s + p.impressions, 0) / n)
  const avgViews = Math.round(posts.reduce((s, p) => s + p.views, 0) / n)
  const avgLikes = Math.round(posts.reduce((s, p) => s + p.likes, 0) / n)
  const avgSaves = Math.round(posts.reduce((s, p) => s + p.saves, 0) / n)
  const avgComments = Math.round(posts.reduce((s, p) => s + p.comments, 0) / n)
  const avgShares = Math.round(posts.reduce((s, p) => s + p.shares, 0) / n)
  const avgInteractions = Math.round(
    posts.reduce((s, p) => s + p.likes + p.saves + p.comments + p.shares, 0) / n
  )
  const avgFollowersRaw = posts.reduce((s, p) => s + p.newFollowers, 0) / n
  // 涨粉平均数小于1时保留1位小数，否则取整
  const avgFollowers = avgFollowersRaw < 1 && avgFollowersRaw > 0
    ? avgFollowersRaw.toFixed(1)
    : Math.round(avgFollowersRaw).toString()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
        <Link
          to="/account-analysis"
          className="text-sm text-red-500 hover:text-red-600 font-medium"
        >
          查看账号深度分析 →
        </Link>
      </div>

      {/* 核心指标卡片 */}
      {accountStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="总曝光"
            value={accountStats.totalImpressions}
            avgPerPost={avgImpressions.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalImpressions, n, benchmark.avgCoverCTR * 10000)}
          />
          <MetricCard
            label="总阅读"
            value={accountStats.totalViews}
            avgPerPost={avgViews.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalViews, n, benchmark.avgCoverCTR * 5000)}
          />
          <MetricCard
            label="总点赞"
            value={accountStats.totalLikes}
            avgPerPost={avgLikes.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalLikes, n, benchmark.avgLikeRate * 1000)}
          />
          <MetricCard
            label="总收藏"
            value={accountStats.totalSaves}
            avgPerPost={avgSaves.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalSaves, n, benchmark.avgSaveRate * 500)}
          />
          <MetricCard
            label="总评论"
            value={accountStats.totalComments}
            avgPerPost={avgComments.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalComments, n, benchmark.avgCommentRate * 200)}
          />
          <MetricCard
            label="总分享"
            value={accountStats.totalShares}
            avgPerPost={avgShares.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalShares, n, benchmark.avgShareRate * 100)}
          />
          <MetricCard
            label="总互动"
            value={accountStats.totalInteractions}
            avgPerPost={avgInteractions.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalInteractions, n, benchmark.avgInteractionRate * 1500)}
          />
          <MetricCard
            label="涨粉数量"
            value={accountStats.netFollowerGrowth}
            avgPerPost={avgFollowers.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.netFollowerGrowth, n, benchmark.avgFollowConversionRate * 100)}
          />
        </div>
      )}

      {/* 同类账号数据说明 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="text-xl">📊</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">关于「同类账号」对比数据</h3>

            {/* 当前匹配的基准类型 */}
            <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">当前匹配</span>
                <span className="text-sm font-medium text-gray-900">{benchmarkMatch.categoryName} · {benchmark.followerRange}粉丝</span>
                {firstReal && firstReal.name !== '其他话题' && (
                  <span className="text-xs text-gray-400">
                    （自动识别: {firstReal.name}{classification.categories[0]?.name === '其他话题' ? '' : ` · ${Math.round(firstReal.percentage)}%`}）
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                系统自动分析了你 {posts.length} 条帖子的标题，识别出主要内容类型为「{benchmarkMatch.categoryName}」（{firstReal ? `占比 ${Math.round(firstReal.percentage)}%` : '未识别到具体领域'}），并匹配该类型的基准数据进行对比。
              </p>
            </div>

            {/* 数据来源说明 */}
            <div className="space-y-2 text-sm text-blue-800">
              <details className="group">
                <summary className="cursor-pointer hover:text-blue-900 font-medium flex items-center gap-1">
                  <span className="transition-transform group-open:rotate-90">▶</span>
                  数据来源是什么？
                </summary>
                <div className="mt-2 pl-4 text-xs text-blue-700 space-y-1">
                  <p>• 基于小红书官方发布的行业报告和公开数据</p>
                  <p>• 参考第三方数据分析平台（如新红、千瓜）的行业均值</p>
                  <p>• 结合创作者社群分享的经验值</p>
                  <p>• 按粉丝量级分层：新手期(0-1000)、成长期(1000-1万)、稳定期(1万+)</p>
                  <p className="text-amber-600 mt-1">⚠️ 注意：这些是行业参考值，不是实时的小红书官方数据</p>
                </div>
              </details>

              <details className="group">
                <summary className="cursor-pointer hover:text-blue-900 font-medium flex items-center gap-1">
                  <span className="transition-transform group-open:rotate-90">▶</span>
                  如何定义「同类账号」？
                </summary>
                <div className="mt-2 pl-4 text-xs text-blue-700 space-y-1">
                  <p><strong>内容类型：</strong>目前支持通用、美妆、穿搭、美食、旅行、生活/Vlog、知识/干货等分类</p>
                  <p><strong>粉丝量级：</strong>不同粉丝阶段的数据标准差异很大，新号和万粉账号不能直接对比</p>
                  <p><strong>建议：</strong>重点对比同粉丝量级的账号，不要拿新号去对比大V的数据</p>
                </div>
              </details>

              <details className="group">
                <summary className="cursor-pointer hover:text-blue-900 font-medium flex items-center gap-1">
                  <span className="transition-transform group-open:rotate-90">▶</span>
                  查看当前使用的基准值
                </summary>
                <div className="mt-2 pl-4 text-xs text-blue-700 bg-white/70 rounded p-2 space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <span>封面点击率: {(benchmark.avgCoverCTR * 100).toFixed(1)}%</span>
                    <span>互动率: {(benchmark.avgInteractionRate * 100).toFixed(1)}%</span>
                    <span>点赞率: {(benchmark.avgLikeRate * 100).toFixed(1)}%</span>
                    <span>收藏率: {(benchmark.avgSaveRate * 100).toFixed(1)}%</span>
                    <span>评论率: {(benchmark.avgCommentRate * 100).toFixed(1)}%</span>
                    <span>涨粉率: {(benchmark.avgFollowConversionRate * 100).toFixed(2)}%</span>
                    <span>分享率: {(benchmark.avgShareRate * 100).toFixed(1)}%</span>
                    <span>观看时长: {benchmark.avgWatchTime}秒</span>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* 内容类型自动分析 */}
      {classification.categories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">内容类型分布</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              classification.verticalityScore >= 70 ? 'bg-green-100 text-green-700' :
              classification.verticalityScore >= 45 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              垂直度 {classification.verticalityScore}分 · {classification.mainDirection}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">基于 {posts.length} 条帖子标题自动分类（无需手动操作）</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {classification.categories.slice(0, 6).map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6 text-right">{idx + 1}</span>
                  <span className="text-sm text-gray-700 w-20 truncate">{cat.name}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${idx === 0 ? 'bg-red-400' : idx === 1 ? 'bg-orange-400' : 'bg-gray-300'}`}
                      style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-14 text-right">{cat.count}篇 ({cat.percentage.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2">分析结论</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{classification.assessment}</p>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-red-500 font-medium">建议</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{classification.suggestion}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 趋势图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">近 30 天趋势</h2>
        <TrendChart posts={posts} />
      </div>

      {/* 帖子排行榜——显示全部 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              互动率排行（共 {posts.length} 篇）
            </h2>
            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full flex items-center gap-1">
              👆 点击帖子 ↓ 下翻查看详细分析
            </span>
          </div>
          <PostRanking
            posts={posts}
            sortKey="interactionRate"
            onPostClick={(post) => setSelectedPost(selectedPost?.id === post.id ? null : post)}
            selectedId={selectedPost?.id}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              涨粉率排行（共 {posts.length} 篇）
            </h2>
            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full flex items-center gap-1">
              👆 点击帖子 ↓ 下翻查看详细分析
            </span>
          </div>
          <PostRanking
            posts={posts}
            sortKey="followConversionRate"
            onPostClick={(post) => setSelectedPost(selectedPost?.id === post.id ? null : post)}
            selectedId={selectedPost?.id}
          />
        </div>
      </div>

      {/* 选中的帖子详情 - 在当前页面展开 */}
      {selectedPost && (
        <div className="bg-white rounded-xl border-2 border-red-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {selectedPost.type === 'video' ? '视频' : '图文'}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedPost.title}</h2>
              <p className="text-sm text-gray-400">{selectedPost.publishDate} 发布</p>
            </div>
            <button
              onClick={() => setSelectedPost(null)}
              className="text-gray-400 hover:text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              ✕ 收起
            </button>
          </div>

          {/* 漏斗图 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">转化漏斗</h3>
            <FunnelChart post={selectedPost} />
          </div>

          {/* 漏斗逐层分析 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">漏斗逐层分析</h3>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 text-sm text-blue-800 mb-4">
              <p className="font-medium text-blue-900 mb-1">💡 关于数据对比</p>
              <p>对比的是「通用-新手期(0-1000粉)」账号的平均数据。绝对数值差异很大，重点看相对指标。</p>
            </div>

            {/* 漏斗各层含义 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">📖 漏斗各层含义</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full mt-0.5 bg-[#C4A882]" />
                  <span><span className="font-medium">曝光量:</span> 你的内容被推荐系统推送给多少人</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full mt-0.5 bg-[#B8A9C9]" />
                  <span><span className="font-medium">阅读量:</span> 看到你的封面后，有多少人被吸引点击进来</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full mt-0.5 bg-[#9BA4B5]" />
                  <span><span className="font-medium">互动量:</span> 看完内容后，有多少人愿意点赞/收藏/评论/分享</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full mt-0.5 bg-[#A8A4A0]" />
                  <span><span className="font-medium">涨粉:</span> 觉得内容有价值，关注你成为粉丝的比例</span>
                </div>
              </div>
            </div>

            <FunnelLayer
              label="封面点击"
              absoluteValue={selectedPost.views}
              relativeValue={selectedPost.coverCTR}
              relativeLabel="封面点击率"
              benchmarkValue={benchmark.avgCoverCTR}
              diagnosis={diagnosis?.funnelDiagnosis[0]}
              layerType="ctr"
            />
            <FunnelLayer
              label="互动转化"
              absoluteValue={selectedPost.likes + selectedPost.saves + selectedPost.comments + selectedPost.shares}
              relativeValue={selectedPost.interactionRate}
              relativeLabel="互动率"
              benchmarkValue={benchmark.avgInteractionRate}
              diagnosis={diagnosis?.funnelDiagnosis[2]}
              layerType="interaction"
            />
            <FunnelLayer
              label="涨粉转化"
              absoluteValue={selectedPost.newFollowers}
              relativeValue={selectedPost.followConversionRate}
              relativeLabel="涨粉转化率"
              benchmarkValue={benchmark.avgFollowConversionRate}
              diagnosis={diagnosis?.funnelDiagnosis[3]}
              layerType="conversion"
            />
          </div>

          {/* 互动深度分析 - 新增 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">互动深度分析</h3>
            <InteractionAnalysis post={selectedPost} />
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
              {selectedPost.avgWatchTime && (
                <div>
                  <dt className="font-medium">人均观看时长</dt>
                  <dd>每个人平均看了多久（秒）。时长越长，说明内容越能留住人。</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
