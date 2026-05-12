import type { ReferencePost } from '../../types'

interface ReferencePostsProps {
  references: ReferencePost[]
  post: import('../../types').Post
}

export default function ReferencePosts({ references, post }: ReferencePostsProps) {
  if (references.length === 0) {
    return <p className="text-gray-400 text-sm">暂无匹配的参考案例</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        以下参考案例来自粉丝数 {references[0].followerCount < 2000 ? '较少' : '不多的'} 普通创作者，
        他们在自然流量下获得了高转化率。参考素人比参考大V更有实际意义。
      </p>

      {references.map((ref) => (
        <div key={ref.id} className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">{ref.title}</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {[
              { label: '粉丝数', value: ref.followerCount.toLocaleString() },
              { label: '曝光量', value: `${(ref.impressions / 10000).toFixed(1)}万` },
              { label: '封面点击率', value: `${(ref.coverCTR * 100).toFixed(1)}%` },
              { label: '点赞率', value: `${(ref.likeRate * 100).toFixed(1)}%` },
              { label: '收藏率', value: `${(ref.saveRate * 100).toFixed(1)}%` },
              { label: '评论率', value: `${(ref.commentRate * 100).toFixed(1)}%` },
              { label: '转发率', value: `${(ref.shareRate * 100).toFixed(1)}%` },
              { label: '涨粉率', value: `${(ref.followConversionRate * 100).toFixed(2)}%` },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="text-sm font-semibold text-gray-800">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3">
            <p className="text-xs text-green-700 font-medium mb-1">为什么这篇帖子成功了？</p>
            <p className="text-sm text-green-600">{ref.successReason}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">你可以学习的点：</p>
            <ul className="list-disc list-inside space-y-0.5">
              {ref.learnablePoints.map((point, i) => (
                <li key={i} className="text-sm text-gray-600">{point}</li>
              ))}
            </ul>
          </div>

          {/* 对比：你的数据 vs 参考 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">与你的帖子对比：</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-gray-400">封面点击率</p>
                <p className={`text-sm font-semibold ${post.coverCTR >= ref.coverCTR ? 'text-green-600' : 'text-red-500'}`}>
                  你 {(post.coverCTR * 100).toFixed(1)}% vs 素人 {(ref.coverCTR * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">互动率</p>
                <p className={`text-sm font-semibold ${post.interactionRate >= (ref.likeRate + ref.saveRate + ref.commentRate + ref.shareRate) ? 'text-green-600' : 'text-red-500'}`}>
                  你 {(post.interactionRate * 100).toFixed(1)}% vs 素人 {((ref.likeRate + ref.saveRate + ref.commentRate + ref.shareRate) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">涨粉率</p>
                <p className={`text-sm font-semibold ${post.followConversionRate >= ref.followConversionRate ? 'text-green-600' : 'text-red-500'}`}>
                  你 {(post.followConversionRate * 100).toFixed(2)}% vs 素人 {(ref.followConversionRate * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
