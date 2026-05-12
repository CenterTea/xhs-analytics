import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Badge from '../ui/Badge'

interface MonetizationData {
  score: number
  suitableFor: string[]
  readiness: string
  suggestion: string
}

export default function MonetizationMatrix({ data }: { data: MonetizationData }) {
  const variant = data.score >= 70 ? 'great' : data.score >= 45 ? 'normal' : 'poor'

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">变现潜力评估</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-bold text-gray-900">{data.score}</span>
            <span className="text-gray-400 text-sm mb-1">/ 100</span>
            <Badge variant={variant}>
              {data.score >= 70 ? '可尝试变现' : data.score >= 45 ? '积累中' : '先养号'}
            </Badge>
          </div>
          <ProgressBar
            value={data.score}
            max={100}
            color={data.score >= 70 ? 'bg-green-500' : data.score >= 45 ? 'bg-yellow-500' : 'bg-gray-400'}
          />
          <p className="text-sm text-gray-600 mt-3">{data.readiness}</p>

          {/* 得分依据 */}
          <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 得分计算方式</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p>变现潜力分 = 内容垂直度 × 40% + 粉丝粘性 × 30% + 互动率表现 × 30%</p>
              <p>• 内容垂直度：聚焦度越高，品牌方越愿意合作</p>
              <p>• 粉丝粘性：粉丝留存意愿决定长期变现能力</p>
              <p>• 互动率表现：互动率 × 1000（封顶100分）</p>
              <p className="text-gray-400 mt-1">分级标准：≥70分（可变现），45-70分（积累中），&lt;45分（先养号）</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">适合的变现方式</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.suitableFor.map((item) => (
              <span
                key={item}
                className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 italic">{data.suggestion}</p>
        </div>
      </div>
    </Card>
  )
}
