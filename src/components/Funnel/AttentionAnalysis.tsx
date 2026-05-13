import Badge from '../ui/Badge'
import type { Post } from '../../types'

interface AttentionAnalysisProps {
  post: Post
  isOwnPost: boolean
}

/**
 * 估算帖子的阅读/观看时长
 */
function estimateReadingTime(post: Post): number {
  if (post.type === 'video') {
    return 60
  } else {
    const textTime = (post.title?.length || 20) * 0.1 + 30
    const imageTime = 20
    return Math.round(textTime + imageTime)
  }
}

export default function AttentionAnalysis({ post, isOwnPost }: AttentionAnalysisProps) {
  if (!isOwnPost) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">观众注意力分析</h3>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-sm text-amber-800">
            <span className="font-medium">⚠️ 暂不支持分析</span>
          </p>
          <p className="text-xs text-amber-600 mt-1">
            此帖子不是您上传数据中的帖子，无法进行观众注意力分析。请分析您自己账号的帖子数据。
          </p>
        </div>
      </div>
    )
  }

  const estimatedReadTime = estimateReadingTime(post)
  const avgWatchTime = post.avgWatchTime || 0
  const watchTimeRatio = avgWatchTime / estimatedReadTime

  let watchTimeStatus: 'high' | 'medium' | 'low'
  if (watchTimeRatio >= 1.2) {
    watchTimeStatus = 'high'
  } else if (watchTimeRatio >= 0.8) {
    watchTimeStatus = 'medium'
  } else {
    watchTimeStatus = 'low'
  }

  const diagnosis: {
    title: string
    description: string
    suggestion: string
    variant: 'great' | 'normal' | 'poor'
  } = watchTimeStatus === 'high'
    ? {
        title: '内容优质，吸引用户停留',
        description: `人均观看时长（${avgWatchTime}秒）高于预估阅读时长（${estimatedReadTime}秒），说明内容质量高，能够吸引用户反复观看或暂停思考。`,
        suggestion: '内容很有吸引力！继续保持优质内容的创作节奏。',
        variant: 'great'
      }
    : watchTimeStatus === 'medium'
      ? {
          title: '表现平稳，有优化空间',
          description: `人均观看时长（${avgWatchTime}秒）与预估阅读时长（${estimatedReadTime}秒）相当，表现中规中矩。`,
          suggestion: '内容整体不错，可以尝试增加悬念或互动点，提升用户停留时长。',
          variant: 'normal'
        }
      : {
          title: '内容吸引力不足，用户流失快',
          description: `人均观看时长（${avgWatchTime}秒）明显低于预估阅读时长（${estimatedReadTime}秒），说明用户没有看完就划走了。`,
          suggestion: '需要改进帖子内容质量与吸引程度：①开头要更有冲击力；②内容节奏要快，减少冗余；③增加视觉吸引力（封面、配图、剪辑）；④检查内容是否符合目标受众兴趣。',
          variant: 'poor'
        }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">观众注意力分析</h3>
        <Badge variant={diagnosis.variant}>
          {diagnosis.variant === 'great' ? '优秀' : diagnosis.variant === 'normal' ? '一般' : '需改进'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">预估阅读时长</p>
          <p className="text-xl font-bold text-gray-900">{estimatedReadTime}秒</p>
          <p className="text-xs text-gray-400 mt-1">内容完整浏览所需</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${watchTimeStatus === 'high' ? 'bg-green-50' : watchTimeStatus === 'medium' ? 'bg-yellow-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-400 mb-1">人均观看时长</p>
          <p className={`text-xl font-bold ${watchTimeStatus === 'high' ? 'text-green-600' : watchTimeStatus === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgWatchTime > 0 ? `${avgWatchTime}秒` : '暂无数据'}
          </p>
          <p className="text-xs text-gray-400 mt-1">实际停留时间</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">观看时长对比</p>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500 w-20">预估时长</span>
          <div className="flex-1 h-4 bg-gray-100 rounded relative">
            <div className="absolute left-0 top-0 h-4 bg-gray-400 rounded" style={{ width: '100%' }} />
          </div>
          <span className="text-xs text-gray-500 w-16 text-right">{estimatedReadTime}秒</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-20">实际时长</span>
          <div className="flex-1 h-4 bg-gray-100 rounded relative">
            <div
              className={`absolute left-0 top-0 h-4 rounded ${watchTimeStatus === 'high' ? 'bg-green-500' : watchTimeStatus === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((avgWatchTime / estimatedReadTime) * 100, 100)}%` }}
            />
          </div>
          <span className={`text-xs w-16 text-right ${watchTimeStatus === 'high' ? 'text-green-600' : watchTimeStatus === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgWatchTime > 0 ? `${avgWatchTime}秒` : 'N/A'}
          </span>
        </div>
        {avgWatchTime > 0 && (
          <p className={`text-xs mt-2 ${watchTimeRatio >= 1 ? 'text-green-600' : 'text-red-500'}`}>
            {watchTimeRatio >= 1
              ? `✓ 实际观看时长是预估的 ${watchTimeRatio.toFixed(1)} 倍`
              : `✗ 实际观看时长仅为预估的 ${(watchTimeRatio * 100).toFixed(0)}%`}
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">{diagnosis.title}</h4>
        <p className="text-sm text-gray-600 mb-3">{diagnosis.description}</p>
        <div className="bg-white rounded-lg p-3 border-l-4 border-red-400">
          <p className="text-sm text-gray-700">
            <span className="font-medium">💡 建议：</span>{diagnosis.suggestion}
          </p>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
        <h5 className="text-xs font-semibold text-blue-900 mb-2">📊 分析说明</h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 预估阅读时长：基于帖子类型（图文/视频）估算的完整浏览所需时间</li>
          <li>• 人均观看时长：用户实际停留在帖子的平均时间（从数据文件获取）</li>
          <li>• 数据来源：需从创作者中心导出包含"人均观看时长"的数据文件</li>
        </ul>
      </div>
    </div>
  )
}
