import * as XLSX from 'xlsx'
import type { Post } from '../types'
import { calculatePostRates } from './calculate'

export interface ParseDebugInfo {
  sheetNames: string[]
  columnNames: string[]
  rowCount: number
  sampleRows: Record<string, unknown>[]
}

/**
 * 获取文件的调试信息（用于诊断解析问题）
 */
export async function getParseDebugInfo(file: File): Promise<ParseDebugInfo> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

  return {
    sheetNames: workbook.SheetNames,
    columnNames: rawData.length > 0 ? Object.keys(rawData[0]) : [],
    rowCount: rawData.length,
    sampleRows: rawData.slice(0, 3),
  }
}

/**
 * 解析上传的 CSV 或 Excel 文件
 * 兼容小红书创作者平台导出 和 xhs-creator-export 工具导出两种格式
 */
export async function parseFile(file: File): Promise<Post[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  if (workbook.SheetNames.length === 0) {
    throw new Error('Excel 文件中没有工作表')
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

  if (rawData.length === 0) {
    const sheetNames = workbook.SheetNames.join('、')
    throw new Error(
      `文件中没有数据行。\n\n` +
      `检测到的工作表：${sheetNames}\n\n` +
      `请确认：\n` +
      `1. 数据是否在第一个工作表中\n` +
      `2. 文件是否包含表头行\n` +
      `3. 是否上传了正确的数据文件`
    )
  }

  const posts = rawData.map((row, index) => {
    const post = parseRow(row, index)
    return calculatePostRates(post)
  })

  // 检查是否所有数据都是空的（列名没匹配上）
  const allEmpty = posts.every(
    (p) => p.impressions === 0 && p.views === 0 && p.likes === 0
  )
  if (allEmpty) {
    const fileColumns = Object.keys(rawData[0]).join('、')
    const sampleData = JSON.stringify(rawData[0], null, 2).slice(0, 500)
    throw new Error(
      `解析后所有数据都是 0，可能是列名没匹配上。\n\n` +
      `【文件中的列名】\n${fileColumns}\n\n` +
      `【第一行数据样本】\n${sampleData}${rawData[0] && JSON.stringify(rawData[0]).length > 500 ? '...' : ''}\n\n` +
      `【系统期望的列名】\n` +
      `- 标题相关：标题、笔记标题、title\n` +
      `- 曝光相关：曝光量、impressions、展现量\n` +
      `- 阅读相关：阅读数、阅读量、views、浏览量\n` +
      `- 点赞相关：点赞数、likes、点赞\n` +
      `- 收藏相关：收藏数、saves、收藏\n` +
      `- 评论相关：评论数、comments、评论\n` +
      `- 分享相关：分享数、转发数、shares、转发\n` +
      `- 涨粉相关：涨粉数、newFollowers、新增粉丝`
    )
  }

  return posts
}

// 字段映射：兼容官方导出 + xhs-creator-export 等多种格式
const fieldMapping: Record<string, string[]> = {
  id: ['笔记ID', 'id', 'post_id', 'article_id', '笔记id', '编号', '序号'],
  title: ['标题', 'title', '笔记标题', '内容标题', '笔记'],
  type: ['笔记类型', '类型', 'type', '内容类型', 'media_type', '形式'],
  publishDate: ['发布时间', 'publishDate', '发布时间', 'publish_time', '发布日期', 'date', '时间'],
  impressions: ['曝光量', 'impressions', '曝光', '展现量', '展示量', '曝光数'],
  views: ['阅读数', '阅读量', 'views', '阅读', '浏览', '浏览量', '播放量', '播放', 'read_count', 'view_count'],
  avgWatchTime: ['平均观看时长', 'avgWatchTime', '平均停留时长', '观看时长', '平均观看时长（秒）', 'avg_watch_time'],
  completionRate: ['完播率', 'completionRate', '完播率', '阅读完成率', '完成率'],
  likes: ['点赞数', 'likes', '点赞', '点赞量', 'like_count', '获赞'],
  saves: ['收藏数', 'saves', '收藏', '收藏量', 'bookmarks', 'save_count', '收藏次数'],
  comments: ['评论数', 'comments', '评论', '评论量', 'comment_count', '弹幕数'],
  shares: ['分享数', '转发数', 'shares', '转发', '分享', '分享量', 'share_count', '转发量'],
  newFollowers: ['涨粉数', 'newFollowers', '新增粉丝', '涨粉', 'follows', '新增关注'],
  effectiveComments: ['有效评论数', 'effectiveComments', '有效评论'],
  ineffectiveComments: ['无效评论数', 'ineffectiveComments', '无效评论'],
  topics: ['话题', 'topics', '标签', 'tags', '话题标签', '关键词'],
  recommend: ['推荐流量', 'recommend', '推荐', '推荐来源', '推荐流'],
  search: ['搜索流量', 'search', '搜索', '搜索来源', '搜索流'],
  following: ['关注流量', 'following', '关注', '关注来源', '关注流'],
  profile: ['个人主页流量', 'profile', '个人主页', '主页来源', '主页流'],
  other: ['其他流量', 'other', '其他来源', '其它'],
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
