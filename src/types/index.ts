// 单篇帖子
export interface Post {
  id: string
  title: string
  type: 'image' | 'video'
  publishDate: string
  coverUrl?: string
  topics: string[]

  impressions: number
  views: number
  avgWatchTime?: number
  completionRate?: number
  likes: number
  saves: number
  comments: number
  shares: number
  newFollowers: number

  effectiveComments: number
  ineffectiveComments: number

  trafficSources?: {
    recommend: number
    search: number
    following: number
    profile: number
    other: number
  }

  coverCTR: number
  likeRate: number
  saveRate: number
  commentRate: number
  shareRate: number
  interactionRate: number
  followConversionRate: number
  effectiveCommentRate: number
}

// 账号维度
export interface AccountStats {
  totalPosts: number
  totalImpressions: number
  totalViews: number
  totalInteractions: number
  totalFollowers: number
  netFollowerGrowth: number
  avgCoverCTR: number
  avgInteractionRate: number
  avgLikeRate: number
  avgCommentRate: number
  avgShareRate: number
  avgSaveRate: number
  avgFollowConversionRate: number
  contentVerticality: number
  topTopics: string[]
  fanEngagementRate: number
  fanGrowthTrend: number
}

// 同类目基准数据
export interface Benchmark {
  categoryId: string
  categoryName: string
  followerRange: string
  avgCoverCTR: number
  avgCompletionRate: number
  avgLikeRate: number
  avgSaveRate: number
  avgCommentRate: number
  avgShareRate: number
  avgInteractionRate: number
  avgFollowConversionRate: number
  avgEffectiveCommentRate: number
}

// 素人爆款参考
export interface ReferencePost {
  id: string
  title: string
  category: string
  followerCount: number
  coverDescription: string
  impressions: number
  coverCTR: number
  completionRate: number
  likeRate: number
  saveRate: number
  commentRate: number
  shareRate: number
  followConversionRate: number
  successReason: string
  learnablePoints: string[]
}

// 归因诊断结果
export interface Diagnosis {
  postId: string
  overallRating: 'excellent' | 'good' | 'average' | 'needs_improvement'
  funnelDiagnosis: FunnelLayerDiagnosis[]
  rootCause: string
  attribution: string
  improvements: Improvement[]
  referencePosts: ReferencePost[]
}

export interface FunnelLayerDiagnosis {
  layer: string
  yourValue: number
  benchmarkValue: number
  diff: number
  rating: 'great' | 'normal' | 'poor'
  explanation: string
  suggestion: string
}

export interface Improvement {
  priority: 'high' | 'medium' | 'low'
  category: string
  description: string
  referenceExample?: string
}

// 账号分析报告
export interface AccountAnalysis {
  contentVerticality: {
    score: number
    mainTopics: { topic: string; weight: number }[]
    assessment: string
    suggestion: string
  }
  fanStickiness: {
    score: number
    fanEngagementRate: number
    newVsLostFollowers: { gained: number; lost: number }
    assessment: string
    suggestion: string
  }
  monetizationPotential: {
    score: number
    suitableFor: string[]
    readiness: string
    suggestion: string
  }
  overallDirection: string
}

// 应用全局数据状态
export interface AppData {
  posts: Post[]
  accountStats: AccountStats | null
  accountAnalysis: AccountAnalysis | null
}
