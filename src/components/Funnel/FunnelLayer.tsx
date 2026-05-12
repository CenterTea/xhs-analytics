import { useState } from 'react'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
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
  const [expanded, setExpanded] = useState(false)

  const diff = benchmarkValue > 0 ? (relativeValue - benchmarkValue) / benchmarkValue : 0
  const rating: 'great' | 'normal' | 'poor' =
    diff > 0.5 ? 'great' : diff >= -0.3 ? 'normal' : 'poor'

  const displayAbsolute =
    absoluteValue >= 10000
      ? `${(absoluteValue / 10000).toFixed(1)}万`
      : absoluteValue.toLocaleString()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <Badge variant={rating}>
              {rating === 'great' ? '优秀' : rating === 'normal' ? '一般' : '需改进'}
            </Badge>
          </div>
          <span className="text-gray-400 text-sm">
            {expanded ? '收起 ▲' : '展开 ▼'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-xs text-gray-400">绝对数值</p>
            <p className="text-xl font-bold text-gray-900">{displayAbsolute}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">{relativeLabel}（你的）</p>
            <p className="text-xl font-bold text-gray-900">
              {(relativeValue * 100).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">同类目均值</p>
            <p className="text-xl font-bold text-gray-500">
              {(benchmarkValue * 100).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar
            value={relativeValue}
            max={benchmarkValue * 2}
            color={rating === 'great' ? 'bg-green-500' : rating === 'normal' ? 'bg-yellow-500' : 'bg-red-500'}
            showPercent={false}
          />
          <p className="text-xs text-gray-400 mt-1">
            差值：{diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}% vs 同类目均值
          </p>
        </div>
      </button>

      {expanded && diagnosis && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-700">{diagnosis.explanation}</p>
          <p className="text-sm text-red-500 mt-2 italic">{diagnosis.suggestion}</p>
        </div>
      )}
    </div>
  )
}
