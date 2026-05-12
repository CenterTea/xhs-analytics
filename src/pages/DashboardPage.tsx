import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import MetricCard from '../components/Dashboard/MetricCard'
import TrendChart from '../components/Dashboard/TrendChart'
import PostRanking from '../components/Dashboard/PostRanking'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { posts, accountStats } = useData()
  const navigate = useNavigate()

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
          <MetricCard label="总曝光" value={accountStats.totalImpressions} />
          <MetricCard label="总阅读" value={accountStats.totalViews} />
          <MetricCard label="总互动" value={accountStats.totalInteractions} />
          <MetricCard label="净增粉丝" value={accountStats.netFollowerGrowth} />
          <MetricCard label="平均封面点击率" value={`${(accountStats.avgCoverCTR * 100).toFixed(1)}%`} />
          <MetricCard label="平均互动率" value={`${(accountStats.avgInteractionRate * 100).toFixed(1)}%`} />
          <MetricCard label="平均点赞率" value={`${(accountStats.avgLikeRate * 100).toFixed(1)}%`} />
          <MetricCard label="平均涨粉率" value={`${(accountStats.avgFollowConversionRate * 100).toFixed(2)}%`} />
        </div>
      )}

      {/* 趋势图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">近 30 天趋势</h2>
        <TrendChart posts={posts} />
      </div>

      {/* 帖子排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">互动量排行</h2>
          <PostRanking
            posts={posts}
            sortKey="interactionRate"
            onPostClick={(post) => navigate(`/post/${post.id}`)}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">涨粉率排行</h2>
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
