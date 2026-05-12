import type { Post } from '../types'
import { calculatePostRates } from './calculate'

interface RawPost {
  id: string
  title: string
  type: 'image' | 'video'
  publishDate: string
  topics: string[]
  impressions: number
  views: number
  completionRate?: number
  avgWatchTime?: number
  totalWatchTime?: number
  likes: number
  saves: number
  comments: number
  shares: number
  newFollowers: number
  effectiveComments: number
  ineffectiveComments: number
  viewingPeriods?: number[]
  trafficSources?: {
    recommend: number
    search: number
    following: number
    profile: number
    other: number
  }
}

const rawPosts: RawPost[] = [
  {
    id: 'post-1',
    title: '新手必看！3步搞定日常通勤妆，5分钟出门',
    type: 'image',
    publishDate: '2026-05-01',
    topics: ['美妆', '通勤妆', '新手化妆'],
    impressions: 28500,
    views: 5200,
    completionRate: 0.55,
    avgWatchTime: 32,
    totalWatchTime: 166400,
    likes: 416,
    saves: 312,
    comments: 130,
    shares: 62,
    newFollowers: 130,
    effectiveComments: 95,
    ineffectiveComments: 35,
    viewingPeriods: [7, 6, 5, 3, 2, 2, 4, 8, 12, 18, 22, 28, 32, 30, 25, 20, 18, 22, 30, 35, 38, 28, 18, 10],
    trafficSources: {
      recommend: 3200,
      search: 1200,
      following: 500,
      profile: 200,
      other: 100,
    },
  },
  {
    id: 'post-2',
    title: '千万别买！我踩雷的10件网红护肤品',
    type: 'video',
    publishDate: '2026-05-03',
    topics: ['美妆', '护肤避雷', '网红产品'],
    impressions: 45000,
    views: 9900,
    completionRate: 0.62,
    avgWatchTime: 58,
    totalWatchTime: 574200,
    likes: 891,
    saves: 693,
    comments: 396,
    shares: 198,
    newFollowers: 297,
    effectiveComments: 320,
    ineffectiveComments: 76,
    viewingPeriods: [5, 4, 3, 2, 2, 3, 5, 9, 15, 22, 30, 38, 40, 35, 28, 22, 20, 25, 35, 42, 38, 25, 15, 8],
    trafficSources: {
      recommend: 6800,
      search: 1800,
      following: 800,
      profile: 300,
      other: 200,
    },
  },
  {
    id: 'post-3',
    title: '周末在家做了一个蛋糕，太治愈了',
    type: 'image',
    publishDate: '2026-05-05',
    topics: ['美食', '烘焙', '治愈'],
    impressions: 8200,
    views: 650,
    completionRate: 0.38,
    avgWatchTime: 15,
    totalWatchTime: 9750,
    likes: 26,
    saves: 12,
    comments: 8,
    shares: 3,
    newFollowers: 4,
    effectiveComments: 5,
    ineffectiveComments: 3,
    viewingPeriods: [10, 5, 3, 2, 2, 3, 5, 8, 10, 12, 15, 18, 20, 18, 15, 14, 16, 20, 25, 28, 22, 15, 12, 8],
  },
  {
    id: 'post-4',
    title: '打工人一周便当合集！每天15分钟，月省2000外卖费',
    type: 'image',
    publishDate: '2026-04-28',
    topics: ['美食', '便当', '省钱', '打工人'],
    impressions: 32000,
    views: 5100,
    completionRate: 0.58,
    avgWatchTime: 38,
    totalWatchTime: 193800,
    likes: 357,
    saves: 408,
    comments: 153,
    shares: 77,
    newFollowers: 102,
    effectiveComments: 120,
    ineffectiveComments: 33,
    viewingPeriods: [8, 6, 4, 3, 3, 5, 8, 12, 18, 25, 32, 35, 30, 22, 18, 16, 18, 22, 28, 32, 30, 20, 12, 8],
    trafficSources: {
      recommend: 3000,
      search: 1500,
      following: 400,
      profile: 150,
      other: 50,
    },
  },
  {
    id: 'post-5',
    title: '面试官说"你还有什么问题"时，问这5个问题直接拿offer',
    type: 'image',
    publishDate: '2026-04-25',
    topics: ['职场', '面试技巧', '干货'],
    impressions: 68000,
    views: 10200,
    completionRate: 0.70,
    avgWatchTime: 52,
    totalWatchTime: 530400,
    likes: 612,
    saves: 918,
    comments: 408,
    shares: 255,
    newFollowers: 357,
    effectiveComments: 350,
    ineffectiveComments: 58,
    viewingPeriods: [6, 5, 4, 3, 3, 5, 8, 12, 18, 28, 38, 42, 38, 30, 22, 18, 20, 28, 38, 42, 38, 28, 18, 10],
    trafficSources: {
      recommend: 5500,
      search: 3500,
      following: 700,
      profile: 300,
      other: 200,
    },
  },
  {
    id: 'post-6',
    title: '30岁裸辞去大理，一个月花了多少钱？真实账单公开',
    type: 'video',
    publishDate: '2026-04-20',
    topics: ['旅行', '大理', '裸辞', '生活方式'],
    impressions: 56000,
    views: 11200,
    completionRate: 0.65,
    avgWatchTime: 78,
    totalWatchTime: 873600,
    likes: 896,
    saves: 448,
    comments: 392,
    shares: 202,
    newFollowers: 314,
    effectiveComments: 340,
    ineffectiveComments: 52,
    viewingPeriods: [4, 3, 2, 2, 2, 4, 6, 10, 16, 25, 35, 42, 45, 38, 30, 22, 18, 25, 32, 40, 45, 35, 20, 10],
    trafficSources: {
      recommend: 7200,
      search: 2200,
      following: 1100,
      profile: 400,
      other: 300,
    },
  },
  {
    id: 'post-7',
    title: '春天的第一支口红，这个颜色太显白了！',
    type: 'image',
    publishDate: '2026-04-15',
    topics: ['美妆', '口红', '显白'],
    impressions: 15000,
    views: 1800,
    completionRate: 0.40,
    avgWatchTime: 20,
    totalWatchTime: 36000,
    likes: 90,
    saves: 36,
    comments: 27,
    shares: 14,
    newFollowers: 18,
    effectiveComments: 18,
    ineffectiveComments: 9,
    viewingPeriods: [9, 6, 4, 3, 3, 5, 7, 10, 12, 15, 18, 22, 25, 22, 18, 15, 14, 18, 24, 30, 28, 20, 12, 8],
  },
  {
    id: 'post-8',
    title: '今日穿搭 | 早春温柔风，梨形身材救星',
    type: 'image',
    publishDate: '2026-04-10',
    topics: ['穿搭', '早春', '梨形身材'],
    impressions: 12000,
    views: 1200,
    completionRate: 0.42,
    avgWatchTime: 18,
    totalWatchTime: 21600,
    likes: 60,
    saves: 36,
    comments: 18,
    shares: 10,
    newFollowers: 12,
    effectiveComments: 12,
    ineffectiveComments: 6,
    viewingPeriods: [10, 7, 5, 3, 3, 5, 8, 12, 15, 18, 20, 22, 25, 20, 16, 14, 15, 20, 25, 28, 25, 18, 12, 8],
  },
]

export function loadSampleData(): { posts: Post[] } {
  const posts = rawPosts.map((p) => {
    const post: Partial<Post> = {
      ...p,
      coverCTR: 0,
      likeRate: 0,
      saveRate: 0,
      commentRate: 0,
      shareRate: 0,
      interactionRate: 0,
      followConversionRate: 0,
      effectiveCommentRate: 0,
    }
    return calculatePostRates(post)
  })
  return { posts }
}
