import type { Benchmark } from '../types'

/**
 * ⚠️ 重要说明：以下数据为行业参考值，非实时官方数据
 *
 * 数据来源说明：
 * 1. 参考新红、千瓜等第三方数据分析平台的行业报告（2024年）
 * 2. 参考小红书官方发布的创作者运营指南
 * 3. 参考创作者社群分享的经验值和业内普遍认知
 * 4. 按粉丝量级分层统计的新手期账号平均表现
 *
 * 数据局限性：
 * - 这些是行业平均参考值，不是实时的小红书官方数据
 * - 不同内容类型、不同时间段数据会有差异
 * - 仅供参考，帮助新手创作者了解自己的相对位置
 *
 * 如需更精确的对比，建议使用专业数据分析工具或加入创作者社群交流
 */

const benchmarks: Benchmark[] = [
  {
    categoryId: 'default',
    categoryName: '通用',
    followerRange: '0-1000',
    avgCoverCTR: 0.08,        // 行业参考：新手账号平均封面点击率 6-10%
    avgWatchTime: 25,         // 行业参考：平均停留时长 20-30秒
    avgCompletionRate: 0.35,  // 行业参考：完播率 30-40%
    avgLikeRate: 0.04,        // 行业参考：点赞率 3-5%
    avgSaveRate: 0.02,        // 行业参考：收藏率 1.5-3%
    avgCommentRate: 0.01,     // 行业参考：评论率 0.8-1.5%
    avgShareRate: 0.005,      // 行业参考：分享率 0.3-0.8%
    avgInteractionRate: 0.05, // 行业参考：总互动率 4-6%
    avgFollowConversionRate: 0.008, // 行业参考：涨粉率 0.5-1%
    avgEffectiveCommentRate: 0.65,  // 行业参考：有效评论占比 60-70%
  },
  {
    categoryId: 'default',
    categoryName: '通用',
    followerRange: '1000-1w',
    avgCoverCTR: 0.10,
    avgWatchTime: 30,
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
    avgWatchTime: 28,
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
    avgWatchTime: 22,
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
    avgWatchTime: 30,
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
    avgWatchTime: 35,
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
    avgWatchTime: 20,
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
    avgWatchTime: 45,
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

/**
 * 获取基准数据说明
 */
export function getBenchmarkInfo(): string {
  return `
数据来源：新红/千瓜等平台行业报告 + 小红书官方创作者指南 + 创作者社群经验值
数据性质：行业参考平均值，非实时官方数据
适用对象：新手期账号（0-1000粉丝）
更新时间：2024年
局限性：仅供参考，实际数据因内容类型、时间段会有差异
  `.trim()
}

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
