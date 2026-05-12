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
        <h4 className="text-sm font-medium text-gray-700 mb-2">为什么转发了？</h4>
        <p className="text-xs text-gray-500">
          {isHigh
            ? '转发率挺高的！说明你的内容让人有"必须分享"的冲动——要么干货太实用了想发给朋友，要么说到心坎里了想转发表达自己，要么太搞笑了忍不住转发。转发是平台最看重的互动行为。'
            : isMedium
            ? '有人转发但不算多。想想你自己平时会因为什么转发？一般是"这个对XX有用"、"这就是我！"、"哈哈哈哈快看"。给你的内容加点这些属性。'
            : '转发偏少。人转发内容一般就三个理由：太有用了（转给需要的人）、太共鸣了（转发就是表达自己）、太有趣了（转发就是分享快乐）。你的内容可以往这三个方向靠一靠。'}
        </p>
      </div>

      <div className="text-xs text-gray-400">
        <p>在小红书，转发是互动里权重最高的行为。一篇帖子转发多，系统就会觉得"这内容不错，多给点流量"。</p>
      </div>
    </div>
  )
}
