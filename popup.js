// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadBtn');
    const status = document.getElementById('status');

    downloadBtn.addEventListener('click', function() {
        downloadBtn.disabled = true;
        status.textContent = 'Downloading...';
        status.style.color = '#666';

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const currentTab = tabs[0];
            chrome.tabs.sendMessage(currentTab.id, { action: "download_markdown" }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Download failed.';
                    status.style.color = '#ea4335';
                    console.error(chrome.runtime.lastError.message);
                } else if (response && response.success) {
                    status.textContent = 'Download successful!';
                    status.style.color = '#34a853';
                    setTimeout(() => window.close(), 1500);
                } else {
                    status.textContent = response.error || 'Download failed.';
                    status.style.color = '#ea4335';
                }
                downloadBtn.disabled = false;
            });
        });
    });
});