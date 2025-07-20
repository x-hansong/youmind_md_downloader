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
    }).use(TurndownPluginGfmService.gfm);

    // Add a custom rule for YouMind's specific code block structure.
    turndownService.addRule('youmindCodeBlock', {
        filter: function (node, options) {
            return (
                node.nodeName === 'DIV' &&
                node.classList.contains('react-renderer') &&
                node.classList.contains('node-codeBlock')
            );
        },
        replacement: function (content, node, options) {
            const langElement = node.querySelector('.language-display span');
            let language = '';
            if (langElement) {
                language = langElement.textContent.toLowerCase().replace(/\s/g, '');
            }

            const codeElement = node.querySelector('pre');
            const code = codeElement ? codeElement.textContent : '';

            return '\n\n' + options.fence + language + '\n' + code + '\n' + options.fence + '\n\n';
        }
    });

    // Add a custom rule for images to remove the alt text.
    turndownService.addRule('image', {
        filter: 'img',
        replacement: function (content, node) {
            const src = node.getAttribute('src') || '';
            return '![](' + src + ')';
        }
    });

    // Add a custom rule to create tight lists by handling <p> inside <li>.
    turndownService.addRule('tightLists', {
        filter: function (node, options) {
            return (
                node.nodeName === 'P' &&
                node.parentNode.nodeName === 'LI'
            );
        },
        replacement: function (content) {
            return content;
        }
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
        } else if (request.action === "get_markdown_content") {
            const result = extractContentAsMarkdown();
            if (result) {
                sendResponse({ success: true, content: result.content });
            } else {
                sendResponse({ success: false, error: 'Content not found.' });
            }
        }
        return true;
    });

})();