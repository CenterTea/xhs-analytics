import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface PostContentAnalysis {
  estimatedReadTime: number
  wordCount: number
  infoDensity: 'low' | 'medium' | 'high'
  suggestions: string[]
}

interface CommentWordCloud {
  topWords: { word: string; count: number }[]
  sentiment: 'positive' | 'neutral' | 'negative'
  mainTopic: string
}

interface ExtractedData {
  title: string
  content: string
  author: string
  likes: number
  collects: number
  comments: number
  shares: number
  postTime: string
  url: string
  commentList?: { author: string; content: string; likes: number }[]
}

export default function PostAnalysisPage() {
  const location = useLocation()
  // 分析状态由数据接收驱动，不再需要手动触发
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [result, setResult] = useState<{
    content: PostContentAnalysis
    comments: CommentWordCloud
    commentQuality: {
      effectiveRate: number
      ineffectiveRate: number
      analysis: string
    }
  } | null>(null)

  // 从 URL 参数读取插件传递的数据
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const dataParam = params.get('data')
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam))
        setExtractedData(data)
        analyzeData(data)
      } catch (e) {
        console.error('解析数据失败:', e)
      }
    }
  }, [location])

  const analyzeData = (data: ExtractedData) => {
    // 内容分析
    const wordCount = data.content.length
    const estimatedReadTime = Math.ceil(wordCount / 300) // 每分钟300字
    const infoDensity = wordCount > 800 ? 'high' : wordCount > 300 ? 'medium' : 'low'

    // 评论分析
    const comments = data.commentList || []
    const allCommentText = comments.map(c => c.content).join(' ')

    // 关键词提取（简单的词频统计）
    const keywords = extractKeywords(allCommentText)

    // 情感分析
    const sentiment = analyzeSentiment(allCommentText)

    // 评论质量分析
    const effectiveComments = comments.filter(c =>
      c.content.length > 5 &&
      !c.content.includes('@') &&
      !/^[^一-龥a-zA-Z]*$/.test(c.content)
    ).length
    const effectiveRate = comments.length > 0 ? Math.round((effectiveComments / comments.length) * 100) : 0

    setResult({
      content: {
        estimatedReadTime,
        wordCount,
        infoDensity,
        suggestions: generateSuggestions(data, wordCount)
      },
      comments: {
        topWords: keywords.slice(0, 10),
        sentiment,
        mainTopic: analyzeMainTopic(keywords, comments)
      },
      commentQuality: {
        effectiveRate,
        ineffectiveRate: 100 - effectiveRate,
        analysis: generateCommentAnalysis(effectiveRate, comments)
      }
    })
  }

  const extractKeywords = (text: string): { word: string; count: number }[] => {
    if (!text || text.length < 10) return []

    // 停用词列表 - 扩展更多常见无意义词汇
    const stopWords = new Set([
      '的', '了', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上', '也', '很', '到', '说', '要', '去', '你', '会',
      '着', '没有', '看', '好', '自己', '这', '那', '在', '他', '她', '它', '们', '个', '来', '过', '下', '大', '小',
      '吗', '吧', '呢', '啊', '哦', '嗯', '哈', '哈哈', '哈哈哈', '嘿嘿', '嘻嘻', '呵呵', 'hhh', 'hhhh',
      '可以', '真的', '感觉', '觉得', '就是', '这个', '那个', '什么', '怎么', '为什么', '因为', '所以',
      '但是', '然后', '还是', '不过', '其实', '可能', '应该', '好像', '一样', '一下', '一样',
      'up', '楼主', '作者', '博主', '姐妹', '集美', '宝子', '宝宝', '姐妹',
      '求', '求求', '跪求', '蹲', '蹲蹲', '同蹲', '跟', '跟跟', '带', '带带',
      '链接', '连接', 'lj', '价格', '多少', '钱', '元', '买', '卖', '链接在哪里',
      '@', '//@', '回复', '引用', '转发', '赞', '赞了', '已赞', '收藏', '收藏了',
      '好看', '不错', '喜欢', '爱了', '太棒', '厉害', '优秀', '好看', '漂亮', '美', '棒', '赞'
    ])

    // 清理文本
    const cleanedText = text
      .replace(/[@@][^\s]+/g, ' ') // 移除@用户
      .replace(/https?:\/\/[^\s]+/g, ' ') // 移除链接
      .replace(/[表情][^\s]*|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ') // 移除表情符号
      .replace(/[0-9]+/g, ' ') // 移除纯数字

    // 提取2-6字的词组
    const wordCount: Record<string, number> = {}

    // 方法1：基于标点和空格的简单分词
    const segments = cleanedText.split(/[\s,，.。!！?？;；、~～…]+/).filter(s => s.length >= 2)

    segments.forEach(segment => {
      // 提取完整词组（2-6字）
      if (segment.length >= 2 && segment.length <= 6 && !stopWords.has(segment)) {
        wordCount[segment] = (wordCount[segment] || 0) + 1
      }

      // 提取滑动窗口词组
      for (let len = 2; len <= 4 && len <= segment.length; len++) {
        for (let i = 0; i <= segment.length - len; i++) {
          const word = segment.substr(i, len)
          // 过滤条件：不包含停用词开头/结尾、不全是数字或字母
          if (!stopWords.has(word) &&
              !stopWords.has(word[0]) &&
              !stopWords.has(word[word.length - 1]) &&
              !/^\d+$/.test(word) &&
              word.length >= 2) {
            wordCount[word] = (wordCount[word] || 0) + 1
          }
        }
      }
    })

    // 过滤低频词，排序取前15
    return Object.entries(wordCount)
      .filter(([_, count]) => count >= 2) // 至少出现2次
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }))
  }

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['好', '棒', '喜欢', '爱', '赞', '漂亮', '好看', '优秀', '感谢', '推荐', '不错', '满意', '开心']
    const negativeWords = ['差', '烂', '不好', '失望', '讨厌', '难看', '坑', '骗', '气', '烦', '垃圾']

    let positive = 0
    let negative = 0

    positiveWords.forEach(word => {
      if (text.includes(word)) positive++
    })
    negativeWords.forEach(word => {
      if (text.includes(word)) negative++
    })

    if (positive > negative) return 'positive'
    if (negative > positive) return 'negative'
    return 'neutral'
  }

  const analyzeMainTopic = (keywords: { word: string; count: number }[], comments: any[]): string => {
    if (keywords.length === 0) return '暂无足够数据'

    const topWords = keywords.slice(0, 3).map(k => k.word).join('、')
    const hasQuestions = comments.some(c => c.content.includes('?') || c.content.includes('？'))

    if (hasQuestions) {
      return `用户主要围绕"${topWords}"等话题提问或讨论，评论区互动性较好`
    }
    return `用户讨论集中在"${topWords}"等关键词，整体氛围${analyzeSentiment(comments.map(c => c.content).join(' ')) === 'positive' ? '积极' : '中性'}`
  }

  const generateSuggestions = (data: ExtractedData, wordCount: number): string[] => {
    const suggestions: string[] = []

    if (wordCount < 100) {
      suggestions.push('内容较短，建议增加更多细节描述')
    } else if (wordCount > 1000) {
      suggestions.push('内容较长，建议在开头添加目录或要点总结')
    } else {
      suggestions.push('文字量适中，符合移动端阅读习惯')
    }

    const interactionRate = data.comments / (data.likes || 1)
    if (interactionRate < 0.1) {
      suggestions.push('评论率较低，建议结尾增加引导性提问')
    }

    if (data.content.includes('#')) {
      suggestions.push('使用了话题标签，有助于增加曝光')
    }

    return suggestions
  }

  const generateCommentAnalysis = (effectiveRate: number, _comments: any[]): string => {
    if (effectiveRate > 70) {
      return `评论区质量较高（${effectiveRate}%有效评论），大部分评论表达了具体观点或提问。建议多回复高赞评论，可以转化为粉丝。`
    } else if (effectiveRate > 40) {
      return `评论区质量一般（${effectiveRate}%有效评论），有一定互动但存在较多简单回复。建议引导更有深度的讨论。`
    } else {
      return `评论区质量较低（${effectiveRate}%有效评论），无效评论（表情、@好友）占比较高。需要优化内容激发真实讨论。`
    }
  }

  // HTML粘贴功能已移除，仅支持Tampermonkey脚本

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">单帖分析</h1>
        <p className="text-sm text-gray-500">
          使用 Tampermonkey 脚本自动提取帖子数据，分析内容结构和评论质量
        </p>
      </div>

      {/* 功能说明 */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 mb-6">
        <p className="text-sm text-blue-700 text-center font-medium">
          可以分析自己和她人的帖子数据
        </p>
      </div>

      {/* 使用说明 */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 mb-2">使用方式：Tampermonkey 脚本一键提取</h4>

            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-2">步骤1：安装 Tampermonkey 扩展</p>
              <div className="text-xs text-amber-700 space-y-1">
                <p>• Chrome/Edge 用户：<a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">点击安装 Tampermonkey</a></p>
                <p>• Safari 用户：Mac App Store 搜索"Tampermonkey"安装</p>
                <p>• 安装成功后，浏览器右上角会出现一个黑色/彩色的圆形图标</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-2">步骤2：安装数据提取脚本</p>
              <div className="text-xs text-amber-700 space-y-1">
                <p>
                  • <strong>点击下方直接安装：</strong>
                  <a
                    href="https://github.com/CenterTea/xhs-analytics/raw/main/public/xhs-extractor.user.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline font-medium"
                  >
                    安装小红书数据提取脚本
                  </a>
                </p>
                <p>• 浏览器会跳转到 Tampermonkey 的安装确认页面</p>
                <p>• 点击页面上的"安装"按钮（绿色按钮）</p>
                <div className="bg-red-50 p-2 rounded border border-red-200 mt-2">
                  <p className="text-red-700 font-medium">⚠️ 重要：开启插件权限</p>
                  <p className="text-red-600 mt-1">安装完成后，点击浏览器右上角【三个点】-【扩展】-【管理扩展】- 找到 Tampermonkey - 点击【详细信息】- 打开【允许访问文件网址】和【在所有网站上】</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-2">步骤3：打开任意帖子</p>
              <div className="text-xs text-amber-700 space-y-1">
                <p>• 打开任意小红书帖子页面（如 xiaohongshu.com/explore/xxxxx）</p>
                <p>• 等待页面完全加载（约2-3秒）</p>
                <p>• 页面右上角会出现红色按钮"📊 分析此帖"</p>
                <p>• 点击按钮，脚本会自动滚动加载评论（最多500条）</p>
                <p>• 数据提取完成后，会自动跳转到本页面并显示分析结果</p>
                <div className="bg-red-50 p-2 rounded border border-red-200 mt-2">
                  <p className="text-red-700 font-medium">⚠️ 重要说明</p>
                  <p className="text-red-600 mt-1">在想要打开的帖子处<strong>右键点击选取"在新标签页打开链接"</strong>，然后再分析，需要加载一会儿。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据状态提示 - 根据是否提取成功显示不同内容 */}
      {!extractedData ? (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">等待数据提取</h3>
          <p className="text-sm text-blue-700">
            请按照上方步骤安装 Tampermonkey 脚本，然后在小红书帖子页面点击"📊 分析此帖"按钮。<br/>
            数据会自动发送到本页面进行分析。
          </p>
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-900 mb-1">数据提取成功</h3>
              <p className="text-sm text-green-800 font-medium">{extractedData.title}</p>
              <div className="flex gap-4 mt-2 text-xs text-green-700">
                <span>👤 {extractedData.author || '未知作者'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 功能说明 */}
      {!result && !extractedData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">⏱️</div>
            <h3 className="font-semibold text-gray-900 mb-2">阅读时间分析</h3>
            <p className="text-sm text-gray-500">
              根据文字长度和视频时长，估算需要的阅读/观看时间
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">☁️</div>
            <h3 className="font-semibold text-gray-900 mb-2">评论词云</h3>
            <p className="text-sm text-gray-500">
              提取评论高频词，分析用户讨论焦点和情感倾向
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-2">评论质量评估</h3>
            <p className="text-sm text-gray-500">
              区分有效评论和无效评论，评估互动价值
            </p>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 内容分析 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📄 内容分析</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{result.content.estimatedReadTime}分钟</p>
                <p className="text-xs text-gray-500">预估阅读时间</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{result.content.wordCount}字</p>
                <p className="text-xs text-gray-500">文字数量</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {result.content.infoDensity === 'low' ? '低' : result.content.infoDensity === 'medium' ? '中' : '高'}
                </p>
                <p className="text-xs text-gray-500">信息密度</p>
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <h4 className="font-medium text-amber-900 mb-2">💡 优化建议</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                {result.content.suggestions.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 评论词云 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">☁️ 评论关键词</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {result.comments.topWords.map((item) => (
                <span
                  key={item.word}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  style={{
                    fontSize: `${Math.max(0.75, Math.min(1.25, item.count / 5))}rem`,
                    opacity: Math.max(0.5, item.count / 10)
                  }}
                >
                  {item.word} ({item.count})
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                整体情感：
                <span className={
                  result.comments.sentiment === 'positive' ? 'text-green-600' :
                  result.comments.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                }>
                  {result.comments.sentiment === 'positive' ? '积极' :
                   result.comments.sentiment === 'negative' ? '消极' : '中性'}
                </span>
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">
              <span className="font-medium">讨论焦点：</span>{result.comments.mainTopic}
            </p>

            {/* 显示评论 */}
            {extractedData?.commentList && extractedData.commentList.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    热门评论 ({extractedData.commentList.length}条)
                  </h4>
                  <span className="text-xs text-gray-400">
                    按点赞数排序，显示前{Math.min(10, extractedData.commentList.length)}条
                  </span>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {extractedData.commentList.slice(0, 10).map((comment, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                      <span className="font-medium text-gray-700">{comment.author}:</span>
                      <span className="text-gray-600 ml-1">{comment.content}</span>
                      {comment.likes > 0 && (
                        <span className="text-xs text-gray-400 ml-2">👍 {comment.likes}</span>
                      )}
                    </div>
                  ))}
                </div>
                {extractedData.commentList.length > 10 && (
                  <p className="text-xs text-center text-gray-400 mt-2">
                    还有 {extractedData.commentList.length - 10} 条评论未显示
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 评论质量 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">💬 评论质量分析</h2>
            <div className="flex items-center gap-8 mb-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">有效评论</span>
                  <span className="font-medium text-green-600">{result.commentQuality.effectiveRate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${result.commentQuality.effectiveRate}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">无效评论</span>
                  <span className="font-medium text-gray-400">{result.commentQuality.ineffectiveRate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full"
                    style={{ width: `${result.commentQuality.ineffectiveRate}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
              {result.commentQuality.analysis}
            </p>

            {/* 无效评论说明 */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <h4 className="text-xs font-semibold text-amber-900 mb-2">📋 什么是有/无效评论？</h4>
              <div className="text-xs text-amber-800 space-y-1">
                <p><strong>有效评论：</strong>包含实质性内容的评论，如表达观点、提问、分享经验、给出建议等。例如"这个产品的使用感怎么样？""我也买了同款，确实不错""建议搭配什么颜色？"</p>
                <p><strong>无效评论：</strong>没有信息价值的评论，包括：①只@好友没有实质内容；②纯表情符号（如😂👍❤️）；③简单敷衍（如"666""来了""第一""沙发"）；④重复刷评；⑤广告引流评论。</p>
                <p className="mt-1">无效评论过多会影响帖子权重，降低推荐量。建议通过引导提问、置顶优质评论等方式提升有效评论比例。</p>
              </div>
            </div>
          </div>

          {/* 重新分析按钮 */}
          <div className="text-center">
            <button
              onClick={() => {
                setResult(null)
                setExtractedData(null)
              }}
              className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              重新分析
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
