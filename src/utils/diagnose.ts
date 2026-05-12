import type { Post, Diagnosis, FunnelLayerDiagnosis, Improvement } from '../types'
import { getBenchmark } from './benchmark'
import { matchReferences } from './reference'

/**
 * 对单篇帖子进行完整漏斗诊断
 */
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

  // 归因分析
  const { rootCause, attribution, improvements } = attribute(funnelDiagnosis, post)

  // 匹配素人参考
  const referencePosts = matchReferences(post, funnelDiagnosis)

  // 综合评级
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
    explanation = `${metricName}显著高于同类目均值，说明这一层的表现非常出色。`
    suggestion = `保持当前策略，可以尝试在其他层继续优化。`
  } else if (diff >= -0.3) {
    rating = 'normal'
    explanation = `${metricName}接近或略低于同类目均值，还有提升空间。`
    suggestion = `小幅优化即可达到优秀水平。`
  } else {
    rating = 'poor'
    explanation = `${metricName}明显低于同类目均值，这是需要重点关注的薄弱环节。`
    suggestion = `建议优先改进这一层的问题。`
  }

  return { layer, yourValue, benchmarkValue, diff, rating, explanation, suggestion }
}

/**
 * 归因分析 —— 核心逻辑
 * 根据各层指标的好坏组合，推断根本问题
 */
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
    rootCause = '流量获取问题：封面和标题吸引力不足'
    attribution =
      '曝光量足够，但封面点击率偏低。用户看到了你的帖子但没有点击，说明封面或标题不够吸引人。这是"流量浪费"——有曝光但没转化。'
    improvements.push({
      priority: 'high',
      category: '封面/标题',
      description:
        '优化封面设计，使用高清、色彩鲜明、有情绪表达或对比效果的图片。标题要有"钩子"——数字、悬念、利益点、情绪词。',
      referenceExample: '参考高CTR同题材素人帖的封面风格和标题结构',
    })
  }

  // 场景2: 点击率低但互动和涨粉好 → 内容好但流量获取差
  if (
    ctrRating === 'poor' &&
    (interactionRating === 'great' || followRating === 'great')
  ) {
    rootCause = '内容质量很高，但封面/标题拖了后腿'
    attribution =
      '互动率和涨粉率都说明你的内容质量很好、有共鸣。但封面点击率低导致阅读量没上去。你只需要改进封面和标题，把流量引进来，数据会爆发。'
    improvements.push({
      priority: 'high',
      category: '封面/标题',
      description:
        '你的内容本身没问题，重点是让更多人点进来。研究同类爆款封面：颜色搭配、文字排版、情绪传递。尝试A/B测试不同封面。',
    })
  }

  // 场景3: 点击率高互动率低 → 内容质量不行
  if (ctrRating === 'great' && interactionRating === 'poor') {
    rootCause = '内容质量问题：封面粉饰了实际内容'
    attribution =
      '封面和标题成功吸引了点击，但内容没能留住用户或激发互动。用户进来后发现内容和预期不符，或者内容不够有料。'
    improvements.push({
      priority: 'high',
      category: '内容质量',
      description:
        '提升内容信息密度，确保标题承诺的内容在正文中兑现。开头3秒必须有钩子。增加"干货感"或"情绪共鸣"，给用户点赞/收藏/评论的理由。',
      referenceExample: '参考高互动率同题材素人帖的内容结构和节奏',
    })
  }

  // 场景4: 互动率好涨粉率低 → 人设/IP问题
  if (interactionRating === 'great' && followRating === 'poor') {
    rootCause = '人设/IP问题：内容有趣但没有持续关注价值'
    attribution =
      '用户喜欢这篇内容（高互动），但没有关注的冲动。这说明内容本身有吸引力，但没让用户觉得"这个人值得持续关注"。'
    improvements.push({
      priority: 'high',
      category: '人设/IP',
      description:
        '在内容中强化你的独特人设和定位。尝试系列化内容（例如"第X期"），让用户期待下一期。在结尾加关注引导，告诉用户关注你能获得什么持续价值。',
    })
  }

  // 场景5: 阅读完播率低
  if (completionRating === 'poor' && ctrRating !== 'poor') {
    if (!rootCause) {
      rootCause = '内容节奏问题：用户进来了但看不下去'
      attribution =
        '封面标题吸引了点击，但完播率低说明内容前几秒没留住人，或者中间节奏拖沓。用户进来后就划走了。'
    }
    improvements.push({
      priority: 'high',
      category: '内容结构',
      description:
        '优化开头3-5秒：用悬念、冲突、或直接切入主题。检查内容节奏是否有"废话"段落。图文帖子注意段落分明、信息有层次。视频帖子注意BGM和画面切换节奏。',
    })
  }

  // 场景6: 转发率低
  if (post.shareRate < 0.003) {
    improvements.push({
      priority: 'medium',
      category: '分享价值',
      description:
        '内容缺乏"社交货币"——用户不会有冲动转发。增加干货总结（方便收藏转发）、共鸣金句（方便分享表达自己）、或者实用清单（方便发给朋友）。',
    })
  }

  // 默认归因
  if (!rootCause) {
    if (ctrRating === 'poor' && completionRating === 'poor' && interactionRating === 'poor') {
      rootCause = '综合问题：选题或内容形式需要重新思考'
      attribution =
        '从曝光到转化的每个环节数据都不理想。这可能不是因为某一个环节的问题，而是选题本身不够吸引人，或者内容形式不适合你的目标用户。'
    } else {
      rootCause = '部分环节有优化空间'
      attribution =
        '整体数据处于中等水平，需要在薄弱环节做针对性改进。'
    }
  }

  // 通用改进建议
  improvements.push({
    priority: 'low',
    category: '选题策略',
    description:
      '持续关注同类目热门话题和趋势标签，在选题阶段就确保有足够的受众基础。',
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
