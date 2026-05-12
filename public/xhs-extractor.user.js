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
            showToast('🚀 开始提取数据，展开楼中楼评论...');

            // 先展开所有折叠的评论
            await expandAllReplies();

            showToast('📊 正在提取帖子数据和评论...');

            // 提取帖子数据
            const data = {
                title: extractTitle(),
                content: extractContent(),
                author: extractAuthor(),
                likes: extractCount('点赞'),
                collects: extractCount('收藏'),
                comments: extractCount('评论'),
                shares: extractCount('分享'),
                postTime: extractPostTime(),
                url: window.location.href,
                extractTime: new Date().toISOString()
            };

            console.log('[小红书数据提取器] 提取的基础数据:', data);

            // 提取评论
            const comments = await extractComments();
            data.commentList = comments;

            console.log('[小红书数据提取器] 提取的评论数:', comments.length);

            // 复制到剪贴板
            const jsonStr = JSON.stringify(data, null, 2);
            GM_setClipboard(jsonStr);

            showToast('✅ 数据已提取！共' + comments.length + '条评论，正在打开分析工具...');

            // 打开分析工具
            const encodedData = encodeURIComponent(jsonStr);
            const analysisUrl = `https://centertea.github.io/xhs-analytics/#/post-analysis?data=${encodedData}`;

            setTimeout(() => {
                GM_openInTab(analysisUrl, { active: true });
            }, 1500);

        } catch (error) {
            showToast('❌ 提取失败：' + error.message, true);
            console.error('[小红书数据提取器] 提取错误:', error);
        }
    }

    // 展开所有楼中楼回复
    async function expandAllReplies() {
        console.log('[小红书数据提取器] 开始展开楼中楼评论...');

        // 尝试点击所有"展开X条回复"按钮
        const expandTexts = ['展开', '条回复', '查看更多', '查看更多回复'];
        let expandedCount = 0;

        for (const text of expandTexts) {
            const buttons = document.querySelectorAll('span, div, button');
            for (const btn of buttons) {
                if (btn.textContent.includes(text) && btn.textContent.includes('回复')) {
                    try {
                        btn.click();
                        expandedCount++;
                        await sleep(200);
                    } catch (e) {}
                }
            }
        }

        console.log('[小红书数据提取器] 展开了', expandedCount, '个楼中楼');

        // 等待内容加载
        await sleep(1000);
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

        // 滚动加载更多评论（最多滚动20次）
        for (let i = 0; i < 20; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await sleep(600);

            // 尝试点击"加载更多"按钮
            const loadMoreBtns = document.querySelectorAll('button, div, span');
            for (const btn of loadMoreBtns) {
                const text = btn.textContent.trim();
                if (text.includes('加载更多') || text.includes('查看更多评论') || /^展开\d+条回复/.test(text)) {
                    btn.click();
                    await sleep(300);
                }
            }
        }

        // 使用精确的选择器提取评论
        // 小红书的评论结构：父评论 + 子评论（楼中楼）
        const commentSelectors = [
            // 主要评论容器选择器
            '[class*="comment-item"]',
            '[class*="CommentItem"]',
            'div[class*="comment-"] > div',
            '[data-v-] > div[class]'
        ];

        let commentElements = [];
        for (const selector of commentSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                commentElements = elements;
                break;
            }
        }

        // 如果上面的选择器没找到，使用备选方案
        if (commentElements.length === 0) {
            // 查找评论区域
            const commentSection = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"]');
            if (commentSection) {
                // 查找所有可能包含评论的div
                const allDivs = commentSection.querySelectorAll(':scope > div > div');
                commentElements = Array.from(allDivs);
            }
        }

        console.log('[小红书数据提取器] 找到评论元素:', commentElements.length);

        commentElements.forEach(el => {
            try {
                // 跳过非评论元素（如广告、推荐等）
                if (el.querySelector('img[src*="ad"]') || el.textContent.length > 5000) return;

                // 提取评论内容 - 查找包含实际评论文本的元素
                let content = '';
                let contentEl = null;

                // 尝试多种内容选择器
                const contentSelectors = [
                    '[class*="content"] span',
                    '[class*="text"] span',
                    'span[class*="content"]',
                    'span[class*="text"]',
                    'div > span:last-child',
                    'a + span',
                    'a ~ span'
                ];

                for (const sel of contentSelectors) {
                    const el2 = el.querySelector(sel);
                    if (el2 && el2.textContent.trim().length > 1) {
                        // 排除包含"回复"、"赞"等元素
                        const text = el2.textContent.trim();
                        if (!text.includes('@') || text.length > 3) {
                            contentEl = el2;
                            content = text;
                            break;
                        }
                    }
                }

                // 如果没找到，尝试直接从子元素提取
                if (!content) {
                    const spans = el.querySelectorAll('span');
                    for (const span of spans) {
                        const text = span.textContent.trim();
                        // 过滤条件：长度>1，不包含特殊关键词，不是纯数字
                        if (text.length > 1 && text.length < 500 &&
                            !text.includes('赞') && !text.includes('回复') &&
                            !/^\d+$/.test(text) && !text.includes('展开') &&
                            !text.startsWith('@')) {
                            content = text;
                            contentEl = span;
                            break;
                        }
                    }
                }

                // 提取作者 - 通常是链接或特定class的元素
                let author = '';
                const authorSelectors = [
                    'a[href*="user"]',
                    'a[class*="name"]',
                    'a[class*="author"]',
                    '[class*="username"]',
                    'a:first-child'
                ];

                for (const sel of authorSelectors) {
                    const authorEl = el.querySelector(sel);
                    if (authorEl) {
                        const text = authorEl.textContent.trim();
                        if (text && text.length < 50 && !text.includes(' ')) {
                            author = text;
                            break;
                        }
                    }
                }

                // 如果没有找到作者，跳过这条
                if (!author) return;

                // 提取点赞数
                let likes = 0;
                const likeSelectors = [
                    '[class*="like"]',
                    'span:contains("赞")',
                    'span svg + span',
                    'span:last-child'
                ];

                for (const sel of likeSelectors) {
                    const likesEl = el.querySelector(sel);
                    if (likesEl) {
                        const text = likesEl.textContent.trim();
                        const match = text.match(/(\d+)/);
                        if (match && !text.includes('回复')) {
                            likes = parseInt(match[1]) || 0;
                            break;
                        }
                    }
                }

                // 清理内容
                content = content.replace(/回复\s*$/, '').trim();

                // 去重检查
                if (content && content.length > 0 && content.length < 1000) {
                    const uniqueKey = `${author}:${content.slice(0, 50)}`;
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
