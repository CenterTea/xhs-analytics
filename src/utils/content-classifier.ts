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

// 预定义的内容分类关键词库（大幅扩展）
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '美妆护肤': [
    '化妆', '口红', '眼影', '粉底', '遮瑕', '腮红', '眉笔', '睫毛', '美瞳',
    '护肤', '精华', '面霜', '水乳', '防晒', '卸妆', '面膜', '洗面奶', '痘痘',
    '美白', '抗老', '淡斑', '刷酸', '底妆', '定妆', '高光', '修容', '素颜',
    '妆教', '美妆', '彩妆', '化妆品', '眼线', '美甲', '染发', '发色', '发型',
    '卷发', '直发', '短发', '护发', '洗发水', '香水', '香氛', '变美', '好皮肤',
  ],
  '穿搭分享': [
    '穿搭', 'OOTD', 'ootd', '外套', '连衣裙', '裤子', '裙子', '衬衫', '毛衣',
    '卫衣', '大衣', '羽绒服', '西服', '风衣', 'T恤', '鞋子', '包包', '配饰',
    '帽子', '墨镜', '搭配', '显瘦', '显高', '小个子', '微胖', '梨形', '日常穿搭',
    '上班穿搭', '约会穿搭', '试穿', '开箱', '购物', '买', '入手', '新衣服',
    '衣服', '鞋', '穿搭灵感', '极简', '风格', '复古', '法式', '韩系', '日系',
  ],
  '美食探店': [
    '美食', '探店', '好吃', '餐厅', '火锅', '奶茶', '咖啡', '甜品', '蛋糕',
    '面包', '小吃', '烧烤', '日料', '韩料', '麻辣烫', '外卖', '下午茶', '早餐',
    '晚餐', '午餐', '菜谱', '食谱', '做饭', '家常菜', '测评', '饮料', '零食',
    '冰淇淋', '自助', '聚餐', '米其林', '路边摊', '夜市', '吃', '喝', '美味',
    '食材', '厨房', '料理', '便当', '一人食', '减脂餐', '饮品', '酒', '精酿',
  ],
  '旅行攻略': [
    '旅行', '旅游', '攻略', '景点', '酒店', '民宿', '机票', '火车', '自驾',
    '徒步', '登山', '海边', '海岛', '打卡', '拍照', '游记', '签证', '护照',
    '周末去哪', '周边游', '国内游', '出国', '穷游', '旅行日记', '一路', '之行',
    '出发', '目的地', '风景', '日落', '日出', '雪山', '古镇', '城市散步',
  ],
  '家居生活': [
    '家居', '装修', '软装', '收纳', '改造', '租房', '搬家', '布置', '家具',
    '好物', '家居好物', '生活好物', 'RoomTour', '独居', '租房改造', '宿舍改造',
    '书桌', '阳台', '厨房', '卧室', '客厅', '卫生间', 'room', 'roomtour',
    '整理', '断舍离', '极简生活', '一人居', '小户型', '整理收纳', '清洁',
  ],
  '职场成长': [
    '职场', '工作', '面试', '简历', '跳槽', '离职', '裁员', '加薪', '升职',
    '同事', '领导', '实习', '副业', '自媒体', '创业', '自由职业', '考证', '技能',
    '学习', '自律', '效率', '时间管理', '读书', '阅读', '成长', '自我提升',
    '搞钱', '赚钱', '存钱', '理财', '副业赚钱', '大学生', '研究生', '留学',
  ],
  '母婴育儿': [
    '宝宝', '婴儿', '新生儿', '月子', '产后', '母乳', '奶粉', '尿布', '早教',
    '幼儿园', '带娃', '育儿', '宝妈', '妈妈', '怀孕', '孕期', '待产', '产检',
    '顺产', '剖腹产', '胎教', '儿童', '亲子', '二胎', '三胎', '哺乳', '辅食',
  ],
  '数码科技': [
    '手机', '电脑', '笔记本', '平板', '耳机', '相机', '镜头', '手表', '音箱',
    '键盘', '鼠标', '显示器', 'App', 'app', '软件', '游戏', 'Switch', '科技',
    '数码', '电子产品', '开箱', 'iPhone', 'iPad', 'Mac', 'Apple', '华为', '小米',
    '索尼', '任天堂', 'AI', 'ChatGPT', '人工智能', '编程', '代码', '效率工具',
  ],
  '健身运动': [
    '健身', '减肥', '减脂', '增肌', '运动', '瑜伽', '跑步', '游泳', '骑行',
    '健身房', '马甲线', '腹肌', '瘦腿', '瘦腰', '拉伸', '普拉提', '跳绳',
    '燃脂', '有氧', '力量训练', '肌肉', '体态', '身材', '体重', '卡路里',
  ],
  '情感心理': [
    '情感', '恋爱', '分手', '前任', '复合', '相亲', '婚姻', '闺蜜', '朋友',
    '人际关系', '社交', '内向', '社恐', '焦虑', '抑郁', '情绪', '心理健康',
    '原生家庭', '自我认知', 'MBTI', '星座', '心理学', '治愈', '疗愈', '孤独',
  ],
  '艺术创作': [
    '画画', '绘画', '插画', '手绘', '素描', '水彩', '油画', '设计', '摄影',
    '拍照', '滤镜', '调色', '修图', '手帐', '手账', '手工', 'DIY', '粘土',
    '钩针', '编织', '手工制作', '创作', '作品', '书法', '字体', '排版',
  ],
  '宠物萌宠': [
    '猫', '狗', '猫咪', '狗狗', '宠物', '萌宠', '喵', '汪', '主子', '铲屎官',
    '猫粮', '狗粮', '猫砂', '绝育', '领养', '流浪猫', '流浪狗', '金毛', '布偶',
    '英短', '柯基', '哈士奇', '柴犬', '比熊', '吸猫', '撸猫', '遛狗',
  ],
  '娱乐生活': [
    '追剧', '电视剧', '电影', '综艺', '音乐', '演唱会', 'KTV', 'LiveHouse',
    'livehouse', 'live', '演出', '话剧', '展览', '博物馆', '看展', '剧本杀',
    '密室逃脱', 'vlog', 'Vlog', '日常', '周末', '生活碎片', 'plog', '记录',
    '快乐', '开心', '搞笑', '有趣', '好玩的', '娱乐', '八卦', '明星', '偶像',
    '唱歌', '跳舞', '弹琴', '乐队', '弹唱', '翻唱', 'cover', 'Cover',
  ],
  '学习教育': [
    '学习', '考试', '考研', '考公', '考编', '英语', '日语', '法语', '韩语',
    '学习打卡', '书单', '读书笔记', '网课', '笔记', '学习方法', '论文', '毕业',
    '高考', '中考', '四六级', '雅思', '托福', '背单词', '图书馆', '自习',
  ],
}

function classifyTitle(title: string): string | null {
  const scores: Record<string, number> = {}

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (title.includes(kw)) {
        // 长关键词（3字+）权重更高，说明匹配更精准
        score += kw.length >= 3 ? 3 : 1.5
      }
    }
    if (score > 0) scores[category] = score
  }

  if (Object.keys(scores).length === 0) return null

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const best = sorted[0]
  const second = sorted[1]

  // 阈值 1.5：至少匹配一个 3 字关键词或两个短关键词
  if (best[1] < 1.5) return null

  // 如果第一名得分 < 第二名的 1.5 倍，说明标题跨多个领域，不强行归类
  if (second && best[1] < second[1] * 1.5 && best[1] < 3) return null

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

  // 对每条标题分类
  const categoryCount: Record<string, { count: number; samples: string[] }> = {}
  let unclassified = 0

  for (const title of titles) {
    const cat = classifyTitle(title)
    if (cat) {
      if (!categoryCount[cat]) categoryCount[cat] = { count: 0, samples: [] }
      categoryCount[cat].count++
      if (categoryCount[cat].samples.length < 3) {
        categoryCount[cat].samples.push(title)
      }
    } else {
      unclassified++
    }
  }

  // 未分类的归入"其他话题"
  if (unclassified > 0) {
    const unclassifiedTitles = titles.filter(t => !classifyTitle(t))
    categoryCount['其他话题'] = {
      count: unclassified,
      samples: unclassifiedTitles.slice(0, 3),
    }
  }

  // 排序
  const sorted = Object.entries(categoryCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  const categories: CategoryResult[] = sorted.map(([name, data]) => ({
    name,
    count: data.count,
    percentage: Math.round((data.count / titles.length) * 1000) / 10,
    sampleTitles: data.samples,
  }))

  // 找出排名第一的"有效"分类（排除"其他话题"）
  const firstReal = categories.find(c => c.name !== '其他话题')
  const realTopPct = firstReal?.percentage ?? 0
  const otherPct = categories.find(c => c.name === '其他话题')?.percentage ?? 0

  // 计算总有效分类数（排除"其他话题"）
  const realCategoryCount = categories.filter(c => c.name !== '其他话题').length

  // --- 垂直度评分 ---
  let verticalityScore: number
  let assessment: string
  let mainDirection: string
  let suggestion: string

  if (otherPct > 60) {
    // "其他话题"占比过大 → 严重不垂直
    verticalityScore = Math.max(15, Math.round(30 - otherPct * 0.25))
    assessment = `内容方向不够明确——${Math.round(otherPct)}% 的帖子无法被归类到具体领域。这通常意味着：①标题中缺少领域关键词；②内容本身确实比较随性和个人化。推荐算法难以判断你的内容适合推给谁。`
    if (firstReal) {
      mainDirection = `以「${firstReal.name}」为主的个人化内容创作者`
    } else {
      mainDirection = '个人化 / 生活方式类内容创作者'
    }
    suggestion = `如果要提高垂直度：①在标题里加入领域关键词，比如你是做穿搭的就在标题里写上"穿搭""OOTD"；②多发同一类型的内容，让系统能够识别你的定位。如果这就是你想要的风格（随性记录），那这个分数对你来说不重要。`
  } else if (otherPct > 40) {
    // "其他话题"占比较大 → 不够垂直
    verticalityScore = Math.round(40 - (otherPct - 40) * 0.3)
    assessment = `内容有一半左右可以归类，但「其他话题」仍占${Math.round(otherPct)}%。${firstReal ? `能看出「${firstReal.name}」是你的主要方向（${Math.round(realTopPct)}%），但还有大量内容游离在外。` : ''}`
    mainDirection = firstReal
      ? `以「${firstReal.name}」为主的${realCategoryCount >= 3 ? '多元化' : ''}创作者，但方向不够聚焦`
      : '内容方向分散的创作者'
    suggestion = `建议把更多内容集中到「${firstReal?.name || '一个具体领域'}」，减少过于发散的内容。${Math.round(100 - otherPct)}% 的归类率还偏低，目标是让 70% 以上的内容能被归类。`
  } else if (realTopPct > 55) {
    verticalityScore = Math.min(100, Math.round(80 + (realTopPct - 55) * 0.4))
    assessment = `内容高度垂直——${Math.round(realTopPct)}% 的帖子集中在「${firstReal!.name}」领域。账号定位非常清晰，推荐算法能够精准锁定目标受众。`
    mainDirection = `专注「${firstReal!.name}」的垂直账号`
    suggestion = `继续保持「${firstReal!.name}」方向深耕。${categories[1] && categories[1].name !== '其他话题' ? `可以适度拓展「${categories[1].name}」丰富内容矩阵，但保持在 ${Math.round(20)}% 以内。` : '可以在这个领域内探索不同子话题，丰富内容层次。'}`
  } else if (realTopPct > 35) {
    verticalityScore = Math.round(55 + (realTopPct - 35) * 0.7)
    assessment = `有一定垂直度——「${firstReal!.name}」是主要内容方向（${Math.round(realTopPct)}%），但还涉及${realCategoryCount}个其他分类。「其他话题」占${Math.round(otherPct)}%。推荐算法大致知道你的领域但不够精确。`
    mainDirection = `以「${firstReal!.name}」为主的${realCategoryCount >= 3 ? '多领域' : ''}创作者`
    suggestion = `建议把「${firstReal!.name}」相关内容提升到 55% 以上。同时减少偏离主打方向的内容，让系统和粉丝更清楚你的核心定位。`
  } else if (realTopPct > 15) {
    verticalityScore = Math.round(35 + (realTopPct - 15) * 0.6)
    assessment = `内容比较分散——最高分类「${firstReal!.name}」仅占${Math.round(realTopPct)}%，涉及${realCategoryCount}个不同领域。「其他话题」占${Math.round(otherPct)}%。推荐算法难以精准定位你的核心受众。`
    mainDirection = `${realCategoryCount >= 3 ? '多领域' : '双领域'}内容创作者，偏向「${firstReal!.name}」`
    suggestion = `建议收缩内容范围：选出数据表现最好的 1-2 个方向，集中 80% 的内容在上面。封面点击率高的帖子通常是方向对的内容，可以参考。`
  } else {
    verticalityScore = Math.max(15, Math.round(otherPct * 0.3 + 10))
    assessment = `内容定位不清晰——${realCategoryCount > 0 ? `只有${Math.round(realTopPct)}%归类到「${firstReal!.name}」` : '几乎所有内容都无法归类'}。「其他话题」占比高达${Math.round(otherPct)}%。粉丝和算法都不清楚你主要做什么内容。`
    mainDirection = '内容方向非常分散'
    suggestion = `停下来复盘：看看数据最好的几篇帖子有什么共同点？你最喜欢做、最有话说的领域是什么？选准一个方向集中发力，什么都做＝什么都做不好。`
  }

  return {
    categories,
    verticalityScore,
    assessment,
    mainDirection,
    suggestion,
  }
}
