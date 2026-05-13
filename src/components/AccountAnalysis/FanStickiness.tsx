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
            color={data.score >= 80 ? 'bg-green-500' : data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
          />
          <p className="text-xs text-gray-400 mt-1">60分为及格线</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">粉丝互动占比</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {(data.fanEngagementRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">粉丝互动 / 总互动</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">净增粉丝</p>
          <p className={`text-2xl font-bold ${data.newVsLostFollowers.gained >= 0 ? 'text-green-600' : 'text-red-400'}`}>
            {data.newVsLostFollowers.gained >= 0 ? '+' : ''}{data.newVsLostFollowers.gained}
          </p>
          <p className="text-xs text-gray-400">数据周期内净增</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4">{data.assessment}</p>
      <p className="text-sm text-gray-500 mt-1 italic">{data.suggestion}</p>

      {/* 得分依据 + 流失粉丝估算说明 */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 粘性得分维度</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• 粉丝增长趋势 {'>'} +15% → 75分起步 + 增长系数 → 得分 75-100</p>
            <p>• 粉丝增长趋势 -5% ~ +15% → 60分起步 ± 趋势系数 → 得分 50-80</p>
            <p>• 粉丝增长趋势 {'<'} -5% → 60分起步 + 趋势系数（负数） → 得分 0-60</p>
          </div>
        </div>

      </div>
    </Card>
  )
}
