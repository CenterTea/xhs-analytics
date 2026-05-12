import type { Benchmark } from '../types'

/**
 * 同类目基准数据
 * 这些数据基于公开信息和行业经验值，后续可更新为更精确的数据
 */
const benchmarks: Benchmark[] = [
  {
    categoryId: 'default',
    categoryName: '通用',
    followerRange: '0-1000',
    avgCoverCTR: 0.08,
    avgCompletionRate: 0.35,
    avgLikeRate: 0.04,
    avgSaveRate: 0.02,
    avgCommentRate: 0.01,
    avgShareRate: 0.005,
    avgInteractionRate: 0.05,
    avgFollowConversionRate: 0.008,
    avgEffectiveCommentRate: 0.65,
  },
  {
    categoryId: 'default',
    categoryName: '通用',
    followerRange: '1000-1w',
    avgCoverCTR: 0.10,
    avgCompletionRate: 0.40,
    avgLikeRate: 0.05,
    avgSaveRate: 0.025,
    avgCommentRate: 0.012,
    avgShareRate: 0.008,
    avgInteractionRate: 0.06,
    avgFollowConversionRate: 0.01,
    avgEffectiveCommentRate: 0.68,
  },
  {
    categoryId: 'beauty',
    categoryName: '美妆护肤',
    followerRange: '0-1000',
    avgCoverCTR: 0.09,
    avgCompletionRate: 0.38,
    avgLikeRate: 0.045,
    avgSaveRate: 0.03,
    avgCommentRate: 0.015,
    avgShareRate: 0.006,
    avgInteractionRate: 0.06,
    avgFollowConversionRate: 0.009,
    avgEffectiveCommentRate: 0.70,
  },
  {
    categoryId: 'fashion',
    categoryName: '穿搭',
    followerRange: '0-1000',
    avgCoverCTR: 0.085,
    avgCompletionRate: 0.36,
    avgLikeRate: 0.04,
    avgSaveRate: 0.025,
    avgCommentRate: 0.012,
    avgShareRate: 0.007,
    avgInteractionRate: 0.055,
    avgFollowConversionRate: 0.008,
    avgEffectiveCommentRate: 0.66,
  },
  {
    categoryId: 'food',
    categoryName: '美食',
    followerRange: '0-1000',
    avgCoverCTR: 0.095,
    avgCompletionRate: 0.42,
    avgLikeRate: 0.05,
    avgSaveRate: 0.035,
    avgCommentRate: 0.018,
    avgShareRate: 0.01,
    avgInteractionRate: 0.07,
    avgFollowConversionRate: 0.01,
    avgEffectiveCommentRate: 0.72,
  },
  {
    categoryId: 'travel',
    categoryName: '旅行',
    followerRange: '0-1000',
    avgCoverCTR: 0.09,
    avgCompletionRate: 0.40,
    avgLikeRate: 0.045,
    avgSaveRate: 0.04,
    avgCommentRate: 0.02,
    avgShareRate: 0.012,
    avgInteractionRate: 0.07,
    avgFollowConversionRate: 0.012,
    avgEffectiveCommentRate: 0.73,
  },
  {
    categoryId: 'lifestyle',
    categoryName: '生活/Vlog',
    followerRange: '0-1000',
    avgCoverCTR: 0.075,
    avgCompletionRate: 0.33,
    avgLikeRate: 0.038,
    avgSaveRate: 0.018,
    avgCommentRate: 0.01,
    avgShareRate: 0.006,
    avgInteractionRate: 0.048,
    avgFollowConversionRate: 0.007,
    avgEffectiveCommentRate: 0.63,
  },
  {
    categoryId: 'knowledge',
    categoryName: '知识/干货',
    followerRange: '0-1000',
    avgCoverCTR: 0.07,
    avgCompletionRate: 0.45,
    avgLikeRate: 0.042,
    avgSaveRate: 0.05,
    avgCommentRate: 0.022,
    avgShareRate: 0.015,
    avgInteractionRate: 0.078,
    avgFollowConversionRate: 0.015,
    avgEffectiveCommentRate: 0.78,
  },
]

/** 根据内容类型和粉丝量级获取基准数据 */
export function getBenchmark(
  categoryId: string,
  followerCount: number
): Benchmark {
  const range =
    followerCount < 1000
      ? '0-1000'
      : followerCount < 10000
      ? '1000-1w'
      : '1w-10w'

  const match =
    benchmarks.find((b) => b.categoryId === categoryId && b.followerRange === range) ??
    benchmarks.find((b) => b.categoryId === 'default' && b.followerRange === range)

  return match ?? benchmarks[0]
}

/** 获取所有基准数据 */
export function getAllBenchmarks(): Benchmark[] {
  return benchmarks
}
