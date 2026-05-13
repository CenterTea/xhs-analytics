// ==UserScript==
// @name         小红书帖子数据提取器
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  智能分批提取小红书帖子数据，自动降频避免触发反爬虫
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

    // 智能分批配置
    const BATCH_CONFIG = {
        maxExpandRoundsPerBatch: 8,      // 每批展开轮数（增加展开力度）
        maxScrollCountPerBatch: 4,       // 每批滚动次数（增加滚动次数）
        expandDelay: [600, 1200],        // 展开延迟
        scrollDelay: [2500, 4000],       // 滚动延迟
        batchCooldown: [4000, 7000],     // 批次间冷却时间（4-7秒）
        commentsPerBatch: 80,            // 每批目标评论数（增加到80条）
        maxTotalComments: 500,           // 最大提取数量
        maxBatches: 15                   // 最大批次数（减少批次数，增加每批效率）
    };

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

    async function extractData() {
        try {
            // 验证当前页面
            if (!window.location.href.includes('/explore/')) {
                showToast('❌ 请在帖子详情页使用此功能', true);
                console.log('[小红书数据提取器] 当前不是帖子详情页:', window.location.href);
                return;
            }

            showToast('🚀 开始智能分批提取...');
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

            // 智能分批提取评论
            showToast(`📊 开始分批提取评论，预计分多批进行，每批间隔${BATCH_CONFIG.batchCooldown[0]/1000}-${BATCH_CONFIG.batchCooldown[1]/1000}秒...`);
            const commentList = await extractCommentsBatched();

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
                commentList: commentList,
                extractInfo: {
                    totalBatches: Math.ceil(commentList.length / BATCH_CONFIG.commentsPerBatch),
                    finalCommentCount: commentList.length
                }
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

            showToast(`✅ 分批提取完成！共提取 ${commentList.length} 条评论！正在打开分析工具...`);

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

    // 随机延迟函数，避免触发反爬虫机制
    function sleep(minMs, maxMs) {
        const delay = maxMs ? Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs : minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // 智能分批提取评论
    async function extractCommentsBatched() {
        const allComments = [];
        const seenContents = new Set();
        let batchNumber = 0;
        let noNewCommentsCount = 0;  // 连续没有新评论的次数

        // 查找评论区容器
        let commentContainer = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"], [class*="comment-section"]');
        const isContainerScroll = !!commentContainer;

        console.log('[小红书数据提取器] 评论区容器:', commentContainer ? '找到' : '未找到，使用页面滚动');

        while (batchNumber < BATCH_CONFIG.maxBatches && allComments.length < BATCH_CONFIG.maxTotalComments) {
            batchNumber++;
            console.log(`\n[小红书数据提取器] ===== 第 ${batchNumber} 批提取 =====`);
            showToast(`📊 正在提取第 ${batchNumber} 批评论（当前${allComments.length}条）...`);

            const batchStartCount = allComments.length;

            // 本批：展开楼中楼回复
            console.log('[小红书数据提取器] 开始展开楼中楼评论...');
            let expandCount = 0;

            for (let round = 0; round < BATCH_CONFIG.maxExpandRoundsPerBatch; round++) {
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
                        (text.startsWith('展开') && text.includes('回复')) ||  // 其他变体
                        /展开\s*\d+\s*条/.test(text);            // "展开 3 条"

                    if (shouldClick && el.offsetParent !== null) {
                        // 滚动到按钮位置确保可见
                        el.scrollIntoView({ behavior: 'instant', block: 'center' });
                        await sleep(BATCH_CONFIG.expandDelay[0], BATCH_CONFIG.expandDelay[1]);

                        el.click();
                        expandCount++;
                        foundInRound++;
                        await sleep(BATCH_CONFIG.expandDelay[0], BATCH_CONFIG.expandDelay[1]);

                        // 每批最多展开30个就停止
                        if (expandCount >= 30) break;
                    }
                }

                console.log(`[小红书数据提取器] 第${round + 1}轮展开: ${foundInRound}个`);

                // 如果本轮没找到，等待一下再检查
                if (foundInRound === 0) {
                    await sleep(1000, 2000);
                } else {
                    break;  // 找到了就进入下一批的滚动阶段
                }
            }

            console.log('[小红书数据提取器] 本批展开:', expandCount, '个楼中楼');
            await sleep(2000, 3000);  // 等待展开内容加载

            // 本批：滚动加载
            console.log('[小红书数据提取器] 开始滚动加载评论...');
            for (let i = 0; i < BATCH_CONFIG.maxScrollCountPerBatch; i++) {
                if (isContainerScroll && commentContainer) {
                    commentContainer.scrollTop = commentContainer.scrollHeight;
                } else {
                    window.scrollTo(0, document.body.scrollHeight);
                }
                await sleep(BATCH_CONFIG.scrollDelay[0], BATCH_CONFIG.scrollDelay[1]);

                // 尝试点击"加载更多"按钮
                const loadMoreBtns = document.querySelectorAll('button, div, span');
                for (const btn of loadMoreBtns) {
                    const text = btn.textContent.trim();
                    if (text === '加载更多' || text === '查看更多评论' || text === '展开更多') {
                        if (btn.offsetParent !== null) {
                            btn.click();
                            await sleep(1000, 2000);
                        }
                    }
                }
            }

            // 提取当前可见的评论
            const newComments = extractVisibleComments(seenContents);
            allComments.push(...newComments);

            const batchNewCount = allComments.length - batchStartCount;
            console.log(`[小红书数据提取器] 第${batchNumber}批完成，新增: ${batchNewCount}条，总计: ${allComments.length}条`);

            // 检查是否没有新评论了
            if (batchNewCount === 0) {
                noNewCommentsCount++;
                console.log(`[小红书数据提取器] 本批无新评论（连续${noNewCommentsCount}次）`);
                if (noNewCommentsCount >= 5) {
                    console.log('[小红书数据提取器] 连续5批无新评论，判断已提取完毕');
                    break;
                }
            } else {
                noNewCommentsCount = 0;  // 重置计数
            }

            // 批次间冷却
            if (allComments.length < BATCH_CONFIG.maxTotalComments && batchNumber < BATCH_CONFIG.maxBatches) {
                const cooldown = Math.floor(Math.random() *
                    (BATCH_CONFIG.batchCooldown[1] - BATCH_CONFIG.batchCooldown[0] + 1)) +
                    BATCH_CONFIG.batchCooldown[0];
                console.log(`[小红书数据提取器] 批次冷却中，等待 ${cooldown/1000} 秒...`);
                showToast(`⏳ 第${batchNumber}批完成（${allComments.length}条），冷却 ${cooldown/1000} 秒后继续...`);
                await sleep(cooldown, cooldown + 2000);
            }
        }

        console.log('[小红书数据提取器] 分批提取结束，共', batchNumber, '批，', allComments.length, '条评论');

        // 按点赞数排序
        return allComments.sort((a, b) => b.likes - a.likes).slice(0, BATCH_CONFIG.maxTotalComments);
    }

    // 提取当前可见的评论
    function extractVisibleComments(seenContents) {
        const comments = [];

        const commentSelectors = [
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
                    if (elements.length > 3) {
                        commentElements = elements;
                        break;
                    }
                }
            } catch (e) {}
        }

        // 备选方案
        if (commentElements.length === 0) {
            const commentSection = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"], [class*="comment-section"]');
            if (commentSection) {
                const allDivs = commentSection.querySelectorAll(':scope > div');
                commentElements = Array.from(allDivs);
            }
        }

        commentElements.forEach(el => {
            try {
                if (el.querySelector('img[src*="ad"]') || el.textContent.length > 3000) return;

                // 提取作者
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
                        if (text && text.length > 0 && text.length < 100) {
                            author = text.split(/\s+/)[0];
                            break;
                        }
                    }
                }

                if (!author) {
                    const firstLink = el.querySelector('a');
                    if (firstLink) {
                        const text = firstLink.textContent.trim();
                        if (text && text.length > 0 && text.length < 100) {
                            author = text.split(/\s+/)[0];
                        }
                    }
                }

                if (!author) author = '未知用户';

                // 提取评论内容
                let content = '';

                function isValidComment(text) {
                    if (!text || text.length <= 1) return false;
                    if (text === author) return false;
                    if (text.match(/^\d+$/)) return false;
                    if (/^\d{4}[\-\/年]\d{1,2}[\-\/月]\d{1,2}/.test(text)) return false;
                    if (text.includes('赞') && text.match(/^\d+赞$/)) return false;
                    if (text.includes('回复') && text.length < 10) return false;
                    if (text.includes('展开') && text.includes('回复')) return false;
                    if (text.includes('@')) return false;
                    if (text.includes('IP属地')) return false;
                    if (text.includes('编辑于')) return false;
                    if (text.length > 1000) return false;
                    return true;
                }

                // 从span中提取
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

                // 提取点赞数
                let likes = 0;
                const allSpans = el.querySelectorAll('span');

                for (const span of allSpans) {
                    const text = span.textContent.trim();
                    if (/^\d+赞$/.test(text)) {
                        likes = parseInt(text.match(/(\d+)/)[1]);
                        break;
                    }
                }

                if (likes === 0) {
                    for (let i = allSpans.length - 1; i >= 0; i--) {
                        const text = allSpans[i].textContent.trim();
                        if (/^\d+$/.test(text)) {
                            const num = parseInt(text);
                            if (num > 0 && num < 100000) {
                                const parentText = allSpans[i].parentElement?.textContent || '';
                                if (parentText.includes('赞')) {
                                    likes = num;
                                    break;
                                }
                            }
                        }
                    }
                }

                content = content.replace(/回复\s*$/, '').trim();

                // 去重检查
                if (content && content.length > 0) {
                    const uniqueKey = `${author}:${content.slice(0, 30)}`;
                    if (!seenContents.has(uniqueKey)) {
                        seenContents.add(uniqueKey);
                        comments.push({ author, content, likes });
                    }
                }
            } catch (e) {}
        });

        return comments;
    }

    // 以下是数据提取辅助函数（与原版相同）
    function extractTitle() {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            if (text.includes('"note"') || text.includes('"firstNoteId"')) {
                const patterns = [
                    /"title":"([^"]{3,200}?)","desc":/,
                    /"title":"([^"]{3,200}?)","type":"[^"]*"/,
                    /"shareInfo"[^}]*"title":"([^"]{3,200}?)"/
                ];
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match && match[1] && match[1].length > 3) {
                        const title = match[1].replace(/\\n/g, ' ').replace(/\\u0026/g, '&').replace(/\\"/g, '"');
                        if (title.length > 5 || title.includes(' ')) {
                            return title;
                        }
                    }
                }
            }
        }

        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent.trim().length > 3) {
            return h1.textContent.trim();
        }

        const metaTitle = document.querySelector('meta[property="og:title"]');
        if (metaTitle) {
            const content = metaTitle.getAttribute('content');
            if (content && !content.includes('@')) {
                return content.replace(' - 小红书', '');
            }
        }

        const title = document.title.replace(' - 小红书', '');
        if (title && title.length > 5 && !title.startsWith('@')) {
            return title;
        }

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
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            const match = text.match(/"desc":"([^"]{20,5000})"/);
            if (match) {
                return match[1].replace(/\\n/g, '\n').replace(/\\u0026/g, '&');
            }
        }

        const metaDesc = document.querySelector('meta[property="og:description"]');
        if (metaDesc) {
            return metaDesc.getAttribute('content');
        }

        return '';
    }

    function extractAuthor() {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            const match = text.match(/"nickname":"([^"]+)"/);
            if (match) {
                return match[1];
            }
        }

        return '未知作者';
    }

    function extractCount(type) {
        let count = 0;
        const scripts = document.querySelectorAll('script');

        for (const script of scripts) {
            const text = script.textContent;
            if (!text.includes('"note"') && !text.includes('"firstNoteId"')) continue;

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
                            }
                        }
                    }
                }
            }
        }

        if (count > 0) return count;

        const countSelectors = {
            '点赞': ['button[aria-label*="赞"]', '[class*="like"] button', '[class*="like"] span'],
            '收藏': ['button[aria-label*="收藏"]', '[class*="collect"] button', '[class*="collect"] span'],
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
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            const match = text.match(/"createTime":"([^"]+)"/);
            if (match) {
                return match[1];
            }
        }

        return '';
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
