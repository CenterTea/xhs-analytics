import type { Post, AccountStats, AccountAnalysis } from '../types'
import { classifyContent } from './content-classifier'

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

// 导出供 Dashboard 使用
export function getContentClassification(posts: Post[]) {
  const titles = posts.map(p => p.title).filter(Boolean)
  return classifyContent(titles)
}

function analyzeContentVerticality(posts: Post[]) {
  // 优先使用标签，否则从标题自动提取
  const topicCount: Record<string, number> = {}
  posts.forEach((post) => {
    post.topics?.forEach((topic) => {
      topicCount[topic] = (topicCount[topic] || 0) + 1
    })
  })

  // 如果没有标签数据，用标题自动分类
  if (Object.keys(topicCount).length === 0) {
    const titles = posts.map(p => p.title).filter(Boolean)
    const classification = classifyContent(titles)
    const mainTopics = classification.categories.slice(0, 8).map(c => ({
      topic: c.name,
      weight: c.percentage / 100,
    }))

    const score = classification.verticalityScore

    return {
      score,
      mainTopics,
      assessment: classification.assessment,
      suggestion: classification.suggestion,
    }
  }

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
      '内容垂直度高——你的帖子话题集中在少数几个领域，定位清晰。这对推荐算法非常有利：系统明确知道该把你的内容推给谁，推荐精准度更高。\n\n' +
      '说人话：你就像一个专门做川菜的馆子——想吃辣的人自然就来了，而且来了还会再来，因为知道你是做这个的。'
    suggestion =
      '方向不用变。在垂直领域内拓展子话题（比如美妆领域可以做教程、避雷、好物分享等不同角度），既保持垂直度又避免内容重复。'
  } else if (score >= 50) {
    assessment =
      '内容垂直度中等——有一定的聚焦方向，但部分帖子偏离了主要话题。这会导致推荐算法的分发不够精准：系统不确定你的核心受众是谁。\n\n' +
      '说人话：你大概有个方向，但有时候会"跑题"。就像一个餐厅今天卖火锅明天卖蛋糕，顾客也搞不懂你到底主打什么。'
    suggestion =
      '建议把 80% 的内容聚焦在 1-2 个核心话题上，20% 做试探性拓展。先让系统（和粉丝）清楚你是做什么的，再慢慢拓宽。'
  } else {
    assessment =
      '内容垂直度偏低——发布的话题比较分散，没有形成明确的内容定位。这会导致：① 推荐算法无法精准分发；② 粉丝对你的账号印象模糊，关注意愿降低。\n\n' +
      '说人话：你的内容像一个杂货铺——什么都有，但什么都让人记不住。系统不知道该把你的帖子推给谁，粉丝也不知道关注你能获得什么。选一个最擅长的方向先打透，比什么都做要有效得多。'
    suggestion =
      '选一个你最擅长、受众最大的方向集中火力。小红书算法天然偏好垂直账号——你越专注，它越愿意帮你推流量。'
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
      '粉丝增长趋势（Fan Growth Trend）呈上升态势——越来越多用户看完内容后选择关注你。说明内容方向正确，用户对你的持续关注意愿在增强。\n\n' +
      '说人话：粉丝涨势不错！像店铺的回头客越来越多——说明你的"货"确实好，大家愿意再来。'
    suggestion =
      '趁热打铁，保持发帖节奏和内容风格。可以在每篇结尾自然引导关注，进一步提升粉丝转化率。'
  } else if (stats.fanGrowthTrend > -0.1) {
    score = Math.round(50 + stats.fanGrowthTrend * 50)
    assessment =
      '粉丝增长趋势平缓——涨粉速度不快但也没有明显下降，处于平台期。内容表现稳定但缺乏爆发性增长。\n\n' +
      '说人话：水龙头在慢慢滴水——有进账但不猛。需要一篇"爆款"来打破这个瓶颈。'
    suggestion =
      '尝试找个热门话题蹭一蹭（在你领域内），有时一篇爆款就能带动整个账号的数据跃升。'
  } else {
    score = Math.max(0, Math.round(50 + stats.fanGrowthTrend * 100))
    assessment =
      '粉丝增长趋势下降——近期内容对新增粉丝的吸引力在减弱。可能是内容新鲜感下降，或者选题逐渐偏离了用户兴趣。\n\n' +
      '说人话：粉丝增长在减速甚至倒退。就像餐厅老菜单吃腻了，该推新菜了。回去看看你之前涨粉猛的那些帖子，找到"爆款配方"再复制。'
    suggestion =
      '复盘涨粉最好的几篇帖子，找出共性（选题？封面？形式？）。用同样的思路做新内容。人有新鲜感疲劳——适时换个花样。'
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
    readiness = '变现条件较好——内容垂直度、粉丝粘性、互动率综合表现不错，具备商业化基础'
    suggestion =
      '你的内容垂直度高、粉丝互动好——这是品牌方最看重的账号特质。可以主动联系相关品牌，或开通小红书带货功能。如果你在某个领域特别专业，知识付费也是好选择。\n\n' +
      '说人话：你的号状态不错，可以开始接一些商单了。但记住——刚开始别接太频繁，保持内容的真诚感，粉丝才会继续信任你。信任没了，什么都白搭。'
  } else if (score >= 45) {
    suitableFor.push('品牌体验官', '中小量级带货')
    readiness = '变现基础已具备，但还需进一步积累内容资产和粉丝信任'
    suggestion =
      '可以先从"品牌体验官"开始——品牌送产品你做真实测评，不算赚钱但能积累商业案例。同时继续提升内容垂直度和粉丝粘性，为付费合作打基础。\n\n' +
      '说人话：有点底子了但还不太稳。先别急着赚钱，把号再养一养。内容好了，钱是自然而然的事。'
  } else {
    suitableFor.push('先养号，暂缓商业化')
    readiness = '现阶段核心任务是做好内容定位和粉丝积累，变现时机尚未成熟'
    suggestion =
      '现阶段的核心任务是两件事：找准定位 + 做好内容。急于变现会伤害用户体验和账号调性——如果号没养起来就硬接广，不仅赚不到什么钱，还会让现有粉丝觉得你"变了"。\n\n' +
      '说人话：现在别想赚钱的事。先想清楚你是谁、你给粉丝什么价值。地基打牢了，楼才能盖得高。'
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
    return `【账号状态】你的账号在「${topTopic}」领域定位清晰，粉丝粘性强。\n【建议】① 在现有领域内拓展子话题形成内容矩阵；② 尝试系列化内容（"第X期"），培养粉丝追更习惯；③ 可以开始评估商业化时机，接与定位匹配的品牌合作。\n\n说人话：你的号各方面都不错。下一步就是精细化运营+考虑变现了。`
  }

  if (contentVerticality.score >= 75 && fanStickiness.score < 60) {
    return `【账号状态】内容方向清晰（${topTopic}），但粉丝粘性不足。\n【建议】① 增加个人 IP 元素——让粉丝关注的是"你"而不只是"内容"；② 在视频/图文中多出现你的脸、声音、态度；③ 做系列化内容让粉丝习惯"追你"。\n\n说人话：方向对了，但你这个人还不够"鲜活"。粉丝喜欢你的内容但还没喜欢上你。多露脸、多表达，让人记住你。`
  }

  if (contentVerticality.score < 50) {
    return `【账号状态】内容定位尚不清晰，话题分散。\n【建议】先停下盲目发帖，复盘数据最好的几篇——它们围绕什么话题？选最擅长+最有受众的方向集中发力。什么都做=什么都做不好。\n\n说人话：你现在最需要做的不是发更多内容，而是想清楚你到底想做一个什么样的号。小红书特别喜欢专注的创作者。`
  }

  return `【账号状态】账号处于成长期，在「${topTopic}」方向持续深耕中。\n【建议】继续做好内容，同时加强与粉丝的互动、在内容中多体现个人风格。内容是根基，粉丝是果实。\n\n说人话：正常发育中。不急，把每篇内容做好，量变会产生质变的。`
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
