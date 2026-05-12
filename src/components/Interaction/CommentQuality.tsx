import ProgressBar from '../ui/ProgressBar'

interface CommentQualityProps {
  effective: number
  ineffective: number
}

export default function CommentQuality({ effective, ineffective }: CommentQualityProps) {
  const total = effective + ineffective
  const effectiveRate = total > 0 ? effective / total : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">总评论</span>
        <span className="text-lg font-bold text-gray-900">{total}</span>
      </div>

      <div>
        <ProgressBar
          label="有效评论率"
          value={effectiveRate * 100}
          max={100}
          color={effectiveRate >= 0.6 ? 'bg-green-500' : effectiveRate >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}
        />
        <p className="text-xs text-gray-400 mt-1">
          有效评论 {effective} 条 · 无效评论 {ineffective} 条
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">评论分类说明</h4>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>
              <strong className="text-gray-600">有效评论：</strong>
              表达观点、提问、补充信息、分享个人体验的评论。反映内容的讨论价值。
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5">✗</span>
            <span>
              <strong className="text-gray-600">无效评论：</strong>
              @好友（无实质内容）、纯表情、单字/两字回复。这些评论对内容提升没有帮助。
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
