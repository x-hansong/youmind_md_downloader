// content.js for YouMind Markdown Downloader

(function() {
    'use strict';

    const LOG_PREFIX = '[YOUMIND-MD]';

    console.log(`${LOG_PREFIX} Script loaded.`);

    // Initialize TurndownService
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        fence: '```',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined',
        linkReferenceStyle: 'full'
    });

    function sanitizeFilename(title) {
        const invalidChars = ['\\', '/', ':', '* ', '?', '"', '<', '>', '|'];
        let sanitizedTitle = title;
        for (const char of invalidChars) {
            sanitizedTitle = sanitizedTitle.split(char).join('_');
        }
        return sanitizedTitle.trim() || 'downloaded-content';
    }

    function extractContentAsMarkdown() {
        console.log(`${LOG_PREFIX} Extracting content.`);

        const selector = 'body > main > div > div > div:nth-child(1) > div';
        const contentElement = document.querySelector(selector);

        if (!contentElement) {
            console.error(`${LOG_PREFIX} Content element not found with selector: ${selector}`);
            return null;
        }

        const title = document.title;
        const htmlContent = contentElement.innerHTML;
        const markdownContent = turndownService.turndown(htmlContent);

        return { title, content: markdownContent };
    }

    function downloadMarkdown() {
        console.log(`${LOG_PREFIX} Download command received.`);

        const result = extractContentAsMarkdown();
        if (!result) {
            return { success: false, error: 'Content not found.' };
        }

        const { title, content } = result;
        const filename = sanitizeFilename(title) + '.md';
        console.log(`${LOG_PREFIX} Filename: ${filename}`);

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`${LOG_PREFIX} Download triggered successfully.`);
        return { success: true };
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "download_markdown") {
            const result = downloadMarkdown();
            sendResponse(result);
        }
        return true;
    });

})();