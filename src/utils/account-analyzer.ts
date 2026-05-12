import type { Post, AccountStats, AccountAnalysis } from '../types'

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
      '你的账号定位很清晰！发的内容基本都在同一个领域打转，这样小红书才知道把你的帖子推给谁。就像一个专门做川菜的馆子，想吃辣的人自然会来。'
    suggestion =
      '方向不用变。可以在你这个领域里试试不同的子话题，比如你是做美妆的，可以今天化妆教程、明天避雷拔草、后天好物分享——保持在同一个圈子里但内容不重复。'
  } else if (score >= 50) {
    assessment =
      '你大概有个方向，但有时候会"跑题"发一些不相关的内容。这让系统有点懵——你到底算哪个领域的？该把你的帖子推给谁？就像一个餐厅今天卖火锅明天卖蛋糕，顾客也搞不懂你到底是干嘛的。'
    suggestion =
      '把80%的内容聚焦在最擅长的1-2个话题上，剩下的20%可以试探新方向。先把招牌菜做好，再考虑加新菜。'
  } else {
    assessment =
      '你发的内容话题比较杂，没有形成一个明确的"人设"。系统不知道该把你的帖子推荐给谁，关注你的人也不知道你下次会发什么。像一个什么都卖的杂货铺——什么都有，但什么都让人记不住。'
    suggestion =
      '选一个你最擅长、也最容易出内容的方向，集中火力先打透。不用急着什么都做。小红书算法特别喜欢垂直账号——你越专一，它越愿意帮你推。'
  }

  return { score, mainTopics, assessment, suggestion }
}

function analyzeFanStickiness(_posts: Post[], stats: AccountStats) {
  const fanEngagementRate = stats.totalPosts > 0
    ? Math.min(0.5, 0.3 + stats.avgInteractionRate * 2)
    : 0

  const gained = stats.netFollowerGrowth
  const lost = Math.round(gained * 0.3)

  let score: number
  let assessment: string
  let suggestion: string

  if (stats.fanGrowthTrend > 0.1) {
    score = Math.min(100, Math.round(70 + stats.fanGrowthTrend * 100))
    assessment =
      '粉丝涨势不错！越来越多的人看了你的内容后决定关注你。这说明你的内容方向是对的，大家觉得关注你"值"。就像一个店铺回头客越来越多，说明东西确实好。'
    suggestion =
      '趁热打铁！保持现在的发帖节奏和内容风格。可以在每篇结尾多引导一句"觉得有用就关注我吧"，转化率还能再提一提。'
  } else if (stats.fanGrowthTrend > -0.1) {
    score = Math.round(50 + stats.fanGrowthTrend * 50)
    assessment =
      '粉丝增长不快不慢，属于正常水平。有人关注也有人取关，整体稳定。就像水龙头在慢慢滴水——有进账但不猛。'
    suggestion =
      '试试做一两篇"爆款潜力股"的内容，找个热门话题蹭一蹭（但要在你的领域内）。有时候你只需要一篇爆款就能带动整个账号的数据。'
  } else {
    score = Math.max(0, Math.round(50 + stats.fanGrowthTrend * 100))
    assessment =
      '粉丝增长速度在下降，甚至有些帖子发完基本不掉粉但也涨不动。可能你最近的内容没那么"新鲜"了，或者方向偏了。就像餐厅的老菜单吃腻了，该推新菜了。'
    suggestion =
      '翻看你之前涨粉最多的那几篇帖子，它们有什么共同点？是选题、封面、还是形式？把那个"爆款配方"找出来，用同样的思路再做新内容。人都是有新鲜感疲劳的，适时换个花样。'
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
    readiness = '你的账号状态不错，可以考虑开始接一些商业合作了'
    suggestion =
      '你的内容方向明确、粉丝也愿意跟你互动——这是品牌方最喜欢的账号类型。可以开始主动联系一些跟你内容相关的品牌，或者开通小红书的带货功能。如果你在某个领域特别专业，也可以考虑做付费咨询或课程。记住：刚开始接广不要太频繁，保持内容的真诚感，粉丝才会继续信任你。'
  } else if (score >= 45) {
    suitableFor.push('品牌体验官', '中小量级带货')
    readiness = '有点变现基础了，但还得再养一养'
    suggestion =
      '可以先从"品牌体验官"入手——品牌免费送你产品你做真实测评。这不算赚钱但能积累商业案例，也让你体验一下接合作是啥感觉。同时继续把内容做好、粉丝养起来。等账号再大一点，付费合作自然会找上门。别急，先练好内功。'
  } else {
    suitableFor.push('先养号，别急着变现')
    readiness = '现在最重要的事是把内容做好，变现的事可以往后放放'
    suggestion =
      '现阶段的核心任务就是两件事：找准定位 + 做好内容。别急着想赚钱的事——如果你的号还没养起来就硬接广，不仅赚不到什么钱，还会让现有的粉丝觉得你"变了"。把地基打牢，楼才能盖得高。内容做好了，钱是自然而然的事。'
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
    return `你的账号在「${topTopic}」这块做得不错，定位清晰，粉丝也愿意跟你互动。接下来可以：（1）在你这领域里多试几个子话题，丰富内容矩阵；（2）试试做系列内容，比如"XXX第1期"这种，让粉丝有追更的感觉；（3）如果数据持续好看，可以考虑接一些跟你定位匹配的商业合作了。`
  }

  if (contentVerticality.score >= 75 && fanStickiness.score < 60) {
    return `你的内容方向很明确（${topTopic}），但粉丝跟你的"感情"还不够深。建议：（1）多点个人风格，让粉丝关注的是"你这个人"而不只是"你发的内容"；（2）在视频里多出现你的脸、你的声音、你的态度；（3）做系列化内容，让粉丝习惯"追你"，而不是"刷到你"。`
  }

  if (contentVerticality.score < 50) {
    return `你现在最需要做的事不是发更多内容，而是想清楚：你到底想做一个什么样的号？翻一翻你数据最好的那几篇，它们围绕什么话题？选一个你最擅长、也最容易持续出内容的方向，然后集中火力做。什么都做=什么都做不好。小红书特别喜欢专注的人。`
  }

  return `你的账号还在成长期。继续在「${topTopic}」方向深耕，同时注意跟粉丝多互动、多在内容里体现你的个人风格。内容是根基，粉丝是果实——根扎深了，果子自然就多了。`
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
