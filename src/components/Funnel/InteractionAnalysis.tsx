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
  // 求助帖特征：评论率高 + 点赞率正常或偏高（与争议性内容的区别）
  const isHelpSeeking = isCommentHigh && likeConversionRate >= LIKE_NORMAL * 0.7

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
          <Badge variant="poor">⚠️ 需关注</Badge>
        )}
        {isHelpSeeking && !isControversial && (
          <Badge variant="great">💬 高互动求助帖</Badge>
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

      {/* 点赞评论比例分析 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">📊 点赞评论比例分析</h4>
        {(() => {
          const likeCommentRatio = post.comments > 0 ? post.likes / post.comments : 0
          const healthyMin = 5
          const healthyMax = 20

          let ratioDiagnosis: string
          let ratioSuggestion: string
          let ratioColor: string

          if (likeCommentRatio >= healthyMin && likeCommentRatio <= healthyMax) {
            ratioDiagnosis = `点赞评论比例为 ${likeCommentRatio.toFixed(1)}:1，处于健康区间（5:1 ~ 20:1）。`
            ratioSuggestion = '说明内容既能引发用户认可（点赞），又能激发讨论（评论），互动结构均衡。继续保持！'
            ratioColor = 'text-green-600'
          } else if (likeCommentRatio < healthyMin) {
            ratioDiagnosis = `点赞评论比例为 ${likeCommentRatio.toFixed(1)}:1，低于健康区间（应 ≥5:1）。`
            if (post.comments > 10) {
              if (isHelpSeeking && !isControversial) {
                // 求助帖特征：评论多但比例低，但点赞率正常
                ratioSuggestion = '检测到求助帖/讨论帖特征：评论活跃度高，用户积极参与讨论。这是健康的高互动现象！建议积极回复评论，与粉丝建立深度连接。如果想进一步提高转化率，可以打造相关领域的人设并展示个人语言魅力。'
                ratioColor = 'text-purple-600'
              } else {
                // 争议性内容或求助帖
                ratioSuggestion = '评论数相对较多，可能存在争议或引战内容，也有可能是求助帖或话题讨论帖。建议先审视评论区内容：如果是有价值的讨论则积极回复互动，打造人设展示语言魅力；如果是对立争吵则需回归有价值的内容创作，避免故意制造对立。'
                ratioColor = 'text-orange-600'
              }
            } else {
              ratioSuggestion = '评论数较少，可能是内容缺乏讨论点。尝试在结尾抛出开放性问题，引导用户在评论区分享观点。'
              ratioColor = 'text-red-600'
            }
          } else {
            ratioDiagnosis = `点赞评论比例为 ${likeCommentRatio.toFixed(1)}:1，高于健康区间（应 ≤20:1）。`
            ratioSuggestion = '用户愿意点赞但不太愿意评论。说明内容有价值但缺乏互动引导。可以在内容结尾加入提问或讨论引导，比如"你遇到过这种情况吗？"、"你会怎么选？"，提升评论率。'
            ratioColor = 'text-yellow-600'
          }

          return (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">点赞 : 评论</span>
                <span className={`text-lg font-bold ${ratioColor}`}>
                  {likeCommentRatio > 0 ? `${likeCommentRatio.toFixed(1)}:1` : 'N/A'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-3 relative">
                <div className="absolute left-[25%] w-0.5 h-2 bg-gray-400" />
                <div className="absolute left-[83%] w-0.5 h-2 bg-gray-400" />
                <div
                  className={`h-2 rounded-full ${
                    likeCommentRatio >= healthyMin && likeCommentRatio <= healthyMax
                      ? 'bg-green-500'
                      : likeCommentRatio < healthyMin
                        ? isHelpSeeking && !isControversial
                          ? 'bg-purple-500'
                          : 'bg-orange-500'
                        : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(Math.max((likeCommentRatio / 25) * 100, 5), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-3">
                <span>0</span>
                <span>健康区间</span>
                <span>25+</span>
              </div>
              <p className="text-sm text-gray-700 mb-1"><strong>诊断：</strong>{ratioDiagnosis}</p>
              <p className="text-sm text-gray-600"><strong>建议：</strong>{ratioSuggestion}</p>
            </>
          )
        })()}
      </div>

      {/* 争议性内容或求助帖警告 */}
      {isControversial && (
        <div className="mt-4 p-4 bg-orange-100 border border-orange-200 rounded-lg">
          <h5 className="text-sm font-semibold text-orange-800 mb-2">⚠️ 检测到评论转化率异常高</h5>
          <p className="text-sm text-orange-700 mb-2">
            评论转化率异常高（{commentConversionRate.toFixed(2)}%），但点赞转化率偏低（{likeConversionRate.toFixed(1)}%）。
          </p>
          <div className="space-y-3">
            <div className="bg-white rounded p-2 border border-orange-200">
              <p className="text-xs font-medium text-red-700 mb-1">情况一：争议性内容</p>
              <p className="text-xs text-red-600">
                这种情况通常出现在争议性话题、引战内容或"bait"（钓鱼）帖子中。虽然能引发讨论，但不利于长期账号发展和粉丝信任建立。
                建议：避免故意制造争议，专注提供有价值的内容。
              </p>
            </div>
            <div className="bg-white rounded p-2 border border-orange-200">
              <p className="text-xs font-medium text-purple-700 mb-1">情况二：求助帖 / 讨论帖</p>
              <p className="text-xs text-purple-600">
                也有可能是求助帖或话题讨论帖，用户在看到内容后想要表达观点或提供帮助。这类帖子能引发大量有价值的讨论，是积极的高互动现象。建议积极回复评论区，与粉丝建立深度连接。如果想进一步提高互动转化率，可以打造相关领域的人设并展示个人语言魅力。
              </p>
            </div>
          </div>
        </div>
      )}
      {isHelpSeeking && !isControversial && (
        <div className="mt-4 p-4 bg-purple-100 border border-purple-200 rounded-lg">
          <h5 className="text-sm font-semibold text-purple-800 mb-2">💬 检测到求助帖/讨论帖特征</h5>
          <p className="text-sm text-purple-700 mb-2">
            评论转化率较高（{commentConversionRate.toFixed(2)}%），且点赞转化率正常，说明内容成功激发了用户的参与热情。
          </p>
          <p className="text-sm text-purple-700 mb-2">
            <strong>分析原因：</strong>这类帖子通常是求助帖、经验分享帖或话题讨论帖，用户在评论区积极提供建议、分享经历或参与讨论。
          </p>
          <div className="bg-white rounded p-3 border border-purple-200 mt-2">
            <p className="text-sm text-purple-800 mb-1"><strong>💡 建议：</strong></p>
            <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
              <li>积极回复评论区的建议和问题，与粉丝建立深度连接</li>
              <li>对优质回复点赞或置顶，鼓励更多有价值的互动</li>
              <li>如果想进一步提高互动转化率，可以考虑：</li>
              <li className="ml-4">• 打造与话题相关的专业人设（如"护肤达人"、"职场导师"等）</li>
              <li className="ml-4">• 在回复中展示个人语言魅力和独特观点，形成记忆点</li>
              <li className="ml-4">• 适时抛出后续问题，延续讨论热度</li>
            </ul>
          </div>
        </div>
      )}

      {/* 数据诊断总结 */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 互动数据诊断总结</h4>
        {(() => {
          const issues: string[] = []
          const suggestions: string[] = []

          if (likeRating === 'poor') {
            issues.push('点赞转化率偏低')
            suggestions.push('提升内容价值感——让用户觉得"有用"或"有共鸣"')
          }
          if (commentRating === 'poor') {
            issues.push('评论转化率偏低')
            suggestions.push('在结尾加入开放性问题，引导用户表达观点')
          }
          if (saveRating === 'poor') {
            issues.push('收藏转化率偏低')
            suggestions.push('增加内容的"干货密度"，让用户觉得值得保存回看')
          }
          if (post.shares === 0) {
            issues.push('暂无分享')
            suggestions.push('增加"社交货币"属性——让用户愿意转给朋友的内容')
          }

          const likeCommentRatio = post.comments > 0 ? post.likes / post.comments : 0
          if (likeCommentRatio < 5 && post.comments > 5) {
            issues.push('点赞评论比例失衡（评论相对过多）')
            suggestions.push('警惕争议性内容风险，专注建设性话题')
          }

          if (issues.length === 0) {
            return (
              <p className="text-sm text-green-700">
                ✅ 各项互动指标表现良好，互动结构健康。继续保持当前的内容策略！
              </p>
            )
          }

          return (
            <>
              <p className="text-sm text-blue-800 mb-2"><strong>发现问题：</strong></p>
              <ul className="text-sm text-blue-700 list-disc list-inside mb-3">
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
              <p className="text-sm text-blue-800 mb-2"><strong>改进建议：</strong></p>
              <ul className="text-sm text-blue-700 list-disc list-inside">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )
        })()}
      </div>

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
