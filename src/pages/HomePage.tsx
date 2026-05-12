import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import FileUpload from '../components/Upload/FileUpload'
import UploadGuide from '../components/Upload/UploadGuide'
import { loadSampleData } from '../utils/sample-data'

export default function HomePage() {
  const navigate = useNavigate()
  const { setData } = useData()

  const handleDataLoaded = (data: any) => {
    setData(data)
    navigate('/dashboard')
  }

  const handleLoadSample = () => {
    const sampleData = loadSampleData()
    setData(sampleData)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            小红书数据分析工具
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            上传你的帖子数据，一键生成完整的数据分析报告。看懂每篇帖子的真实表现，
            找到流量密码，持续优化你的内容。
          </p>
        </div>

        {/* Features overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: '📊',
              title: '漏斗分析',
              desc: '曝光→点击→阅读→互动→转化，逐层拆解',
            },
            {
              icon: '🔍',
              title: '归因诊断',
              desc: '自动定位问题所在，给出可操作的改进建议',
            },
            {
              icon: '💡',
              title: '素人参考',
              desc: '看同类型普通创作者的爆款是怎么做的',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <FileUpload onDataLoaded={handleDataLoaded} />
          <div className="mt-6 flex items-center gap-4 justify-center">
            <span className="text-sm text-gray-400">或者</span>
            <button
              onClick={handleLoadSample}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              加载示例数据体验一下
            </button>
          </div>
        </div>

        {/* Upload guide */}
        <UploadGuide />
      </div>
    </div>
  )
}
