# 小红书数据分析工具

一个免费的小红书帖子数据分析网站，帮助不会看数据的创作者了解自己每篇帖子的真实表现。

## 功能

- **漏斗分析**：曝光 → 点击 → 阅读 → 互动 → 涨粉，逐层拆解
- **双重指标对比**：绝对数值 + 相对比率，与同类目均值对比
- **归因诊断**：自动定位问题所在，告诉你是封面、内容、互动还是人设的问题
- **素人参考**：参考同类型普通创作者的爆款帖子（非大V），更具参考价值
- **账号深度分析**：内容垂直度、粉丝粘性、变现潜力评估
- **评论质量分析**：区分有效评论和无效评论（如 @好友）
- **智能诊断报告**：一键生成完整分析报告，支持复制文案

## 如何使用

1. 打开 [工具网站](https://centertea.github.io/xhs-analytics/)
2. 上传从小红书创作者平台或 xhs-creator-export 工具导出的 CSV/Excel 文件
3. 查看分析结果
4. 也可以直接点击「加载示例数据」体验功能

### 如何导出数据？

**方法一：官方创作者平台**
1. 浏览器打开 creator.xiaohongshu.com
2. 用小红书 APP 扫码登录
3. 进入「数据看板」→「内容分析」，点击「导出报表」

**方法二：xhs-creator-export 工具（推荐，数据更全）**
1. 访问 [xhs-creator-export](https://github.com/iSk2y/xhs-creator-export)
2. 安装浏览器扩展
3. 登录小红书创作平台后一键导出

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- SheetJS (xlsx)

## 本地运行

```bash
npm install
npm run dev
```

## 部署

推送到 `main` 分支后，GitHub Actions 自动部署到 GitHub Pages。

需要在仓库 Settings → Pages 中启用 GitHub Pages，Source 选择 "GitHub Actions"。

## License

MIT
