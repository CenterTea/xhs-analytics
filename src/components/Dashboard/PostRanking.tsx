import type { Post } from '../../types'

interface PostRankingProps {
  posts: Post[]
  sortKey: 'interactionRate' | 'followConversionRate' | 'likes'
  onPostClick: (post: Post) => void
}

export default function PostRanking({
  posts,
  sortKey,
  onPostClick,
}: PostRankingProps) {
  const sorted = [...posts]
    .sort((a, b) => {
      if (sortKey === 'likes') return b.likes - a.likes
      if (sortKey === 'interactionRate') return b.interactionRate - a.interactionRate
      return b.followConversionRate - a.followConversionRate
    })
    .slice(0, 8)

  if (sorted.length === 0) {
    return <p className="text-gray-400 text-sm">暂无数据</p>
  }

  return (
    <div className="space-y-2">
      {sorted.map((post, index) => {
        const value =
          sortKey === 'likes'
            ? `${post.likes} 赞`
            : sortKey === 'interactionRate'
            ? `${(post.interactionRate * 100).toFixed(1)}%`
            : `${(post.followConversionRate * 100).toFixed(2)}%`

        return (
          <button
            key={post.id}
            onClick={() => onPostClick(post)}
            className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0
                  ? 'bg-red-100 text-red-600'
                  : index === 1
                  ? 'bg-orange-100 text-orange-600'
                  : index === 2
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{post.title}</p>
              <p className="text-xs text-gray-400">{post.publishDate}</p>
            </div>
            <span className="text-sm font-medium text-gray-700 shrink-0">
              {value}
            </span>
          </button>
        )
      })}
    </div>
  )
}
