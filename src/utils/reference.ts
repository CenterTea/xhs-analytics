import type { Post, ReferencePost } from '../types'

/**
 * 素人爆款参考数据池
 * 每个都是普通创作者（发布时粉丝数 < 3000）自然流量下的高转化帖子
 * 后续可通过社区贡献持续扩充
 */
const referencePool: ReferencePost[] = [
  {
    id: 'ref-001',
    title: '新手必看！3步搞定日常通勤妆，5分钟出门',
    category: 'beauty',
    followerCount: 1200,
    coverDescription: '左边素颜右边完妆，对比图占2/3，右上角"3步"大字',
    impressions: 28000,
    coverCTR: 0.18,
    completionRate: 0.55,
    likeRate: 0.08,
    saveRate: 0.06,
    commentRate: 0.025,
    shareRate: 0.012,
    followConversionRate: 0.025,
    successReason:
      '对比封面+数字钩子（3步/5分钟）降低了用户的心理门槛。内容步骤清晰，每一步都有图有真相。结尾引导关注"还想学什么告诉我"。',
    learnablePoints: [
      '用对比图作封面，一眼看到效果差异',
      '标题数字化（3步、5分钟），降低用户预期的难度',
      '内容结构化：每步配图+说明，可扫读',
      '结尾互动引导具体化',
    ],
  },
  {
    id: 'ref-002',
    title: '千万别买！我踩雷的10件网红护肤品，第7个你肯定有',
    category: 'beauty',
    followerCount: 800,
    coverDescription: '产品排成一排，中间打红叉，标题大字"千万别买"',
    impressions: 45000,
    coverCTR: 0.22,
    completionRate: 0.62,
    likeRate: 0.09,
    saveRate: 0.07,
    commentRate: 0.04,
    shareRate: 0.02,
    followConversionRate: 0.03,
    successReason:
      '"千万别买"制造了强烈的好奇心和反面预期。第7个你肯定有——激发验证心理。踩雷类内容天然有讨论价值，评论区变成了大型避雷交流现场。',
    learnablePoints: [
      '反面标题制造好奇心——千万别、别买、避雷',
      '"第X个"括号悬念驱动全文完读',
      '踩雷/避雷内容天然有收藏价值和讨论价值',
      '评论区引导大家分享自己的踩雷经历',
    ],
  },
  {
    id: 'ref-003',
    title: '打工人一周便当合集！每天15分钟，月省2000外卖费',
    category: 'food',
    followerCount: 1500,
    coverDescription: '6格便当拼图，每格色彩分明，底部标注"周一到周六"',
    impressions: 32000,
    coverCTR: 0.16,
    completionRate: 0.58,
    likeRate: 0.07,
    saveRate: 0.08,
    commentRate: 0.03,
    shareRate: 0.015,
    followConversionRate: 0.02,
    successReason:
      '便当合集等于一期顶六期的内容密度。省钱+省时双重实用价值。每日标注让用户有翻阅的动力。收藏率极高因为用户会"先收藏有空做"。',
    learnablePoints: [
      '合集型内容信息密度高，一期顶多期',
      '同时打省钱+省时两张实用牌',
      '高清成图+简洁步骤，降低制作心理门槛',
      '高收藏率内容=后续被搜索推荐的概率大',
    ],
  },
  {
    id: 'ref-004',
    title: '30岁裸辞去大理，一个月花了多少钱？真实账单公开',
    category: 'travel',
    followerCount: 600,
    coverDescription: '手写账单+大理风景照拼图，中间红圈标出总金额',
    impressions: 56000,
    coverCTR: 0.20,
    completionRate: 0.65,
    likeRate: 0.08,
    saveRate: 0.04,
    commentRate: 0.035,
    shareRate: 0.018,
    followConversionRate: 0.028,
    successReason:
      '裸辞+大理+真实账单三个共鸣点叠加。30岁是一个年龄锚点，引发同龄人共鸣。公开账单满足了好奇心和参考需求。评论区充满了"我也想去"和询问细节的讨论。',
    learnablePoints: [
      '用具体数字和真实信息建立信任',
      '年龄+事件锚点引发特定人群共鸣',
      '真实数据公开=好奇驱动+参考价值',
    ],
  },
  {
    id: 'ref-005',
    title: '面试官说"你还有什么问题"时，问这5个问题直接拿offer',
    category: 'knowledge',
    followerCount: 2000,
    coverDescription: '深色背景+白色大字标题+左下方"第4个最加分"引导',
    impressions: 68000,
    coverCTR: 0.15,
    completionRate: 0.70,
    likeRate: 0.06,
    saveRate: 0.09,
    commentRate: 0.04,
    shareRate: 0.025,
    followConversionRate: 0.035,
    successReason:
      '解决了一个极其具体的痛点——面试最后一个问题。标题直接场景化，每个找工作的人都能代入。"第4个最加分"创造了排序浏览的动力。干货密度高所以收藏率极高。',
    learnablePoints: [
      '场景化标题：在所有找工作的人都有这个痛点',
      '具体数字+好奇心钩子驱动完读',
      '干货类内容收藏率是最大的指标',
      '结尾可以引导关注"后续更新更多面试技巧"',
    ],
  },
]

/**
 * 根据帖子类型和诊断结果，匹配最相关的素人参考
 */
export function matchReferences(
  post: Post,
  funnelDiagnosis: { layer: string; rating: string }[]
): ReferencePost[] {
  // 找到最薄弱环节
  const poorLayers = funnelDiagnosis.filter((d) => d.rating === 'poor')
  const priorityLayer = poorLayers.length > 0 ? poorLayers[0].layer : '互动'

  // 按类别筛选
  const categoryMatches = referencePool.filter(
    (r) => r.category === inferCategory(post)
  )

  // 如果同类目没有足够的参考，扩展到全部
  const candidates = categoryMatches.length >= 2 ? categoryMatches : referencePool

  // 按问题类型排序
  const scored = candidates
    .map((r) => ({
      ref: r,
      score: scoreReference(r, priorityLayer, post),
    }))
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 3).map((s) => s.ref)
}

function inferCategory(post: Post): string {
  const title = post.title + ' ' + (post.topics?.join(' ') ?? '')
  const keywords: Record<string, string[]> = {
    beauty: ['化妆', '护肤', '美妆', '口红', '粉底', '眼影', '面膜', '精华', '防晒'],
    fashion: ['穿搭', '穿搭', 'OOTD', 'ootd', '衣服', '鞋子', '包包', '配饰'],
    food: ['美食', '做饭', '便当', '食谱', '吃', '早餐', '晚餐', '探店'],
    travel: ['旅行', '旅游', '攻略', '打卡', '酒店', '民宿', '大理', '三亚'],
    knowledge: ['干货', '教程', '指南', '模板', '方法', '步骤', '技巧', '面试', '职场'],
    lifestyle: ['vlog', 'Vlog', '日常', '生活', '好物', '家居'],
  }

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((w) => title.includes(w))) return category
  }

  return 'lifestyle'
}

function scoreReference(
  ref: ReferencePost,
  priorityLayer: string,
  post: Post
): number {
  let score = 0

  // 优先选择在薄弱环节数据好的
  if (priorityLayer.includes('点击') && ref.coverCTR > 0.12) score += 3
  if (priorityLayer.includes('完播') && ref.completionRate > 0.5) score += 3
  if (priorityLayer.includes('互动') && ref.likeRate + ref.saveRate + ref.commentRate + ref.shareRate > 0.1)
    score += 3
  if (priorityLayer.includes('涨粉') && ref.followConversionRate > 0.02) score += 3

  // 喜欢同类型内容
  if (inferCategory(post) === ref.category) score += 2

  // 喜欢素人（粉丝越少越优先，参考价值更大）
  if (ref.followerCount < 1000) score += 2
  else if (ref.followerCount < 2000) score += 1

  return score
}

export { referencePool }
