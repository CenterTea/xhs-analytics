import type { Post, AccountStats } from '../types'

/** 根据绝对指标计算所有相对指标 */
export function calculatePostRates(post: Partial<Post>): Post {
  const impressions = post.impressions ?? 0
  const views = post.views ?? 0
  const likes = post.likes ?? 0
  const saves = post.saves ?? 0
  const comments = post.comments ?? 0
  const shares = post.shares ?? 0
  const newFollowers = post.newFollowers ?? 0
  const effectiveComments = post.effectiveComments ?? 0
  const ineffectiveComments = post.ineffectiveComments ?? 0

  const coverCTR = impressions > 0 ? views / impressions : 0
  const likeRate = views > 0 ? likes / views : 0
  const saveRate = views > 0 ? saves / views : 0
  const commentRate = views > 0 ? comments / views : 0
  const shareRate = views > 0 ? shares / views : 0
  const interactionRate = views > 0 ? (likes + saves + comments + shares) / views : 0
  const followConversionRate = views > 0 ? newFollowers / views : 0
  const effectiveCommentRate = comments > 0 ? effectiveComments / comments : 0

  return {
    ...post,
    impressions,
    views,
    likes,
    saves,
    comments,
    shares,
    newFollowers,
    effectiveComments,
    ineffectiveComments,
    coverCTR,
    likeRate,
    saveRate,
    commentRate,
    shareRate,
    interactionRate,
    followConversionRate,
    effectiveCommentRate,
  } as Post
}

/** 计算账号总体统计数据 */
export function calculateAccountStats(posts: Post[]): AccountStats {
  if (posts.length === 0) {
    return {
      totalPosts: 0,
      totalImpressions: 0,
      totalViews: 0,
      totalInteractions: 0,
      totalFollowers: 0,
      netFollowerGrowth: 0,
      avgCoverCTR: 0,
      avgInteractionRate: 0,
      avgLikeRate: 0,
      avgCommentRate: 0,
      avgShareRate: 0,
      avgSaveRate: 0,
      avgFollowConversionRate: 0,
      contentVerticality: 0,
      topTopics: [],
      fanEngagementRate: 0,
      fanGrowthTrend: 0,
    }
  }

  const totalPosts = posts.length
  const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0)
  const totalViews = posts.reduce((s, p) => s + p.views, 0)
  const totalInteractions = posts.reduce(
    (s, p) => s + p.likes + p.saves + p.comments + p.shares,
    0
  )
  const netFollowerGrowth = posts.reduce((s, p) => s + p.newFollowers, 0)
  const totalFollowers = 0 // 需要从账号数据获取，暂时留空

  const avgCoverCTR = totalImpressions > 0 ? totalViews / totalImpressions : 0
  const avgLikeRate = posts.reduce((s, p) => s + p.likeRate, 0) / totalPosts
  const avgCommentRate = posts.reduce((s, p) => s + p.commentRate, 0) / totalPosts
  const avgShareRate = posts.reduce((s, p) => s + p.shareRate, 0) / totalPosts
  const avgSaveRate = posts.reduce((s, p) => s + p.saveRate, 0) / totalPosts
  const avgInteractionRate =
    posts.reduce((s, p) => s + p.interactionRate, 0) / totalPosts
  const avgFollowConversionRate =
    posts.reduce((s, p) => s + p.followConversionRate, 0) / totalPosts

  // 粉丝增长趋势：简单判断（加速/平缓/下降）
  const sorted = [...posts].sort(
    (a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
  )
  const half = Math.floor(sorted.length / 2)
  const recentAvg =
    sorted.slice(half).reduce((s, p) => s + p.newFollowers, 0) /
    (sorted.length - half)
  const oldAvg =
    sorted.slice(0, half).reduce((s, p) => s + p.newFollowers, 0) / half
  const fanGrowthTrend = oldAvg > 0 ? (recentAvg - oldAvg) / oldAvg : 0

  return {
    totalPosts,
    totalImpressions,
    totalViews,
    totalInteractions,
    totalFollowers,
    netFollowerGrowth,
    avgCoverCTR,
    avgInteractionRate,
    avgLikeRate,
    avgCommentRate,
    avgShareRate,
    avgSaveRate,
    avgFollowConversionRate,
    contentVerticality: 0,
    topTopics: [],
    fanEngagementRate: 0,
    fanGrowthTrend,
  }
}
