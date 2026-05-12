import type { Post, Diagnosis, FunnelLayerDiagnosis, Improvement } from '../types'
import { getBenchmark } from './benchmark'
import { matchReferences } from './reference'

export function diagnosePost(post: Post, _allPosts: Post[]): Diagnosis {
  const benchmark = getBenchmark('default', 500)

  const funnelDiagnosis: FunnelLayerDiagnosis[] = [
    diagnoseLayer(
      '曝光 → 点击',
      post.coverCTR,
      benchmark.avgCoverCTR,
      '封面点击率（CTR）',
      post.impressions
    ),
    // 完播率层级（仅用于视频，如果数据缺失则跳过展示）
    diagnoseLayer(
      '阅读 → 完播',
      post.completionRate ?? 0,
      benchmark.avgCompletionRate,
      '完播率',
      post.views
    ),
    diagnoseLayer(
      '阅读 → 互动',
      post.interactionRate,
      benchmark.avgInteractionRate,
      '互动率',
      post.views
    ),
    diagnoseLayer(
      '互动 → 涨粉',
      post.followConversionRate,
      benchmark.avgFollowConversionRate,
      '涨粉转化率',
      post.views
    ),
  ]

  const { rootCause, attribution, improvements } = attribute(funnelDiagnosis, post)
  const referencePosts = matchReferences(post, funnelDiagnosis)
  const overallRating = getOverallRating(funnelDiagnosis)

  return {
    postId: post.id,
    overallRating,
    funnelDiagnosis,
    rootCause,
    attribution,
    improvements,
    referencePosts,
  }
}

function diagnoseLayer(
  layer: string,
  yourValue: number,
  benchmarkValue: number,
  metricName: string,
  _absoluteValue: number
): FunnelLayerDiagnosis {
  const diff = benchmarkValue > 0 ? (yourValue - benchmarkValue) / benchmarkValue : 0

  let rating: 'great' | 'normal' | 'poor'
  let explanation: string
  let suggestion: string

  if (diff > 0.5) {
    rating = 'great'
    explanation = `${metricName}高于同类目均值 ${(diff * 100).toFixed(0)}%，这一层表现优秀。`
    suggestion = `保持当前策略即可。说人话：这块你已经做得很好了，不用动，去优化别的地方。`
  } else if (diff >= -0.3) {
    rating = 'normal'
    explanation = `${metricName}接近同类目均值（${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(0)}%），处于正常范围。`
    suggestion = `小幅优化即可提升。说人话：跟大多数人差不多，稍微努努力就能更好。`
  } else {
    rating = 'poor'
    explanation = `${metricName}低于同类目均值 ${Math.abs(diff * 100).toFixed(0)}%，这是需要优先改进的环节。`
    suggestion = `建议优先优化这一层。说人话：这块拖后腿了，下面的归因分析会告诉你怎么改。`
  }

  return { layer, yourValue, benchmarkValue, diff, rating, explanation, suggestion }
}

function attribute(
  diagnosis: FunnelLayerDiagnosis[],
  post: Post
): { rootCause: string; attribution: string; improvements: Improvement[] } {
  const ctrRating = diagnosis[0].rating
  const interactionRating = diagnosis[2].rating
  const followRating = diagnosis[3].rating

  let rootCause = ''
  let attribution = ''
  const improvements: Improvement[] = []

  // 场景1: 曝光高但 CTR 低 → 封面/标题问题
  if (post.impressions > 1000 && ctrRating === 'poor') {
    rootCause = '封面点击率（CTR）偏低：曝光量充足但点击转化不足'
    attribution =
      '系统给了你不错的曝光量，说明平台愿意把你的内容推出去。但封面点击率（CTR）偏低——大部分刷到你帖子的人没有点进来。\n\n' +
      '说人话：你的帖子被推到了很多人面前（曝光不错），但封面和标题没能"勾"住他们。就像你在街上开了个店，人流量很大，但你的门头和招牌不够吸引人，路人看了一眼就走了。问题出在"门面"，不在"货"。'
    improvements.push({
      priority: 'high',
      category: '封面/标题优化',
      description:
        '封面换一个思路：颜色更鲜艳、对比更强烈、放上让人好奇的文字。标题用数字（"3个方法"、"第2个绝了"）、悬念或情绪词（"真的会谢"、"千万别买"），制造"点进去看看"的冲动。',
      referenceExample: '参考同类中 CTR 高的素人帖，看他们的封面配色和标题结构',
    })
  }

  // 场景2: CTR 低但互动和涨粉好 → 内容好但引流差
  if (
    ctrRating === 'poor' &&
    (interactionRating === 'great' || followRating === 'great')
  ) {
    rootCause = '封面点击率偏低：内容质量很好，但流量获取环节拖了后腿'
    attribution =
      '这是典型的"好内容没被人看到"。你的互动率（点赞+收藏+评论+分享）和涨粉转化率都很高——说明点进来的人认可你的内容。但是封面点击率（CTR）低，导致真正看到你内容的人太少。\n\n' +
      '说人话：你的内容其实很棒！看过的人都愿意点赞收藏关注。问题是太多人根本没点进来——你的封面和标题像一道帘子，把流量挡在外面了。你的内容是好菜，但门帘遮太严，路人闻不到香味。只要把门帘掀开，数据会爆发。'
    improvements.push({
      priority: 'high',
      category: '封面/标题优化',
      description:
        '你的内容本身不用大改。集中火力搞封面——去研究跟你做同类内容的普通人（别看大V），看他们的封面长啥样。试试同一篇内容换不同封面多发几次（A/B测试），找到最能吸引点击的那个。',
    })
  }

  // 场景3: CTR 高但互动率低 → 内容未能兑现封面承诺
  if (ctrRating === 'great' && interactionRating === 'poor') {
    rootCause = '封面/标题吸引力强，但内容未能兑现预期，用户互动意愿低'
    attribution =
      '封面点击率（CTR）很高说明你很会抓眼球、起标题。但互动率（点赞+收藏+评论+分享）低说明用户点进来后觉得"就这？"，没有互动的冲动。这是典型的"封面和内容脱节"——用户被吸引进来，但内容没有给他们足够的价值或共鸣。\n\n' +
      '说人话：你很会"吆喝"把人拉进店（这是本事），但店里的货没让人心动。就像餐厅门头很诱人，但菜上桌后客人觉得一般，吃完就走了，不会推荐给朋友。问题不在门面，在你的内容本身。'
    improvements.push({
      priority: 'high',
      category: '内容价值提升',
      description:
        '标题承诺了什么内容就得兑现。开头前 3 秒直接上干货别铺垫。增加信息密度——多给"原来是这样"、"这个有用"的内容。干货要 actionable（用户能马上用），情绪内容要引发共鸣。',
      referenceExample: '参考同类中互动率高的素人帖，注意他们的内容结构和信息密度',
    })
    improvements.push({
      priority: 'medium',
      category: '互动引导',
      description:
        '内容结尾抛个问题引导大家在评论区讨论，比如"你遇到过这种情况吗？"、"如果是你，会怎么选？"。明确引导能显著提升评论率。',
    })
  }

  // 场景4: 互动率好但涨粉率低 → 人设/IP 问题（内容有价值但缺乏持续关注价值）
  if (interactionRating === 'great' && followRating === 'poor') {
    rootCause = '涨粉转化率偏低：内容有吸引力，但账号人设/IP 不够强，缺乏持续关注价值'
    attribution =
      '互动率（Interaction Rate）高说明大家喜欢这篇内容，愿意点赞、收藏、评论。但涨粉转化率（Follow Conversion Rate）低——大家喜欢你的内容但没关注你这个人。这说明内容本身有讨论价值，但用户不觉得"需要持续关注你"。\n\n' +
      '说人话：你讲了个很好笑的笑话，大家都笑了，但没人问你叫什么名字。用户把你的内容当成"一次性消费品"——看完了、点赞了、然后划走了，没有关注你的理由。你需要让大家觉得：关注你之后，还能持续看到这样的好内容。'
    improvements.push({
      priority: 'high',
      category: '人设/IP 打造',
      description:
        '在内容里多点"你"的存在感。做成系列化内容（"第 X 期"这种），让人期待下一期。结尾加一句"关注我，下次带你 XXX"。让用户觉得你是一个活生生的人而不是发帖机器。',
    })
  }

  // 场景5: 互动率低（移除完播率相关内容）
  if (interactionRating === 'poor' && ctrRating !== 'poor') {
    if (!rootCause) {
      rootCause = '互动率偏低：用户点进来了但互动意愿不强，内容缺乏吸引力或互动引导'
      attribution =
        '封面点击率（CTR）不错说明标题封面都有吸引力。但互动率低意味着用户看完内容后，没有点赞、收藏、评论或分享的冲动。问题可能出在：①内容干货不够，用户觉得"就这？"；②缺乏情绪共鸣；③没有引导互动；④内容太长或节奏拖沓，用户没看完就划走了。\n\n' +
        '说人话：客人被你门口的招牌吸引进来了，也逛了一圈，但什么都没买就走了。你的"货品"要么不够诱人，要么没有激发购买的欲望。'
    }
    improvements.push({
      priority: 'high',
      category: '内容价值提升',
      description:
        '增加内容的"信息量"或"情绪价值"——让用户觉得"有用"或"有共鸣"。干货类内容要给 actionable 的建议（用户能马上用的）。情绪类内容要说出用户心里想说但没说的话。',
    })
    improvements.push({
      priority: 'medium',
      category: '互动引导优化',
      description:
        '结尾明确引导互动——"你觉得呢？评论区告诉我"、"收藏起来下次用"、"转给需要的朋友"。人需要被提醒才会行动。',
    })
  }

  // 场景6: 转发率低
  if (post.shareRate < 0.003) {
    improvements.push({
      priority: 'medium',
      category: '分享价值提升',
      description:
        '转发率低说明内容缺少"社交货币"——用户没有转发的冲动。想想你平时会转发什么？①太有用了想转给朋友（干货）②"这就是我！"（情绪共鸣）③"哈哈哈哈"（有趣）。给你的内容加一点这些属性。',
    })
  }

  // 默认归因
  if (!rootCause) {
    if (ctrRating === 'poor' && interactionRating === 'poor') {
      rootCause = '封面点击和互动数据偏低：选题方向或内容形式可能需要重新思考'
      attribution =
        '从曝光→点击→互动，数据都低于同类均值。不一定是某一个环节的问题，更可能是选题本身受众太小，或者内容形式不适合你的目标用户。\n\n' +
        '说人话：不是你的问题，可能是这个话题本身就不太讨喜。换个角度试试？想想你身边的朋友会对这个话题感兴趣吗？'
    } else {
      rootCause = '整体表现中等，部分环节有优化空间'
      attribution = '数据在正常范围内，不是不好，只是还没到让人眼前一亮的地步。针对下面标出来的薄弱环节做针对性改进就能提升。'
    }
  }

  improvements.push({
    priority: 'low',
    category: '选题策略',
    description: '多刷同类型热门内容，关注大家在讨论什么。选题选对了，后面的事轻松一半。',
  })

  return { rootCause, attribution, improvements }
}

function getOverallRating(
  diagnosis: FunnelLayerDiagnosis[]
): 'excellent' | 'good' | 'average' | 'needs_improvement' {
  const greatCount = diagnosis.filter((d) => d.rating === 'great').length
  const poorCount = diagnosis.filter((d) => d.rating === 'poor').length

  if (greatCount >= 3 && poorCount === 0) return 'excellent'
  if (greatCount >= 2 && poorCount <= 1) return 'good'
  if (poorCount >= 2) return 'needs_improvement'
  return 'average'
}
