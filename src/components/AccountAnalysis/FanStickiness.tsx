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
    </Card>
  )
}
