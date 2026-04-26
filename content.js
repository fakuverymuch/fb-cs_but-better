(function() {
    function loadSettingsAndInject() {
        chrome.storage.local.get('fbcs_settings', (result) => {
            const settings = result.fbcs_settings || {};
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('inject.js');
            script.onload = () => {
                window.postMessage({ type: 'FBCS_SETTINGS', settings }, '*');
                script.remove();
            };
            (document.head || document.documentElement).appendChild(script);
        });
    }

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'UPDATE_SETTINGS') {
            window.postMessage({ type: 'FBCS_SETTINGS', settings: msg.settings }, '*');
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSettingsAndInject);
    } else {
        loadSettingsAndInject();
    }
})();