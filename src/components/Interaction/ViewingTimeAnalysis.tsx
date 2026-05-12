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
      '大家在你帖子评论区聊得很嗨——这是好事也是坏事。好事是评论区确实热闹，大家愿意待在这儿；坏事是大家光顾着在评论区聊天了，聊完就走了，忘了关注你这个人。就像你开了个茶馆，大家在你店里聊得很开心，但没人记得茶馆老板是谁。建议你在评论区里多露露脸，或者置顶一条自己的评论引导大家关注你。'
  } else if (watchTimeHigh && isCommentHeavy) {
    commentBoundary = 'warning'
    commentInsight =
      '大家在你这里待得挺久的，评论也挺热闹。但别大意——如果涨粉不多，说明用户在把你这当"聊天室"而不是"关注对象"。可以试着在评论区里回一回大家，顺便说一句"觉得有用可以关注我，后面还有"。把聊天的人变成关注你的人。'
  } else if (watchTimeHigh && !isCommentHeavy) {
    commentInsight =
      '用户在你这儿待的时间比大多数同类内容都长，而且不是因为评论多——是因为你的内容本身好看、有料。这是最健康的情况！用户是真觉得你的内容值得花时间。继续保持这个内容的节奏和深度。'
  } else if (!watchTimeHigh && isCommentHeavy) {
    commentInsight =
      '评论挺多的，但用户停留时间并没有特别长。说明评论内容比较"浅"——比如大多是艾特别人、发个表情之类的。可以试试在内容结尾抛一个更有意思的问题，让大家不只是@朋友，而是真的想发表自己的看法。'
  } else {
    commentInsight =
      '观看时长和评论都在正常范围。想让人在你这里待更久？加点"信息量"——多给点干货，或者结尾留个有讨论空间的话题。人都是这样，看到有东西可聊就忍不住停下来。'
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
          <p className="text-xs text-gray-400">平均每人看多久</p>
          <p className="text-2xl font-bold text-gray-900">
            {avgWatchTime ? formatTime(avgWatchTime) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">总共被看了多久</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalWatchTime ? formatTime(totalWatchTime) : '-'}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-2">和同类内容比，你的停留时长如何？</p>
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
            你：{formatTime(watchTime)}
          </span>
          <span className="text-xs text-gray-400">
            大家平均：{formatTime(benchmarkWatchTime)}
          </span>
        </div>
      </div>

      {completionRate !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">完播率（多少人看完了）</span>
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
            大家平均完播率：{(benchmark.avgCompletionRate * 100).toFixed(1)}%
          </p>
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
          <h4 className="text-sm font-semibold text-gray-800">评论区是在帮你还是害你？</h4>
          <Badge
            variant={
              commentBoundary === 'danger' ? 'poor' : commentBoundary === 'warning' ? 'normal' : 'great'
            }
          >
            {commentBoundary === 'danger'
              ? '要注意了'
              : commentBoundary === 'warning'
              ? '有点风险'
              : '挺健康'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{commentInsight}</p>

        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-600">评论区是把双刃剑：</strong>
          </p>
          <ul className="text-xs text-gray-500 mt-1 space-y-1">
            <li>
              · <span className="text-green-600">用得好：</span>大家聊得开心同时记得关注你 → 停留时长和涨粉率都不错 👍
            </li>
            <li>
              · <span className="text-red-500">用得不好：</span>大家光顾着在评论区吵架/聊天，忘了你是谁 → 停留时长长的但没人关注你 😅
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
