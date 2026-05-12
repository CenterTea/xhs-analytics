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
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6 text-left max-w-2xl mx-auto space-y-6 text-sm text-gray-600">

          {/* 国内版 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">国内版小红书</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="font-medium text-gray-800">方法一：官方创作者中心导出</p>
                <ol className="list-decimal list-inside space-y-1 mt-1">
                  <li>电脑浏览器打开 <code className="bg-white px-1 rounded border">creator.xiaohongshu.com</code></li>
                  <li>用小红书 APP 扫码登录</li>
                  <li>左侧菜单点「数据看板」→「内容分析」</li>
                  <li>点击「导出数据」→ 下载 <strong>xlsx</strong> 文件</li>
                  <li>直接把下载的 xlsx 文件上传到本工具即可</li>
                </ol>
                <p className="text-xs text-gray-400 mt-1">
                  官方导出格式是 xlsx（Excel），本工具支持直接上传。
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">方法二：xhs-creator-export 插件（推荐）</p>
                <ol className="list-decimal list-inside space-y-1 mt-1">
                  <li>浏览器打开 <code className="bg-white px-1 rounded border">github.com/iSk2y/xhs-creator-export</code></li>
                  <li>按说明安装 Tampermonkey 脚本或 Chrome 插件</li>
                  <li>登录 creator.xiaohongshu.com 后，顶部会出现红色「导出全部数据」按钮</li>
                  <li>一键导出 xlsx——字段比官方更全（有封面点击率、平均观看时长等）</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 海外版 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">海外版 REDnote</h4>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-lg mb-2">🚫</p>
              <p className="font-medium text-gray-700">暂不支持海外账号数据分析</p>
              <p className="text-xs text-gray-400 mt-1">
                目前仅支持国内版小红书导出的数据文件
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            支持上传 xlsx / xls / CSV / JSON 格式。所有数据只在你的浏览器里处理，不会上传到任何服务器。
          </p>
        </div>
      )}
    </div>
  )
}
