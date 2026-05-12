import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-gray-50">
      {!isHome && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="text-lg font-bold text-red-500">
              小红书数据分析
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link
                to="/dashboard"
                className={`hover:text-red-500 transition-colors ${
                  location.pathname === '/dashboard' ? 'text-red-500 font-medium' : 'text-gray-600'
                }`}
              >
                数据看板
              </Link>
              <Link
                to="/account-analysis"
                className={`hover:text-red-500 transition-colors ${
                  location.pathname === '/account-analysis' ? 'text-red-500 font-medium' : 'text-gray-600'
                }`}
              >
                账号分析
              </Link>
            </div>
          </div>
        </nav>
      )}
      <main>{children}</main>
    </div>
  )
}
