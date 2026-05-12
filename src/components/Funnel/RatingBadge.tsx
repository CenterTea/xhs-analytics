interface RatingBadgeProps {
  rating: 'great' | 'normal' | 'poor'
}

const config = {
  great: { label: '优秀', color: 'bg-green-100 text-green-700 border-green-200' },
  normal: { label: '一般', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  poor: { label: '需改进', color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function RatingBadge({ rating }: RatingBadgeProps) {
  const { label, color } = config[rating]

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      {label}
    </span>
  )
}
