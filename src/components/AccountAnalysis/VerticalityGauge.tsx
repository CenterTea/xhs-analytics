import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'

interface VerticalityData {
  score: number
  mainTopics: { topic: string; weight: number }[]
  assessment: string
  suggestion: string
}

export default function VerticalityGauge({ data }: { data: VerticalityData }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">内容垂直度</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-bold text-gray-900">{data.score}</span>
            <span className="text-gray-400 text-sm mb-1">/ 100</span>
          </div>
          <ProgressBar
            value={data.score}
            max={100}
            color={data.score >= 70 ? 'bg-green-500' : data.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
          />
          <p className="text-sm text-gray-600 mt-3">{data.assessment}</p>
          <p className="text-sm text-gray-500 mt-2 italic">{data.suggestion}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">主要话题分布</h4>
          <div className="space-y-2">
            {data.mainTopics.map((t) => (
              <div key={t.topic} className="flex items-center gap-2">
                <span className="text-sm text-gray-700 w-24 truncate">{t.topic}</span>
                <div className="flex-1">
                  <ProgressBar value={t.weight * 100} max={100} color="bg-red-400" showPercent={false} />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {Math.round(t.weight * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
