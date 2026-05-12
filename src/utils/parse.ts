import * as XLSX from 'xlsx'
import type { Post } from '../types'
import { calculatePostRates } from './calculate'

/**
 * 解析上传的 CSV 或 Excel 文件
 * 兼容小红书千帆后台导出 和 xhs-creator-export 工具导出两种格式
 */
export async function parseFile(file: File): Promise<Post[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

  return rawData.map((row, index) => {
    const post = parseRow(row, index)
    return calculatePostRates(post)
  })
}

// 字段映射：管理可能的列名变体
const fieldMapping: Record<string, string[]> = {
  id: ['笔记ID', 'id', 'post_id', 'article_id', '笔记id', '编号'],
  title: ['标题', 'title', '笔记标题', '内容标题'],
  type: ['类型', 'type', '笔记类型', '内容类型', 'media_type'],
  publishDate: ['发布时间', 'publishDate', '发布时间', 'publish_time', '发布日期', 'date'],
  impressions: ['曝光量', 'impressions', '曝光', '展现量', '展示量'],
  views: ['阅读量', 'views', '阅读', '浏览', '浏览量', '播放量', '播放'],
  avgWatchTime: ['平均观看时长', 'avgWatchTime', '平均停留时长', '观看时长'],
  completionRate: ['完播率', 'completionRate', '完播率', '阅读完成率'],
  likes: ['点赞数', 'likes', '点赞', '点赞量'],
  saves: ['收藏数', 'saves', '收藏', '收藏量', 'bookmarks'],
  comments: ['评论数', 'comments', '评论', '评论量'],
  shares: ['转发数', 'shares', '转发', '分享', '分享数', 'share_count'],
  newFollowers: ['涨粉数', 'newFollowers', '新增粉丝', '涨粉', 'follows'],
  effectiveComments: ['有效评论数', 'effectiveComments', '有效评论'],
  ineffectiveComments: ['无效评论数', 'ineffectiveComments', '无效评论'],
  topics: ['话题', 'topics', '标签', 'tags', '话题标签'],
  recommend: ['推荐流量', 'recommend', '推荐', '推荐来源'],
  search: ['搜索流量', 'search', '搜索', '搜索来源'],
  following: ['关注流量', 'following', '关注', '关注来源'],
  profile: ['个人主页流量', 'profile', '个人主页', '主页来源'],
  other: ['其他流量', 'other', '其他来源'],
}

function getField(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key]
    }
  }
  return undefined
}

function parseRow(row: Record<string, unknown>, index: number): Partial<Post> {
  const get = (field: keyof typeof fieldMapping): unknown =>
    getField(row, fieldMapping[field])

  const typeStr = String(get('type') ?? 'image')
  const postType: 'image' | 'video' =
    typeStr.includes('视频') || typeStr.includes('video') ? 'video' : 'image'

  // 解析百分比字符串
  const parsePercent = (val: unknown): number | undefined => {
    if (val === undefined) return undefined
    const str = String(val)
    if (str.includes('%')) return parseFloat(str) / 100
    const num = parseFloat(str)
    return isNaN(num) ? undefined : num > 1 ? num / 100 : num
  }

  const hasTrafficSources =
    get('recommend') !== undefined ||
    get('search') !== undefined

  return {
    id: String(get('id') ?? `post-${index + 1}`),
    title: String(get('title') ?? `未命名帖子 ${index + 1}`),
    type: postType,
    publishDate: String(get('publishDate') ?? new Date().toISOString().slice(0, 10)),
    topics: parseTopics(get('topics')),
    impressions: Number(get('impressions') ?? 0),
    views: Number(get('views') ?? 0),
    avgWatchTime: get('avgWatchTime') !== undefined ? Number(get('avgWatchTime')) : undefined,
    completionRate: parsePercent(get('completionRate')),
    likes: Number(get('likes') ?? 0),
    saves: Number(get('saves') ?? 0),
    comments: Number(get('comments') ?? 0),
    shares: Number(get('shares') ?? 0),
    newFollowers: Number(get('newFollowers') ?? 0),
    effectiveComments: Number(get('effectiveComments') ?? 0),
    ineffectiveComments: Number(get('ineffectiveComments') ?? 0),
    trafficSources: hasTrafficSources
      ? {
          recommend: Number(get('recommend') ?? 0),
          search: Number(get('search') ?? 0),
          following: Number(get('following') ?? 0),
          profile: Number(get('profile') ?? 0),
          other: Number(get('other') ?? 0),
        }
      : undefined,
  }
}

function parseTopics(val: unknown): string[] {
  if (!val) return []
  const str = String(val)
  // 支持逗号、中文逗号、空格、分号分隔
  return str
    .split(/[,，、；;\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}
