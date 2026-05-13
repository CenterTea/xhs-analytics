interface AIContentResult {
  categories: {
    name: string
    count: number
    percentage: number
    sampleTitles: string[]
  }[]
  verticalityScore: number
  verticalityAssessment: string
  mainDirection: string
  suggestion: string
}

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'

export async function analyzeContentWithAI(
  titles: string[],
  apiKey: string
): Promise<AIContentResult> {
  const prompt = `你是一个小红书内容分析专家。以下是该账号所有帖子的标题列表（共${titles.length}条）：

${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

请分析并返回纯JSON格式（不要markdown代码块）：

{
  "categories": [
    {
      "name": "分类名称",
      "count": 该分类帖子数,
      "percentage": 该分类占比（保留1位小数）,
      "sampleTitles": ["代表性标题1", "代表性标题2"]
    }
  ],
  "verticalityScore": 垂直度评分0-100,
  "verticalityAssessment": "垂直度评估文字（50字内）",
  "mainDirection": "账号主要方向一句话总结（30字内）",
  "suggestion": "内容方向建议（80字内）"
}

要求：
- categories按count从高到低排序，最多8个分类
- 分类用简短中文命名，如"美妆教程"、"穿搭分享"、"美食探店"
- percentage是基于该分类帖子数占总帖数的百分比
- verticalityScore：TOP1分类占比>60%=85-95分，40-60%=65-85分，20-40%=45-65分，<20%=30-45分，考虑TOP2补充调整
- 用中文输出
- 只返回JSON，不要有任何其他文字`

  const response = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API 请求失败 (${response.status}): ${err}`)
  }

  const data = await response.json()
  const text = data.choices[0].message.content

  // 尝试清理 markdown 代码块
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 返回格式异常，请重试')

  const result = JSON.parse(jsonMatch[0]) as AIContentResult

  // 验证结果
  if (!result.categories || !Array.isArray(result.categories)) {
    throw new Error('AI 返回的分类数据格式错误')
  }

  return result
}
