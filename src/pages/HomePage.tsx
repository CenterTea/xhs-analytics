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
            看不懂数据？我们来帮你看
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            不用学数据分析，不用研究算法。上传你的帖子数据，我们会像朋友一样告诉你：
            哪篇做得好、哪篇有问题、问题出在哪、怎么改。
          </p>
        </div>

        {/* Features overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: '📊',
              title: '逐层拆解每篇帖子',
              desc: '从曝光→点击→看完→互动→关注，每一步都告诉你做得怎么样，跟同类比起来算什么水平。',
            },
            {
              icon: '🔍',
              title: '像朋友一样给你建议',
              desc: '不会甩一堆术语给你。直接告诉你"封面可以怎么改"、"开头不够吸引人"这种听得懂的改进方向。',
            },
            {
              icon: '💡',
              title: '看看普通人怎么做爆的',
              desc: '不给你看大V的数据（人家有粉丝基础没法比）。给你看跟你一样的普通人是怎么做出爆款的。',
            },
            {
              icon: '💬',
              title: '评论区是在帮你还是害你？',
              desc: '评论多不一定是好事。有时候评论区太热闹反而没人关注你了。帮你判断评论区是加分还是减分。',
            },
            {
              icon: '🏠',
              title: '你的账号健康吗？',
              desc: '内容够不够垂直？粉丝粘不粘你？能不能开始接广变现了？全方位给你的账号做个体检。',
            },
            {
              icon: '📝',
              title: '一键生成分析报告',
              desc: '所有分析汇总成一份报告，可以直接复制文案，方便自己复盘或者发给朋友帮你看。',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <FileUpload onDataLoaded={handleDataLoaded} />
          <div className="mt-6 flex items-center gap-4 justify-center">
            <span className="text-sm text-gray-400">还没有数据？</span>
            <button
              onClick={handleLoadSample}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              先加载示例数据体验一下
            </button>
          </div>
        </div>

        {/* Upload guide */}
        <UploadGuide />
      </div>
    </div>
  )
}
