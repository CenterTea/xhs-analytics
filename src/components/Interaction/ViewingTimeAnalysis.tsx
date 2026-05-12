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

  const isCommentHeavy = commentRate > 0.02
  const watchTimeHigh = watchTimeDiff > 0.4
  const conversionLow = followConversionRate < 0.005

  let commentBoundary: 'healthy' | 'warning' | 'danger' = 'healthy'
  let commentInsight = ''

  if (watchTimeHigh && isCommentHeavy && conversionLow) {
    commentBoundary = 'danger'
    commentInsight =
      '平均观看时长（Avg Watch Time）显著高于同类均值 + 评论率高 + 涨粉转化率低。这是一个危险信号——用户在你的评论区投入了大量时间讨论，但最终没有关注你。评论区的活跃反而"吃掉"了本该流向关注行为的注意力。\n\n' +
      '说人话：大家在你评论区聊得特别嗨，但聊完就走了，忘了关注你这个人。就像你开了个茶馆，客人在你店里聊得很开心，但没人记得老板是谁。建议你在评论区多露脸、置顶一条引导关注的评论。'
  } else if (watchTimeHigh && isCommentHeavy) {
    commentBoundary = 'warning'
    commentInsight =
      '观看时长和评论率都较高。评论区活跃是正面的互动信号，但需要警惕：如果涨粉转化率偏低，说明用户把你这当"聊天室"而不是"关注对象"。\n\n' +
      '说人话：评论区热闹是好事，但别让热闹掩盖了问题。在评论里回一回大家，顺便说一句"觉得有用可以关注我"——把聊天的人变成关注你的人。'
  } else if (watchTimeHigh && !isCommentHeavy) {
    commentInsight =
      '观看时长高于同类均值，且不是由评论驱动的——说明内容本身的信息密度和质量较高，用户是因为内容好才停留。这是最健康的停留时长增长模式。\n\n' +
      '说人话：用户在你这儿待得久，不是因为在评论区聊天，而是你的内容真的好看、有料。继续保持这个内容节奏。'
  } else if (!watchTimeHigh && isCommentHeavy) {
    commentInsight =
      '评论率较高但观看时长并未显著增长——说明评论偏向浅层互动（@好友、表情回复等），而非引发深度停留的讨论。\n\n' +
      '说人话：评论挺多但大家没怎么看。说明评论都是"@小明"、"哈哈哈"这种，没有真正讨论起来。试试在内容结尾抛个更有深度的问题。'
  } else {
    commentInsight =
      '观看时长和评论率均在正常范围。如果想提升用户停留时长，可以增加内容的信息密度，或在结尾设置一个有讨论空间的互动问题。'
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}分${sec}秒`
  }

  return (
    <div className="space-y-4">
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
          <span className="text-xs text-gray-500">你的：{formatTime(watchTime)}</span>
          <span className="text-xs text-gray-400">同类均值：{formatTime(benchmarkWatchTime)}</span>
        </div>
      </div>

      {completionRate !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">完播率（Completion Rate）</span>
            <span className="text-sm font-semibold">{(completionRate * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar
            value={completionRate * 100}
            max={100}
            color={
              completionRate > 0.5 ? 'bg-green-500' : completionRate > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
            }
          />
          <p className="text-xs text-gray-400 mt-1">同类均值：{(benchmark.avgCompletionRate * 100).toFixed(1)}%</p>
        </div>
      )}

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
          <h4 className="text-sm font-semibold text-gray-800">评论区与停留时长的关联分析</h4>
          <Badge
            variant={commentBoundary === 'danger' ? 'poor' : commentBoundary === 'warning' ? 'normal' : 'great'}
          >
            {commentBoundary === 'danger' ? '需警惕' : commentBoundary === 'warning' ? '有风险' : '健康'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{commentInsight}</p>

        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-600">评论区的双重效应：</strong>
          </p>
          <ul className="text-xs text-gray-500 mt-1 space-y-1">
            <li>
              · <span className="text-green-600">正向效应——</span>高质量评论增加用户停留时长 → 提升内容在算法中的权重 → 获得更多流量 → 涨粉率同步提升
            </li>
            <li>
              · <span className="text-red-500">负向效应——</span>评论区过度活跃但讨论与账号无关 → 用户注意力被评论区"吃掉" → 停留时长长的但涨粉率低 → 算法推送了内容但没帮到你
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
