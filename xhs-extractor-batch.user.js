// ==UserScript==
// @name         小红书帖子数据提取器（分批版）
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  分批提取小红书帖子数据，避免触发反爬虫机制
// @author       You
// @match        https://www.xiaohongshu.com/*
// @match        http://www.xiaohongshu.com/*
// @match        https://xiaohongshu.com/*
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[小红书分批提取器] 脚本开始加载...');

    // 检查是否在小红书网页版
    if (!window.location.href.includes('xiaohongshu.com')) {
        console.log('[小红书分批提取器] 非小红书页面，跳过加载');
        return;
    }

    // 分批提取配置
    const BATCH_CONFIG = {
        maxExpandRounds: 5,        // 每批最多展开轮数（原50）
        maxScrollCount: 3,         // 每批最多滚动次数（原15）
        expandDelay: [500, 1000],  // 展开延迟（原300-600）
        scrollDelay: [2000, 3500], // 滚动延迟（原1000-2000）
        commentsPerBatch: 50       // 每批目标评论数
    };

    // 存储键名
    const STORAGE_KEY = 'xhs_batch_extract_data';

    function init() {
        console.log('[小红书分批提取器] 初始化中...');

        const isPostPage = window.location.href.includes('/explore/') ||
                           document.querySelector('h1') ||
                           document.querySelector('[class*="note"]');

        if (!isPostPage) {
            console.log('[小红书分批提取器] 不是帖子详情页，不显示按钮');
            return;
        }

        createButtonPanel();
    }

    function createButtonPanel() {
        // 检查面板是否已存在
        if (document.getElementById('xhs-batch-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'xhs-batch-panel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            min-width: 200px;
        `;

        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            background: #ff2442;
            color: white;
            padding: 10px 15px;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = '<span>📊 数据分析</span>';

        // 收起/展开按钮
        const toggleBtn = document.createElement('span');
        toggleBtn.textContent = '▼';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.onclick = () => {
            const content = panel.querySelector('#xhs-panel-content');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggleBtn.textContent = '▼';
            } else {
                content.style.display = 'none';
                toggleBtn.textContent = '▶';
            }
        };
        header.appendChild(toggleBtn);
        panel.appendChild(header);

        // 内容区
        const content = document.createElement('div');
        content.id = 'xhs-panel-content';
        content.style.cssText = 'padding: 15px;';

        // 显示当前状态
        const statusDiv = document.createElement('div');
        statusDiv.id = 'xhs-batch-status';
        statusDiv.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 6px;
        `;
        updateStatus(statusDiv);
        content.appendChild(statusDiv);

        // 分批提取按钮
        const extractBtn = createButton('提取本批评论', '#ff2442', () => extractBatch());
        content.appendChild(extractBtn);

        // 继续提取按钮
        const continueBtn = createButton('继续提取下一批', '#00c853', () => extractBatch(true));
        content.appendChild(continueBtn);

        // 合并并导出按钮
        const exportBtn = createButton('合并并导出全部', '#2196f3', () => mergeAndExport());
        content.appendChild(exportBtn);

        // 清空数据按钮
        const clearBtn = createButton('清空已存数据', '#757575', () => clearStoredData());
        content.appendChild(clearBtn);

        // 说明文字
        const tip = document.createElement('div');
        tip.style.cssText = `
            font-size: 11px;
            color: #999;
            margin-top: 10px;
            line-height: 1.5;
        `;
        tip.innerHTML = '💡 提示：分批提取可降低被封风险。每批提取后请手动滚动加载更多评论，然后点击"继续提取"。';
        content.appendChild(tip);

        panel.appendChild(content);

        if (document.body) {
            document.body.appendChild(panel);
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(panel);
            });
        }
    }

    function createButton(text, color, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            background: ${color};
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            transition: opacity 0.2s;
        `;
        btn.onmouseover = () => btn.style.opacity = '0.9';
        btn.onmouseout = () => btn.style.opacity = '1';
        btn.onclick = onClick;
        return btn;
    }

    function updateStatus(element) {
        const stored = getStoredData();
        const batchCount = stored.batches ? stored.batches.length : 0;
        const totalComments = stored.totalComments || 0;

        element.innerHTML = `
            <div>已提取批次: <strong>${batchCount}</strong></div>
            <div>累计评论数: <strong>${totalComments}</strong></div>
            <div style="margin-top: 5px; font-size: 11px; color: #999;">
                ${batchCount === 0 ? '首次使用请点击"提取本批评论"' : '请点击"继续提取"加载更多'}
            </div>
        `;
    }

    // 随机延迟函数
    function sleep(minMs, maxMs) {
        const delay = maxMs ? Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs : minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // 获取存储的数据
    function getStoredData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : { batches: [], totalComments: 0 };
        } catch (e) {
            return { batches: [], totalComments: 0 };
        }
    }

    // 保存数据
    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // 更新状态显示
        const statusDiv = document.getElementById('xhs-batch-status');
        if (statusDiv) updateStatus(statusDiv);
    }

    // 清空数据
    function clearStoredData() {
        if (confirm('确定要清空所有已保存的提取数据吗？')) {
            localStorage.removeItem(STORAGE_KEY);
            const statusDiv = document.getElementById('xhs-batch-status');
            if (statusDiv) updateStatus(statusDiv);
            showToast('✅ 已清空所有数据');
        }
    }

    // 提取单批数据
    async function extractBatch(isContinue = false) {
        try {
            showToast(isContinue ? '🚀 继续提取下一批...' : '🚀 开始提取第一批...');

            // 检查当前页面
            if (!window.location.href.includes('/explore/')) {
                showToast('❌ 请在帖子详情页使用', true);
                return;
            }

            // 提取基础数据（只在第一批时提取）
            let postData = {};
            if (!isContinue) {
                postData = {
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
            }

            // 分批提取评论
            const batchComments = await extractCommentsBatch(isContinue);

            // 保存到本地存储
            const stored = getStoredData();
            stored.batches.push({
                timestamp: new Date().toISOString(),
                commentCount: batchComments.length,
                comments: batchComments
            });
            stored.totalComments = (stored.totalComments || 0) + batchComments.length;

            if (!isContinue) {
                stored.postData = postData;
            }

            saveData(stored);

            showToast(`✅ 本批提取完成！本次${batchComments.length}条，累计${stored.totalComments}条`);

        } catch (error) {
            showToast('❌ 提取失败：' + error.message, true);
            console.error('[小红书分批提取器] 错误:', error);
        }
    }

    // 分批提取评论（限制数量）
    async function extractCommentsBatch(isContinue) {
        const comments = [];
        const seenContents = new Set();

        // 加载已有的评论ID用于去重
        const stored = getStoredData();
        if (stored.batches) {
            stored.batches.forEach(batch => {
                batch.comments.forEach(c => {
                    seenContents.add(`${c.author}:${c.content.slice(0, 30)}`);
                });
            });
        }

        // 查找评论区容器
        let commentContainer = document.querySelector('#comment-container, [class*="comment-list"], [class*="comments-list"], [class*="comment-section"]');
        const isContainerScroll = !!commentContainer;

        console.log('[小红书分批提取器] 评论区容器:', commentContainer ? '找到' : '未找到');

        // 展开楼中楼（限制轮数）
        console.log('[小红书分批提取器] 开始展开楼中楼...');
        let expandCount = 0;

        for (let round = 0; round < BATCH_CONFIG.maxExpandRounds; round++) {
            let foundInRound = 0;
            const allElements = document.querySelectorAll('button, div, span, a, p');

            for (const el of allElements) {
                const text = el.textContent.trim();
                const shouldClick =
                    /^展开\d+条回复/.test(text) ||
                    text === '查看更多回复' ||
                    text === '展开回复' ||
                    (text.startsWith('展开') && text.includes('回复')) ||
                    /展开\s*\d+\s*条/.test(text);

                if (shouldClick && el.offsetParent !== null) {
                    el.scrollIntoView({ behavior: 'instant', block: 'center' });
                    await sleep(BATCH_CONFIG.expandDelay[0], BATCH_CONFIG.expandDelay[1]);
                    el.click();
                    expandCount++;
                    foundInRound++;
                    await sleep(BATCH_CONFIG.expandDelay[0], BATCH_CONFIG.expandDelay[1]);

                    // 如果已收集足够评论，提前退出
                    if (comments.length >= BATCH_CONFIG.commentsPerBatch) {
                        break;
                    }
                }
            }

            console.log(`[小红书分批提取器] 第${round + 1}轮展开: ${foundInRound}个`);

            if (foundInRound === 0) {
                await sleep(500, 1000);
                const remainingBtns = Array.from(document.querySelectorAll('button, div, span, a, p'))
                    .filter(el => {
                        const text = el.textContent.trim();
                        return (/^展开\d+条回复/.test(text) || text === '查看更多回复') && el.offsetParent !== null;
                    });
                if (remainingBtns.length === 0) break;
            }

            if (comments.length >= BATCH_CONFIG.commentsPerBatch) break;
        }

        console.log('[小红书分批提取器] 总共展开:', expandCount, '个楼中楼');
        await sleep(1500, 2500);

        // 滚动加载（限制次数）
        console.log('[小红书分批提取器] 开始滚动加载...');
        for (let i = 0; i < BATCH_CONFIG.maxScrollCount; i++) {
            if (isContainerScroll && commentContainer) {
                commentContainer.scrollTop = commentContainer.scrollHeight;
            } else {
                window.scrollTo(0, document.body.scrollHeight);
            }
            await sleep(BATCH_CONFIG.scrollDelay[0], BATCH_CONFIG.scrollDelay[1]);

            // 点击加载更多按钮
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

            // 提取当前可见的评论
            const currentComments = extractVisibleComments(seenContents);
            comments.push(...currentComments);

            console.log(`[小红书分批提取器] 第${i + 1}次滚动后，本批累计: ${comments.length}条`);

            if (comments.length >= BATCH_CONFIG.commentsPerBatch) {
                console.log('[小红书分批提取器] 已达到本批目标数量，停止滚动');
                break;
            }
        }

        console.log('[小红书分批提取器] 本批提取完成:', comments.length, '条');
        return comments;
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
                if (elements.length > 3) {
                    commentElements = elements;
                    break;
                }
            } catch (e) {}
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

                if (!author) author = '未知用户';

                // 提取内容
                let content = '';
                const allText = el.textContent;

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

    // 合并并导出
    function mergeAndExport() {
        const stored = getStoredData();

        if (!stored.batches || stored.batches.length === 0) {
            showToast('❌ 没有已保存的数据，请先提取', true);
            return;
        }

        // 合并所有评论
        const allComments = [];
        const seenKeys = new Set();

        stored.batches.forEach(batch => {
            batch.comments.forEach(comment => {
                const key = `${comment.author}:${comment.content.slice(0, 30)}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    allComments.push(comment);
                }
            });
        });

        // 排序
        const sortedComments = allComments.sort((a, b) => b.likes - a.likes);

        // 组装最终数据
        const finalData = {
            ...stored.postData,
            commentList: sortedComments.slice(0, 500),
            extractInfo: {
                batchCount: stored.batches.length,
                totalComments: sortedComments.length,
                finalExtractTime: new Date().toISOString()
            }
        };

        // 导出
        const jsonStr = JSON.stringify(finalData, null, 2);
        GM_setClipboard(jsonStr);

        // 打开分析工具
        const encodedData = encodeURIComponent(jsonStr);
        const analysisUrl = `https://centertea.github.io/xhs-analytics/#/post-analysis?data=${encodedData}`;
        GM_openInTab(analysisUrl, { active: true });

        showToast(`✅ 已导出 ${sortedComments.length} 条评论！`);

        // 可选：导出后清空数据
        setTimeout(() => {
            if (confirm('数据已导出，是否清空本地存储的数据？')) {
                clearStoredData();
            }
        }, 2000);
    }

    // 显示提示
    function showToast(message, isError = false) {
        const existing = document.getElementById('xhs-batch-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'xhs-batch-toast';
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
                '点赞': [/["']likedCount["']\s*:\s*(\d+)/, /["']likeCount["']\s*:\s*["']?(\d+)["']?/],
                '收藏': [/["']collectedCount["']\s*:\s*(\d+)/, /["']collectCount["']\s*:\s*["']?(\d+)["']?/],
                '评论': [/["']commentCount["']\s*:\s*(\d+)/],
                '分享': [/["']shareCount["']\s*:\s*(\d+)/]
            };

            if (patterns[type]) {
                for (const pattern of patterns[type]) {
                    const match = text.match(pattern);
                    if (match) {
                        const val = parseInt(match[1]) || 0;
                        if (val > 0 && val < 10000000) {
                            count = Math.max(count, val);
                        }
                    }
                }
            }
        }

        return count;
    }

    function extractPostTime() {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent;
            const match = text.match(/["']createTime["']:["']([^"']+)["']/);
            if (match) {
                return match[1];
            }
        }
        return '';
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
