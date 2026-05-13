// ==UserScript==
// @name         小红书帖子数据提取器
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  提取小红书帖子数据并发送到数据分析工具
// @author       You
// @match        https://www.xiaohongshu.com/*
// @match        http://www.xiaohongshu.com/*
// @match        https://xiaohongshu.com/*
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[小红书数据提取器] 脚本开始加载...');
    console.log('[小红书数据提取器] 当前URL:', window.location.href);

    // 检查是否在小红书网页版
    if (!window.location.href.includes('xiaohongshu.com')) {
        console.log('[小红书数据提取器] 非小红书页面，跳过加载');
        return;
    }

    // 等待页面加载完成
    function init() {
        console.log('[小红书数据提取器] 初始化中...');

        // 检查是否在帖子页面
        const isPostPage = window.location.href.includes('/explore/') ||
                           document.querySelector('h1') ||
                           document.querySelector('[class*="note"]');

        if (!isPostPage) {
            console.log('[小红书数据提取器] 不是帖子详情页，不显示按钮');
            return;
        }

        // 创建浮动按钮
        createButton();
        console.log('[小红书数据提取器] 按钮已创建');
    }

    function createButton() {
        // 检查按钮是否已存在
        if (document.getElementById('xhs-analyzer-btn')) {
            console.log('[小红书数据提取器] 按钮已存在，跳过创建');
            return;
        }

        const button = document.createElement('div');
        button.id = 'xhs-analyzer-btn';
        button.innerHTML = '📊 分析此帖';
        button.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #ff2442;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            z-index: 2147483647;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(255, 36, 66, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        button.onmouseover = () => button.style.transform = 'scale(1.05)';
        button.onmouseout = () => button.style.transform = 'scale(1)';
        button.onclick = () => extractData().catch(console.error);

        // 尝试添加到body
        if (document.body) {
            document.body.appendChild(button);
            console.log('[小红书数据提取器] 按钮已添加到body');
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(button);
                console.log('[小红书数据提取器] 按钮已添加到body (延迟)');
            });
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 每分钟检查一次按钮是否存在（防止被页面移除）
    setInterval(() => {
        if (!document.getElementById('xhs-analyzer-btn')) {
            console.log('[小红书数据提取器] 按钮被移除，重新创建');
            init();
        }
    }, 5000);

    // 监听URL变化（SPA页面）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('[小红书数据提取器] URL变化，重新初始化');
            const oldBtn = document.getElementById('xhs-analyzer-btn');
            if (oldBtn) oldBtn.remove();
            setTimeout(init, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

    async function extractData() {
        // 存储全局状态，用于反爬虫时返回已有数据
        window.xhsExtractionState = {
            title: '',
            author: '',
            content: '',
            likes: 0,
            collects: 0,
            comments: 0,
            shares: 0,
            postTime: '',
            commentList: [],
            antiScrapingDetected: false,
            detectionReason: ''
        };

        try {
            // 验证当前页面
            if (!window.location.href.includes('/explore/')) {
                showToast('❌ 请在帖子详情页使用此功能', true);
                console.log('[小红书数据提取器] 当前不是帖子详情页:', window.location.href);
                return;
            }

            showToast('🚀 开始提取数据...');
            console.log('[小红书数据提取器] ==============================');
            console.log('[小红书数据提取器] 开始提取，当前URL:', window.location.href);

            // 提取帖子基础数据（先保存基础数据）
            const title = extractTitle();
            window.xhsExtractionState.title = title;
            console.log('[小红书数据提取器] 提取的标题:', title);

            const author = extractAuthor();
            window.xhsExtractionState.author = author;
            console.log('[小红书数据提取器] 提取的作者:', author);

            const likes = extractCount('点赞');
            const collects = extractCount('收藏');
            const comments = extractCount('评论');
            const shares = extractCount('分享');
            window.xhsExtractionState.likes = likes;
            window.xhsExtractionState.collects = collects;
            window.xhsExtractionState.comments = comments;
            window.xhsExtractionState.shares = shares;
            console.log('[小红书数据提取器] 互动数据:', { likes, collects, comments, shares });

            const content = extractContent();
            window.xhsExtractionState.content = content;

            const postTime = extractPostTime();
            window.xhsExtractionState.postTime = postTime;

            // 检查数据合理性
            if (title === '未提取到标题' || title.length < 3) {
                console.warn('[小红书数据提取器] 警告: 标题提取可能不准确');
            }

            showToast('📊 正在展开楼中楼评论...');

            // 提取评论（可能因反爬虫而提前返回）
            const commentList = await extractComments();
            window.xhsExtractionState.commentList = commentList;

            // 检查是否检测到反爬虫
            const wasAntiScrapingDetected = window.xhsExtractionState.antiScrapingDetected;
            const detectionReason = window.xhsExtractionState.detectionReason;

            const data = {
                title: title,
                content: content,
                author: author,
                likes: likes,
                collects: collects,
                comments: comments,
                shares: shares,
                postTime: postTime,
                url: window.location.href,
                extractTime: new Date().toISOString(),
                commentList: commentList,
                antiScrapingTriggered: wasAntiScrapingDetected,
                antiScrapingReason: detectionReason
            };

            console.log('[小红书数据提取器] 提取完成:');
            console.log('  - 标题:', title);
            console.log('  - 作者:', author);
            console.log('  - 点赞:', likes);
            console.log('  - 评论:', comments, '(提取到', commentList.length, '条)');
            if (wasAntiScrapingDetected) {
                console.log('  - ⚠️ 触发反爬虫:', detectionReason);
            }
            console.log('[小红书数据提取器] ==============================');

            // 复制到剪贴板
            const jsonStr = JSON.stringify(data, null, 2);
            GM_setClipboard(jsonStr);

            if (wasAntiScrapingDetected) {
                showToast(`⚠️ 触发反爬虫机制，已提取 ${commentList.length} 条评论，正在发送...`, true);
            } else {
                showToast(`✅ 已提取 ${commentList.length} 条评论！正在打开分析工具...`);
            }

            // 打开分析工具
            const encodedData = encodeURIComponent(jsonStr);
            const analysisUrl = `https://centertea.github.io/xhs-analytics/#/post-analysis?data=${encodedData}`;

            setTimeout(() => {
                GM_openInTab(analysisUrl, { active: true });
            }, wasAntiScrapingDetected ? 2000 : 1000);

        } catch (error) {
            // 如果已经提取了部分数据，尝试发送
            if (window.xhsExtractionState && window.xhsExtractionState.title) {
                console.log('[小红书数据提取器] 发生错误，尝试发送已收集的数据...');
                const partialData = {
                    title: window.xhsExtractionState.title,
                    content: window.xhsExtractionState.content,
                    author: window.xhsExtractionState.author,
                    likes: window.xhsExtractionState.likes,
                    collects: window.xhsExtractionState.collects,
                    comments: window.xhsExtractionState.comments,
                    shares: window.xhsExtractionState.shares,
                    postTime: window.xhsExtractionState.postTime,
                    url: window.location.href,
                    extractTime: new Date().toISOString(),
                    commentList: window.xhsExtractionState.commentList || [],
                    extractionError: error.message,
                    antiScrapingTriggered: window.xhsExtractionState.antiScrapingDetected
                };

                const jsonStr = JSON.stringify(partialData, null, 2);
                GM_setClipboard(jsonStr);

                showToast(`⚠️ 提取中断，已发送已收集的 ${partialData.commentList.length} 条评论`, true);

                const encodedData = encodeURIComponent(jsonStr);
                const analysisUrl = `https://centertea.github.io/xhs-analytics/#/post-analysis?data=${encodedData}`;

                setTimeout(() => {
                    GM_openInTab(analysisUrl, { active: true });
                }, 1500);
            } else {
                showToast('❌ 提取失败：' + error.message, true);
                console.error('[小红书数据提取器] 提取错误:', error);
            }
        }
    }

    // 随机延迟函数，避免触发反爬虫机制
    function sleep(minMs, maxMs) {
        const delay = maxMs ? Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs : minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    function extractTitle() {
        // 方法1: 从页面脚本中提取（查找note数据）
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            // 查找包含 note 数据的脚本
            if (text.includes('"note"') || text.includes('"firstNoteId"')) {
                // 尝试多种标题字段
                const patterns = [
                    /"title":"([^"]{3,200}?)","desc":/,
                    /"title":"([^"]{3,200}?)","type":"[^"]*"/,
                    /"shareInfo"[^}]*"title":"([^"]{3,200}?)"/
                ];
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match && match[1] && match[1].length > 3) {
                        const title = match[1].replace(/\\n/g, ' ').replace(/\\u0026/g, '&').replace(/\\"/g, '"');
                        // 过滤掉像昵称一样的短标题
                        if (title.length > 5 || title.includes(' ')) {
                            return title;
                        }
                    }
                }
            }
        }

        // 方法2: 从h1提取（小红书页面通常有h1标签作为标题）
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent.trim().length > 3) {
            return h1.textContent.trim();
        }

        // 方法3: 从meta标签提取
        const metaTitle = document.querySelector('meta[property="og:title"]');
        if (metaTitle) {
            const content = metaTitle.getAttribute('content');
            if (content && !content.includes('@')) {
                return content.replace(' - 小红书', '');
            }
        }

        // 方法4: 从title标签提取
        const title = document.title.replace(' - 小红书', '');
        if (title && title.length > 5 && !title.startsWith('@')) {
            return title;
        }

        // 方法5: 从帖子内容区域提取第一行作为标题
        const contentEl = document.querySelector('#detail-desc, [class*="desc"][class*="content"], .note-content');
        if (contentEl) {
            const text = contentEl.textContent.trim();
            const firstLine = text.split(/[\n。！？.!?]/)[0].trim();
            if (firstLine.length > 5 && firstLine.length < 100) {
                return firstLine;
            }
        }

        return '未提取到标题';
    }

    function extractContent() {
        // 方法1: 从页面脚本中提取
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            const match = text.match(/"desc":"([^"]{20,5000})"/);
            if (match) {
                return match[1].replace(/\\n/g, '\n').replace(/\\u0026/g, '&');
            }
        }

        // 方法2: 从meta描述提取
        const metaDesc = document.querySelector('meta[property="og:description"]');
        if (metaDesc) {
            return metaDesc.getAttribute('content');
        }

        // 方法3: 从正文区域提取
        const contentSelectors = [
            '[class*="desc"]',
            '[class*="content"]',
            '[class*="note-content"]'
        ];
        for (const selector of contentSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 10) {
                return el.textContent.trim();
            }
        }

        return '';
    }

    function extractAuthor() {
        // 方法1: 从页面脚本中提取
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            const match = text.match(/"nickname":"([^"]+)"/);
            if (match) {
                return match[1];
            }
        }

        // 方法2: 从meta标签提取
        const metaAuthor = document.querySelector('meta[property="og:author"]');
        if (metaAuthor) {
            return metaAuthor.getAttribute('content');
        }

        // 方法3: 从特定区域提取
        const authorSelectors = [
            '[class*="author"] [class*="name"]',
            '[class*="user-name"]',
            '[class*="nickname"]'
        ];
        for (const selector of authorSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 0) {
                return el.textContent.trim();
            }
        }

        return '未知作者';
    }

    function extractCount(type) {
        let count = 0;
        let debugLog = [];

        // 方法1: 从页面脚本(JSON)中提取 - 查找note相关的数据
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            // 只处理包含note数据的脚本
            if (!text.includes('"note"') && !text.includes('"firstNoteId"')) continue;

            // 改进：使用更具体的模式，查找note对象内的统计数据
            const patterns = {
                '点赞': [
                    /"note"[\s\S]{0,500}?"likedCount"\s*[:：]\s*(\d+)/,  // 在note对象附近查找
                    /"likedCount"\s*[:：]\s*(\d+)(?=[\s\S]{0,200}?"note")/,  // likedCount在note前
                    /'likedCount'\s*[:：]\s*(\d+)/,
                    /"likedCount"\s*[:：]\s*(\d+)/,
                    /"likeCount"\s*[:：]\s*"?(\d+)"?/
                ],
                '收藏': [
                    /"note"[\s\S]{0,500}?"collectedCount"\s*[:：]\s*(\d+)/,
                    /"collectedCount"\s*[:：]\s*(\d+)(?=[\s\S]{0,200}?"note")/,
                    /'collectedCount'\s*[:：]\s*(\d+)/,
                    /"collectedCount"\s*[:：]\s*(\d+)/,
                    /"collectCount"\s*[:：]\s*"?(\d+)"?/
                ],
                '评论': [
                    /"note"[\s\S]{0,500}?"commentCount"\s*[:：]\s*(\d+)/,
                    /"commentCount"\s*[:：]\s*(\d+)(?=[\s\S]{0,200}?"note")/,
                    /'commentCount'\s*[:：]\s*(\d+)/,
                    /"commentCount"\s*[:：]\s*(\d+)/
                ],
                '分享': [
                    /"note"[\s\S]{0,500}?"shareCount"\s*[:：]\s*(\d+)/,
                    /"shareCount"\s*[:：]\s*(\d+)(?=[\s\S]{0,200}?"note")/,
                    /'shareCount'\s*[:：]\s*(\d+)/,
                    /"shareCount"\s*[:：]\s*(\d+)/
                ]
            };

            if (patterns[type]) {
                for (const pattern of patterns[type]) {
                    const match = text.match(pattern);
                    if (match) {
                        const val = parseInt(match[1]) || 0;
                        if (val > 0 && val < 10000000) {
                            // 如果已经有一个值，选择更大的那个（避免匹配到子评论的统计）
                            if (count === 0 || val > count) {
                                count = val;
                                debugLog.push(`模式匹配: ${pattern.toString().substring(0, 50)}... = ${val}`);
                            }
                        }
                    }
                }
            }
        }

        if (count > 0) {
            console.log(`[小红书数据提取器] ${type}提取:`, count, debugLog);
            return count;
        }

        // 方法2: 从按钮/交互区域提取
        const countSelectors = {
            '点赞': ['button[aria-label*="赞"]', '[class*="like"] button', '[class*="like"] span', 'svg[fill*="#"][fill*="red"] ~ span'],
            '收藏': ['button[aria-label*="收藏"]', '[class*="collect"] button', '[class*="collect"] span', 'svg ~ span'],
            '评论': ['button[aria-label*="评论"]', '[class*="comment"] button', '[class*="comment"] span'],
            '分享': ['button[aria-label*="分享"]', '[class*="share"] button', '[class*="share"] span']
        };

        if (countSelectors[type]) {
            for (const selector of countSelectors[type]) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.textContent || el.getAttribute('aria-label') || '';
                    const match = text.match(/(\d+[\.\d]*[万kK]?)/);
                    if (match) {
                        const val = parseCount(match[1]);
                        if (val > 0 && val < 10000000) {
                            console.log(`[小红书数据提取器] ${type}从DOM提取:`, val, `(选择器: ${selector})`);
                            return val;
                        }
                    }
                }
            }
        }

        console.log(`[小红书数据提取器] ${type}未找到，返回0`);
        return count;
    }

    function parseCount(text) {
        if (!text) return 0;
        text = text.toString().toLowerCase().replace(/,/g, '');
        if (text.includes('万')) {
            return Math.round(parseFloat(text) * 10000);
        }
        if (text.includes('k')) {
            return Math.round(parseFloat(text) * 1000);
        }
        return parseInt(text) || 0;
    }

    function extractPostTime() {
        // 从页面脚本中提取
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            const match = text.match(/"createTime":"([^"]+)"/);
            if (match) {
                return match[1];
            }
        }

        // 从页面元素提取
        const timeSelectors = ['time', '[class*="time"]', '[class*="date"]'];
        for (const selector of timeSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.match(/\d{4}/)) {
                return el.textContent.trim();
            }
        }

        return '';
    }

    // 反爬虫检测函数
    function detectAntiScraping() {
        // 只检测明确可见的反爬虫弹窗/提示，避免误判正常页面元素

        // 检测1：验证码/安全验证弹窗（仅检测可见的模态弹窗）
        const modalElements = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="dialog"], [class*="overlay"], [class*="mask"]');
        for (const el of modalElements) {
            if (el.offsetParent === null || el.offsetHeight < 50) continue;
            const text = el.textContent || '';
            if (/验证|拖动滑块|图形验证|人机验证|安全验证|请点击/.test(text) && text.length < 500) {
                return { detected: true, reason: '检测到验证码/安全验证弹窗' };
            }
        }

        // 检测2：操作频繁提示（只检查toast/通知类元素，不扫描整个页面）
        const toastElements = document.querySelectorAll('[class*="toast"], [class*="notice"], [class*="message"], [class*="tips"], [class*="alert"]');
        for (const el of toastElements) {
            if (el.offsetParent === null) continue;
            const text = el.textContent || '';
            if (text.length < 100 && /操作频繁|请稍后再试|访问受限|请求过多/i.test(text)) {
                return { detected: true, reason: '检测到操作频繁提示' };
            }
        }

        // 检测3：页面被重定向到非帖子页面
        if (!window.location.href.includes('/explore/')) {
            return { detected: true, reason: '页面已离开帖子详情页' };
        }

        return { detected: false };
    }

    // 显示反爬虫检测提示
    function showAntiScrapingWarning(reason) {
        const existing = document.getElementById('xhs-anti-scraping-warning');
        if (existing) existing.remove();

        const warning = document.createElement('div');
        warning.id = 'xhs-anti-scraping-warning';
        warning.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 8px;">⚠️ 触发反爬虫机制</div>
            <div style="font-size: 14px; opacity: 0.9;">${reason}</div>
            <div style="font-size: 12px; margin-top: 12px; opacity: 0.8;">
                已收集的数据将立即发送到分析平台...
            </div>
        `;
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 30px 40px;
            border-radius: 16px;
            z-index: 999999999;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 8px 32px rgba(238, 90, 36, 0.4);
            max-width: 90%;
            text-align: center;
            line-height: 1.5;
            animation: shake 0.5s ease-in-out;
        `;

        // 添加抖动动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translate(-50%, -50%) translateX(0); }
                25% { transform: translate(-50%, -50%) translateX(-10px); }
                75% { transform: translate(-50%, -50%) translateX(10px); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(warning);
    }

    async function extractComments() {
        const comments = [];
        const seenContents = new Set();
        let antiScrapingDetected = false;
        let detectionReason = '';

        // 查找评论区容器（尝试多种可能的选择器）
        let commentContainer = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"], [class*="comment-section"]');

        // 如果没有找到特定容器，使用页面主体
        const scrollTarget = commentContainer || document.documentElement;
        const isContainerScroll = !!commentContainer;

        console.log('[小红书数据提取器] 评论区容器:', commentContainer ? '找到' : '未找到，使用页面滚动');

        // 展开所有楼中楼回复（先点击所有展开按钮）
        console.log('[小红书数据提取器] 开始展开楼中楼评论...');
        let expandCount = 0;

        // 多次尝试点击展开按钮（最多50轮，确保展开所有回复）
        for (let round = 0; round < 50; round++) {
            // 每轮开始前检查反爬虫
            checkResult = detectAntiScraping();
            if (checkResult.detected) {
                antiScrapingDetected = true;
                detectionReason = checkResult.reason;
                console.log(`[小红书数据提取器] ⚠️ 第${round + 1}轮检测到反爬虫:`, checkResult.reason);
                showAntiScrapingWarning(checkResult.reason);
                break;
            }

            let foundInRound = 0;

            // 查找所有可能的展开按钮
            const allElements = document.querySelectorAll('button, div, span, a, p');
            for (const el of allElements) {
                const text = el.textContent.trim();

                // 匹配各种展开回复的格式
                const shouldClick =
                    /^展开\d+条回复/.test(text) ||           // "展开3条回复"
                    text === '查看更多回复' ||               // "查看更多回复"
                    text === '展开回复' ||                   // "展开回复"
                    text.startsWith('展开') && text.includes('回复') ||  // 其他变体
                    /展开\s*\d+\s*条/.test(text);            // "展开 3 条"

                if (shouldClick && el.offsetParent !== null) {
                    // 滚动到按钮位置确保可见
                    el.scrollIntoView({ behavior: 'instant', block: 'center' });
                    await sleep(100, 300);

                    el.click();
                    expandCount++;
                    foundInRound++;
                    await sleep(300, 600);

                    // 点击后检查反爬虫（可能被触发）
                    checkResult = detectAntiScraping();
                    if (checkResult.detected) {
                        antiScrapingDetected = true;
                        detectionReason = checkResult.reason;
                        console.log('[小红书数据提取器] ⚠️ 点击后检测到反爬虫:', checkResult.reason);
                        showAntiScrapingWarning(checkResult.reason);
                        break;
                    }
                }
            }

            // 如果检测到反爬虫，退出循环
            if (antiScrapingDetected) break;

            console.log(`[小红书数据提取器] 第${round + 1}轮展开: ${foundInRound}个`);

            // 如果没有找到新的按钮，等待一下再检查（可能有延迟加载的）
            if (foundInRound === 0) {
                await sleep(500, 1000);
                // 再检查一次，如果还是没有就退出
                const remainingBtns = Array.from(document.querySelectorAll('button, div, span, a, p'))
                    .filter(el => {
                        const text = el.textContent.trim();
                        return (/^展开\d+条回复/.test(text) || text === '查看更多回复') && el.offsetParent !== null;
                    });
                if (remainingBtns.length === 0) break;
            }
        }

        console.log('[小红书数据提取器] 总共展开了', expandCount, '个楼中楼');

        // 如果已经触发反爬虫，直接返回已收集的数据（此时可能还没有数据，继续尝试提取页面上的）
        if (antiScrapingDetected) {
            console.log('[小红书数据提取器] 因检测到反爬虫，跳过后续滚动加载');
        }

        // 等待所有展开的内容加载完成
        await sleep(1500, 2500);

        // 滚动加载更多评论（最多滚动15次）- 仅当未触发反爬虫时
        if (!antiScrapingDetected) {
            console.log('[小红书数据提取器] 开始滚动加载评论...');
            let noNewCommentsCount = 0;
            let previousCommentCount = 0;

            for (let i = 0; i < 15; i++) {
                // 每次滚动前检查反爬虫
                checkResult = detectAntiScraping();
                if (checkResult.detected) {
                    antiScrapingDetected = true;
                    detectionReason = checkResult.reason;
                    console.log(`[小红书数据提取器] ⚠️ 第${i + 1}次滚动检测到反爬虫:`, checkResult.reason);
                    showAntiScrapingWarning(checkResult.reason);
                    break;
                }

                if (isContainerScroll && commentContainer) {
                    // 滚动评论区容器
                    commentContainer.scrollTop = commentContainer.scrollHeight;
                } else {
                    // 滚动页面
                    window.scrollTo(0, document.body.scrollHeight);
                }
                await sleep(1000, 2000);

                // 滚动后再次检查反爬虫
                checkResult = detectAntiScraping();
                if (checkResult.detected) {
                    antiScrapingDetected = true;
                    detectionReason = checkResult.reason;
                    console.log('[小红书数据提取器] ⚠️ 滚动后检测到反爬虫:', checkResult.reason);
                    showAntiScrapingWarning(checkResult.reason);
                    break;
                }

                // 尝试点击"加载更多"按钮
                const loadMoreBtns = document.querySelectorAll('button, div, span');
                for (const btn of loadMoreBtns) {
                    const text = btn.textContent.trim();
                    if (text === '加载更多' || text === '查看更多评论' || text === '展开更多') {
                        if (btn.offsetParent !== null) {
                            btn.click();
                            await sleep(400, 800);

                            // 点击后检查反爬虫
                            checkResult = detectAntiScraping();
                            if (checkResult.detected) {
                                antiScrapingDetected = true;
                                detectionReason = checkResult.reason;
                                console.log('[小红书数据提取器] ⚠️ 点击加载更多后检测到反爬虫:', checkResult.reason);
                                showAntiScrapingWarning(checkResult.reason);
                                break;
                            }
                        }
                    }
                }

                if (antiScrapingDetected) break;

                // 检测评论是否还在增加（防止空转）
                const currentCommentElements = document.querySelectorAll('[class*="comment-item"], [class*="CommentItem"], div[class*="comment-"] > div');
                if (currentCommentElements.length <= previousCommentCount) {
                    noNewCommentsCount++;
                    if (noNewCommentsCount >= 3) {
                        console.log('[小红书数据提取器] 连续3次滚动没有新评论，停止滚动');
                        break;
                    }
                } else {
                    noNewCommentsCount = 0;
                    previousCommentCount = currentCommentElements.length;
                }
            }
        }

        // 使用精确的选择器提取评论
        // 小红书的评论结构：父评论 + 子评论（楼中楼）
        const commentSelectors = [
            // 主要评论容器选择器 - 小红书常见的评论项class
            '[class*="comment-item"]',
            '[class*="CommentItem"]',
            'div[class*="comment-"] > div',
            '[class*="note-comment"] > div',
            '.comments-container > div > div',
            '#comment-container > div > div'
        ];

        let commentElements = [];
        for (const selector of commentSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log('[小红书数据提取器] 尝试选择器:', selector, '找到', elements.length, '个元素');
                    if (elements.length > 3) { // 至少要有几条评论才算找到
                        commentElements = elements;
                        console.log('[小红书数据提取器] ✓ 使用选择器:', selector);
                        break;
                    }
                }
            } catch (e) {}
        }

        // 如果上面的选择器没找到，使用备选方案
        if (commentElements.length === 0) {
            // 查找评论区域
            const commentSection = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"], [class*="comment-section"]');
            console.log('[小红书数据提取器] 评论区域元素:', commentSection);
            if (commentSection) {
                // 查找直接子元素
                const allDivs = commentSection.querySelectorAll(':scope > div');
                console.log('[小红书数据提取器] 评论区子元素:', allDivs.length);
                commentElements = Array.from(allDivs);
            }
        }

        // 备选：从整个页面找所有可能包含用户头像和评论内容的块
        if (commentElements.length === 0) {
            console.log('[小红书数据提取器] 尝试从用户链接定位...');
            const allComments = [];
            const possibleComments = document.querySelectorAll('a[href*="user"]');
            console.log('[小红书数据提取器] 找到用户链接:', possibleComments.length);
            possibleComments.forEach(a => {
                const parent = a.closest('div[class]');
                if (parent) {
                    const siblingDivs = parent.querySelectorAll(':scope > div');
                    if (siblingDivs.length >= 2) {
                        allComments.push(parent);
                    }
                }
            });
            console.log('[小红书数据提取器] 从用户链接定位到:', allComments.length);
            if (allComments.length > 0) {
                commentElements = allComments;
            }
        }

        console.log('[小红书数据提取器] 最终找到评论元素:', commentElements.length);

        // 终极备选：直接查找包含"回复"文本的元素，其父元素可能是评论
        if (commentElements.length === 0) {
            console.log('[小红书数据提取器] 尝试终极备选方案...');
            const replyLinks = document.querySelectorAll('div, span');
            const commentContainers = new Set();
            replyLinks.forEach(el => {
                if (el.textContent.trim() === '回复') {
                    // 向上查找3层父元素
                    let parent = el;
                    for (let i = 0; i < 3; i++) {
                        parent = parent.parentElement;
                        if (!parent) break;
                    }
                    if (parent) {
                        commentContainers.add(parent);
                    }
                }
            });
            if (commentContainers.size > 0) {
                commentElements = Array.from(commentContainers);
                console.log('[小红书数据提取器] 从"回复"按钮找到:', commentElements.length);
            }
        }

        // 如果还是没找到，输出页面结构帮助调试
        if (commentElements.length === 0) {
            console.log('[小红书数据提取器] ❌ 未找到评论元素，输出页面结构供分析...');
            // 查找所有可能包含评论的容器
            const allDivs = document.querySelectorAll('div');
            let potentialContainers = [];
            allDivs.forEach(div => {
                if (div.children.length >= 3 && div.children.length <= 10) {
                    const text = div.textContent;
                    if (text.length > 20 && text.length < 1000) {
                        const links = div.querySelectorAll('a');
                        if (links.length >= 1 && links.length <= 3) {
                            potentialContainers.push({
                                element: div,
                                text: text.substring(0, 100),
                                childCount: div.children.length
                            });
                        }
                    }
                }
            });
            console.log('[小红书数据提取器] 可能的评论容器:', potentialContainers.slice(0, 5));
        }

        commentElements.forEach(el => {
            try {
                // 跳过非评论元素（如广告、推荐等）
                if (el.querySelector('img[src*="ad"]') || el.textContent.length > 3000) return;

                // 提取作者 - 第一个用户链接或包含用户名的元素
                let author = '';
                const authorSelectors = [
                    'a[href*="user"]',
                    'a[class*="name"]',
                    'a[class*="author"]',
                    '[class*="username"]',
                    'span[class*="name"]'
                ];

                for (const sel of authorSelectors) {
                    const authorEl = el.querySelector(sel);
                    if (authorEl) {
                        const text = authorEl.textContent.trim();
                        // 放宽条件：只要有文本，长度合理即可
                        if (text && text.length > 0 && text.length < 100) {
                            // 如果包含空格，只取第一部分（通常是昵称）
                            author = text.split(/\s+/)[0];
                            break;
                        }
                    }
                }

                // 如果还是没有找到作者，尝试从元素的第一个子元素获取
                if (!author) {
                    const firstLink = el.querySelector('a');
                    if (firstLink) {
                        const text = firstLink.textContent.trim();
                        if (text && text.length > 0 && text.length < 100) {
                            author = text.split(/\s+/)[0];
                        }
                    }
                }

                // 如果没有找到作者，使用默认名称
                if (!author) {
                    author = '未知用户';
                }

                // 提取评论内容 - 直接从元素的所有文本中提取
                let content = '';

                // 方法1: 获取元素内所有直接文本节点（排除子元素的文本）
                const allText = el.textContent;

                // 辅助函数：检查是否是日期
                function isDate(text) {
                    return /^\d{4}[\-\/年]\d{1,2}[\-\/月]\d{1,2}/.test(text) ||  // 2025-12-24, 2025/12/24, 2025年12月24日
                           /^\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}\s+\d{1,2}:\d{2}/.test(text) ||  // 带时间的日期
                           /^\d{1,2}[\-\/月]\d{1,2}[日]?$/.test(text);  // 12-24, 12月24日
                }

                // 辅助函数：检查是否是有效评论内容
                function isValidComment(text) {
                    if (!text || text.length <= 1) return false;
                    if (text === author) return false;
                    if (text.match(/^\d+$/)) return false;  // 纯数字
                    if (isDate(text)) return false;  // 日期
                    if (text.includes('赞') && text.match(/^\d+赞$/)) return false;  // "X赞"
                    if (text.includes('回复') && text.length < 10) return false;  // 短回复提示
                    if (text.includes('展开') && text.includes('回复')) return false;  // 展开按钮
                    if (text.includes('@')) return false;  // @用户名
                    if (text.includes('IP属地')) return false;
                    if (text.includes('编辑于')) return false;
                    if (text.length > 1000) return false;  // 太长
                    return true;
                }

                // 方法2: 查找最长的span文本作为评论内容
                let maxSpanText = '';
                const spans = el.querySelectorAll('span');
                for (const span of spans) {
                    const text = span.textContent.trim();
                    if (isValidComment(text) && text.length > maxSpanText.length) {
                        maxSpanText = text;
                    }
                }

                if (maxSpanText.length > 1) {
                    content = maxSpanText;
                }

                // 方法3: 如果还没找到，尝试获取div的文本
                if (!content) {
                    const divs = el.querySelectorAll('div');
                    for (const div of divs) {
                        const text = div.textContent.trim();
                        if (isValidComment(text) && text.length > content.length) {
                            // 检查是否以作者名开头（通常是作者信息行）
                            if (!text.startsWith(author)) {
                                content = text;
                            }
                        }
                    }
                }

                // 提取点赞数
                let likes = 0;
                const debugInfo = []; // 收集调试信息

                // 辅助函数：提取数字
                function extractNumber(text) {
                    const match = text.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }

                // 先输出这个元素的所有文本内容，帮助调试
                const allSpans = el.querySelectorAll('span');
                const allTexts = Array.from(allSpans).map(s => s.textContent.trim()).filter(t => t.length > 0);

                // 方法1: 查找明确的"X赞"格式（最准确）
                for (const span of allSpans) {
                    const text = span.textContent.trim();
                    if (/^\d+赞$/.test(text)) {
                        likes = extractNumber(text);
                        debugInfo.push(`方法1-明确赞格式: ${likes}`);
                        break;
                    }
                }

                // 方法2: 查找包含"赞"字aria-label的元素
                if (likes === 0) {
                    for (const span of allSpans) {
                        const ariaLabel = span.getAttribute('aria-label');
                        if (ariaLabel && ariaLabel.includes('赞')) {
                            const num = extractNumber(ariaLabel);
                            if (num > 0) {
                                likes = num;
                                debugInfo.push(`方法2-aria-label: ${likes} (${ariaLabel})`);
                                break;
                            }
                        }
                    }
                }

                // 方法3: 从后往前找纯数字（排除已知的非点赞数字）
                if (likes === 0) {
                    for (let i = allSpans.length - 1; i >= 0; i--) {
                        const text = allSpans[i].textContent.trim();
                        // 只匹配纯数字
                        if (/^\d+$/.test(text)) {
                            const num = parseInt(text);
                            // 排除明显不是点赞数的数字（如日期、ID等）
                            if (num > 0 && num < 100000 && !isDate(text)) {
                                // 检查这个span后面是否有"赞"字或点赞图标
                                const nextSibling = allSpans[i].nextElementSibling;
                                const parentText = allSpans[i].parentElement?.textContent || '';
                                const hasLikeContext = parentText.includes('赞') ||
                                                       nextSibling?.textContent?.includes('赞');

                                if (hasLikeContext) {
                                    likes = num;
                                    debugInfo.push(`方法3-纯数字+赞上下文: ${likes}`);
                                    break;
                                }
                            }
                        }
                    }
                }

                // 方法4: 查找点赞图标附近的数字
                if (likes === 0) {
                    // 查找所有可能包含点赞图标的元素
                    const possibleLikeElements = el.querySelectorAll('[class*="like"], [class*="赞"], svg');
                    for (const likeEl of possibleLikeElements) {
                        // 检查父元素中的数字
                        const parent = likeEl.parentElement;
                        if (parent) {
                            const siblingSpans = parent.querySelectorAll('span');
                            for (const span of siblingSpans) {
                                const text = span.textContent.trim();
                                if (/^\d+$/.test(text)) {
                                    const num = parseInt(text);
                                    if (num >= 0 && num < 100000) {
                                        likes = num;
                                        debugInfo.push(`方法4-图标附近: ${likes}`);
                                        break;
                                    }
                                }
                            }
                            if (likes > 0) break;
                        }
                    }
                }

                // 如果还没找到，记录调试信息
                if (likes === 0) {
                    console.log('[小红书数据提取器] 未找到点赞数，元素文本:', allTexts.slice(-5));
                } else {
                    console.log('[小红书数据提取器] 点赞数:', likes, '调试:', debugInfo.join(' | '));
                }

                // 清理内容
                content = content.replace(/回复\s*$/, '').trim();

                // console.log('[小红书数据提取器] 处理评论:', { author: author.substring(0, 20), content: content.substring(0, 50), likes });

                // 去重检查（需要同时有作者和内容）
                if (content && content.length > 0) {
                    const uniqueKey = `${author}:${content.slice(0, 30)}`;
                    if (!seenContents.has(uniqueKey)) {
                        seenContents.add(uniqueKey);
                        comments.push({ author, content, likes });
                        // console.log('[小红书数据提取器] ✓ 添加评论:', author, content.substring(0, 30));
                    }
                } else {
                    // console.log('[小红书数据提取器] ✗ 跳过：无内容', { author, textPreview: el.textContent.substring(0, 100) });
                }
            } catch (e) {
                console.log('[小红书数据提取器] 处理元素出错:', e);
            }
        });

        console.log('[小红书数据提取器] 共提取有效评论:', comments.length);

        // 如果检测到反爬虫，更新全局状态
        if (antiScrapingDetected && window.xhsExtractionState) {
            window.xhsExtractionState.antiScrapingDetected = true;
            window.xhsExtractionState.detectionReason = detectionReason;
            console.log('[小红书数据提取器] 已记录反爬虫状态:', detectionReason);
        }

        // 按点赞数排序
        return comments.sort((a, b) => b.likes - a.likes).slice(0, 500);
    }

    function showToast(message, isError = false) {
        // 移除已有的toast
        const existing = document.getElementById('xhs-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'xhs-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${isError ? '#ff4444' : '#00c853'};
            color: white;
            padding: 20px 40px;
            border-radius: 12px;
            z-index: 99999999;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 80%;
            text-align: center;
            line-height: 1.5;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), isError ? 5000 : 3000);
    }
})();
