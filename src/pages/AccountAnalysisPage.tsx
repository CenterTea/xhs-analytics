import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import VerticalityGauge from '../components/AccountAnalysis/VerticalityGauge'
import FanStickiness from '../components/AccountAnalysis/FanStickiness'
import FanAnalysisDetail from '../components/AccountAnalysis/FanAnalysisDetail'
import MonetizationMatrix from '../components/AccountAnalysis/MonetizationMatrix'
import DirectionAdvice from '../components/AccountAnalysis/DirectionAdvice'
import AIContentAnalysis from '../components/AccountAnalysis/AIContentAnalysis'

export default function AccountAnalysisPage() {
  const { accountAnalysis, accountStats, posts } = useData()
  const navigate = useNavigate()

  // 收集所有帖子标题用于 AI 分析
  const allTitles = posts.map(p => p.title).filter(Boolean)

  if (!posts.length || !accountStats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">还没有数据，请先上传</p>
        <button
          onClick={() => navigate('/')}
          className="text-red-500 hover:text-red-600 font-medium"
        >
          返回首页上传数据
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">账号深度分析</h1>

      {accountAnalysis ? (
        <div className="space-y-8">
          <VerticalityGauge data={accountAnalysis.contentVerticality} />
          <AIContentAnalysis
            titles={allTitles}
            currentVerticality={accountAnalysis.contentVerticality}
          />
          <FanStickiness data={accountAnalysis.fanStickiness} />
          {/* 粉丝深度分析 */}
          <FanAnalysisDetail
            posts={posts}
            stats={accountStats}
            fanStickiness={accountAnalysis.fanStickiness}
          />
          <MonetizationMatrix data={accountAnalysis.monetizationPotential} />
          <DirectionAdvice
            direction={accountAnalysis.overallDirection}
            monetization={accountAnalysis.monetizationPotential}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">正在计算账号分析数据...</p>
        </div>
      )}
    </div>
  )
}
