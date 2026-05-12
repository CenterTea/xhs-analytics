// ==UserScript==
// @name         小红书帖子数据提取器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  提取小红书帖子数据并发送到数据分析工具
// @author       You
// @match        https://www.xiaohongshu.com/explore/*
// @match        https://www.xiaohongshu.com/user/profile/*
// @grant        GM_openInTab
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // 创建浮动按钮
    const button = document.createElement('div');
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
        z-index: 999999;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(255, 36, 66, 0.3);
        transition: all 0.3s;
    `;
    button.onmouseover = () => button.style.transform = 'scale(1.05)';
    button.onmouseout = () => button.style.transform = 'scale(1)';
    button.onclick = extractData;
    document.body.appendChild(button);

    function extractData() {
        try {
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

            // 提取评论（需要滚动加载更多）
            const comments = extractComments();
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

    function extractComments() {
        const comments = [];
        const commentElements = document.querySelectorAll('.comment-item, [class*="comment"], .reply-item');

        commentElements.forEach(el => {
            const content = el.querySelector('.content, .text, [class*="content"]');
            const author = el.querySelector('.username, .name, [class*="user"]');
            const likes = el.querySelector('.like-count, [class*="like"]');

            if (content && content.textContent.trim()) {
                comments.push({
                    author: author ? author.textContent.trim() : '',
                    content: content.textContent.trim(),
                    likes: likes ? parseInt(likes.textContent) || 0 : 0
                });
            }
        });

        return comments.slice(0, 50); // 最多取50条
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

    console.log('✅ 小红书数据提取器已加载');
})();
