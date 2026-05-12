import Badge from '../ui/Badge'
import type { Post } from '../../types'

interface InteractionAnalysisProps {
  post: Post
}

export default function InteractionAnalysis({ post }: InteractionAnalysisProps) {
  const totalInteractions = post.likes + post.saves + post.comments + post.shares

  // 转化率计算
  const likeConversionRate = post.views > 0 ? (post.likes / post.views) * 100 : 0
  const commentConversionRate = post.views > 0 ? (post.comments / post.views) * 100 : 0
  const saveConversionRate = post.views > 0 ? (post.saves / post.views) * 100 : 0

  // 正常阈值
  const LIKE_NORMAL = 15 // 15% 为正常
  const COMMENT_NORMAL = 1.5 // 1.5% 为正常
  const SAVE_NORMAL = 3 // 3% 为正常

  // 判断是否异常
  const isLikeLow = likeConversionRate < LIKE_NORMAL * 0.7
  const isCommentHigh = commentConversionRate > COMMENT_NORMAL * 1.5
  const isControversial = isLikeLow && isCommentHigh

  // 评级函数
  const getRating = (rate: number, normal: number) => {
    if (rate >= normal * 1.3) return 'great'
    if (rate >= normal * 0.7) return 'normal'
    return 'poor'
  }

  const likeRating = getRating(likeConversionRate, LIKE_NORMAL)
  const commentRating = getRating(commentConversionRate, COMMENT_NORMAL)
  const saveRating = getRating(saveConversionRate, SAVE_NORMAL)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">互动深度分析</h3>
        {isControversial && (
          <Badge variant="poor">⚠️ 争议性内容</Badge>
        )}
      </div>

      {/* 总互动数 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">总互动数量</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">点赞</p>
            <p className="text-2xl font-bold text-red-500">{post.likes.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">收藏</p>
            <p className="text-2xl font-bold text-yellow-500">{post.saves.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">评论</p>
            <p className="text-2xl font-bold text-blue-500">{post.comments.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">分享</p>
            <p className="text-2xl font-bold text-green-500">{post.shares.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            总互动数 <span className="text-xl font-bold text-gray-900">{totalInteractions.toLocaleString()}</span>
            <span className="text-xs text-gray-400 ml-2">（占阅读量 {(post.interactionRate * 100).toFixed(1)}%）</span>
          </p>
        </div>
      </div>

      {/* 各类型转化率 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">各类型转化率</h4>

        {/* 点赞转化率 */}
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">点赞转化率</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-red-600">{likeConversionRate.toFixed(1)}%</span>
              <Badge variant={likeRating}>
                {likeRating === 'great' ? '优秀' : likeRating === 'normal' ? '正常' : '偏低'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${likeRating === 'great' ? 'bg-green-500' : likeRating === 'normal' ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(likeConversionRate / LIKE_NORMAL * 50, 100)}%` }}
              />
            </div>
            <span className="w-16 text-right">正常: {LIKE_NORMAL}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            每100个阅读中，{likeConversionRate.toFixed(1)}人点赞。{LIKE_NORMAL}%为行业参考值。
          </p>
        </div>

        {/* 评论转化率 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">评论转化率</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">{commentConversionRate.toFixed(2)}%</span>
              <Badge variant={commentRating}>
                {commentRating === 'great' ? '优秀' : commentRating === 'normal' ? '正常' : '偏低'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${commentRating === 'great' ? 'bg-green-500' : commentRating === 'normal' ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(commentConversionRate / COMMENT_NORMAL * 50, 100)}%` }}
              />
            </div>
            <span className="w-16 text-right">正常: {COMMENT_NORMAL}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            每100个阅读中，{commentConversionRate.toFixed(2)}人评论。{COMMENT_NORMAL}%为行业参考值。
          </p>
        </div>

        {/* 收藏转化率 */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">收藏转化率</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-yellow-600">{saveConversionRate.toFixed(1)}%</span>
              <Badge variant={saveRating}>
                {saveRating === 'great' ? '优秀' : saveRating === 'normal' ? '正常' : '偏低'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${saveRating === 'great' ? 'bg-green-500' : saveRating === 'normal' ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(saveConversionRate / SAVE_NORMAL * 50, 100)}%` }}
              />
            </div>
            <span className="w-16 text-right">正常: {SAVE_NORMAL}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            每100个阅读中，{saveConversionRate.toFixed(1)}人收藏。收藏代表内容有长期价值。
          </p>
        </div>
      </div>

      {/* 争议性内容警告 */}
      {isControversial && (
        <div className="mt-4 p-4 bg-red-100 border border-red-200 rounded-lg">
          <h5 className="text-sm font-semibold text-red-800 mb-2">⚠️ 检测到争议性内容特征</h5>
          <p className="text-sm text-red-700 mb-2">
            评论转化率异常高（{commentConversionRate.toFixed(2)}%），但点赞转化率偏低（{likeConversionRate.toFixed(1)}%）。
          </p>
          <p className="text-xs text-red-600">
            这种情况通常出现在争议性话题、引战内容或" bait "（钓鱼）帖子中。虽然能引发讨论，但不利于长期账号发展和粉丝信任建立。
            建议：避免故意制造争议，专注提供有价值的内容。
          </p>
        </div>
      )}

      {/* 解释说明 */}
      <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-100">
        <h5 className="text-xs font-semibold text-amber-800 mb-1">💡 如何理解这些数据？</h5>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>点赞</strong>：最基础的认可，门槛最低</li>
          <li>• <strong>收藏</strong>：内容有实用价值，用户想留着以后看</li>
          <li>• <strong>评论</strong>：引发了用户的表达欲或疑问</li>
          <li>• <strong>分享</strong>：内容有传播价值（权重最高）</li>
          <li>• <strong>健康比例</strong>：点赞:评论 ≈ 10:1 是正常的，如果评论远高于此，需警惕争议性</li>
        </ul>
      </div>
    </div>
  )
}
