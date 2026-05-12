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

            // 检查数据合理性
            if (title === '未提取到标题' || title.length < 3) {
                console.warn('[小红书数据提取器] 警告: 标题提取可能不准确');
            }

            showToast('📊 正在展开楼中楼评论...');

            // 提取评论
            const commentList = await extractComments();

            const data = {
                title: title,
                content: extractContent(),
                author: author,
                likes: likes,
                collects: collects,
                comments: comments,
                shares: shares,
                postTime: extractPostTime(),
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

        // 方法1: 从页面脚本(JSON)中提取 - 查找note相关的数据
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            // 只处理包含note数据的脚本
            if (!text.includes('"note"') && !text.includes('"firstNoteId"')) continue;

            const patterns = {
                '点赞': [/'likedCount':\s*(\d+)/, /"likedCount":\s*(\d+)/, /"likeCount":\s*"?(\d+)"?/],
                '收藏': [/'collectedCount':\s*(\d+)/, /"collectedCount":\s*(\d+)/, /"collectCount":\s*"?(\d+)"?/],
                '评论': [/'commentCount':\s*(\d+)/, /"commentCount":\s*(\d+)/, /"commentCount":\s*"?(\d+)"?/],
                '分享': [/'shareCount':\s*(\d+)/, /"shareCount":\s*(\d+)/, /"shareCount":\s*"?(\d+)"?/]
            };

            if (patterns[type]) {
                for (const pattern of patterns[type]) {
                    const match = text.match(pattern);
                    if (match) {
                        const val = parseInt(match[1]) || 0;
                        if (val > 0 && val < 10000000) { // 过滤不合理的值
                            count = val;
                            break;
                        }
                    }
                }
                if (count > 0) return count;
            }
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
                            return val;
                        }
                    }
                }
            }
        }

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
        for (let attempt = 0; attempt < 5; attempt++) {
            const expandBtns = document.querySelectorAll('button, div, span, a');
            let foundNew = false;
            for (const btn of expandBtns) {
                const text = btn.textContent.trim();
                // 匹配"展开X条回复"、"查看更多回复"等
                if (/^展开\d+条回复/.test(text) || text === '查看更多回复' || text === '展开回复') {
                    if (btn.offsetParent !== null) { // 确保按钮可见
                        btn.click();
                        expandCount++;
                        foundNew = true;
                        await sleep(200);
                    }
                }
            }
            if (!foundNew) break; // 没有新的展开按钮了
        }
        console.log('[小红书数据提取器] 展开了', expandCount, '个楼中楼');

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
            await sleep(800);

            // 尝试点击"加载更多"按钮
            const loadMoreBtns = document.querySelectorAll('button, div, span');
            for (const btn of loadMoreBtns) {
                const text = btn.textContent.trim();
                if (text === '加载更多' || text === '查看更多评论' || text === '展开更多') {
                    if (btn.offsetParent !== null) {
                        btn.click();
                        await sleep(400);
                    }
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
                if (elements.length > 3) { // 至少要有几条评论才算找到
                    commentElements = elements;
                    console.log('[小红书数据提取器] 使用选择器:', selector, '找到', elements.length, '个元素');
                    break;
                }
            } catch (e) {}
        }

        // 如果上面的选择器没找到，使用备选方案
        if (commentElements.length === 0) {
            // 查找评论区域
            const commentSection = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"], [class*="comment-section"]');
            if (commentSection) {
                // 查找直接子元素
                const allDivs = commentSection.querySelectorAll(':scope > div');
                commentElements = Array.from(allDivs);
                console.log('[小红书数据提取器] 使用评论区子元素，找到', commentElements.length, '个');
            }
        }

        // 备选：从整个页面找所有可能包含用户头像和评论内容的块
        if (commentElements.length === 0) {
            const allComments = [];
            const possibleComments = document.querySelectorAll('a[href*="user"]');
            possibleComments.forEach(a => {
                const parent = a.closest('div[class]');
                if (parent) {
                    const siblingDivs = parent.querySelectorAll(':scope > div');
                    if (siblingDivs.length >= 2) {
                        allComments.push(parent);
                    }
                }
            });
            if (allComments.length > 3) {
                commentElements = allComments;
                console.log('[小红书数据提取器] 使用用户链接定位，找到', commentElements.length, '个');
            }
        }

        console.log('[小红书数据提取器] 最终找到评论元素:', commentElements.length);

        commentElements.forEach(el => {
            try {
                // 跳过非评论元素（如广告、推荐等）
                if (el.querySelector('img[src*="ad"]') || el.textContent.length > 3000) return;

                // 提取作者 - 第一个用户链接
                let author = '';
                const authorEl = el.querySelector('a[href*="user"], a[class*="name"]');
                if (authorEl) {
                    author = authorEl.textContent.trim();
                }

                // 如果没有找到作者，跳过这条
                if (!author || author.length > 50 || author.includes(' ')) return;

                // 提取评论内容
                let content = '';

                // 方法1: 查找包含"回复"的父元素内的span
                const replyLinks = el.querySelectorAll('span, div');
                for (const link of replyLinks) {
                    const text = link.textContent.trim();
                    // 真正的评论通常包含"回复"关键词或者是主要文本内容
                    if (text.startsWith('回复') && text.includes(':')) {
                        const match = text.match(/回复[^:]+:\s*(.+)/);
                        if (match) {
                            content = match[1].trim();
                            break;
                        }
                    }
                }

                // 方法2: 如果没找到，尝试从结构中提取
                if (!content) {
                    // 找到作者链接后面的第一个span
                    const allElements = el.querySelectorAll('*');
                    let foundAuthor = false;
                    for (const elem of allElements) {
                        if (elem === authorEl || elem.contains(authorEl)) {
                            foundAuthor = true;
                            continue;
                        }
                        if (foundAuthor && elem.tagName === 'SPAN') {
                            const text = elem.textContent.trim();
                            // 过滤掉点赞数、时间等
                            if (text.length > 1 && text.length < 1000 &&
                                !/^\d+$/.test(text) &&
                                !text.includes('赞') &&
                                !text.includes('回复') &&
                                !text.includes('展开')) {
                                content = text;
                                break;
                            }
                        }
                    }
                }

                // 方法3: 从所有span中提取最长的（排除已知非评论的）
                if (!content) {
                    let maxLen = 0;
                    const spans = el.querySelectorAll('span');
                    for (const span of spans) {
                        const text = span.textContent.trim();
                        if (text.length > maxLen && text.length < 1000 &&
                            !text.includes('@') &&
                            !text.includes('赞') &&
                            !text.includes('回复') &&
                            !text.includes('展开') &&
                            !/^\d+$/.test(text) &&
                            text !== author) {
                            maxLen = text.length;
                            content = text;
                        }
                    }
                }

                // 提取点赞数
                let likes = 0;
                const likeElements = el.querySelectorAll('span, div');
                for (const likeEl of likeElements) {
                    const text = likeEl.textContent.trim();
                    // 匹配纯数字（点赞数）
                    if (/^\d+$/.test(text)) {
                        const num = parseInt(text);
                        if (num < 100000) { // 合理的点赞数范围
                            likes = num;
                            break;
                        }
                    }
                }

                // 清理内容
                content = content.replace(/回复\s*$/, '').trim();

                // 去重检查（需要同时有作者和内容）
                if (content && content.length > 0 && content.length < 1000) {
                    const uniqueKey = `${author}:${content.slice(0, 30)}`;
                    if (!seenContents.has(uniqueKey)) {
                        seenContents.add(uniqueKey);
                        comments.push({ author, content, likes });
                    }
                }
            } catch (e) {}
        });

        console.log('[小红书数据提取器] 共提取有效评论:', comments.length);

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
