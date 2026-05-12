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
        <span className="text-sm text-gray-600">总评论数</span>
        <span className="text-lg font-bold text-gray-900">{total}</span>
      </div>

      <div>
        <ProgressBar
          label="有效评论占比"
          value={effectiveRate * 100}
          max={100}
          color={effectiveRate >= 0.6 ? 'bg-green-500' : effectiveRate >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}
        />
        <p className="text-xs text-gray-400 mt-1">
          有效评论 {effective} 条 · 水评论 {ineffective} 条
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">怎么区分评论有没有用？</h4>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>
              <strong className="text-gray-600">有用的评论：</strong>
              说自己的看法、问问题、补充信息、分享经历。这种评论说明你的内容引发了真正的讨论。
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5">✗</span>
            <span>
              <strong className="text-gray-600">水评论：</strong>
              艾特别人、纯发表情、"哈哈哈"、"好看"。这种评论虽然增加了评论数，但对你的内容没什么实际帮助，算法其实也能识别出来。
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
