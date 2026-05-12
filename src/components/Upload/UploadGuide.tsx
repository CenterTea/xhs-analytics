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
                  <li>点击「导出报表」→ 下载 <strong>xlsx</strong> 文件</li>
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
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-xs text-blue-600 mb-2">
                REDnote 的创作者中心目前是 <strong>App 内嵌功能</strong>，没有独立的 PC 网页版后台。
                数据导出功能可能还没有国内版完善。以下是目前可用的方法：
              </p>
              <div>
                <p className="font-medium text-blue-900">方法一：App 内查看数据</p>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-blue-800">
                  <li>打开 REDnote App → 右下角「Profile」</li>
                  <li>点右上角三条线 →「Creator Center」（创作者中心）</li>
                  <li>进入「Data Center」（数据中心）查看各篇笔记数据</li>
                  <li>逐篇截屏记录关键数字，上传截图或手动填入本工具</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-blue-900">方法二：试试官方导出（如果有的话）</p>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-blue-800">
                  <li>在 App 的 Creator Center → Data Center 里找「Export」按钮</li>
                  <li>部分海外账号可能支持导出 xlsx 文件到邮箱</li>
                  <li>如果找不到导出按钮，说明你的账号暂时还不支持导出</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-blue-900">方法三：先体验示例数据</p>
                <p className="text-xs text-blue-700 mt-1">
                  暂时导不出也不要紧，点首页的「加载示例数据」就能完整体验全部分析功能。
                  等 REDnote 的数据导出功能上线后再用自己的数据。
                </p>
              </div>
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
