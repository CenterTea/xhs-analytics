import { useState } from 'react'
import { Link } from 'react-router-dom'

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

export default function PostAnalysisPage() {
  const [postUrl, setPostUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    content: PostContentAnalysis
    comments: CommentWordCloud
    commentQuality: {
      effectiveRate: number
      ineffectiveRate: number
      analysis: string
    }
  } | null>(null)

  const handleAnalyze = () => {
    if (!postUrl.trim()) return
    setAnalyzing(true)
    // 模拟分析过程
    setTimeout(() => {
      setResult({
        content: {
          estimatedReadTime: 3,
          wordCount: 450,
          infoDensity: 'medium',
          suggestions: [
            '文字量适中，阅读时间约3分钟，符合移动端阅读习惯',
            '建议在开头30字内点明主题，提高完播率',
            '段落间距可适当加大，提升阅读体验'
          ]
        },
        comments: {
          topWords: [
            { word: '好看', count: 15 },
            { word: '学习了', count: 12 },
            { word: '求教程', count: 8 },
            { word: '太强了', count: 7 },
            { word: '收藏了', count: 6 }
          ],
          sentiment: 'positive',
          mainTopic: '用户对教程内容感兴趣，希望获得更详细的步骤说明'
        },
        commentQuality: {
          effectiveRate: 75,
          ineffectiveRate: 25,
          analysis: '评论区质量较高，大部分评论表达了具体观点或提问，有互动价值。建议多回复"求教程"类评论，可以转化为粉丝。'
        }
      })
      setAnalyzing(false)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">单帖分析</h1>
        <p className="text-sm text-gray-500">
          输入帖子链接，分析内容结构和评论质量
        </p>
      </div>

      {/* 输入区域 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          小红书帖子链接
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.xiaohongshu.com/explore/..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !postUrl.trim()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? '分析中...' : '开始分析'}
          </button>
        </div>
        {/* 爬虫接入说明 */}
        <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚧</span>
            <div>
              <h4 className="font-medium text-amber-900 mb-1">关于爬虫接入</h4>
              <p className="text-sm text-amber-800 mb-2">
                单帖分析需要爬取小红书公开的帖子内容和评论数据，这需要部署后端爬虫服务。
              </p>
              <p className="text-xs text-amber-700">
                当前版本为前端演示，展示分析后的数据呈现形式。如需真实数据爬取，需额外部署 Python/Node.js 后端服务，处理反爬、登录态、数据解析等。
              </p>
              <details className="mt-2">
                <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-800 font-medium">
                  查看爬虫技术方案
                </summary>
                <div className="mt-2 pl-2 text-xs text-amber-700 space-y-1">
                  <p>1. 使用 Puppeteer/Playwright 模拟浏览器行为</p>
                  <p>2. 处理小红书反爬机制（滑块验证、请求频率限制）</p>
                  <p>3. 解析加密接口返回的数据</p>
                  <p>4. 评论内容需要做 NLP 分析（情感分析、关键词提取）</p>
                  <p>5. 需定期更新 cookie/登录态</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* 功能说明 */}
      {!result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">⏱️</div>
            <h3 className="font-semibold text-gray-900 mb-2">阅读时间分析</h3>
            <p className="text-sm text-gray-500">
              根据文字长度和视频时长，估算需要的阅读/观看时间。判断内容密度是否适合目标受众。
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">☁️</div>
            <h3 className="font-semibold text-gray-900 mb-2">评论词云</h3>
            <p className="text-sm text-gray-500">
              提取评论中的高频词，分析用户讨论的焦点和情感倾向。了解观众真正关心什么。
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-2">评论质量评估</h3>
            <p className="text-sm text-gray-500">
              区分有效评论（提问、分享经验）和无效评论（纯表情、@好友）。评论区质量影响转化率。
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
                    fontSize: `${Math.max(0.75, Math.min(1.25, item.count / 10))}rem`,
                    opacity: Math.max(0.5, item.count / 15)
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

          {/* 提示信息 */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">
              以上是演示数据。完整功能需要接入小红书 API 或支持爬虫分析。
            </p>
            <Link to="/dashboard" className="text-red-500 hover:text-red-600 text-sm font-medium">
              返回数据看板查看已有数据分析 →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
