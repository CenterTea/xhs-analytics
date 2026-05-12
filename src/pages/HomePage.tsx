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

        {/* Export Guide Card - 更醒目 */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📥</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                不知道怎么导出数据？看这里
              </h3>
              <p className="text-amber-800 text-sm mb-4">
                我们支持小红书创作者中心导出的 Excel 文件，以及 xhs-creator-export 插件导出的数据。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-amber-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-red-500">🇨🇳</span> 国内版小红书
                  </h4>
                  <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
                    <li>电脑打开 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">creator.xiaohongshu.com</code></li>
                    <li>APP 扫码登录 → 左侧「数据看板」→「内容分析」</li>
                    <li>点击「导出报表」下载 xlsx 文件</li>
                  </ol>
                  <p className="text-xs text-gray-400 mt-2">
                    或使用 <a href="https://github.com/iSk2y/xhs-creator-export" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">xhs-creator-export</a> 插件导出更全的数据
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-blue-500">🌍</span> 海外版 REDnote
                  </h4>
                  <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
                    <li>打开 REDnote App →「Profile」→ 右上角菜单</li>
                    <li>进入「Creator Center」→「Data Center」</li>
                    <li>查看数据或导出（如支持）</li>
                  </ol>
                  <p className="text-xs text-gray-400 mt-2">
                    海外版目前主要是 App 内查看，导出功能可能不完善
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">上传你的数据</h3>
            <p className="text-sm text-gray-500">支持 xlsx / xls / CSV / JSON 格式，数据仅在本地处理</p>
          </div>
          <FileUpload onDataLoaded={handleDataLoaded} />
          <div className="mt-6 flex items-center gap-4 justify-center">
            <span className="text-sm text-gray-400">还没有数据？</span>
            <button
              onClick={handleLoadSample}
              className="text-sm text-red-500 hover:text-red-600 font-medium px-4 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              先加载示例数据体验一下
            </button>
          </div>
        </div>

        {/* Detailed Upload guide - collapsible */}
        <div className="mt-8">
          <UploadGuide />
        </div>
      </div>
    </div>
  )
}
