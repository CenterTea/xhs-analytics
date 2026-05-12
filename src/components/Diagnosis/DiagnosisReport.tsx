import { useRef } from 'react'
import type { Post, Diagnosis } from '../../types'

interface DiagnosisReportProps {
  diagnosis: Diagnosis
  post: Post
}

export default function DiagnosisReport({ diagnosis, post }: DiagnosisReportProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  const handleCopyText = () => {
    const text = generateReportText(diagnosis, post)
    navigator.clipboard.writeText(text).then(() => {
      alert('报告文案已复制到剪贴板')
    })
  }

  return (
    <div>
      <div ref={reportRef} className="space-y-6">
        {/* 报告头部 */}
        <div className="text-center pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">帖子数据分析报告</h3>
          <p className="text-sm text-gray-400 mt-1">
            {post.title} · {post.publishDate}
          </p>
          <div className="mt-3">
            <span
              className={`inline-block text-sm font-semibold px-4 py-1.5 rounded-full ${
                diagnosis.overallRating === 'excellent'
                  ? 'bg-green-100 text-green-700'
                  : diagnosis.overallRating === 'good'
                  ? 'bg-blue-100 text-blue-700'
                  : diagnosis.overallRating === 'average'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              综合评级：
              {diagnosis.overallRating === 'excellent'
                ? '优秀'
                : diagnosis.overallRating === 'good'
                ? '良好'
                : diagnosis.overallRating === 'average'
                ? '一般'
                : '需改进'}
            </span>
          </div>
        </div>

        {/* 数据总览 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">数据总览</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: '曝光量', value: post.impressions.toLocaleString() },
              { label: '阅读量', value: post.views.toLocaleString() },
              {
                label: '互动量',
                value: (post.likes + post.saves + post.comments + post.shares).toLocaleString(),
              },
              { label: '涨粉', value: post.newFollowers.toLocaleString() },
            ].map((d) => (
              <div key={d.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">{d.label}</p>
                <p className="text-lg font-bold text-gray-900">{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 问题诊断 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">问题诊断</h4>
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <p className="text-sm font-medium text-red-700 mb-1">根本问题</p>
            <p className="text-red-600">{diagnosis.rootCause}</p>
          </div>
        </div>

        {/* 归因分析 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">归因分析</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {diagnosis.attribution}
          </p>
        </div>

        {/* 改进建议 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">改进建议</h4>
          <div className="space-y-2">
            {diagnosis.improvements.map((imp, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${
                  imp.priority === 'high'
                    ? 'bg-red-50 text-red-700'
                    : imp.priority === 'medium'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                <span className="font-medium">
                  [{imp.priority === 'high' ? '优先' : imp.priority === 'medium' ? '建议' : '可选'}]
                </span>{' '}
                {imp.description}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleCopyText}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
        >
          复制报告文案
        </button>
      </div>
    </div>
  )
}

function generateReportText(diagnosis: Diagnosis, post: Post): string {
  return `【小红书帖子数据分析报告】

📝 帖子：${post.title}
📅 发布时间：${post.publishDate}

📊 数据总览：
- 曝光量：${post.impressions.toLocaleString()}
- 阅读量：${post.views.toLocaleString()}
- 互动量：${(post.likes + post.saves + post.comments + post.shares).toLocaleString()}
- 涨粉：${post.newFollowers.toLocaleString()}

🎯 综合评级：${
    diagnosis.overallRating === 'excellent'
      ? '优秀'
      : diagnosis.overallRating === 'good'
      ? '良好'
      : diagnosis.overallRating === 'average'
      ? '一般'
      : '需改进'
  }

🔍 问题诊断：${diagnosis.rootCause}

💡 归因分析：${diagnosis.attribution}

📌 改进建议：
${diagnosis.improvements
  .map(
    (imp, i) =>
      `${i + 1}. [${
        imp.priority === 'high' ? '优先' : imp.priority === 'medium' ? '建议' : '可选'
      }] ${imp.description}`
  )
  .join('\n')}

---
生成自：小红书数据分析工具 (xhs-analytics)
`
}
