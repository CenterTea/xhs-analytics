import Badge from '../ui/Badge'
import type { FunnelLayerDiagnosis } from '../../types'

interface FunnelLayerProps {
  label: string
  absoluteValue: number
  relativeValue: number
  relativeLabel: string
  benchmarkValue: number
  diagnosis?: FunnelLayerDiagnosis
  layerType: 'exposure' | 'ctr' | 'interaction' | 'conversion'
}

// 各层的详细解释
const layerExplanations: Record<string, { what: string; why: string; how: string }> = {
  exposure: {
    what: '曝光量就是系统把你的内容推给了多少人看。',
    why: '曝光量主要取决于你的账号权重和内容标签匹配度。新账号通常曝光较低，这是正常的。',
    how: '提升方法：保持更新频率、内容标签要精准、互动率高的内容会获得更多推荐。',
  },
  ctr: {
    what: '封面点击率（CTR）= 看到封面的人里有多少人点进来。这是最重要的第一层筛选。',
    why: '用户刷到一堆内容，凭什么点你的？封面和标题必须在0.5秒内抓住注意力。',
    how: '提升方法：封面要高清有重点、标题要有情绪词或数字、前三秒要有钩子。',
  },
  interaction: {
    what: '互动率 = 看完的人里有多少人点赞/收藏/评论/分享。这是平台判断内容质量的核心指标。',
    why: '互动率高说明内容有价值，平台会继续推给更多人。收藏和评论的权重比点赞更高。',
    how: '提升方法：内容要有干货或情绪共鸣、结尾引导互动、多回复评论增加互动数。',
  },
  conversion: {
    what: '涨粉率 = 看完的人里有多少人关注你。这代表内容的长期关注价值。',
    why: '用户关注你是因为期待看到更多类似内容。人设感越强、系列感越强，涨粉率越高。',
    how: '提升方法：建立内容系列感、个人特色要鲜明、主页内容风格要统一。',
  },
}

export default function FunnelLayer({
  label,
  absoluteValue,
  relativeValue,
  relativeLabel,
  benchmarkValue,
  diagnosis,
  layerType,
}: FunnelLayerProps) {
  const diff = benchmarkValue > 0 ? (relativeValue - benchmarkValue) / benchmarkValue : 0
  const rating: 'great' | 'normal' | 'poor' =
    diff > 0.5 ? 'great' : diff >= -0.3 ? 'normal' : 'poor'

  const displayAbsolute =
    absoluteValue >= 10000
      ? `${(absoluteValue / 10000).toFixed(1)}万`
      : absoluteValue.toLocaleString()

  const yourPct = (relativeValue * 100).toFixed(2)
  const benchmarkPct = (benchmarkValue * 100).toFixed(2)

  // 双条对比：用户 vs 均值
  const maxValue = Math.max(relativeValue, benchmarkValue) * 1.2
  const yourBarW = maxValue > 0 ? (relativeValue / maxValue) * 100 : 0
  const benchmarkBarW = maxValue > 0 ? (benchmarkValue / maxValue) * 100 : 0

  const explanation = layerExplanations[layerType]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <Badge variant={rating}>
            {rating === 'great' ? '优秀' : rating === 'normal' ? '一般' : '需改进'}
          </Badge>
        </div>
      </div>

      {/* 数据解释 */}
      {explanation && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
          <p><span className="font-medium text-gray-700">是什么：</span>{explanation.what}</p>
          <p><span className="font-medium text-gray-700">为什么重要：</span>{explanation.why}</p>
        </div>
      )}

      {/* 三列数字 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">绝对数值</p>
          <p className="text-xl font-bold text-gray-900">{displayAbsolute}</p>
          <p className="text-xs text-gray-400 mt-1">原始数据</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">你的{relativeLabel}</p>
          <p className="text-xl font-bold text-red-600">{yourPct}%</p>
          <p className="text-xs text-gray-500 mt-1">{relativeLabel === '封面点击率' ? '点击÷曝光' : relativeLabel === '互动率' ? '互动÷阅读' : '转化÷阅读'}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">同类均值</p>
          <p className="text-xl font-bold text-gray-600">{benchmarkPct}%</p>
          <p className="text-xs text-gray-400 mt-1">同量级账号平均</p>
        </div>
      </div>

      {/* 直观对比条 */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">对比图：红色=你的数据，灰色=同类均值</p>
        <div className="space-y-2">
          {/* 你的 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 w-12 shrink-0">你</span>
            <div className="flex-1 h-5 bg-gray-100 rounded relative">
              <div
                className="absolute left-0 top-0 h-5 bg-red-400 rounded"
                style={{ width: `${Math.max(yourBarW, 1)}%` }}
              />
            </div>
            <span className="text-xs text-red-600 w-14 text-right shrink-0">{yourPct}%</span>
          </div>
          {/* 均值 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12 shrink-0">均值</span>
            <div className="flex-1 h-5 bg-gray-100 rounded relative">
              <div
                className="absolute left-0 top-0 h-5 bg-gray-400 rounded"
                style={{ width: `${Math.max(benchmarkBarW, 1)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-14 text-right shrink-0">{benchmarkPct}%</span>
          </div>
        </div>
        <p className={`text-xs mt-1.5 ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {diff >= 0 ? '高于' : '低于'}均值 {Math.abs(diff * 100).toFixed(0)}%
        </p>
      </div>

      {/* 解读和建议 */}
      {diagnosis && (
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <p className="text-sm text-gray-700"><span className="font-medium">诊断：</span>{diagnosis.explanation}</p>
          <p className="text-sm text-red-500"><span className="font-medium">建议：</span>{diagnosis.suggestion}</p>
          {explanation && (
            <p className="text-sm text-gray-500"><span className="font-medium">提升方法：</span>{explanation.how}</p>
          )}
        </div>
      )}
    </div>
  )
}
