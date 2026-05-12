import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { Post, AccountStats, AccountAnalysis, Diagnosis } from '../types'
import { calculateAccountStats } from '../utils/calculate'
import { analyzeAccount } from '../utils/account-analyzer'
import { diagnosePost } from '../utils/diagnose'

interface AppData {
  posts: Post[]
  accountStats: AccountStats | null
  accountAnalysis: AccountAnalysis | null
}

interface DataContextType extends AppData {
  setData: (data: { posts: Post[] }) => void
  getDiagnosis: (post: Post) => Diagnosis
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<AppData>({
    posts: [],
    accountStats: null,
    accountAnalysis: null,
  })

  const setData = useCallback((raw: { posts: Post[] }) => {
    const posts = raw.posts
    const accountStats = calculateAccountStats(posts)
    const accountAnalysis = analyzeAccount(posts, accountStats)
    setDataState({ posts, accountStats, accountAnalysis })
  }, [])

  const getDiagnosis = useCallback(
    (post: Post): Diagnosis => {
      return diagnosePost(post, data.posts)
    },
    [data.posts]
  )

  const value = useMemo(
    () => ({ ...data, setData, getDiagnosis }),
    [data, setData, getDiagnosis]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
