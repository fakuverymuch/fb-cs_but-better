(() => {
    function sendSettings(settings) {
        window.postMessage({ type: 'FBCS_SETTINGS', settings }, '*');
    }

    chrome.storage.local.get('fbcs_settings', (result) => {
        sendSettings(result.fbcs_settings || {});
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'UPDATE_SETTINGS') {
            sendSettings(msg.settings);
        }
    });
})();

