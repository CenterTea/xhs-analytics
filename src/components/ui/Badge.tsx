interface BadgeProps {
  variant: 'great' | 'normal' | 'poor' | 'default'
  children: React.ReactNode
}

const colors: Record<BadgeProps['variant'], string> = {
  great: 'bg-green-100 text-green-700',
  normal: 'bg-yellow-100 text-yellow-700',
  poor: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-600',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[variant]}`}>
      {children}
    </span>
  )
}
