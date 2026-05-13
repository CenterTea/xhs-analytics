import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import AttentionAnalysis from '../components/Funnel/AttentionAnalysis'
import { useData } from '../context/DataContext'
import type { Post } from '../types'

interface PostContentAnalysis {
  estimatedReadTime: number
  wordCount: number
  infoDensity: 'low' | 'medium' | 'high'
  suggestions: string[]
}

interface CommentWordCloud {
  topWords: { word: string; count: number }[]
  sentiment: 'positive' | 'neutral' | 'negative'
  mainTopic: string
  summary: {
    hotTopics: string
    windDirection: string
    sentimentText: string
    isPositive: boolean
    discussionContent: string
    interactionStatus: string
    conclusion: string
    detailedAnalysis: string
    recommendations: string[]
    stats: {
      questionCount: number
      experienceCount: number
      praiseCount: number
      suggestionCount: number
      agreementCount: number
    }
  }
}

interface ExtractedData {
  title: string
  content: string
  author: string
  likes: number
  collects: number
  comments: number
  shares: number
  postTime: string
  postType?: 'video' | 'image'
  videoDuration?: number
  url: string
  commentList?: { author: string; content: string; likes: number }[]
}

export default function PostAnalysisPage() {
  const location = useLocation()
  const { posts: existingPosts } = useData()
  // 分析状态由数据接收驱动，不再需要手动触发
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [result, setResult] = useState<{
    content: PostContentAnalysis
    comments: CommentWordCloud
    commentQuality: {
      effectiveRate: number
      ineffectiveRate: number
      analysis: string
    }
  } | null>(null)

  // 文件上传相关状态
  const [fileData, setFileData] = useState<Post[] | null>(null)
  const [matchedPost, setMatchedPost] = useState<Post | null>(null)
  const [isCheckingMatch, setIsCheckingMatch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 判断是否有主页上传的数据
  const hasExistingData = existingPosts.length > 0
  // 最终使用的数据源：优先用主页上传的数据，否则用本页上传的
  const dataSource = hasExistingData ? existingPosts : fileData

  // 从 URL 参数读取插件传递的数据
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const dataParam = params.get('data')
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam))
        setExtractedData(data)
        analyzeData(data)
      } catch (e) {
        console.error('解析数据失败:', e)
      }
    }
  }, [location])

  // 规范化标题用于匹配（移除emoji、特殊字符、所有类型空格）
  const normalizeTitle = (title: string): string => {
    return title
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // 移除emoji
      .replace(/\s+/g, '') // 移除所有空白字符（包括全角/半角空格、换行、制表符）
      .replace(/[^一-龥a-zA-Z0-9]/g, '') // 只保留中文、英文、数字
      .toLowerCase()
  }

  // 计算两个字符串的相似度（Levenshtein距离）
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeTitle(str1)
    const s2 = normalizeTitle(str2)

    if (s1 === s2) return 1.0
    if (s1.length === 0 || s2.length === 0) return 0.0

    // 简单的包含关系也算高相似度
    if (s1.includes(s2) || s2.includes(s1)) {
      const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)
      return 0.8 + ratio * 0.2 // 0.8-1.0之间
    }

    // 计算编辑距离
    const matrix: number[][] = []
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    const distance = matrix[s1.length][s2.length]
    const maxLength = Math.max(s1.length, s2.length)
    return 1 - distance / maxLength
  }

  // 详细的匹配结果信息
  const [matchDetails, setMatchDetails] = useState<{
    extractedTitle: string
    normalizedExtracted: string
    comparisons: { title: string; normalized: string; similarity: number }[]
    bestMatch: { title: string; similarity: number } | null
    fileTitles: string[] // 数据文件中的前20个标题
  } | null>(null)

  // 当提取的数据或数据源变化时，尝试匹配帖子
  useEffect(() => {
    if (extractedData && dataSource && dataSource.length > 0) {
      setIsCheckingMatch(true)

      const normalizedExtracted = normalizeTitle(extractedData.title)
      console.log('提取的标题:', extractedData.title)
      console.log('规范化后:', normalizedExtracted)
      console.log('数据源帖子数:', dataSource.length)

      // 计算所有帖子的相似度
      const comparisons = dataSource.map(post => {
        const similarity = calculateSimilarity(extractedData.title, post.title)
        return {
          title: post.title,
          normalized: normalizeTitle(post.title),
          similarity
        }
      })

      // 按相似度排序
      comparisons.sort((a, b) => b.similarity - a.similarity)

      // 找到最佳匹配（相似度 > 0.6）
      const bestComparison = comparisons[0]
      const matched = bestComparison && bestComparison.similarity > 0.6
        ? dataSource.find(post => post.title === bestComparison.title) || null
        : null

      console.log('匹配结果:', matched ? matched.title : '未匹配')
      console.log('最佳匹配:', bestComparison)

      setMatchDetails({
        extractedTitle: extractedData.title,
        normalizedExtracted,
        comparisons: comparisons.slice(0, 10), // 只显示前10个
        bestMatch: bestComparison ? { title: bestComparison.title, similarity: bestComparison.similarity } : null,
        fileTitles: dataSource.slice(0, 20).map(p => p.title) // 数据文件中的前20个标题
      })

      setMatchedPost(matched)
      setIsCheckingMatch(false)
    }
  }, [extractedData, dataSource])

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

        // 解析数据 - 处理小红书导出文件的格式
        // 小红书导出文件通常第一行是提示文字 "最多导出排序后前1000条笔记"，真正的表头在第二行
        let headerRowIndex = 0
        let dataStartIndex = 1

        // 检查第一行是否是表头（包含多个不同的列名）
        const firstRow = jsonData[0] as string[]
        const firstRowValues = firstRow.map(h => h?.toString().trim() || '')
        const uniqueFirstRowValues = [...new Set(firstRowValues)].filter(v => v !== '')

        // 如果第一行所有值都相同（或者是空值），说明这是提示行，表头在第二行
        if (uniqueFirstRowValues.length <= 1) {
          headerRowIndex = 1
          dataStartIndex = 2
          console.log('检测到第一行是提示文字，使用第二行作为表头')
        }

        if (jsonData.length < dataStartIndex + 1) {
          alert('文件数据为空')
          return
        }

        const headers = jsonData[headerRowIndex].map((h: any) => h?.toString().trim() || '')
        const posts: Post[] = []

        console.log('Excel列名:', headers)
        console.log('表头所在行:', headerRowIndex)
        console.log('数据起始行:', dataStartIndex)
        console.log('第一行数据样例:', jsonData[dataStartIndex])

        // 查找需要的列索引 - 优先精确匹配"笔记标题"
        const titleIndex = headers.findIndex((h: string) => h === '笔记标题') !== -1
          ? headers.findIndex((h: string) => h === '笔记标题')
          : headers.findIndex((h: string) => h.includes('标题'))

        // 如果没找到标题列，尝试其他常见列名
        const finalTitleIndex = titleIndex !== -1 ? titleIndex :
          headers.findIndex((h: string) => h.includes('笔记') || h.includes('内容') || h.includes('主题'))

        const impressionsIndex = headers.findIndex((h: string) => h.includes('曝光'))
        const viewsIndex = headers.findIndex((h: string) => h.includes('阅读') || h.includes('播放'))
        const likesIndex = headers.findIndex((h: string) => h.includes('点赞'))
        const savesIndex = headers.findIndex((h: string) => h.includes('收藏'))
        const commentsIndex = headers.findIndex((h: string) => h.includes('评论'))
        const sharesIndex = headers.findIndex((h: string) => h.includes('分享'))
        // 精确匹配涨粉相关列，避免误匹配"粉丝数""粉丝画像"等列
        let newFollowersIndex = headers.findIndex((h: string) => {
          const t = h.trim()
          return t === '新增粉丝' || t === '涨粉' || t === '粉丝净增' ||
                 t.includes('新增粉丝') || t.includes('涨粉数') || t.includes('粉丝增长')
        })
        // 降级匹配
        if (newFollowersIndex === -1) {
          newFollowersIndex = headers.findIndex((h: string) => {
            const t = h.trim()
            return (t.includes('涨粉') || t.includes('新增粉') || t.includes('净增粉')) &&
                   !t.includes('粉丝数')
          })
        }
        if (newFollowersIndex === -1) {
          console.log('⚠️ 未找到涨粉列，将使用 0')
        }
        // 查找观看时长列 - 直接精确匹配"人均观看时长"
        const avgWatchTimeIndex = headers.findIndex((h: string) => {
          const trimmed = h.trim()
          return trimmed === '人均观看时长' || trimmed.includes('观看时长')
        })

        console.log('找到的列索引:', { finalTitleIndex, impressionsIndex, viewsIndex, likesIndex, savesIndex, commentsIndex, sharesIndex, newFollowersIndex, avgWatchTimeIndex })
        console.log('人均观看时长列名:', headers[avgWatchTimeIndex], '索引:', avgWatchTimeIndex)

        // 打印所有列名帮助调试
        console.log('所有列名:')
        headers.forEach((h: string, i: number) => {
          console.log(`  [${i}] "${h}"`)
        })

        // 检查是否找到标题列
        if (finalTitleIndex === -1) {
          alert(`未找到标题列。请确保Excel文件包含"笔记标题"列。\n实际找到的列名：${headers.join(', ')}`)
          return
        }

        for (let i = dataStartIndex; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row[finalTitleIndex]) continue

          const getNum = (idx: number) => {
            if (idx === -1) return 0
            const val = row[idx]
            if (typeof val === 'number') return val
            if (typeof val === 'string') {
              // 处理千分位逗号、去除多余空格
              const cleaned = val.replace(/,/g, '').trim()
              const parsed = parseFloat(cleaned)
              return isNaN(parsed) ? 0 : parsed
            }
            return 0
          }

          const impressions = getNum(impressionsIndex)
          const views = getNum(viewsIndex)
          const likes = getNum(likesIndex)
          const saves = getNum(savesIndex)
          const comments = getNum(commentsIndex)
          const shares = getNum(sharesIndex)
          const newFollowers = getNum(newFollowersIndex)
          const avgWatchTime = getNum(avgWatchTimeIndex)
          const actualRowNum = i - dataStartIndex + 1
          if (actualRowNum <= 3) {
            console.log(`第${actualRowNum}行数据:`, { title: row[finalTitleIndex], avgWatchTime, rawValue: row[avgWatchTimeIndex] })
          }

          const post: Post = {
            id: `post-${i}`,
            title: row[finalTitleIndex]?.toString() || '',
            type: 'image',
            publishDate: '',
            topics: [],
            impressions,
            views,
            likes,
            saves,
            comments,
            shares,
            newFollowers,
            avgWatchTime: avgWatchTime > 0 ? avgWatchTime : undefined,
            effectiveComments: 0,
            ineffectiveComments: 0,
            coverCTR: impressions > 0 ? views / impressions : 0,
            likeRate: views > 0 ? likes / views : 0,
            saveRate: views > 0 ? saves / views : 0,
            commentRate: views > 0 ? comments / views : 0,
            shareRate: views > 0 ? shares / views : 0,
            interactionRate: views > 0 ? (likes + saves + comments + shares) / views : 0,
            followConversionRate: views > 0 ? newFollowers / views : 0,
            effectiveCommentRate: comments > 0 ? 0.6 : 0
          }
          posts.push(post)
        }

        setFileData(posts)
      } catch (error) {
        console.error('解析文件失败:', error)
        alert('文件解析失败，请检查文件格式是否正确')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const analyzeData = (data: ExtractedData) => {
    // 内容分析
    const wordCount = data.content.length
    const estimatedReadTime = Math.ceil(wordCount / 300) // 每分钟300字
    const infoDensity = wordCount > 800 ? 'high' : wordCount > 300 ? 'medium' : 'low'

    // 评论分析
    const comments = data.commentList || []
    const allCommentText = comments.map(c => c.content).join(' ')

    // 收集所有评论者昵称，用于关键词过滤
    const authorNames = new Set(comments.map(c => c.author).filter(a => a && a !== '未知用户'))

    // 关键词提取（简单的词频统计），传入昵称以过滤
    const keywords = extractKeywords(allCommentText, authorNames)

    // 情感分析
    const sentiment = analyzeSentiment(allCommentText)

    // 评论质量分析
    const effectiveComments = comments.filter(c =>
      c.content.length > 5 &&
      !c.content.includes('@') &&
      !/^[^一-龥a-zA-Z]*$/.test(c.content)
    ).length
    const effectiveRate = comments.length > 0 ? Math.round((effectiveComments / comments.length) * 100) : 0

    // 生成评论区总结
    const commentSummary = generateCommentSummary(keywords, comments, sentiment, effectiveRate)

    setResult({
      content: {
        estimatedReadTime,
        wordCount,
        infoDensity,
        suggestions: generateSuggestions(data, wordCount)
      },
      comments: {
        topWords: keywords.slice(0, 10),
        sentiment,
        mainTopic: analyzeMainTopic(keywords, comments),
        summary: commentSummary
      },
      commentQuality: {
        effectiveRate,
        ineffectiveRate: 100 - effectiveRate,
        analysis: generateCommentAnalysis(effectiveRate, comments)
      }
    })
  }

  const extractKeywords = (text: string, authorNames?: Set<string>): { word: string; count: number }[] => {
    if (!text || text.length < 10) return []

    // 停用词列表
    const stopWords = new Set([
      '的', '了', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上', '也', '很', '到', '说', '要', '去', '你', '会',
      '着', '没有', '看', '好', '自己', '这', '那', '在', '他', '她', '它', '们', '个', '来', '过', '下', '大', '小',
      '吗', '吧', '呢', '啊', '哦', '嗯', '哈', '哈哈', '哈哈哈', '嘿嘿', '嘻嘻', '呵呵', 'hhh', 'hhhh',
      '可以', '真的', '感觉', '觉得', '就是', '这个', '那个', '什么', '怎么', '为什么', '因为', '所以',
      '但是', '然后', '还是', '不过', '其实', '可能', '应该', '好像', '一样', '一下',
      'up', '楼主', '作者', '博主', '姐妹', '集美', '宝子', '宝宝',
      '求', '求求', '跪求', '蹲', '蹲蹲', '同蹲', '跟', '跟跟', '带', '带带',
      '链接', '连接', 'lj', '价格', '多少', '钱', '元', '买', '卖', '链接在哪里',
      '回复', '引用', '转发', '赞', '赞了', '已赞', '收藏', '收藏了',
      '好看', '不错', '喜欢', '爱了', '太棒', '厉害', '优秀', '漂亮', '美', '棒', '赞'
    ])

    // 将评论者昵称加入停用词，避免提取到用户名
    if (authorNames) {
      authorNames.forEach(name => {
        if (name && name.length >= 2 && name.length <= 10) {
          stopWords.add(name)
        }
      })
    }

    // 清理文本：去除 @用户名、链接、IP、表情、数字
    const cleanedText = text
      .replace(/@\S+/g, ' ') // 移除 @username
      .replace(/https?:\/\/[^\s]+/g, ' ') // 移除链接
      .replace(/IP[属地：:]\s*\S+/g, ' ') // 移除 IP属地
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ') // 移除emoji
      .replace(/\d{4}[\-\/年]\d{1,2}[\-\/月]\d{1,2}[\s\d:]*/g, ' ') // 移除时间戳
      .replace(/\d+赞|\d+$/gm, ' ') // 移除点赞数和行尾数字
      .replace(/[0-9]+/g, ' ') // 移除纯数字
      .replace(/^回复\s*$/gm, ' ') // 移除纯"回复"文本

    // 提取2-6字的词组
    const wordCount: Record<string, number> = {}

    // 方法1：基于标点和空格的简单分词
    const segments = cleanedText.split(/[\s,，.。!！?？;；、~～…]+/).filter(s => s.length >= 2)

    segments.forEach(segment => {
      // 提取完整词组（2-6字）
      if (segment.length >= 2 && segment.length <= 6 && !stopWords.has(segment)) {
        wordCount[segment] = (wordCount[segment] || 0) + 1
      }

      // 提取滑动窗口词组
      for (let len = 2; len <= 4 && len <= segment.length; len++) {
        for (let i = 0; i <= segment.length - len; i++) {
          const word = segment.substr(i, len)
          // 过滤条件：不包含停用词开头/结尾、不全是数字或字母
          if (!stopWords.has(word) &&
              !stopWords.has(word[0]) &&
              !stopWords.has(word[word.length - 1]) &&
              !/^\d+$/.test(word) &&
              word.length >= 2) {
            wordCount[word] = (wordCount[word] || 0) + 1
          }
        }
      }
    })

    // 过滤低频词，排序取前15
    return Object.entries(wordCount)
      .filter(([_, count]) => count >= 2) // 至少出现2次
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }))
  }

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['好', '棒', '喜欢', '爱', '赞', '漂亮', '好看', '优秀', '感谢', '推荐', '不错', '满意', '开心']
    const negativeWords = ['差', '烂', '不好', '失望', '讨厌', '难看', '坑', '骗', '气', '烦', '垃圾']

    let positive = 0
    let negative = 0

    positiveWords.forEach(word => {
      if (text.includes(word)) positive++
    })
    negativeWords.forEach(word => {
      if (text.includes(word)) negative++
    })

    if (positive > negative) return 'positive'
    if (negative > positive) return 'negative'
    return 'neutral'
  }

  const analyzeMainTopic = (keywords: { word: string; count: number }[], comments: any[]): string => {
    if (keywords.length === 0) return '暂无足够数据'

    const topWords = keywords.slice(0, 3).map(k => k.word).join('、')
    const hasQuestions = comments.some(c => c.content.includes('?') || c.content.includes('？'))

    if (hasQuestions) {
      return `用户主要围绕"${topWords}"等话题提问或讨论，评论区互动性较好`
    }
    return `用户讨论集中在"${topWords}"等关键词，整体氛围${analyzeSentiment(comments.map(c => c.content).join(' ')) === 'positive' ? '积极' : '中性'}`
  }

  const generateSuggestions = (data: ExtractedData, wordCount: number): string[] => {
    const suggestions: string[] = []

    if (wordCount < 100) {
      suggestions.push('内容较短，建议增加更多细节描述')
    } else if (wordCount > 1000) {
      suggestions.push('内容较长，建议在开头添加目录或要点总结')
    } else {
      suggestions.push('文字量适中，符合移动端阅读习惯')
    }

    const interactionRate = data.comments / (data.likes || 1)
    if (interactionRate < 0.1) {
      suggestions.push('评论率较低，建议结尾增加引导性提问')
    }

    if (data.content.includes('#')) {
      suggestions.push('使用了话题标签，有助于增加曝光')
    }

    return suggestions
  }

  const generateCommentAnalysis = (effectiveRate: number, _comments: any[]): string => {
    if (effectiveRate > 70) {
      return `评论区质量较高（${effectiveRate}%有效评论），大部分评论表达了具体观点或提问。建议多回复高赞评论，可以转化为粉丝。`
    } else if (effectiveRate > 40) {
      return `评论区质量一般（${effectiveRate}%有效评论），有一定互动但存在较多简单回复。建议引导更有深度的讨论。`
    } else {
      return `评论区质量较低（${effectiveRate}%有效评论），无效评论（表情、@好友）占比较高。需要优化内容激发真实讨论。`
    }
  }

  // 生成评论区总结
  const generateCommentSummary = (
    keywords: { word: string; count: number }[],
    comments: any[],
    sentiment: 'positive' | 'neutral' | 'negative',
    effectiveRate: number
  ) => {
    const total = comments.length
    if (total === 0) {
      return {
        hotTopics: '', windDirection: '暂无评论数据', sentimentText: '中性', isPositive: true,
        discussionContent: '', interactionStatus: '', conclusion: '', detailedAnalysis: '', recommendations: [],
        stats: { questionCount: 0, experienceCount: 0, praiseCount: 0, suggestionCount: 0, agreementCount: 0 }
      }
    }

    // 提取热门话题
    const hotTopics = keywords.slice(0, 5).map(k => k.word).join('、')

    // 多维度统计评论类型
    const questionCount = comments.filter(c => c.content.includes('?') || c.content.includes('？') || /怎么|如何|什么|哪里|多少|能不能|可以吗/.test(c.content)).length
    const experienceCount = comments.filter(c => /我也|一样|同感|确实|试过|用过|买过|去过|吃过|穿过|我也觉得|我也是/.test(c.content)).length
    const praiseCount = comments.filter(c => /好看|漂亮|美|棒|厉害|喜欢|爱|赞|绝了|太.*了|好好看/.test(c.content)).length
    const suggestionCount = comments.filter(c => /建议|推荐|可以试试|不妨|不如|要不|下次|应该|其实可以/.test(c.content)).length
    const agreementCount = comments.filter(c => /没错|对的|同意|赞同|说得对|确实如此|正解|就是这个|有道理/.test(c.content)).length

    // 计算各项占比
    const questionRatio = questionCount / total
    const experienceRatio = experienceCount / total
    const praiseRatio = praiseCount / total
    const suggestionRatio = suggestionCount / total
    const agreementRatio = agreementCount / total

    // 评论长度分析
    const avgLength = comments.reduce((sum, c) => sum + c.content.length, 0) / total
    const longComments = comments.filter(c => c.content.length > 50).length
    const deepDiscussion = longComments / total > 0.3

    // 判断评论区风向（更细致）
    let windDirection = ''
    let discussionContent = ''
    let interactionStatus = ''
    let detailedAnalysis = ''
    let conclusion = ''
    const recommendations: string[] = []

    // 根据情感和评论类型组合判断
    if (sentiment === 'positive') {
      if (praiseRatio > 0.3) {
        windDirection = '非常积极，充满赞美'
        detailedAnalysis = `评论区共有${total}条评论，其中赞美类评论占比最高（${Math.round(praiseRatio * 100)}%），平均每条评论${Math.round(avgLength)}字。`
        if (deepDiscussion) {
          detailedAnalysis += `有${Math.round(longComments / total * 100)}%的用户写了超过50字的深度评论，说明内容引发了强烈共鸣。`
        }
        conclusion = `用户对内容的认可度非常高，评论区充满正面反馈。${
          deepDiscussion ? '而且许多用户愿意花时间写长评论，这种深度互动非常珍贵。' : ''
        }建议继续保持此类内容风格，同时可以多回复高赞评论来增强粉丝粘性。`
        recommendations.push('继续保持当前内容风格和创作方向')
        recommendations.push('精选几条高质量评论进行回复或置顶，拉近与粉丝距离')
        if (questionRatio > 0.05) recommendations.push('部分用户在评论区提问，及时回复可以进一步提升互动率')
      } else if (experienceRatio > 0.2) {
        windDirection = '积极且互动性强，用户参与度高'
        detailedAnalysis = `评论区有${Math.round(experienceRatio * 100)}%的用户在分享个人经历或感受，${Math.round(suggestionRatio * 100)}%的用户给出了建议，说明内容具有很强的参与感和话题性。`
        conclusion = '这是一个高度活跃的评论区，用户不只是简单点赞，而是在分享自己的故事和经验。这种UGC内容本身就很有价值，建议积极回复这些分享，让用户感受到被重视，形成良性互动循环。'
        recommendations.push('回复用户的经验分享，表达感谢和共情')
        recommendations.push('可以在后续内容中引用用户的真实经历，增强社区归属感')
        recommendations.push('考虑围绕热门讨论话题策划后续内容')
      } else if (suggestionRatio > 0.15) {
        windDirection = '积极且富有建设性'
        detailedAnalysis = `评论区中${Math.round(suggestionRatio * 100)}%的用户在主动提供建议，说明他们真心希望博主变得更好。这是一种高质量的粉丝关系。`
        conclusion = '用户不只是消费内容，还在主动帮助博主成长。这种"共创"关系非常珍贵。建议认真对待每一条建议，让粉丝感受到他们的意见被重视。'
        recommendations.push('对有价值的建议公开表示感谢，展示你的开放态度')
        recommendations.push('将有代表性的建议整理成后续内容，回馈社区')
      } else {
        windDirection = '整体积极，氛围友好'
        detailedAnalysis = `评论区以正面互动为主，用户整体态度友好。平均评论长度${Math.round(avgLength)}字，${
          effectiveRate > 60 ? '有效评论率较高，用户交流质量不错。' : '但有效讨论占比还可以提升。'
        }`
        conclusion = '评论区氛围良好，但深度互动还有提升空间。建议通过提问或发起话题来引导更深层次的讨论。'
        recommendations.push('在内容结尾增加开放式提问，引导用户表达观点')
        recommendations.push('可以尝试发起投票或选择类话题，降低参与门槛')
      }
    } else if (sentiment === 'negative') {
      windDirection = '偏负面，需要关注和处理'
      detailedAnalysis = `评论区中检测到较多负面情绪。${
        questionRatio > 0.15 ? `同时有${Math.round(questionRatio * 100)}%的评论在提出质疑或疑问。` : ''
      }${
        suggestionRatio > 0.1 ? `也有${Math.round(suggestionRatio * 100)}%的用户在试图给出建设性意见。` : ''
      }`
      if (suggestionRatio > 0.1) {
        conclusion = '虽然评论区有负面声音，但也有用户在真诚地提出改进建议。建议区分"恶意攻击"和"合理批评"，对合理的反馈表示感谢和改进，对恶意内容可以选择忽略或隐藏。'
        recommendations.push('区分恶意攻击和合理批评，对后者表示感谢')
        recommendations.push('如果确实存在问题，真诚道歉并及时改进反而能赢得信任')
        recommendations.push('不要与负面评论争论，保持专业和冷静')
      } else {
        conclusion = '评论区负面情绪较明显，建议先了解负面反馈的具体原因——是内容质量、观点争议还是其他因素，再有针对性地调整策略。'
        recommendations.push('深入了解负面反馈的具体原因，针对性调整')
        recommendations.push('必要时可以发一条评论统一回应大家的疑问')
      }
    } else {
      // 中性
      if (questionRatio > 0.25) {
        windDirection = '以咨询和提问为主'
        detailedAnalysis = `评论区${Math.round(questionRatio * 100)}%的内容是提问和咨询，说明内容成功激发了用户的好奇心，但信息可能不够完整。平均评论长度${Math.round(avgLength)}字。`
        conclusion = '用户对你的内容很感兴趣，但觉得信息还不够。这是一个很好的信号——说明内容选题方向正确，只需要补充更多细节。建议整理高频问题，用后续内容或置顶评论统一解答。'
        recommendations.push('整理评论区高频问题，发布一篇专门的答疑内容')
        recommendations.push('在置顶评论中补充常见问题的答案')
        recommendations.push('下次发类似内容时提前把关键信息写进去，减少重复提问')
      } else if (experienceRatio > 0.15) {
        windDirection = '中性偏分享，用户在交流经验'
        detailedAnalysis = `评论区${Math.round(experienceRatio * 100)}%的内容是用户在分享自己的经历，${Math.round(agreementRatio * 100)}%的用户表示认同。这是一个健康的话题讨论氛围。`
        conclusion = '评论区像一个小型社区，用户之间在互相交流和分享。这种氛围有助于培养粉丝忠诚度。建议多参与讨论，适当引导话题方向。'
        recommendations.push('参与讨论，展示专业知识和个人见解')
        recommendations.push('适时抛出延伸话题，保持讨论热度')
        recommendations.push('关注用户的真实需求，作为选题灵感来源')
      } else {
        windDirection = '中性平和，互动较浅'
        detailedAnalysis = `评论区整体氛围平和，没有明显的情绪倾向。${
          effectiveRate > 50 ? '有效评论占比尚可，但讨论深度有待提升。' : '大部分互动停留在较浅层次。'
        }平均评论长度${Math.round(avgLength)}字。`
        conclusion = '用户对内容没有强烈的正面或负面反应，说明内容的"情绪钩子"不够。建议在内容中有意识地加入能引发讨论的元素。'
        recommendations.push('在内容中主动抛出一个有争议性或讨论价值的问题')
        recommendations.push('增加内容的"情绪价值"，让用户有表达的冲动')
        recommendations.push('尝试分享个人观点或经历，引发共鸣和讨论')
      }
    }

    // 讨论内容总结
    if (hotTopics && keywords.length >= 3) {
      discussionContent = `围绕"${hotTopics}"等话题展开讨论`
    } else if (hotTopics) {
      discussionContent = `主要讨论"${hotTopics}"`
    }

    // 有效互动情况
    if (effectiveRate > 70) {
      interactionStatus = `大部分用户都在认真交流（有效评论率${effectiveRate}%）`
    } else if (effectiveRate > 40) {
      interactionStatus = `有实质性讨论也有简单互动（有效评论率${effectiveRate}%）`
    } else {
      interactionStatus = `简单互动占比较高（有效评论率${effectiveRate}%），可引导更深度的讨论`
    }

    return {
      hotTopics,
      windDirection,
      sentimentText: sentiment === 'positive' ? '积极' : sentiment === 'negative' ? '消极' : '中性',
      isPositive: sentiment === 'positive',
      discussionContent,
      interactionStatus,
      conclusion,
      detailedAnalysis,
      recommendations,
      stats: {
        questionCount,
        experienceCount,
        praiseCount,
        suggestionCount,
        agreementCount
      }
    }
  }

  // HTML粘贴功能已移除，仅支持Tampermonkey脚本

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">单帖分析</h1>
        <p className="text-sm text-gray-500">
          使用 Tampermonkey 脚本自动提取帖子数据，分析内容结构和评论质量
        </p>
      </div>

      {/* 功能说明 */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 mb-6">
        <p className="text-sm text-blue-700 text-center font-medium">
          可以分析自己和她人的帖子数据
        </p>
      </div>

      {/* 使用说明 */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 mb-2">使用方式：Tampermonkey 脚本一键提取</h4>

            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-2">步骤1：安装 Tampermonkey 扩展</p>
              <div className="text-xs text-amber-700 space-y-1">
                <p>• Chrome/Edge 用户：<a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">点击安装 Tampermonkey</a></p>
                <p>• Safari 用户：Mac App Store 搜索"Tampermonkey"安装</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-2">步骤2：安装数据提取脚本</p>
              <div className="text-xs text-amber-700 space-y-1">
                <p>
                  • <strong>点击下方直接安装：</strong>
                  <a
                    href="https://github.com/CenterTea/xhs-analytics/raw/main/public/xhs-extractor.user.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline font-medium"
                  >
                    安装小红书数据提取脚本
                  </a>
                </p>
                <p>• 浏览器会跳转到 Tampermonkey 的安装确认页面</p>
                <p>• 点击页面上的"安装"按钮</p>
                <div className="bg-red-50 p-2 rounded border border-red-200 mt-2">
                  <p className="text-red-700 font-medium">⚠️ 重要：开启插件权限</p>
                  <p className="text-red-600 mt-1">安装完成后，点击浏览器右上角【三个点】-【扩展】-【管理扩展】- 找到 Tampermonkey - 点击【详细信息】- 打开【允许访问文件网址】和【在所有网站上】</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-2">步骤3：打开任意帖子</p>
              <div className="bg-red-50 p-2 rounded border border-red-200 mb-3">
                <p className="text-red-700 font-medium">⚠️ 重要说明</p>
                <p className="text-red-600 mt-1">在想要打开的帖子处<strong>右键点击选取"在新标签页打开链接"</strong>，然后再分析。</p>
                <p className="text-red-600 mt-1">由于小红书反爬虫机制，数据提取需要分批进行，请耐心等待，不要关闭页面。</p>
              </div>
              <div className="text-xs text-amber-700 space-y-1">
                <p>• 打开任意小红书帖子页面（如 xiaohongshu.com/explore/xxxxx）</p>
                <p>• 等待页面完全加载（约2-3秒）</p>
                <p>• 页面右上角会出现红色按钮"📊 分析此帖"</p>
                <p>• 点击按钮，脚本会自动分批滚动加载评论（最多500条）</p>
                <p>• 数据提取完成后，会自动跳转到本页面并显示分析结果</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据状态提示 - 根据是否提取成功显示不同内容 */}
      {!extractedData ? (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">等待数据提取</h3>
          <p className="text-sm text-blue-700">
            请按照上方步骤安装 Tampermonkey 脚本，然后在小红书帖子页面点击"📊 分析此帖"按钮。<br/>
            数据会自动发送到本页面进行分析。
          </p>
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-900 mb-1">数据提取成功</h3>
              <p className="text-sm text-green-800 font-medium">{extractedData.title}</p>
              <div className="flex gap-4 mt-2 text-xs text-green-700">
                <span>👤 {extractedData.author || '未知作者'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 功能说明 */}
      {!result && !extractedData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">⏱️</div>
            <h3 className="font-semibold text-gray-900 mb-2">阅读时间分析</h3>
            <p className="text-sm text-gray-500">
              根据文字长度和视频时长，估算需要的阅读/观看时间
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">☁️</div>
            <h3 className="font-semibold text-gray-900 mb-2">评论词云</h3>
            <p className="text-sm text-gray-500">
              提取评论高频词，分析用户讨论焦点和情感倾向
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-2">评论质量评估</h3>
            <p className="text-sm text-gray-500">
              区分有效评论和无效评论，评估互动价值
            </p>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 评论词云 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">☁️ 评论关键词</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {result.comments.topWords.map((item) => (
                <span
                  key={item.word}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  style={{
                    fontSize: `${Math.max(0.75, Math.min(1.25, item.count / 5))}rem`,
                    opacity: Math.max(0.5, item.count / 10)
                  }}
                >
                  {item.word} ({item.count})
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                整体情感：
                <span className={
                  result.comments.sentiment === 'positive' ? 'text-green-600' :
                  result.comments.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                }>
                  {result.comments.sentiment === 'positive' ? '积极' :
                   result.comments.sentiment === 'negative' ? '消极' : '中性'}
                </span>
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">
              <span className="font-medium">讨论焦点：</span>{result.comments.mainTopic}
            </p>

            {/* 评论区总结 */}
            {result.comments.summary && (
              <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <span>📊</span>
                  评论区总结
                </h4>

                {/* 风向标签 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.comments.summary.isPositive
                      ? 'bg-green-100 text-green-700'
                      : result.comments.summary.sentimentText === '消极'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    情感: {result.comments.summary.sentimentText}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    风向: {result.comments.summary.windDirection}
                  </span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    有效评论率: {result.commentQuality.effectiveRate}%
                  </span>
                </div>

                {/* 讨论内容 */}
                <div className="space-y-3">
                  <div className="bg-white rounded p-3 border border-purple-100">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-purple-800">讨论主题：</span>
                      {result.comments.summary.discussionContent
                        ? `评论区主要在${result.comments.summary.discussionContent}`
                        : '评论区暂无明显的集中话题'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium text-purple-800">互动质量：</span>
                      {result.comments.summary.interactionStatus}
                    </p>
                  </div>

                  <div className="bg-white rounded p-3 border border-purple-100">
                    <p className="text-sm font-medium text-purple-800 mb-1">📈 互动类型分布：</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {result.comments.summary.stats.questionCount > 0 && (
                        <div className="bg-blue-50 rounded p-2 text-center">
                          <p className="font-bold text-blue-700">{result.comments.summary.stats.questionCount}</p>
                          <p className="text-blue-600">提问</p>
                        </div>
                      )}
                      {result.comments.summary.stats.experienceCount > 0 && (
                        <div className="bg-green-50 rounded p-2 text-center">
                          <p className="font-bold text-green-700">{result.comments.summary.stats.experienceCount}</p>
                          <p className="text-green-600">经验分享</p>
                        </div>
                      )}
                      {result.comments.summary.stats.praiseCount > 0 && (
                        <div className="bg-pink-50 rounded p-2 text-center">
                          <p className="font-bold text-pink-700">{result.comments.summary.stats.praiseCount}</p>
                          <p className="text-pink-600">赞美</p>
                        </div>
                      )}
                      {result.comments.summary.stats.suggestionCount > 0 && (
                        <div className="bg-amber-50 rounded p-2 text-center">
                          <p className="font-bold text-amber-700">{result.comments.summary.stats.suggestionCount}</p>
                          <p className="text-amber-600">建议</p>
                        </div>
                      )}
                      {result.comments.summary.stats.agreementCount > 0 && (
                        <div className="bg-indigo-50 rounded p-2 text-center">
                          <p className="font-bold text-indigo-700">{result.comments.summary.stats.agreementCount}</p>
                          <p className="text-indigo-600">认同</p>
                        </div>
                      )}
                      {result.comments.summary.stats.questionCount === 0 &&
                       result.comments.summary.stats.experienceCount === 0 &&
                       result.comments.summary.stats.praiseCount === 0 &&
                       result.comments.summary.stats.suggestionCount === 0 &&
                       result.comments.summary.stats.agreementCount === 0 && (
                        <div className="col-span-3 bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-500">以普通互动为主</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 border border-purple-100">
                    <p className="text-sm font-medium text-purple-800 mb-1">🔍 详细分析：</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.comments.summary.detailedAnalysis}</p>
                  </div>

                  <div className="bg-white rounded p-3 border border-purple-200">
                    <p className="text-sm font-medium text-purple-900 mb-2">💡 结论与建议：</p>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{result.comments.summary.conclusion}</p>
                    {result.comments.summary.recommendations && result.comments.summary.recommendations.length > 0 && (
                      <ul className="space-y-1">
                        {result.comments.summary.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5">▸</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 热门评论 - 原生评论区样式 */}
            {extractedData?.commentList && extractedData.commentList.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800">
                    热门评论 <span className="text-gray-400 font-normal">({extractedData.commentList.length}条)</span>
                  </h4>
                  <span className="text-xs text-gray-400">
                    按 👍 排序，显示前{Math.min(20, extractedData.commentList.length)}条
                  </span>
                </div>
                <div className="space-y-0 max-h-[500px] overflow-y-auto divide-y divide-gray-50">
                  {extractedData.commentList.slice(0, 20).map((comment, idx) => {
                    // 生成头像背景色
                    const colors = ['bg-rose-100 text-rose-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600', 'bg-sky-100 text-sky-600', 'bg-violet-100 text-violet-600', 'bg-pink-100 text-pink-600']
                    const avatarColor = colors[idx % colors.length]
                    const initial = (comment.author || '?')[0]

                    return (
                      <div key={idx} className="py-3 first:pt-0">
                        <div className="flex gap-3">
                          {/* 头像 */}
                          <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold shrink-0`}>
                            {initial}
                          </div>
                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-800">{comment.author}</span>
                              {idx === 0 && (
                                <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded">热评</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed break-words">
                              {comment.content}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              {comment.likes > 0 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                                  </svg>
                                  {comment.likes}
                                </span>
                              )}
                              <span className="text-xs text-gray-300">#{idx + 1}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {extractedData.commentList.length > 20 && (
                  <p className="text-xs text-center text-gray-400 mt-4 pt-3 border-t border-gray-100">
                    还有 {extractedData.commentList.length - 20} 条评论未显示
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 评论质量 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">💬 评论质量分析</h2>
            <div className="flex items-center gap-8 mb-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">有效评论</span>
                  <span className="font-medium text-green-600">{result.commentQuality.effectiveRate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${result.commentQuality.effectiveRate}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">无效评论</span>
                  <span className="font-medium text-gray-400">{result.commentQuality.ineffectiveRate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full"
                    style={{ width: `${result.commentQuality.ineffectiveRate}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
              {result.commentQuality.analysis}
            </p>

            {/* 无效评论说明 */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <h4 className="text-xs font-semibold text-amber-900 mb-2">📋 什么是有/无效评论？</h4>
              <div className="text-xs text-amber-800 space-y-1">
                <p><strong>有效评论：</strong>包含实质性内容的评论，如表达观点、提问、分享经验、给出建议等。例如"这个产品的使用感怎么样？""我也买了同款，确实不错""建议搭配什么颜色？"</p>
                <p><strong>无效评论：</strong>没有信息价值的评论，包括：①只@好友没有实质内容；②纯表情符号（如😂👍❤️）；③简单敷衍（如"666""来了""第一""沙发"）；④重复刷评；⑤广告引流评论。</p>
                <p className="mt-1">无效评论过多会影响帖子权重，降低推荐量。建议通过引导提问、置顶优质评论等方式提升有效评论比例。</p>
              </div>
            </div>
          </div>

          {/* 观众注意力分析 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">📊 观众注意力分析</h2>
            <p className="text-xs text-gray-500 mb-4">
              如果是分析自己的帖子，可以在这里上传小红书创作平台导出的数据文件来深度解析自己的帖子
            </p>

            {/* 情况1：没有主页数据，也没有本页上传的数据 */}
            {!hasExistingData && !fileData && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-900 mb-2">上传数据文件获取深度分析</h3>
                <p className="text-xs text-blue-700 mb-4">
                  上传您从小红书创作者中心导出的数据文件（.xlsx），系统将自动匹配帖子并展示观众注意力分析，包括官方的人均观看时长数据。
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  上传数据文件
                </button>
              </div>
            )}

            {/* 情况2：有主页数据（优先使用） */}
            {hasExistingData && (
              <>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">✅ 检测到已有账号数据</p>
                      <p className="text-xs text-green-700 mt-1">从主页数据看板加载了 {existingPosts.length} 条帖子数据</p>
                    </div>
                  </div>
                </div>

                {isCheckingMatch ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">正在匹配帖子数据...⏳</p>
                  </div>
                ) : matchedPost ? (
                  <>
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-200 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎉</span>
                        <div>
                          <p className="text-sm font-semibold text-green-800">已识别到这是您的帖子</p>
                          <p className="text-xs text-green-700 mt-1">
                            已从您的账号数据中匹配到该帖子的官方数据，正在展示观众注意力分析...
                          </p>
                        </div>
                      </div>
                    </div>
                    <AttentionAnalysis post={matchedPost} isOwnPost={true} content={extractedData?.content} duration={extractedData?.videoDuration} postType={extractedData?.postType} />
                  </>
                ) : (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">未找到匹配的帖子</p>
                        <p className="text-xs text-amber-700 mt-1">
                          未找到相似度超过60%的匹配。请查看下方详细对比：
                        </p>
                        {/* 详细调试信息 */}
                        {matchDetails && (
                          <div className="mt-3 bg-white rounded p-3 text-xs border border-amber-200 space-y-2">
                            <div className="bg-blue-50 p-2 rounded">
                              <p className="font-medium text-blue-800">提取的标题：</p>
                              <p className="text-gray-700">"{matchDetails.extractedTitle}"</p>
                              <p className="text-gray-500 mt-1">规范化后: "{matchDetails.normalizedExtracted}"</p>
                            </div>

                            {matchDetails.bestMatch && (
                              <div className="bg-yellow-50 p-2 rounded">
                                <p className="font-medium text-yellow-800">最佳匹配（相似度: {(matchDetails.bestMatch.similarity * 100).toFixed(1)}%）：</p>
                                <p className="text-gray-700">"{matchDetails.bestMatch.title}"</p>
                              </div>
                            )}

                            <details className="mt-2">
                              <summary className="cursor-pointer text-amber-700 font-medium">查看详细对比（前10条）</summary>
                              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                                {matchDetails.comparisons.map((comp, idx) => (
                                  <div key={idx} className={`p-2 rounded ${comp.similarity > 0.6 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                    <div className="flex justify-between">
                                      <span className={comp.similarity > 0.6 ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                        {idx + 1}. {comp.title.substring(0, 40)}{comp.title.length > 40 ? '...' : ''}
                                      </span>
                                      <span className={`font-mono ${comp.similarity > 0.6 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {(comp.similarity * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <p className="text-gray-400 text-[10px] mt-0.5">{comp.normalized}</p>
                                  </div>
                                ))}
                              </div>
                            </details>

                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-700 font-medium">查看数据文件中的所有标题（前20条）</summary>
                              <div className="mt-2 bg-gray-50 rounded p-2 max-h-60 overflow-y-auto">
                                {matchDetails.fileTitles.map((title, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">
                                    {idx + 1}. {title}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 情况3：没有主页数据，但有本页上传的数据 */}
            {!hasExistingData && fileData && (
              <>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">✅ 数据文件已上传</p>
                      <p className="text-xs text-green-700 mt-1">共 {fileData.length} 条帖子数据</p>
                    </div>
                    <button
                      onClick={() => {
                        setFileData(null)
                        setMatchedPost(null)
                      }}
                      className="text-xs text-green-700 hover:text-green-900 underline"
                    >
                      重新上传
                    </button>
                  </div>
                </div>

                {isCheckingMatch ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">正在匹配帖子数据...⏳</p>
                  </div>
                ) : matchedPost ? (
                  <>
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-200 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎉</span>
                        <div>
                          <p className="text-sm font-semibold text-green-800">已识别到这是您的帖子</p>
                          <p className="text-xs text-green-700 mt-1">
                            已从数据文件中匹配到该帖子的官方数据，正在展示观众注意力分析...
                          </p>
                        </div>
                      </div>
                    </div>
                    <AttentionAnalysis post={matchedPost} isOwnPost={true} content={extractedData?.content} duration={extractedData?.videoDuration} postType={extractedData?.postType} />
                  </>
                ) : (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">未找到匹配的帖子</p>
                        <p className="text-xs text-amber-700 mt-1">
                          未找到相似度超过60%的匹配。请查看下方详细对比：
                        </p>
                        {/* 详细调试信息 */}
                        {matchDetails && (
                          <div className="mt-3 bg-white rounded p-3 text-xs border border-amber-200 space-y-2">
                            <div className="bg-blue-50 p-2 rounded">
                              <p className="font-medium text-blue-800">提取的标题：</p>
                              <p className="text-gray-700">"{matchDetails.extractedTitle}"</p>
                              <p className="text-gray-500 mt-1">规范化后: "{matchDetails.normalizedExtracted}"</p>
                            </div>

                            {matchDetails.bestMatch && (
                              <div className="bg-yellow-50 p-2 rounded">
                                <p className="font-medium text-yellow-800">最佳匹配（相似度: {(matchDetails.bestMatch.similarity * 100).toFixed(1)}%）：</p>
                                <p className="text-gray-700">"{matchDetails.bestMatch.title}"</p>
                              </div>
                            )}

                            <details className="mt-2">
                              <summary className="cursor-pointer text-amber-700 font-medium">查看详细对比（前10条）</summary>
                              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                                {matchDetails.comparisons.map((comp, idx) => (
                                  <div key={idx} className={`p-2 rounded ${comp.similarity > 0.6 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                    <div className="flex justify-between">
                                      <span className={comp.similarity > 0.6 ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                        {idx + 1}. {comp.title.substring(0, 40)}{comp.title.length > 40 ? '...' : ''}
                                      </span>
                                      <span className={`font-mono ${comp.similarity > 0.6 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {(comp.similarity * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <p className="text-gray-400 text-[10px] mt-0.5">{comp.normalized}</p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 重新分析按钮 */}
          <div className="text-center">
            <button
              onClick={() => {
                setResult(null)
                setExtractedData(null)
                setFileData(null)
                setMatchedPost(null)
              }}
              className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              重新分析
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
