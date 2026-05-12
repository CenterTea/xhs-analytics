import Badge from '../ui/Badge'
import type { FunnelLayerDiagnosis } from '../../types'

interface FunnelLayerProps {
  label: string
  absoluteValue: number
  relativeValue: number
  relativeLabel: string
  benchmarkValue: number
  diagnosis?: FunnelLayerDiagnosis
}

export default function FunnelLayer({
  label,
  absoluteValue,
  relativeValue,
  relativeLabel,
  benchmarkValue,
  diagnosis,
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

  // 直观的对比条：你的值 vs 均值
  const barMax = Math.max(relativeValue, benchmarkValue) * 1.5
  const yourBarW = barMax > 0 ? (relativeValue / barMax) * 100 : 0
  const benchmarkBarW = barMax > 0 ? (benchmarkValue / barMax) * 100 : 0

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

      {/* 三列数字 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">绝对数值</p>
          <p className="text-xl font-bold text-gray-900">{displayAbsolute}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">你的{relativeLabel}</p>
          <p className="text-xl font-bold text-red-600">{yourPct}%</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">同类均值</p>
          <p className="text-xl font-bold text-gray-600">{benchmarkPct}%</p>
        </div>
      </div>

      {/* 直观对比条 */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">
          一图看懂：你的数据（红色） vs 同类均值（灰色）
        </p>
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

      {/* 解读和建议——直接显示，不折叠 */}
      {diagnosis && (
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <p className="text-sm text-gray-700">{diagnosis.explanation}</p>
          <p className="text-sm text-red-500">{diagnosis.suggestion}</p>
        </div>
      )}
    </div>
  )
}
