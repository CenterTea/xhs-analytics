// 自动从标题中提取内容类型分类
// 完全客户端运行，无需 API

interface CategoryResult {
  name: string
  count: number
  percentage: number
  sampleTitles: string[]
}

interface ContentClassification {
  categories: CategoryResult[]
  verticalityScore: number
  assessment: string
  mainDirection: string
  suggestion: string
}

// 预定义的内容分类关键词库
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '美妆护肤': ['化妆', '口红', '眼影', '粉底', '遮瑕', '腮红', '眉笔', '睫毛', '美瞳', '护肤', '精华', '面霜', '水乳', '防晒', '卸妆', '面膜', '洗面奶', '痘痘', '美白', '抗老', '淡斑', '刷酸', '底妆', '定妆', '高光', '修容', '素颜', '妆教', '美妆'],
  '穿搭分享': ['穿搭', '穿搭分享', 'OOTD', 'ootd', '外套', '连衣裙', '裤子', '裙子', '衬衫', '毛衣', '卫衣', '大衣', '羽绒服', '西服', '风衣', 'T恤', '鞋子', '包包', '配饰', '帽子', '墨镜', '搭配', '显瘦', '显高', '小个子', '微胖', '梨形', '日常穿搭', '上班穿搭', '约会穿搭'],
  '美食探店': ['美食', '探店', '好吃', '餐厅', '火锅', '奶茶', '咖啡', '甜品', '蛋糕', '面包', '小吃', '烧烤', '日料', '韩料', '泰国菜', '麻辣烫', '外卖', '下午茶', '早餐', '晚餐', '午餐', '菜谱', '食谱', '自己做饭', '家常菜', '测评', '美食测评'],
  '旅行攻略': ['旅行', '旅游', '攻略', '景点', '酒店', '民宿', '机票', '火车', '自驾', '徒步', '登山', '海边', '海岛', '城市', '打卡', '拍照', '游记', '签证', '护照', '周末去哪', '周边游', '国内游', '出国游', '穷游'],
  '家居生活': ['家居', '装修', '软装', '收纳', '改造', '租房', '搬家', '布置', '家具', '窗帘', '地毯', '灯', '植物', '花', '好物', '家居好物', '生活好物', 'roomtour', 'RoomTour', '独居', '租房改造', '宿舍改造', '书桌', '阳台'],
  '职场成长': ['职场', '工作', '面试', '简历', '跳槽', '离职', '裁员', '加薪', '升职', '同事', '领导', '实习', '副业', '自媒体', '创业', '自由职业', '考证', '技能', '学习', '自律', '效率', '时间管理', '读书', '阅读', '成长', '自我提升'],
  '母婴育儿': ['宝宝', '婴儿', '新生儿', '月子', '产后', '母乳', '奶粉', '尿布', '早教', '幼儿园', '带娃', '育儿', '宝妈', '妈妈', '怀孕', '孕期', '待产', '产检', '顺产', '剖腹产', '胎教', '儿童', '亲子'],
  '数码科技': ['手机', '电脑', '笔记本', '平板', '耳机', '相机', '镜头', '手表', '音箱', '键盘', '鼠标', '显示器', 'App', 'app', '软件', '游戏', 'Switch', 'PS5', '科技', '数码', '电子产品', '开箱', '测评'],
  '健身运动': ['健身', '减肥', '减脂', '增肌', '运动', '瑜伽', '跑步', '游泳', '骑行', '健身房', '私教', '马甲线', '腹肌', '瘦腿', '瘦腰', '拉伸', '普拉提', '跳操', '跳绳', '燃脂', '有氧', '力量训练', '肌肉', '体态'],
  '情感心理': ['情感', '恋爱', '分手', '前任', '复合', '相亲', '婚姻', '闺蜜', '朋友', '人际关系', '社交', '内向', '社恐', '焦虑', '抑郁', '情绪', '心理健康', '原生家庭', '自我认知', 'MBTI', '人格', '星座', '心理学'],
  '艺术创作': ['画画', '绘画', '插画', '手绘', '素描', '水彩', '油画', '设计', '平面设计', 'UI', 'UX', '摄影', '拍照技巧', '滤镜', '调色', '修图', 'P图', '手帐', '手账', '手工', 'DIY', '粘土', '钩针', '编织'],
  '宠物萌宠': ['猫', '狗', '猫咪', '狗狗', '宠物', '萌宠', '喵', '汪', '主子', '铲屎官', '猫粮', '狗粮', '猫砂', '绝育', '领养', '流浪猫', '流浪狗', '品种猫', '金毛', '布偶', '英短', '柯基'],
}

function extractKeywords(text: string): string[] {
  // 从文本中提取有意义的2-4字词组
  const cleaned = text
    .replace(/[@#][^\s]+/g, ' ')
    .replace(/[，。！？、；：""''（）【】《》\s]+/g, ' ')
    .replace(/[0-9a-zA-Z]+/g, ' ')
    .trim()

  const keywords: string[] = []
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= cleaned.length - len; i++) {
      const word = cleaned.substring(i, i + len)
      if (!/[0-9a-zA-Z]/.test(word) && word.trim().length === len) {
        keywords.push(word.trim())
      }
    }
  }
  return keywords
}

function classifyTitle(title: string): string | null {
  const titleKeywords = extractKeywords(title)
  const scores: Record<string, number> = {}

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (title.includes(kw)) {
        // 更长的关键词匹配权重更高
        score += kw.length >= 3 ? 3 : 1
      }
    }
    // 检查双字词组匹配
    for (const tk of titleKeywords) {
      if (keywords.some(k => k.includes(tk) || tk.includes(k))) {
        score += 0.5
      }
    }
    if (score > 0) scores[category] = score
  }

  // 返回得分最高的分类
  if (Object.keys(scores).length === 0) return null
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  // 阈值：降到 0，只要能匹配就归类
  if (best[1] < 0) return null
  return best[0]
}

export function classifyContent(titles: string[]): ContentClassification {
  if (titles.length === 0) {
    return {
      categories: [],
      verticalityScore: 0,
      assessment: '暂无数据',
      mainDirection: '暂无数据',
      suggestion: '请先上传帖子数据',
    }
  }

  // 对每条标题进行分类
  const categoryCount: Record<string, { count: number; samples: string[] }> = {}

  for (const title of titles) {
    const cat = classifyTitle(title)
    if (cat) {
      if (!categoryCount[cat]) categoryCount[cat] = { count: 0, samples: [] }
      categoryCount[cat].count++
      if (categoryCount[cat].samples.length < 3) {
        categoryCount[cat].samples.push(title)
      }
    }
  }

  // 总是运行动态话题发现，补充分类
  dynamicTopicDiscovery(titles, categoryCount)

  // 将所有未归入已有分类的标题，归入"其他话题"
  let classifiedCount = Object.values(categoryCount).reduce((s, c) => s + c.count, 0)
  if (classifiedCount < titles.length) {
    const unclassifiedTitles = titles.filter(t => !classifyTitle(t) && !isTitleInCategories(t, categoryCount))
    if (unclassifiedTitles.length > 0) {
      categoryCount['其他话题'] = {
        count: unclassifiedTitles.length,
        samples: unclassifiedTitles.slice(0, 3),
      }
    }
  }

  // 排序并计算百分比
  const sorted = Object.entries(categoryCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  const categories: CategoryResult[] = sorted.map(([name, data]) => ({
    name,
    count: data.count,
    percentage: Math.round((data.count / titles.length) * 1000) / 10,
    sampleTitles: data.samples,
  }))

  // 计算垂直度
  const topPct = categories[0]?.percentage ?? 0

  let verticalityScore: number
  let assessment: string
  let mainDirection: string
  let suggestion: string

  if (categories.length === 1 && categories[0].name.includes('其他')) {
    // 全部无法分类的情况
    verticalityScore = 40
    assessment = `你的帖子标题风格比较个性化，系统暂时无法自动归类到具体领域。如果你觉得分类不对，可能是标题中没有包含领域关键词。`
    mainDirection = '个性化内容创作者'
    suggestion = `建议：在标题中适当加入领域关键词（如"穿搭""美食""旅行"等），不仅有助于系统理解你的内容，也能让搜索引擎更好地推荐你的帖子。或者在帖子中加上话题标签 #。`
  } else if (topPct > 60) {
    verticalityScore = Math.min(100, Math.round(85 + (topPct - 60) * 0.3))
    assessment = `内容高度垂直——${Math.round(topPct)}% 的帖子集中在「${categories[0].name}」领域。账号定位非常清晰，推荐算法能够精准锁定目标受众。`
    mainDirection = `专注「${categories[0].name}」的垂直账号`
    suggestion = `继续保持「${categories[0].name}」方向深耕。${categories[1] ? `可以适度拓展「${categories[1].name}」作为第二方向（建议不超过${Math.round(20)}%），丰富内容矩阵但不要冲淡主定位。` : '可以在这个领域内探索不同子话题，丰富内容层次。'}`
  } else if (topPct > 40) {
    verticalityScore = Math.round(65 + (topPct - 40) * 0.8)
    assessment = `有一定垂直度——「${categories[0].name}」是主要内容方向（${Math.round(topPct)}%），但内容范围还比较宽。推荐算法大致知道你的领域但不够精确。`
    mainDirection = `以「${categories[0].name}」为主的${categories[1] ? `兼「${categories[1].name}」` : ''}账号`
    suggestion = `建议把「${categories[0].name}」相关内容的占比提升到 60% 以上。让系统和粉丝更清楚你的核心定位，减少过于偏离主打方向的内容。`
  } else if (topPct > 25) {
    verticalityScore = Math.round(45 + (topPct - 25) * 0.8)
    assessment = `内容比较分散——最高分类「${categories[0].name}」仅占${Math.round(topPct)}%，涉及领域较多（${categories.length}个分类）。推荐算法难以精准定位你的核心受众。`
    mainDirection = `${categories.length >= 3 ? '多领域' : '双领域'}内容创作者，偏向「${categories[0].name}」`
    suggestion = `建议收缩内容范围：选出数据表现最好的 1-2 个分类，把 80% 的内容聚焦在上面。与其什么都做但都做不精，不如在一个方向打透。`
  } else {
    verticalityScore = Math.max(20, Math.round(topPct * 1.2 + 10))
    assessment = `内容定位不清晰——发布的话题非常分散（${categories.length}个分类），最高占比仅${Math.round(topPct)}%。粉丝和算法都不知道你主要做什么内容。`
    mainDirection = '内容方向尚未聚焦'
    suggestion = `停下来复盘：看看数据最好的 5 篇帖子分别属于什么类型？你最喜欢做、最有话说的领域是什么？那个方向受众最大？选准一个方向集中发力，什么都做 = 什么都做不好。`
  }

  return {
    categories,
    verticalityScore,
    assessment,
    mainDirection,
    suggestion,
  }
}

function isTitleInCategories(
  title: string,
  categoryCount: Record<string, { count: number; samples: string[] }>
): boolean {
  for (const cat of Object.values(categoryCount)) {
    if (cat.samples.includes(title)) return true
  }
  return false
}

function dynamicTopicDiscovery(
  titles: string[],
  categoryCount: Record<string, { count: number; samples: string[] }>
) {
  const wordFreq: Record<string, number> = {}
  const stopWords = new Set(['小红书', '分享', '推荐', '合集', '日常', '记录', '生活', '真的', '感觉', '一个', '这个', '那个', '今天', '终于', '还是', '怎么', '什么', '视频', '图文', '攻略', '必备', '超全', '整理', '必备', '免费', '终于', '教程', '干货', '笔记', '好物', '宝藏', '近期', '喜欢', '最近', '会有', '拍照', '哈哈哈', '一下', '啊啊', '发现', '超爱', '绝了', '直接', '看看', '好好'])

  for (const title of titles) {
    const words = extractKeywords(title)
    const seen = new Set<string>()
    for (const w of words) {
      if (stopWords.has(w) || w.length < 2) continue
      if (seen.has(w)) continue
      seen.add(w)
      wordFreq[w] = (wordFreq[w] || 0) + 1
    }
  }

  // 取高频词作为动态分类（降低阈值到 ≥2 次）
  const sorted = Object.entries(wordFreq)
    .filter(([_, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  for (const [word, count] of sorted) {
    const name = `「${word}」相关`
    // 避免与已有分类重复
    if (!categoryCount[name]) {
      categoryCount[name] = {
        count,
        samples: titles.filter(t => t.includes(word)).slice(0, 3),
      }
    }
  }
}
