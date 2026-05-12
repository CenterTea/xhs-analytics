import Card from '../ui/Card'

interface DirectionAdviceProps {
  direction: string
  monetization: { score: number; suitableFor: string[] }
}

export default function DirectionAdvice({ direction }: DirectionAdviceProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">账号方向建议</h2>
      <p className="text-sm text-gray-700 leading-relaxed">{direction}</p>
    </Card>
  )
}
