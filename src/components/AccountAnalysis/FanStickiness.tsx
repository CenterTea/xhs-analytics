import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'

interface FanStickinessData {
  score: number
  fanEngagementRate: number
  newVsLostFollowers: { gained: number; lost: number }
  assessment: string
  suggestion: string
}

export default function FanStickiness({ data }: { data: FanStickinessData }) {
  // 反推粉丝增长趋势用于展示计算依据
  const trendFromScore = data.score >= 70 ? ((data.score - 70) / 100) : ((data.score - 50) / 50)

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">粉丝粘性</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">粘性得分</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">{data.score}</span>
            <span className="text-gray-400 text-sm mb-1">/ 100</span>
          </div>
          <ProgressBar
            value={data.score}
            max={100}
            color={data.score >= 60 ? 'bg-green-500' : data.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">粉丝互动占比</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {(data.fanEngagementRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">粉丝互动 / 总互动</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">新增 vs 流失</p>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-lg font-bold text-green-600">+{data.newVsLostFollowers.gained}</p>
              <p className="text-xs text-gray-400">新增粉丝</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">-{data.newVsLostFollowers.lost}</p>
              <p className="text-xs text-gray-400">流失粉丝（估算）</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4">{data.assessment}</p>
      <p className="text-sm text-gray-500 mt-1 italic">{data.suggestion}</p>

      {/* 得分依据 */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 得分维度</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <p><strong>粉丝增长趋势</strong> — 得分核心依据</p>
          <p>• 趋势 {'>'} +10%（加速增长）→ 基础分70 + 增长系数 → 得分 {Math.min(100, Math.round(70 + Math.max(0, trendFromScore) * 100))}</p>
          <p>• 趋势 -10% ~ +10%（平缓增长）→ 基础分50 ± 趋势系数 → 得分 40-60</p>
          <p>• 趋势 {'<'} -10%（下降趋势）→ 基础分50 - 下降系数 → 得分 0-40</p>
          <p className="text-gray-400 mt-1">流失粉丝按新增粉丝的30%估算（行业参考值）</p>
        </div>
      </div>
    </Card>
  )
}
