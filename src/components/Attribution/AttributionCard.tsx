import type { Diagnosis } from '../../types'
import Badge from '../ui/Badge'

interface AttributionCardProps {
  diagnosis: Diagnosis
}

export default function AttributionCard({ diagnosis }: AttributionCardProps) {
  return (
    <div className="space-y-6">
      {/* 根本问题 */}
      <div className="bg-red-50 border border-red-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-700 mb-1">问题诊断</h3>
        <p className="text-red-600">{diagnosis.rootCause}</p>
      </div>

      {/* 归因分析 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">归因分析</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{diagnosis.attribution}</p>
      </div>

      {/* 漏斗逐层诊断 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">逐层诊断</h3>
        <div className="space-y-2">
          {diagnosis.funnelDiagnosis.map((d) => (
            <div
              key={d.layer}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">{d.layer}</p>
                <p className="text-xs text-gray-400">
                  你的：{(d.yourValue * 100).toFixed(2)}% · 均值：{(d.benchmarkValue * 100).toFixed(2)}%
                </p>
              </div>
              <div className="text-right">
                <Badge variant={d.rating}>
                  {d.rating === 'great' ? '优秀' : d.rating === 'normal' ? '一般' : '需改进'}
                </Badge>
                <p
                  className={`text-xs mt-0.5 ${
                    d.diff >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {d.diff >= 0 ? '+' : ''}
                  {(d.diff * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 改进建议 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">改进建议</h3>
        <div className="space-y-3">
          {diagnosis.improvements.map((imp, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                imp.priority === 'high'
                  ? 'bg-red-50 border-red-200'
                  : imp.priority === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={imp.priority === 'high' ? 'poor' : imp.priority === 'medium' ? 'normal' : 'great'}>
                  {imp.priority === 'high' ? '优先' : imp.priority === 'medium' ? '建议' : '可选'}
                </Badge>
                <span className="text-xs text-gray-500">{imp.category}</span>
              </div>
              <p className="text-sm text-gray-700">{imp.description}</p>
              {imp.referenceExample && (
                <p className="text-xs text-gray-400 mt-1">参考：{imp.referenceExample}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
