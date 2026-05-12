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
      '封面点击率',
      post.impressions
    ),
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
      post.interactionRate
    ),
    diagnoseLayer(
      '互动 → 涨粉',
      post.followConversionRate,
      benchmark.avgFollowConversionRate,
      '涨粉转化率',
      post.followConversionRate
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
    explanation = `${metricName}比大部分同类内容好不少 👍 这一层你做得挺棒的。`
    suggestion = `这块继续保持就行，可以把精力放在其他还能提升的地方。`
  } else if (diff >= -0.3) {
    rating = 'normal'
    explanation = `${metricName}跟大部分人差不多，不算差，但还有进步空间。`
    suggestion = `不用大动干戈，稍微调一调就能更好。`
  } else {
    rating = 'poor'
    explanation = `${metricName}这块确实偏低了 😅 这是你最需要花时间改进的地方。`
    suggestion = `别担心，这不是说你不行，只是说这一层没做好。下面会告诉你怎么调。`
  }

  return { layer, yourValue, benchmarkValue, diff, rating, explanation, suggestion }
}

function attribute(
  diagnosis: FunnelLayerDiagnosis[],
  post: Post
): { rootCause: string; attribution: string; improvements: Improvement[] } {
  const ctrRating = diagnosis[0].rating
  const completionRating = diagnosis[1].rating
  const interactionRating = diagnosis[2].rating
  const followRating = diagnosis[3].rating

  let rootCause = ''
  let attribution = ''
  const improvements: Improvement[] = []

  // 场景1: 曝光高但点击率低 → 封面/标题问题
  if (post.impressions > 1000 && ctrRating === 'poor') {
    rootCause = '封面和标题不够吸引人，人家刷到了但不想点进来'
    attribution =
      '你的帖子被推给了不少人（曝光量不错），但大部分人划走了没点进来。这就好比你在街上摆了个摊，路过的人挺多，但你的招牌不够显眼，大家不知道你卖的啥、有啥好看的。换个说法——你的"门面"需要装修一下。'
    improvements.push({
      priority: 'high',
      category: '封面/标题',
      description:
        '封面换个思路试试：颜色亮一点、对比强一点、让人一眼看到就想点。标题也是——用数字（"3个方法"）、用悬念（"第2个绝了"）、用情绪（"真的会谢"），让人忍不住想点进来看看到底是啥。',
      referenceExample: '去看看同类里封面点击率高的素人帖子，看他们的封面长啥样、标题怎么写的',
    })
  }

  // 场景2: 点击率低但互动和涨粉好 → 内容好但流量获取差
  if (
    ctrRating === 'poor' &&
    (interactionRating === 'great' || followRating === 'great')
  ) {
    rootCause = '内容本身很棒，但被封面和标题耽误了'
    attribution =
      '告诉你一个好消息：你的内容质量真的很能打！点进来的人愿意点赞、收藏、关注你，这说明你的内容有料、有共鸣。但问题就出在——太多人根本不知道你内容这么好，因为封面和标题没把人"勾"进来。就像你做了超好吃的菜，但门帘遮得太严实，路人闻不到香味。把门帘掀开，流量就进来了。'
    improvements.push({
      priority: 'high',
      category: '封面/标题',
      description:
        '你的内容不用大改！集中火力搞封面。去看看那些跟你做同类内容、但点击率很高的普通人的帖子（别看大V，人家有粉丝基础）。学他们的封面配色、文字排版、那种"让人想点"的感觉。可以同一篇内容换不同封面多发几次试试。',
    })
  }

  // 场景3: 点击率高互动率低 → 内容质量不行
  if (ctrRating === 'great' && interactionRating === 'poor') {
    rootCause = '标题封面很会"骗"人点进来，但内容没接住'
    attribution =
      '你是个起标题和做封面的高手！点击率这么高说明你很会抓眼球。但用户点进来之后发现内容跟预期的差一截，或者看完觉得"就这？"——然后就划走了，没点赞没收藏。这就好比电影预告片剪得太精彩，正片反而让人失望了。问题不在你的"门面"，在你"店里的货"。'
    improvements.push({
      priority: 'high',
      category: '内容质量',
      description:
        '标题答应了用户什么，内容就得真给。如果标题说"3个方法"，内容就别只给1个半。开头前3秒直接上干货，别铺垫。多加点"哇这个有用"、"原来是这样"的信息量，让人觉得不白看。结尾抛个问题让大家在评论区聊起来。',
      referenceExample: '去看同类里互动率高的素人帖子，注意他们内容的结构和节奏',
    })
  }

  // 场景4: 互动率好涨粉率低 → 人设/IP问题
  if (interactionRating === 'great' && followRating === 'poor') {
    rootCause = '内容挺有意思，但用户没觉得"值得关注你这个人"'
    attribution =
      '大家喜欢你发的这篇内容——点赞收藏都挺多。但是他们关注的是"这篇内容"而不是"你这个人"。就像你讲了个很好笑的笑话，大家笑完就走了，没人问"你叫什么名字"。你需要让大家觉得：关注你之后，还能持续看到这么好的内容。'
    improvements.push({
      priority: 'high',
      category: '人设/IP',
      description:
        '在内容里多点"你"的存在感。可以做成系列——"第1期"、"第2期"这样，让人期待下一期。结尾加一句"关注我，下次带你XXX"。让用户觉得你是一个活生生的人，不是一个发帖机器。你的个性、你的说话方式、你的态度——这些才是让人想关注你的理由。',
    })
  }

  // 场景5: 完播率低
  if (completionRating === 'poor' && ctrRating !== 'poor') {
    if (!rootCause) {
      rootCause = '用户点进来了，但没看完就走了'
      attribution =
        '封面标题把人吸引进来了（这点做得好！），但内容没留住人。就像你开了个店，门口招牌很吸引人，客人进来了，但逛了两步觉得没意思就转身走了。问题很可能出在开头——要么开头太啰嗦，要么节奏太慢，要么信息密度不够。'
    }
    improvements.push({
      priority: 'high',
      category: '内容结构',
      description:
        '开头3-5秒（或者前两段文字）直接上最吸引人的东西，别铺垫！视频的话试着把最精彩的画面放最前面。图文的话第一段就让人知道"这篇能给我什么"。中间不要有凑字数的废话段落，每段都让人有看下去的欲望。',
    })
  }

  // 场景6: 转发率低
  if (post.shareRate < 0.003) {
    improvements.push({
      priority: 'medium',
      category: '分享价值',
      description:
        '你的内容可能缺少让人"想转给朋友"的冲动。想想你平时会转发什么？要么是"这个太有用了转给闺蜜"（实用干货），要么是"这就是我！"（情绪共鸣），要么是"笑死我了必须转"（有趣）。让你的内容带点这种属性。',
    })
  }

  // 默认归因
  if (!rootCause) {
    if (ctrRating === 'poor' && completionRating === 'poor' && interactionRating === 'poor') {
      rootCause = '各方面都需要大调整——选题方向可能不太对'
      attribution =
        '从被人看到→点进来→看完→互动，每一步的数据都不太理想。别灰心，这不一定是你的问题，很可能是这个选题本身就不太讨喜，或者形式不太对。可以想想：你身边的朋友会对这个话题感兴趣吗？这个话题最近是不是大家都在讨论？换个角度试试。'
    } else {
      rootCause = '整体还行，但有几个环节可以做得更好'
      attribution = '数据中等偏上，不是不好，只是还没到让人眼前一亮的地步。下面针对薄弱的环节给一些具体的建议。'
    }
  }

  // 通用建议
  improvements.push({
    priority: 'low',
    category: '选题策略',
    description: '平时多刷刷同类型的热门内容，看看大家在讨论什么、什么话题容易火。选题选对了，后面的事就轻松一半。',
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
