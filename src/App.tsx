import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import AccountAnalysisPage from './pages/AccountAnalysisPage'
import PostDetailPage from './pages/PostDetailPage'
import { DataProvider } from './context/DataContext'

function App() {
  return (
    <DataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account-analysis" element={<AccountAnalysisPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
        </Routes>
      </Layout>
    </DataProvider>
  )
}

export default App
