import type { Post, AccountStats, AccountAnalysis } from '../types'

/**
 * 账号深度分析
 * 分析内容垂直度、粉丝粘性、变现潜力
 */
export function analyzeAccount(
  posts: Post[],
  stats: AccountStats
): AccountAnalysis {
  if (posts.length === 0) {
    return emptyAnalysis()
  }

  const contentVerticality = analyzeContentVerticality(posts)
  const fanStickiness = analyzeFanStickiness(posts, stats)
  const monetizationPotential = analyzeMonetization(
    contentVerticality,
    fanStickiness,
    stats
  )
  const overallDirection = generateDirection(
    contentVerticality,
    fanStickiness,
    monetizationPotential
  )

  return {
    contentVerticality,
    fanStickiness,
    monetizationPotential,
    overallDirection,
  }
}

function analyzeContentVerticality(posts: Post[]) {
  // 收集所有话题标签
  const topicCount: Record<string, number> = {}
  posts.forEach((post) => {
    post.topics?.forEach((topic) => {
      topicCount[topic] = (topicCount[topic] || 0) + 1
    })
  })

  const sorted = Object.entries(topicCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const mainTopics = sorted.map(([topic, count]) => ({
    topic,
    weight: count / posts.length,
  }))

  // 垂直度得分：最高频话题占比越高，说明越垂直
  const topWeight = mainTopics.length > 0 ? mainTopics[0].weight : 0
  const top2Weight =
    mainTopics.length > 1
      ? mainTopics[0].weight + mainTopics[1].weight
      : topWeight
  const score = Math.min(100, Math.round(top2Weight * 70 + topWeight * 30))

  let assessment: string
  let suggestion: string

  if (score >= 75) {
    assessment =
      '你的内容非常垂直，主要集中在少数几个话题上。这有助于算法精准推荐给目标用户。'
    suggestion =
      '保持当前的内容方向。可以考虑在垂直领域内拓展子话题，既保持垂直度又避免内容重复。'
  } else if (score >= 50) {
    assessment =
      '你的内容有一定聚焦，但话题略有分散。部分帖子偏离了主要方向。'
    suggestion =
      '建议将80%的内容聚焦在1-2个核心话题上，20%做试探性拓展。话题越垂直，算法推荐越精准。'
  } else {
    assessment =
      '你的内容话题比较分散，没有形成明确的垂直定位。这会让算法难以精准推荐，粉丝也不知道你到底做什么内容。'
    suggestion =
      '建议选择一个你最擅长且受众最大的方向，集中火力打透。内容垂直是小红书涨粉的核心基础。'
  }

  return { score, mainTopics, assessment, suggestion }
}

function analyzeFanStickiness(_posts: Post[], stats: AccountStats) {
  // 简单估算：假设总互动中的约30-50%来自粉丝（无实际数据时的估算）
  const fanEngagementRate = stats.totalPosts > 0
    ? Math.min(0.5, 0.3 + stats.avgInteractionRate * 2)
    : 0

  const gained = stats.netFollowerGrowth
  const lost = Math.round(gained * 0.3) // 假设流失率为新增的30%

  let score: number
  let assessment: string
  let suggestion: string

  if (stats.fanGrowthTrend > 0.1) {
    score = Math.min(100, Math.round(70 + stats.fanGrowthTrend * 100))
    assessment =
      '粉丝增长呈加速趋势，说明内容方向正确，用户对你的关注意愿在增强。'
    suggestion =
      '继续保持当前的内容策略。可以适当增加互动引导（点赞/收藏/关注），进一步提升转化。'
  } else if (stats.fanGrowthTrend > -0.1) {
    score = Math.round(50 + stats.fanGrowthTrend * 50)
    assessment =
      '粉丝增长趋势平缓，内容表现稳定但缺乏爆发力。'
    suggestion =
      '尝试做一些有话题性的内容来刺激增长。可以参与热门话题或蹭热点，但要在垂直领域内。'
  } else {
    score = Math.max(0, Math.round(50 + stats.fanGrowthTrend * 100))
    assessment =
      '粉丝增长呈下降趋势，需要警惕。可能是内容新鲜感下降，或者选题偏离用户兴趣。'
    suggestion =
      '回顾最近涨粉好的帖子，分析共性。考虑切换内容角度或形式，给用户新的新鲜感。'
  }

  return {
    score,
    fanEngagementRate,
    newVsLostFollowers: { gained, lost },
    assessment,
    suggestion,
  }
}

function analyzeMonetization(
  contentVerticality: { score: number },
  fanStickiness: { score: number },
  stats: AccountStats
) {
  // 变现力 = 垂直度(40%) + 粉丝粘性(30%) + 互动率(30%)
  const rawScore =
    contentVerticality.score * 0.4 +
    fanStickiness.score * 0.3 +
    Math.min(100, stats.avgInteractionRate * 1000) * 0.3

  const score = Math.round(Math.min(100, rawScore))
  const suitableFor: string[] = []
  let readiness: string
  let suggestion: string

  if (score >= 70) {
    suitableFor.push('品牌合作（接广）', '知识付费', '带货')
    readiness = '变现条件较好，可以考虑开始商业化尝试'
    suggestion =
      '你的内容垂直度高、粉丝互动好，品牌方会比较看重这样的账号。可以开始主动联系相关品牌，或者开通小红书带货功能。知识付费也是不错的选择——粉丝信任你的专业度。'
  } else if (score >= 45) {
    suitableFor.push('品牌体验官', '带货（中小量级）')
    readiness = '变现基础已具备，但还需要继续积累'
    suggestion =
      '可以先从品牌体验官开始（品牌送产品你做测评），积累商业合作案例。同时继续提升内容垂直度和粉丝粘性，为接付费合作做准备。'
  } else {
    suitableFor.push('先养号')
    readiness = '现阶段建议以内容积累为主，暂缓商业化'
    suggestion =
      '目前账号的核心任务是做好内容、找准定位。急于变现会伤害用户体验和账号调性。先把内容垂直度和粉丝粘性做起来，商业价值自然会来。'
  }

  return { score, suitableFor, readiness, suggestion }
}

function generateDirection(
  contentVerticality: { score: number; mainTopics: { topic: string; weight: number }[] },
  fanStickiness: { score: number },
  _monetization: { score: number }
): string {
  const topTopic = contentVerticality.mainTopics[0]?.topic ?? '你的内容'

  if (contentVerticality.score >= 75 && fanStickiness.score >= 60) {
    return `你的账号在「${topTopic}」领域定位清晰，粉丝粘性强。建议下一步：（1）拓展该领域内的子话题形成内容矩阵；（2）考虑系列化内容增强粉丝归属感；（3）评估商业化时机。`
  }

  if (contentVerticality.score >= 75 && fanStickiness.score < 60) {
    return `你的内容方向很清晰（${topTopic}），但粉丝粘性需要加强。建议：（1）增加个人IP元素，让粉丝关注的是"你"而不只是"内容"；（2）增加互动引导和关注引导；（3）做系列化内容培养追更习惯。`
  }

  if (contentVerticality.score < 50) {
    return `你的首要任务是明确内容定位。观察最近表现最好的3篇帖子，它们有什么共同话题？选择最擅长+最有受众的方向，集中发力。精力分散是做内容的大敌。`
  }

  return `你的账号处于发展阶段。继续深耕「${topTopic}」方向，同时注意提升粉丝粘性和互动率。内容是根基，粉丝是果实——先把内容做好，其他会随之而来。`
}

function emptyAnalysis(): AccountAnalysis {
  return {
    contentVerticality: {
      score: 0,
      mainTopics: [],
      assessment: '暂无数据',
      suggestion: '请先上传帖子数据',
    },
    fanStickiness: {
      score: 0,
      fanEngagementRate: 0,
      newVsLostFollowers: { gained: 0, lost: 0 },
      assessment: '暂无数据',
      suggestion: '请先上传帖子数据',
    },
    monetizationPotential: {
      score: 0,
      suitableFor: [],
      readiness: '暂无数据',
      suggestion: '请先上传帖子数据',
    },
    overallDirection: '请先上传帖子数据以获取方向建议',
  }
}
