import ProgressBar from '../ui/ProgressBar'

interface ShareAnalysisProps {
  shares: number
  shareRate: number
}

export default function ShareAnalysis({ shares, shareRate }: ShareAnalysisProps) {
  const shareRatePct = shareRate * 100
  const isHigh = shareRatePct > 1.0
  const isMedium = shareRatePct > 0.5

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">转发量</span>
        <span className="text-lg font-bold text-gray-900">{shares}</span>
      </div>

      <ProgressBar
        label="转发率"
        value={shareRatePct}
        max={2}
        color={isHigh ? 'bg-green-500' : isMedium ? 'bg-yellow-500' : 'bg-gray-400'}
      />

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">转发原因推测</h4>
        <p className="text-xs text-gray-500">
          {isHigh
            ? '转发率高，说明内容有很强的分享价值——可能是干货（收藏型转发）、观点共鸣（态度型转发）、或内容有趣（娱乐型转发）'
            : isMedium
            ? '转发率中等，内容有一定的分享价值，但可能缺乏"必须转发"的强烈动机'
            : '转发率较低，可以考虑增加内容的"社交货币"属性——让用户觉得转发你的内容能帮助朋友、表达自己'}
        </p>
      </div>

      <div className="text-xs text-gray-400">
        <p>转发是互动中权重最高的行为，平台算法会重点考虑转发量来分配流量。</p>
      </div>
    </div>
  )
}
