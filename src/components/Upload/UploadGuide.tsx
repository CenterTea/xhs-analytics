import { useState } from 'react'

export default function UploadGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-8 text-center">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-400 hover:text-gray-600"
      >
        {open ? '收起' : '不知道怎么导出数据？看这里 →'}
      </button>

      {open && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6 text-left max-w-2xl mx-auto">
          <h3 className="font-semibold text-gray-900 mb-3">如何从小红书导出数据？</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-800">方法一：官方创作者平台导出</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>电脑浏览器打开 <code className="bg-gray-100 px-1 rounded">creator.xiaohongshu.com</code></li>
                <li>用小红书 APP 扫码登录</li>
                <li>进入「数据看板」→「内容分析」</li>
                <li>点击右上角「导出报表」，选 CSV 格式下载</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-gray-800">方法二：xhs-creator-export 工具（推荐，导出的数据更全）</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>访问 <code className="bg-gray-100 px-1 rounded">github.com/iSk2y/xhs-creator-export</code></li>
                <li>安装浏览器插件（支持 Chrome / Edge）</li>
                <li>登录小红书创作平台后，点插件一键导出</li>
                <li>导出的字段更全——封面点击率、平均观看时长这些官方导出没有的它都有</li>
              </ol>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="font-medium text-blue-800 text-xs mb-1">海外用户（REDnote）</p>
              <p className="text-xs text-blue-600">
                自 2026 年 3 月起，小红书海外版已独立为 <strong>REDnote</strong>，数据与国内版分离。
                海外创作者请访问 <code className="bg-blue-100 px-1 rounded">rednote.com</code>，
                在创作者中心导出数据。注意：海外版与国内版数据不互通。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
