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
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url')
  const [postUrl, setPostUrl] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
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
    setAnalyzing(true)

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

    setAnalyzing(false)
  }

  const extractKeywords = (text: string): { word: string; count: number }[] => {
    // 简单的关键词提取：分词后统计
    const commonWords = ['的', '了', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']
    const words = text.split(/[\s,，.。!！?？;；、]+/)
    const wordCount: Record<string, number> = {}

    words.forEach(word => {
      if (word.length >= 2 && !commonWords.includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    })

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
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

  const handleAnalyze = () => {
    if (inputMode === 'url' && !postUrl.trim()) return
    if (inputMode === 'html' && !htmlContent.trim()) return

    setAnalyzing(true)

    if (inputMode === 'html') {
      // 解析 HTML 提取数据
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')

      const data: ExtractedData = {
        title: doc.querySelector('h1')?.textContent || doc.title || '',
        content: doc.body.innerText.slice(0, 2000),
        author: '',
        likes: 0,
        collects: 0,
        comments: 0,
        shares: 0,
        postTime: '',
        url: ''
      }

      analyzeData(data)
    } else {
      // URL 模式需要后端支持，这里显示提示
      alert('URL 自动爬取需要安装浏览器插件。请先安装 Tampermonkey 脚本，或切换到"粘贴 HTML"模式。')
      setAnalyzing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">单帖分析</h1>
        <p className="text-sm text-gray-500">
          输入帖子链接或粘贴HTML，分析内容结构和评论质量
        </p>
      </div>

      {/* 使用说明 */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 mb-2">两种使用方式</h4>

            {/* 方式1 详细教程 */}
            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-2">方式1（推荐）：Tampermonkey 脚本一键提取</p>

              <div className="space-y-2">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-amber-800 hover:text-amber-900 flex items-center gap-1">
                    <span className="transition-transform group-open:rotate-90">▶</span>
                    步骤1：安装 Tampermonkey 扩展
                  </summary>
                  <div className="mt-2 pl-4 text-xs text-amber-700 space-y-1">
                    <p>• Chrome/Edge 用户：访问 Chrome 网上应用店，搜索"Tampermonkey"，点击"添加至 Chrome"</p>
                    <p>• Safari 用户：Mac App Store 搜索"Tampermonkey"安装</p>
                    <p>• 安装成功后，浏览器右上角会出现一个黑色/彩色的圆形图标</p>
                  </div>
                </details>

                <details className="group">
                  <summary className="cursor-pointer text-sm text-amber-800 hover:text-amber-900 flex items-center gap-1">
                    <span className="transition-transform group-open:rotate-90">▶</span>
                    步骤2：安装数据提取脚本
                  </summary>
                  <div className="mt-2 pl-4 text-xs text-amber-700 space-y-1">
                    <p>• 点击下方链接：<a href="/xhs-analytics/xhs-extractor.user.js" target="_blank" className="text-red-600 hover:underline font-medium">安装小红书数据提取脚本</a></p>
                    <p>• 浏览器会跳转到 Tampermonkey 的安装确认页面</p>
                    <p>• 点击页面上的"安装"按钮（绿色按钮）</p>
                    <p>• 安装成功后，Tampermonkey 图标会显示数字"1"，表示有1个脚本在运行</p>
                  </div>
                </details>

                <details className="group">
                  <summary className="cursor-pointer text-sm text-amber-800 hover:text-amber-900 flex items-center gap-1">
                    <span className="transition-transform group-open:rotate-90">▶</span>
                    步骤3：使用脚本提取数据
                  </summary>
                  <div className="mt-2 pl-4 text-xs text-amber-700 space-y-1">
                    <p>• 打开任意小红书帖子页面（如 xiaohongshu.com/explore/xxxxx）</p>
                    <p>• 等待页面完全加载（约2-3秒）</p>
                    <p>• 页面右上角会出现红色按钮"📊 分析此帖"</p>
                    <p>• 点击按钮，脚本会自动滚动加载评论（最多500条）</p>
                    <p>• 数据提取完成后，会自动跳转到本页面并显示分析结果</p>
                  </div>
                </details>

                <details className="group">
                  <summary className="cursor-pointer text-sm text-amber-800 hover:text-amber-900 flex items-center gap-1">
                    <span className="transition-transform group-open:rotate-90">▶</span>
                    常见问题排查
                  </summary>
                  <div className="mt-2 pl-4 text-xs text-amber-700 space-y-1">
                    <p>• <strong>没有出现"分析此帖"按钮？</strong> 刷新页面，或检查 Tampermonkey 是否开启（图标应为彩色）</p>
                    <p>• <strong>按钮点击没反应？</strong> 确保你在帖子详情页，不是列表页</p>
                    <p>• <strong>提取的评论太少？</strong> 脚本需要滚动加载，耐心等待10-20秒</p>
                    <p>• <strong>如何卸载脚本？</strong> 点击 Tampermonkey 图标 → 找到脚本 → 点击垃圾桶图标</p>
                  </div>
                </details>
              </div>
            </div>

            {/* 方式2 简要说明 */}
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-1">方式2：手动粘贴 HTML 源码</p>
              <p className="text-xs text-amber-700">在小红书帖子页面右键「查看网页源代码」→ 全选(Ctrl+A) → 复制(Ctrl+C) → 点击下方"方式2"标签粘贴</p>
            </div>
          </div>
        </div>
      </div>

      {/* 输入模式切换 */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setInputMode('url')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === 'url'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          方式1: 帖子链接
        </button>
        <button
          onClick={() => setInputMode('html')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === 'html'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          方式2: 粘贴HTML源码
        </button>
      </div>

      {/* 输入区域 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        {inputMode === 'url' ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              小红书帖子链接
            </label>
            <input
              type="text"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://www.xiaohongshu.com/explore/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">
              需要先安装浏览器插件才能自动提取
            </p>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              粘贴网页源代码（Ctrl+A 全选后复制）
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="右键页面 → 查看网页源代码 → 全选(Ctrl+A) → 复制(Ctrl+C) → 粘贴到这里..."
              className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none font-mono text-xs"
            />
            <p className="text-xs text-gray-400 mt-2">
              提示：在小红书帖子页面右键 → 查看网页源代码 → 全选复制
            </p>
          </>
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing || (inputMode === 'url' ? !postUrl.trim() : !htmlContent.trim())}
          className="mt-4 w-full px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? '分析中...' : '开始分析'}
        </button>
      </div>

      {/* 已提取的数据显示 */}
      {extractedData && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-xl">✅</span>
            <div className="flex-1">
              <h4 className="font-medium text-green-900 mb-1">数据提取成功</h4>
              <p className="text-sm text-green-800 font-medium">{extractedData.title}</p>
              <div className="flex gap-4 mt-2 text-xs text-green-700">
                <span>👤 {extractedData.author || '未知作者'}</span>
                <span>👍 {extractedData.likes || 0}</span>
                <span>⭐ {extractedData.collects || 0}</span>
                <span>💬 {extractedData.comments || 0}</span>
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
          {/* 基础数据 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 帖子数据</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{extractedData?.likes || 0}</p>
                <p className="text-xs text-gray-500">点赞</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{extractedData?.collects || 0}</p>
                <p className="text-xs text-gray-500">收藏</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{extractedData?.comments || 0}</p>
                <p className="text-xs text-gray-500">评论</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{extractedData?.shares || 0}</p>
                <p className="text-xs text-gray-500">分享</p>
              </div>
            </div>
          </div>

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
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
              {result.commentQuality.analysis}
            </p>
          </div>

          {/* 重新分析按钮 */}
          <div className="text-center">
            <button
              onClick={() => {
                setResult(null)
                setExtractedData(null)
                setPostUrl('')
                setHtmlContent('')
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
