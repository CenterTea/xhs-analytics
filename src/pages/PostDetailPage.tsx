import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import FunnelChart from '../components/Funnel/FunnelChart'
import FunnelLayer from '../components/Funnel/FunnelLayer'
import MetricComparison from '../components/Funnel/MetricComparison'
import TrafficSource from '../components/Funnel/TrafficSource'
import CommentQuality from '../components/Interaction/CommentQuality'
import ShareAnalysis from '../components/Interaction/ShareAnalysis'
import ViewingTimeAnalysis from '../components/Interaction/ViewingTimeAnalysis'
import ViewingPeriodsChart from '../components/Interaction/ViewingPeriodsChart'
import AttributionCard from '../components/Attribution/AttributionCard'
import ReferencePosts from '../components/Attribution/ReferencePosts'
import DiagnosisReport from '../components/Diagnosis/DiagnosisReport'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { posts, getDiagnosis } = useData()

  const post = posts.find((p) => p.id === id)

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">找不到这篇帖子</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-red-500 hover:text-red-600 font-medium"
        >
          返回看板
        </button>
      </div>
    )
  }

  const diagnosis = getDiagnosis?.(post)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 帖子基本信息 */}
      <button
        onClick={() => navigate('/dashboard')}
        className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block"
      >
        ← 返回看板
      </button>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              {post.type === 'video' ? '视频' : '图文'}
            </span>
            <h1 className="text-xl font-bold text-gray-900 mt-2 mb-1">{post.title}</h1>
            <p className="text-sm text-gray-400">{post.publishDate} 发布</p>
          </div>
          {diagnosis && (
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                diagnosis.overallRating === 'excellent'
                  ? 'bg-green-100 text-green-700'
                  : diagnosis.overallRating === 'good'
                  ? 'bg-blue-100 text-blue-700'
                  : diagnosis.overallRating === 'average'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {diagnosis.overallRating === 'excellent'
                ? '优秀'
                : diagnosis.overallRating === 'good'
                ? '良好'
                : diagnosis.overallRating === 'average'
                ? '一般'
                : '需改进'}
            </span>
          )}
        </div>
      </div>

      {/* 漏斗图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">转化漏斗</h2>
        <FunnelChart post={post} />
      </div>

      {/* 各漏斗层级详情 */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-gray-900">漏斗逐层分析</h2>
        <FunnelLayer
          label="曝光量"
          absoluteValue={post.impressions}
          relativeValue={post.coverCTR}
          relativeLabel="封面点击率"
          benchmarkValue={0.08}
          diagnosis={diagnosis?.funnelDiagnosis[0]}
        />
        <FunnelLayer
          label="阅读量 / 播放量"
          absoluteValue={post.views}
          relativeValue={post.completionRate ?? 0}
          relativeLabel="完播率"
          benchmarkValue={0.35}
          diagnosis={diagnosis?.funnelDiagnosis[1]}
        />
        <FunnelLayer
          label="互动量"
          absoluteValue={post.likes + post.saves + post.comments + post.shares}
          relativeValue={post.interactionRate}
          relativeLabel="互动率"
          benchmarkValue={0.05}
          diagnosis={diagnosis?.funnelDiagnosis[2]}
        />
        <FunnelLayer
          label="涨粉"
          absoluteValue={post.newFollowers}
          relativeValue={post.followConversionRate}
          relativeLabel="涨粉转化率"
          benchmarkValue={0.01}
          diagnosis={diagnosis?.funnelDiagnosis[3]}
        />
      </div>

      {/* 指标对比表 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">绝对 + 相对指标对比</h2>
        <MetricComparison post={post} />
      </div>

      {/* 观看时长与完播率分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">观看时长 & 评论区关联</h2>
          <ViewingTimeAnalysis
            avgWatchTime={post.avgWatchTime}
            totalWatchTime={post.totalWatchTime}
            completionRate={post.completionRate}
            commentRate={post.commentRate}
            followConversionRate={post.followConversionRate}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">观看时段分布</h2>
          <ViewingPeriodsChart viewingPeriods={post.viewingPeriods} />
        </div>
      </div>

      {/* 流量来源 */}
      {post.trafficSources && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">流量来源</h2>
          <TrafficSource trafficSources={post.trafficSources} />
        </div>
      )}

      {/* 评论质量 + 转发分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">评论质量</h2>
          <CommentQuality
            effective={post.effectiveComments}
            ineffective={post.ineffectiveComments}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">转发分析</h2>
          <ShareAnalysis shares={post.shares} shareRate={post.shareRate} />
        </div>
      </div>

      {/* 归因分析 */}
      {diagnosis && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">归因分析</h2>
          <AttributionCard diagnosis={diagnosis} />
        </div>
      )}

      {/* 素人参考 */}
      {diagnosis && diagnosis.referencePosts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">素人爆款参考</h2>
          <ReferencePosts references={diagnosis.referencePosts} post={post} />
        </div>
      )}

      {/* 诊断报告 */}
      {diagnosis && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">完整诊断报告</h2>
          <DiagnosisReport diagnosis={diagnosis} post={post} />
        </div>
      )}
    </div>
  )
}
