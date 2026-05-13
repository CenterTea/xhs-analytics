// ==UserScript==
// @name         小红书帖子数据提取器
// @namespace    http://tampermonkey.net/
// @version      1.6
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

        // 查找评论区容器
        let commentContainer = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"], [class*="comment-section"]');
        const isContainerScroll = !!commentContainer;

        console.log('[小红书数据提取器] 评论区容器:', commentContainer ? '找到' : '未找到，使用页面滚动');

        // ===== 阶段1：展开所有楼中楼回复 =====
        console.log('[小红书数据提取器] 开始展开楼中楼评论...');
        let expandCount = 0;

        for (let round = 0; round < 80; round++) {
            let foundInRound = 0;

            const allElements = document.querySelectorAll('button, div, span, a, p');
            for (const el of allElements) {
                const text = el.textContent.trim();
                const shouldClick =
                    /^展开\d+条回复/.test(text) ||
                    text === '查看更多回复' ||
                    text === '展开回复' ||
                    (text.startsWith('展开') && text.includes('回复')) ||
                    /展开\s*\d+\s*条/.test(text) ||
                    /^\d+条回复$/.test(text);

                if (shouldClick && el.offsetParent !== null) {
                    try {
                        el.scrollIntoView({ behavior: 'instant', block: 'center' });
                        await sleep(50, 150);
                        el.click();
                        expandCount++;
                        foundInRound++;
                        await sleep(200, 400);
                    } catch (e) {}
                }
            }

            if (round % 10 === 0) {
                console.log(`[小红书数据提取器] 第${round + 1}轮展开: ${foundInRound}个`);
            }

            if (foundInRound === 0) {
                await sleep(800, 1200);
                const remaining = document.querySelectorAll('button, div, span, a, p');
                const hasMore = Array.from(remaining).some(el => {
                    const t = el.textContent.trim();
                    return (/^展开\d+条回复/.test(t) || t === '查看更多回复') && el.offsetParent !== null;
                });
                if (!hasMore) break;
            }
        }

        console.log('[小红书数据提取器] 总共展开了', expandCount, '个楼中楼');
        await sleep(2000, 3000);

        // ===== 阶段2：滚动加载更多评论 =====
        console.log('[小红书数据提取器] 开始滚动加载评论...');
        let noNewCount = 0;
        let prevCount = 0;

        for (let i = 0; i < 30; i++) {
            if (isContainerScroll && commentContainer) {
                commentContainer.scrollTop = commentContainer.scrollHeight;
            } else {
                window.scrollTo(0, document.body.scrollHeight);
            }
            await sleep(800, 1500);

            // 点击"加载更多"
            const btns = document.querySelectorAll('button, div, span');
            for (const btn of btns) {
                const t = btn.textContent.trim();
                if (/加载更多|查看更多评论|展开更多|加载中/.test(t) && btn.offsetParent !== null) {
                    try { btn.click(); await sleep(300, 600); } catch (e) {}
                }
            }

            // 检测是否有新评论加载
            const currentElements = document.querySelectorAll('a[href*="/user/"]');
            if (currentElements.length <= prevCount) {
                noNewCount++;
                if (noNewCount >= 4) {
                    console.log('[小红书数据提取器] 连续', noNewCount, '次滚动无新评论，停止');
                    break;
                }
            } else {
                noNewCount = 0;
                prevCount = currentElements.length;
            }
        }

        // ===== 阶段3：再次展开可能新出现的折叠回复 =====
        console.log('[小红书数据提取器] 再次检查折叠回复...');
        for (let round = 0; round < 20; round++) {
            let found = 0;
            const elements = document.querySelectorAll('button, div, span');
            for (const el of elements) {
                const t = el.textContent.trim();
                if ((/^展开\d+条回复/.test(t) || t === '查看更多回复') && el.offsetParent !== null) {
                    try {
                        el.scrollIntoView({ behavior: 'instant', block: 'center' });
                        await sleep(50, 100);
                        el.click();
                        found++;
                        await sleep(150, 300);
                    } catch (e) {}
                }
            }
            if (found === 0) break;
            console.log('[小红书数据提取器] 第2轮展开:', found, '个');
        }
        await sleep(1500, 2000);

        // ===== 阶段4：提取所有评论 =====
        // 核心思路：通过用户链接定位每个评论块
        console.log('[小红书数据提取器] 开始提取评论内容...');

        const userLinks = document.querySelectorAll('a[href*="/user/"]');
        console.log('[小红书数据提取器] 找到用户链接:', userLinks.length);

        // 用 Set 去重作者+内容组合
        const processed = new Set();

        userLinks.forEach(link => {
            try {
                if (!link.textContent.trim()) return;

                // 获取作者名
                const author = link.textContent.trim().split(/\s+/)[0];
                if (!author || author.length < 1 || author.length > 50) return;

                // 判断是否是元数据文本
                const isMetadata = (text) => {
                    if (!text) return true;
                    if (/^\d+$/.test(text)) return true;
                    if (/^\d{4}[\-\/年]/.test(text)) return true;
                    if (/IP属地|编辑于/.test(text)) return true;
                    if (/^\d+赞?$/.test(text)) return true;
                    if (/^回复\s*$/.test(text)) return true;
                    if (/展开.+回复|查看更多/.test(text)) return true;
                    if (text.length > 2000) return true;
                    return false;
                };

                // 向上查找评论行容器（包含作者+内容+元数据的行，不包含嵌套回复）
                let row = link.parentElement;
                for (let i = 0; i < 4; i++) {
                    if (!row) break;
                    const children = row.children;
                    // 找一个有多个子元素但不是过大的容器
                    if (children.length >= 2 && children.length <= 20 && row.textContent.length < 3000) {
                        break;
                    }
                    row = row.parentElement;
                }
                if (!row) return;

                // 在此行内查找评论内容：遍历直接子元素，找到最长且不是元数据的文本
                let bestContent = '';
                const directChildren = row.children;
                const candidates = [];

                for (const child of directChildren) {
                    // 跳过包含用户链接的（可能是嵌套回复）
                    if (child.querySelector('a[href*="/user/"]')) continue;
                    const text = child.textContent.trim();
                    if (text.length >= 2 && text.length <= 2000 && !isMetadata(text) && text !== author) {
                        candidates.push({ text, len: text.length });
                    }
                }

                // 如果有候选，选最长的一个
                if (candidates.length > 0) {
                    candidates.sort((a, b) => b.len - a.len);
                    bestContent = candidates[0].text;
                }

                // 备选：从 row 下所有 span 中找最长的有效文本
                if (!bestContent) {
                    const rowSpans = row.querySelectorAll(':scope > * span, :scope > span');
                    for (const span of rowSpans) {
                        if (span.querySelector('a[href*="/user/"]')) continue;
                        const text = span.textContent.trim();
                        if (text.length >= 2 && text.length <= 2000 && !isMetadata(text) && text !== author) {
                            if (text.length > (bestContent ? bestContent.length : 0)) {
                                bestContent = text;
                            }
                        }
                    }
                }

                // 清理内容中残留的 @username 引用
                let content = bestContent.replace(/@\S+/g, '').trim();
                // 清理 IP 地址格式
                content = content.replace(/IP[：:]\S+/g, '').trim();

                if (!content || content.length < 2) return;
                if (/^\d+$/.test(content)) return;

                // 去重
                const key = `${author}:${content.slice(0, 40)}`;
                if (processed.has(key)) return;
                processed.add(key);

                // 提取点赞数（在 row 及其父级找）
                let likes = 0;
                const parent = row.parentElement || row;
                const allSpans = parent.querySelectorAll('span');
                for (const span of allSpans) {
                    const t = span.textContent.trim();
                    const m = t.match(/^(\d+)赞?$/);
                    if (m) {
                        const n = parseInt(m[1]);
                        if (n > 0 && n < 100000) { likes = n; break; }
                    }
                }

                comments.push({ author, content, likes });
            } catch (e) {
                // silent
            }
        });

        console.log('[小红书数据提取器] 共提取有效评论:', comments.length);

        // 按点赞数排序，最多返回 MAX_COMMENTS 条
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
