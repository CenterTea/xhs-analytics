import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  const tabs = [
    { path: '/dashboard', label: '数据看板', icon: '📊' },
    { path: '/account-analysis', label: '账号分析', icon: '🔍' },
    { path: '/post-analysis', label: '单帖分析', icon: '📝' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {!isHome && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            {/* Top bar with logo */}
            <div className="h-14 flex items-center justify-between">
              <Link to="/" className="text-lg font-bold text-red-500">
                小红书数据分析
              </Link>
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                返回首页
              </Link>
            </div>

            {/* Tab navigation - centered and prominent */}
            <div className="flex justify-center pb-0">
              <div className="flex bg-gray-100 rounded-t-lg p-1">
                {tabs.map((tab) => {
                  const isActive = location.pathname.startsWith(tab.path) ||
                    (tab.path === '/post-analysis' && location.pathname.startsWith('/post/'))
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-white text-red-500 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </nav>
      )}
      <main>{children}</main>
    </div>
  )
}
