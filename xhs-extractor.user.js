// ==UserScript==
// @name         小红书帖子数据提取器
// @namespace    http://tampermonkey.net/
// @version      2.0
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

    const MAX_COMMENTS = 300; // 最多提取300条评论

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
        try {
            // 验证当前页面
            if (!window.location.href.includes('/explore/')) {
                showToast('❌ 请在帖子详情页使用此功能', true);
                return;
            }

            showToast('🚀 开始提取数据...');
            console.log('[小红书数据提取器] ==============================');
            console.log('[小红书数据提取器] 开始提取，当前URL:', window.location.href);

            // 提取帖子基础数据
            const title = extractTitle();
            console.log('[小红书数据提取器] 提取的标题:', title);

            const author = extractAuthor();
            console.log('[小红书数据提取器] 提取的作者:', author);

            const likes = extractCount('点赞');
            const collects = extractCount('收藏');
            const comments = extractCount('评论');
            const shares = extractCount('分享');
            console.log('[小红书数据提取器] 互动数据:', { likes, collects, comments, shares });

            const content = extractContent();
            const postTime = extractPostTime();
            const videoInfo = extractVideoInfo();
            console.log('[小红书数据提取器] 视频信息:', videoInfo);

            // 检查数据合理性
            if (title === '未提取到标题' || title.length < 3) {
                console.warn('[小红书数据提取器] 警告: 标题提取可能不准确');
            }

            showToast('📊 正在展开楼中楼评论...');

            // 提取评论
            const commentList = await extractComments();

            const data = {
                title: title,
                content: content,
                author: author,
                likes: likes,
                collects: collects,
                comments: comments,
                shares: shares,
                postTime: postTime,
                postType: videoInfo.type,
                videoDuration: videoInfo.duration,
                url: window.location.href,
                extractTime: new Date().toISOString(),
                commentList: commentList
            };

            console.log('[小红书数据提取器] 提取完成:');
            console.log('  - 标题:', title);
            console.log('  - 作者:', author);
            console.log('  - 点赞:', likes);
            console.log('  - 评论:', comments, '(提取到', commentList.length, '条)');
            console.log('[小红书数据提取器] ==============================');

            // 复制到剪贴板
            const jsonStr = JSON.stringify(data, null, 2);
            GM_setClipboard(jsonStr);

            showToast(`✅ 已提取 ${commentList.length} 条评论！正在打开分析工具...`);

            // 打开分析工具
            const encodedData = encodeURIComponent(jsonStr);
            const analysisUrl = `https://centertea.github.io/xhs-analytics/#/post-analysis?data=${encodedData}`;

            setTimeout(() => {
                GM_openInTab(analysisUrl, { active: true });
            }, 1000);

        } catch (error) {
            showToast('❌ 提取失败：' + error.message, true);
            console.error('[小红书数据提取器] 提取错误:', error);
        }
    }

    // 随机延迟函数
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
                    /"note"[\s\S]{0,500}?"likedCount"\s*[:：]\s*(\d+)/,
                    /"likedCount"\s*[:：]\s*(\d+)(?=[\s\S]{0,200}?"note")/,
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

    function extractVideoInfo() {
        console.log('[小红书数据提取器] 开始提取视频信息...');

        // 方法1：从页面所有 script 标签中提取
        const scripts = document.querySelectorAll('script');
        let foundType = 'image';
        let foundDuration = 0;

        for (const script of scripts) {
            const text = script.textContent;
            if (!text || text.length < 100) continue;

            // 检测帖子类型（只取第一次发现的）
            if (foundType === 'image') {
                const typeMatch = text.match(/"type"\s*:\s*"(video|normal)"/);
                if (typeMatch) {
                    foundType = typeMatch[1] === 'video' ? 'video' : 'image';
                    console.log('[小红书数据提取器] 检测到帖子类型:', foundType);
                }
            }

            // 尝试提取视频时长 - 多种可能的字段名和格式
            const durationPatterns = [
                /"videoDuration"\s*:\s*(\d+(?:\.\d+)?)/,
                /"duration"\s*:\s*(\d+(?:\.\d+)?)/,
                /"video"\s*:\s*\{[^}]*?"duration"\s*:\s*(\d+(?:\.\d+)?)/,
                /"videoInfo"\s*:\s*\{[^}]*?"duration"\s*:\s*(\d+(?:\.\d+)?)/,
                /"media"\s*:\s*\{[^}]*?"duration"\s*:\s*(\d+(?:\.\d+)?)/,
                /"length"\s*:\s*(\d+(?:\.\d+)?)/,
            ];

            for (const pattern of durationPatterns) {
                const match = text.match(pattern);
                if (match) {
                    const raw = parseFloat(match[1]);
                    if (raw > 0 && raw < 100000000) {
                        // 判断单位：>10000 大概率是毫秒
                        const seconds = raw > 10000 ? Math.floor(raw / 1000) : Math.round(raw);
                        if (seconds > 0 && seconds < 36000) {
                            foundDuration = seconds;
                            console.log('[小红书数据提取器] 找到视频时长:', raw, '→', seconds, '秒 (pattern:', pattern.toString().substring(0, 40), ')');
                            break;
                        }
                    }
                }
            }

            if (foundDuration > 0) break;
        }

        // 方法2：从 window.__INITIAL_STATE__ 提取
        if (foundDuration === 0 && window.__INITIAL_STATE__) {
            try {
                const state = window.__INITIAL_STATE__;
                if (state.note && state.note.type === 'video') {
                    foundType = 'video';
                    const dur = state.note.videoDuration || state.note.duration || (state.note.video && state.note.video.duration);
                    if (dur) {
                        const raw = parseFloat(dur);
                        foundDuration = raw > 10000 ? Math.floor(raw / 1000) : Math.round(raw);
                        console.log('[小红书数据提取器] 从 __INITIAL_STATE__ 找到视频时长:', foundDuration, '秒');
                    }
                }
            } catch (e) {
                console.log('[小红书数据提取器] __INITIAL_STATE__ 提取失败:', e);
            }
        }

        // 方法3：从页面 video 元素提取
        if (foundDuration === 0) {
            const videoEl = document.querySelector('video');
            if (videoEl) {
                foundType = 'video';
                console.log('[小红书数据提取器] 找到 video 元素');

                // 尝试获取 duration 属性
                if (videoEl.duration && isFinite(videoEl.duration) && videoEl.duration > 0) {
                    foundDuration = Math.round(videoEl.duration);
                    console.log('[小红书数据提取器] 从 video.duration 获取:', foundDuration, '秒');
                }

                // 尝试从 video 的 src 或 data 属性获取
                if (foundDuration === 0) {
                    const dataDuration = videoEl.getAttribute('data-duration') || videoEl.getAttribute('duration');
                    if (dataDuration) {
                        const raw = parseFloat(dataDuration);
                        foundDuration = raw > 10000 ? Math.floor(raw / 1000) : Math.round(raw);
                        console.log('[小红书数据提取器] 从 video 属性获取:', foundDuration, '秒');
                    }
                }
            }
        }

        console.log('[小红书数据提取器] 最终结果: type=' + foundType + ', duration=' + foundDuration + '秒');
        return { type: foundType, duration: foundDuration };
    }

    async function extractComments() {
        const comments = [];
        const seenContents = new Set();

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
                }
            }

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

        // 等待所有展开的内容加载完成
        await sleep(1500, 2500);

        // 滚动加载更多评论（最多滚动15次）
        console.log('[小红书数据提取器] 开始滚动加载评论...');
        for (let i = 0; i < 15; i++) {
            if (isContainerScroll && commentContainer) {
                // 滚动评论区容器
                commentContainer.scrollTop = commentContainer.scrollHeight;
            } else {
                // 滚动页面
                window.scrollTo(0, document.body.scrollHeight);
            }
            await sleep(1000, 2000);

            // 尝试点击"加载更多"按钮
            const loadMoreBtns = document.querySelectorAll('button, div, span');
            for (const btn of loadMoreBtns) {
                const text = btn.textContent.trim();
                if (text === '加载更多' || text === '查看更多评论' || text === '展开更多') {
                    if (btn.offsetParent !== null) {
                        btn.click();
                        await sleep(400, 800);
                    }
                }
            }
        }

        // ===== 用精确选择器提取评论 =====
        // 优先使用小红书已知的 DOM 结构：.comment-inner-container
        let containers = document.querySelectorAll('.comment-inner-container');
        console.log('[小红书数据提取器] 找到 comment-inner-container:', containers.length);

        if (containers.length === 0) {
            // 备选：旧的选择器
            containers = document.querySelectorAll('[class*="comment-item"]');
            console.log('[小红书数据提取器] 备选 [class*="comment-item"]:', containers.length);
        }

        containers.forEach(el => {
            try {
                // 作者：.author-wrapper .name a
                const authorEl = el.querySelector('.author-wrapper .name, .author .name, a.name');
                const author = authorEl ? authorEl.textContent.trim().split(/\s+/)[0] : '未知用户';
                if (!author || author.length > 50) return;

                // 内容：.content .note-text span
                const contentEl = el.querySelector('.content .note-text, .content span');
                const content = contentEl ? contentEl.textContent.trim() : '';
                if (!content || content.length < 1 || content.length > 2000) return;
                // 跳过纯数字（日期、点赞数）和 IP 属地
                if (/^\d+$/.test(content)) return;
                if (/^\d{2}-\d{2}$/.test(content)) return;
                if (/^(北京|上海|广东|浙江|江苏|四川|重庆|湖北|湖南|福建|山东|河南|河北|辽宁|天津|陕西|甘肃|新疆|西藏|宁夏|内蒙古|广西|云南|贵州|海南|吉林|黑龙江|安徽|江西|山西|中国香港|中国澳门|中国台湾|海外|其他)$/.test(content)) return;

                // 点赞数：.interactions .like .count
                const likeEl = el.querySelector('.interactions .like .count, .like .count, .like-wrapper .count');
                let likes = 0;
                if (likeEl) {
                    const m = likeEl.textContent.trim().match(/(\d+)/);
                    if (m) likes = parseInt(m[1]);
                }

                // 去重
                const key = `${author}:${content.slice(0, 40)}`;
                if (seenContents.has(key)) return;
                seenContents.add(key);

                comments.push({ author, content, likes });
            } catch (e) {}
        });

        console.log('[小红书数据提取器] 共提取有效评论:', comments.length);

        return comments.sort((a, b) => b.likes - a.likes).slice(0, MAX_COMMENTS);
    }


    function showToast(message, isError = false) {
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
