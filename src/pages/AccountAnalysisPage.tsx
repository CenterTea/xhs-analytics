import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import VerticalityGauge from '../components/AccountAnalysis/VerticalityGauge'
import FanStickiness from '../components/AccountAnalysis/FanStickiness'
import MonetizationMatrix from '../components/AccountAnalysis/MonetizationMatrix'
import DirectionAdvice from '../components/AccountAnalysis/DirectionAdvice'

export default function AccountAnalysisPage() {
  const { accountAnalysis, posts } = useData()
  const navigate = useNavigate()

  if (!posts.length) {
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
          <FanStickiness data={accountAnalysis.fanStickiness} />
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
