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
                  <li>右上角点「导出报表」→ 选 CSV 格式 → 下载</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-gray-800">方法二：xhs-creator-export 插件（推荐）</p>
                <ol className="list-decimal list-inside space-y-1 mt-1">
                  <li>浏览器打开 <code className="bg-white px-1 rounded border">github.com/iSk2y/xhs-creator-export</code></li>
                  <li>按说明安装浏览器插件（Chrome / Edge 都支持）</li>
                  <li>登录 creator.xiaohongshu.com 后，顶部会出现红色「导出全部数据」按钮</li>
                  <li>一键导出——字段比官方更全（有封面点击率、平均观看时长等）</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 海外版 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">海外版 REDnote</h4>
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-xs text-blue-600 mb-2">
                自 2026 年 3 月起，海外版已独立为 <strong>REDnote</strong>，数据与国内版完全分离，互不相通。
              </p>
              <div>
                <p className="font-medium text-blue-900">方法一：REDnote 创作者中心导出</p>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-blue-800">
                  <li>电脑浏览器打开 <code className="bg-blue-100 px-1 rounded">rednote.com</code> 并登录</li>
                  <li>点击右上角头像 → 选择「Creator Center」（创作者中心）</li>
                  <li>进入「Data Dashboard」（数据看板）→「Content Analysis」（内容分析）</li>
                  <li>点击「Export Report」（导出报表），选择 CSV 格式下载</li>
                </ol>
                <p className="text-xs text-blue-500 mt-1">
                  如果找不到入口，也可以直接尝试访问 <code className="bg-blue-100 px-1 rounded">creator.rednote.com</code>
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-900">方法二：用 App 查看并手动记录</p>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-blue-800">
                  <li>打开 REDnote App → 右下角「Profile」（我）</li>
                  <li>右上角三条线 →「Creator Center」（创作者中心）</li>
                  <li>「Data Center」（数据中心）→ 选择你要看的笔记</li>
                  <li>逐篇截图或记录关键数据，然后在本工具手动输入</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-blue-900">方法三：加载示例数据先体验</p>
                <p className="text-xs text-blue-700 mt-1">
                  如果暂时导不出数据，可以先点「加载示例数据」体验本工具的全部功能。
                  示例数据包含了 8 篇不同类型帖子的完整数据，可以完整走一遍分析流程。
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            导出后上传 CSV / Excel / JSON 文件即可。文件完全在你的浏览器里处理，不会上传到任何服务器。
          </p>
        </div>
      )}
    </div>
  )
}
