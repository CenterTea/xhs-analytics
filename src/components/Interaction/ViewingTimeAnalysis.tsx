import { getBenchmark } from '../../utils/benchmark'
import ProgressBar from '../ui/ProgressBar'
import Badge from '../ui/Badge'

interface ViewingTimeAnalysisProps {
  avgWatchTime?: number
  totalWatchTime?: number
  completionRate?: number
  commentRate: number
  followConversionRate: number
}

export default function ViewingTimeAnalysis({
  avgWatchTime,
  totalWatchTime,
  completionRate,
  commentRate,
  followConversionRate,
}: ViewingTimeAnalysisProps) {
  const benchmark = getBenchmark('default', 500)
  const watchTime = avgWatchTime ?? 0
  const benchmarkWatchTime = benchmark.avgWatchTime
  const watchTimeDiff = benchmarkWatchTime > 0 ? (watchTime - benchmarkWatchTime) / benchmarkWatchTime : 0

  // 评论区吸引力判断
  const isCommentHeavy = commentRate > 0.02 // 评论率超过2%
  const watchTimeHigh = watchTimeDiff > 0.4 // 观看时长超过均值40%
  const conversionLow = followConversionRate < 0.005 // 涨粉率低于0.5%

  // 两个界限判断
  let commentBoundary: 'healthy' | 'warning' | 'danger' = 'healthy'
  let commentInsight = ''

  if (watchTimeHigh && isCommentHeavy && conversionLow) {
    commentBoundary = 'danger'
    commentInsight =
      '观看时长显著高于同类均值，结合高评论率和低涨粉率来看，评论区可能过度吸引了用户注意力。用户在评论区投入了大量时间讨论，但对你的账号本身关注度不足——这就是"评论区喧宾夺主"。建议适当引导讨论方向，在内容中强化个人IP和关注引导。'
  } else if (watchTimeHigh && isCommentHeavy) {
    commentBoundary = 'warning'
    commentInsight =
      '观看时长和评论率都较高，评论区活跃是好事，但要警惕：如果涨粉转化率偏低，说明用户的注意力正在被评论区"吃掉"。建议在评论区顶部或置顶评论中加入关注引导，把讨论热情转化为关注行为。'
  } else if (watchTimeHigh && !isCommentHeavy) {
    commentInsight =
      '观看时长高于均值，且不是由评论区驱动的——这说明内容本身的信息密度和吸引力很强。用户是因为内容好而停留，这是最健康的时长增长模式。继续保持内容质量。'
  } else if (!watchTimeHigh && isCommentHeavy) {
    commentInsight =
      '评论率较高但观看时长并未显著增长，说明评论内容偏向浅层互动（如@好友、简单表态），而非深度讨论。可以尝试在内容中留出更有讨论价值的"钩子"来引发深度评论。'
  } else {
    commentInsight =
      '观看时长与评论率均处于正常范围。如果希望提升用户停留时长，可以增加内容的信息密度或在结尾设置互动问题。'
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}分${sec}秒`
  }

  return (
    <div className="space-y-4">
      {/* 观看时长 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400">平均观看时长</p>
          <p className="text-2xl font-bold text-gray-900">
            {avgWatchTime ? formatTime(avgWatchTime) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">总观看时长</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalWatchTime ? formatTime(totalWatchTime) : '-'}
          </p>
        </div>
      </div>

      {/* 与同类均值对比 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">平均观看时长 vs 同类均值</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar
              value={watchTime}
              max={benchmarkWatchTime * 2}
              color={watchTimeDiff > 0.3 ? 'bg-green-500' : watchTimeDiff > -0.3 ? 'bg-yellow-500' : 'bg-red-500'}
              showPercent={false}
            />
          </div>
          <span className="text-sm text-gray-500 w-16 text-right">
            {formatTime(benchmarkWatchTime)}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            你的：{formatTime(watchTime)}
          </span>
          <span className="text-xs text-gray-400">
            均值：{formatTime(benchmarkWatchTime)}
          </span>
        </div>
      </div>

      {/* 完播率 */}
      {completionRate !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">完播率</span>
            <span className="text-sm font-semibold">
              {(completionRate * 100).toFixed(1)}%
            </span>
          </div>
          <ProgressBar
            value={completionRate * 100}
            max={100}
            color={
              completionRate > 0.5
                ? 'bg-green-500'
                : completionRate > 0.3
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }
          />
          <p className="text-xs text-gray-400 mt-1">
            同类均值：{(benchmark.avgCompletionRate * 100).toFixed(1)}%
          </p>
        </div>
      )}

      {/* 评论区双重界限分析 */}
      <div
        className={`rounded-lg p-4 border ${
          commentBoundary === 'danger'
            ? 'bg-red-50 border-red-200'
            : commentBoundary === 'warning'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-semibold text-gray-800">评论区与停留时长分析</h4>
          <Badge
            variant={
              commentBoundary === 'danger' ? 'poor' : commentBoundary === 'warning' ? 'normal' : 'great'
            }
          >
            {commentBoundary === 'danger'
              ? '需注意'
              : commentBoundary === 'warning'
              ? '有风险'
              : '健康'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{commentInsight}</p>

        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-600">评论区双重界限说明：</strong>
          </p>
          <ul className="text-xs text-gray-500 mt-1 space-y-1">
            <li>
              · <span className="text-green-600">健康的评论</span>：增加用户停留，提升内容权重，同时用户仍然关注账号本身 → 涨粉率正常
            </li>
            <li>
              · <span className="text-red-500">过度的评论</span>：用户注意力被评论区"吃掉"，讨论热烈但不关注你 → 涨粉率明显偏低
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
