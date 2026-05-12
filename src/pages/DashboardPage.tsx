import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import MetricCard from '../components/Dashboard/MetricCard'
import TrendChart from '../components/Dashboard/TrendChart'
import PostRanking from '../components/Dashboard/PostRanking'
import { Link } from 'react-router-dom'
import { getBenchmark } from '../utils/benchmark'

function pctRank(yours: number, benchmark: number): string {
  if (benchmark <= 0) return ''
  const ratio = yours / benchmark
  if (ratio >= 1.3) return '超过 70% 同类账号'
  if (ratio >= 1.0) return '超过 50% 同类账号'
  if (ratio >= 0.7) return '超过 30% 同类账号'
  return '低于多数同类账号'
}

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
  const { posts, accountStats } = useData()
  const navigate = useNavigate()
  const benchmark = getBenchmark('default', 500)
  const n = posts.length

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

  const avgImpressions = Math.round(posts.reduce((s, p) => s + p.impressions, 0) / n)
  const avgViews = Math.round(posts.reduce((s, p) => s + p.views, 0) / n)
  const avgInteractions = Math.round(
    posts.reduce((s, p) => s + p.likes + p.saves + p.comments + p.shares, 0) / n
  )
  const avgFollowers = Math.round(posts.reduce((s, p) => s + p.newFollowers, 0) / n)

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
            label="总互动"
            value={accountStats.totalInteractions}
            avgPerPost={avgInteractions.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.totalInteractions, n, benchmark.avgInteractionRate * 1000)}
          />
          <MetricCard
            label="净增粉丝"
            value={accountStats.netFollowerGrowth}
            avgPerPost={avgFollowers.toLocaleString()}
            percentile={calculateTotalPercentile(accountStats.netFollowerGrowth, n, benchmark.avgFollowConversionRate * 100)}
          />
          <MetricCard
            label="平均封面点击率"
            value={`${(accountStats.avgCoverCTR * 100).toFixed(1)}%`}
            percentile={pctRank(accountStats.avgCoverCTR, benchmark.avgCoverCTR)}
          />
          <MetricCard
            label="平均互动率"
            value={`${(accountStats.avgInteractionRate * 100).toFixed(1)}%`}
            percentile={pctRank(accountStats.avgInteractionRate, benchmark.avgInteractionRate)}
          />
          <MetricCard
            label="平均点赞率"
            value={`${(accountStats.avgLikeRate * 100).toFixed(1)}%`}
            percentile={pctRank(accountStats.avgLikeRate, benchmark.avgLikeRate)}
          />
          <MetricCard
            label="平均涨粉率"
            value={`${(accountStats.avgFollowConversionRate * 100).toFixed(2)}%`}
            percentile={pctRank(accountStats.avgFollowConversionRate, benchmark.avgFollowConversionRate)}
          />
        </div>
      )}

      {/* 同类账号数据说明 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">关于「同类账号」对比数据</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              当前对比的是「通用-新手期(0-1000粉)」账号的平均数据。
              <br />
              系统根据你的内容类型和粉丝量级自动匹配基准数据。基准数据综合了平台公开信息和行业经验值，仅供参考。
            </p>
            <details className="mt-2">
              <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                查看当前使用的基准数据详情
              </summary>
              <div className="mt-2 text-xs text-blue-700 bg-white/50 rounded p-2 space-y-1">
                <p>平均封面点击率: {(benchmark.avgCoverCTR * 100).toFixed(1)}%</p>
                <p>平均互动率: {(benchmark.avgInteractionRate * 100).toFixed(1)}%</p>
                <p>平均点赞率: {(benchmark.avgLikeRate * 100).toFixed(1)}%</p>
                <p>平均涨粉率: {(benchmark.avgFollowConversionRate * 100).toFixed(2)}%</p>
                <p>平均观看时长: {benchmark.avgWatchTime}秒</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">近 30 天趋势</h2>
        <TrendChart posts={posts} />
      </div>

      {/* 帖子排行榜——显示全部 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              互动率排行（共 {posts.length} 篇）
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              👆 点击帖子查看详细分析
            </span>
          </div>
          <PostRanking
            posts={posts}
            sortKey="interactionRate"
            onPostClick={(post) => navigate(`/post/${post.id}`)}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              涨粉率排行（共 {posts.length} 篇）
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              👆 点击帖子查看详细分析
            </span>
          </div>
          <PostRanking
            posts={posts}
            sortKey="followConversionRate"
            onPostClick={(post) => navigate(`/post/${post.id}`)}
          />
        </div>
      </div>
    </div>
  )
}
