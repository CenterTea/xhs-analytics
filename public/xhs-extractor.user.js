// ==UserScript==
// @name         小红书帖子数据提取器
// @namespace    http://tampermonkey.net/
// @version      1.1
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
        console.log('[小红书数据提取器] ✅ 按钮已创建');
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
            transition: all 0.3s;
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
            // 如果body还不存在，等待DOM加载
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
            // 移除旧按钮
            const oldBtn = document.getElementById('xhs-analyzer-btn');
            if (oldBtn) oldBtn.remove();
            // 延迟重新初始化
            setTimeout(init, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

    async function extractData() {
        try {
            // 显示开始提取提示
            showToast('🚀 开始提取数据，正在滚动加载评论...');

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

            // 提取评论（自动滚动加载，最多500条）
            const comments = await extractComments();
            data.commentList = comments;

            // 复制到剪贴板
            const jsonStr = JSON.stringify(data, null, 2);
            GM_setClipboard(jsonStr);

            // 显示提示
            showToast('✅ 数据已提取并复制到剪贴板！正在打开分析工具...');

            // 打开分析工具并传递数据
            const encodedData = encodeURIComponent(jsonStr);
            const analysisUrl = `https://centertea.github.io/xhs-analytics/#/post-analysis?data=${encodedData}`;

            setTimeout(() => {
                GM_openInTab(analysisUrl, { active: true });
            }, 1500);

        } catch (error) {
            showToast('❌ 提取失败：' + error.message, true);
            console.error('提取错误:', error);
        }
    }

    function extractTitle() {
        // 尝试多种选择器
        const selectors = [
            'h1.title',
            '[class*="title"]',
            'h1',
            '.note-content h1',
            '[data-testid="note-title"]'
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim()) {
                return el.textContent.trim();
            }
        }
        return document.title.replace(' - 小红书', '');
    }

    function extractContent() {
        const selectors = [
            '.note-content .desc',
            '[class*="desc"]',
            '.content',
            '.note-text',
            'article'
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim()) {
                return el.textContent.trim();
            }
        }
        return '';
    }

    function extractAuthor() {
        const selectors = [
            '.author-name',
            '[class*="author"]',
            '.user-name',
            '.nickname'
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim()) {
                return el.textContent.trim();
            }
        }
        return '';
    }

    function extractCount(type) {
        // 通过文本内容查找
        const elements = document.querySelectorAll('span, div, button');
        for (const el of elements) {
            const text = el.textContent;
            if (text.includes(type)) {
                // 提取数字
                const match = text.match(/(\d+\.?\d*)/);
                if (match) {
                    return parseInt(match[1]);
                }
            }
        }
        return 0;
    }

    function extractPostTime() {
        const timeEl = document.querySelector('.time, [class*="time"], .publish-time');
        if (timeEl) {
            return timeEl.textContent.trim();
        }
        return '';
    }

    async function extractComments() {
        const comments = [];
        const seenContents = new Set(); // 去重

        // 自动滚动加载更多评论，最多加载500条
        const maxComments = 500;
        const scrollAttempts = 20; // 最多滚动20次

        for (let i = 0; i < scrollAttempts && comments.length < maxComments; i++) {
            // 获取当前可见的评论
            const commentElements = document.querySelectorAll('.comment-item, [class*="comment"], .reply-item, [class*="note-comment"]');

            commentElements.forEach(el => {
                const contentEl = el.querySelector('.content, .text, [class*="content"], [class*="text"]');
                const authorEl = el.querySelector('.username, .name, [class*="user"], [class*="nickname"]');
                const likesEl = el.querySelector('.like-count, [class*="like"], [class*="liked"]');

                if (contentEl) {
                    const content = contentEl.textContent.trim();
                    const author = authorEl ? authorEl.textContent.trim() : '匿名';

                    // 去重检查
                    const uniqueKey = `${author}:${content.slice(0, 50)}`;
                    if (content && !seenContents.has(uniqueKey)) {
                        seenContents.add(uniqueKey);

                        // 提取点赞数
                        let likes = 0;
                        if (likesEl) {
                            const likeText = likesEl.textContent;
                            const likeMatch = likeText.match(/(\d+)/);
                            if (likeMatch) likes = parseInt(likeMatch[1]);
                        }

                        comments.push({
                            author,
                            content,
                            likes
                        });
                    }
                }
            });

            // 如果已经获取足够，停止滚动
            if (comments.length >= maxComments) break;

            // 滚动到页面底部加载更多评论
            const commentSection = document.querySelector('.comments-section, [class*="comment-list"], [class*="note-comment"]');
            if (commentSection) {
                commentSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else {
                window.scrollTo(0, document.body.scrollHeight);
            }

            // 等待加载
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // 按点赞数排序，取前500条
        return comments
            .sort((a, b) => b.likes - a.likes)
            .slice(0, maxComments);
    }

    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${isError ? '#ff4444' : '#00c853'};
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            z-index: 9999999;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
})();
