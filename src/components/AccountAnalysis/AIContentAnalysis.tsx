import { useState, useEffect } from 'react'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Badge from '../ui/Badge'
import { analyzeContentWithAI } from '../../utils/ai-analyzer'

interface Props {
  titles: string[]
  currentVerticality: {
    score: number
    mainTopics: { topic: string; weight: number }[]
    assessment: string
    suggestion: string
  }
}

const STORAGE_KEY = 'xhs_ai_api_key'

export default function AIContentAnalysis({ titles, currentVerticality }: Props) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem(STORAGE_KEY))
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeContentWithAI>> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey)
  }, [apiKey])

  const handleAnalyze = async () => {
    if (!apiKey.trim()) return
    setError('')
    setAnalyzing(true)
    try {
      const r = await analyzeContentWithAI(titles, apiKey.trim())
      setResult(r)
    } catch (e: any) {
      setError(e.message || '分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">🤖 AI 内容类型分析</h2>
          <p className="text-xs text-gray-400 mt-1">
            汇总所有帖子标题，AI 一键分析账号的内容方向和垂直度
          </p>
        </div>
        {!showKeyInput && !result && (
          <button
            onClick={() => setShowKeyInput(true)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            更换 API Key
          </button>
        )}
      </div>

      {/* API Key 输入 */}
      {showKeyInput && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-800 mb-2 font-medium">需要 Groq API Key（免费）</p>
          <p className="text-xs text-amber-600 mb-3">
            前往 <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">console.groq.com/keys</a> 注册并创建 API Key，免费额度足够日常使用
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={() => { setShowKeyInput(false); handleAnalyze() }}
              disabled={!apiKey.trim() || analyzing}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 whitespace-nowrap"
            >
              {analyzing ? '分析中...' : '开始分析'}
            </button>
          </div>
          <button
            onClick={() => setShowKeyInput(false)}
            className="text-xs text-gray-400 hover:text-gray-600 mt-2"
          >
            取消
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 分析中 */}
      {analyzing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-red-200 border-t-red-500 mb-3" />
          <p className="text-sm text-gray-500">AI 正在分析 {titles.length} 条帖子标题...</p>
          <p className="text-xs text-gray-400 mt-1">这可能需要几秒钟</p>
        </div>
      )}

      {/* AI 分析结果 */}
      {result && (
        <div className="space-y-4">
          {/* 核心结论 */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">{result.mainDirection}</p>
                <p className="text-xs text-red-700">{result.verticalityAssessment}</p>
              </div>
              <div className="text-center shrink-0 ml-4">
                <div className="text-3xl font-bold text-red-600">{result.verticalityScore}</div>
                <div className="text-xs text-red-400">AI 垂直度评分</div>
              </div>
            </div>
          </div>

          {/* 分类详情 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              内容分类分布（基于 {titles.length} 条帖子标题）
            </h4>
            <div className="space-y-3">
              {result.categories.map((cat, idx) => (
                <div key={cat.name} className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                        <span className="text-xs text-gray-400">{cat.count}篇</span>
                        {idx === 0 && <Badge variant="great">最多</Badge>}
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <ProgressBar
                      value={cat.percentage}
                      max={100}
                      color={idx === 0 ? 'bg-red-400' : idx === 1 ? 'bg-orange-400' : 'bg-gray-300'}
                    />
                    {cat.sampleTitles && cat.sampleTitles.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        如：{cat.sampleTitles.slice(0, 2).join('、')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 对比系统评分 */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>系统评分: {currentVerticality.score}分</span>
              <span>AI 评分: {result.verticalityScore}分</span>
            </div>
            <div className="flex h-2 mt-1 rounded-full overflow-hidden">
              <div
                className="bg-red-400 transition-all"
                style={{ width: `${Math.max(currentVerticality.score, result.verticalityScore)}%` }}
              />
            </div>
          </div>

          {/* 建议 */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-900 font-medium mb-1">💡 AI 建议</p>
            <p className="text-xs text-blue-700">{result.suggestion}</p>
          </div>
        </div>
      )}

      {/* 未开始分析时的提示 */}
      {!result && !analyzing && !showKeyInput && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">点击下方按钮，让 AI 分析你的账号内容</p>
          <button
            onClick={() => { if (apiKey) handleAnalyze(); else setShowKeyInput(true) }}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            🤖 AI 分析内容类型
          </button>
        </div>
      )}
    </Card>
  )
}
