document.addEventListener('DOMContentLoaded', () => {
    function loadSettings() {
        chrome.storage.local.get('fbcs_settings', (result) => {
            const s = result.fbcs_settings || {};
            document.getElementById('enableSid').checked = s.enableSid !== false;
            document.getElementById('enableId').checked = s.enableId !== false;
            document.getElementById('enableFloat').checked = s.enableFloat !== false;
            document.getElementById('enableSt').checked = s.enableSt !== false;

            // SID
            document.getElementById('sidShowAll').checked = s.sidShowAll !== false;
            document.getElementById('rareSids').value = (s.rareSids || []).join(',');
            document.getElementById('sidRareAnimate').checked = s.sidRareAnimate || false;
            document.getElementById('sidRareColor').value = s.sidRareColor || '#2ecc71';
            document.getElementById('sidNormalColor').value = s.sidNormalColor || '#95a5a6';

            // ID
            document.getElementById('idShowAll').checked = s.idShowAll !== false;
            document.getElementById('rareIdsThreshold').value = s.rareIdsThreshold || 10000;
            document.getElementById('idRareColor').value = s.idRareColor || '#e67e22';
            document.getElementById('idNormalColor').value = s.idNormalColor || '#9b59b6';
            document.getElementById('idRareAnimate').checked = s.idRareAnimate || false;

            // Float
            document.getElementById('floatShowAll').checked = s.floatShowAll !== false;
            document.getElementById('floatFN').value = s.floatColors?.FN || '#4cd964';
            document.getElementById('floatMW').value = s.floatColors?.MW || '#ff9500';
            document.getElementById('floatFT').value = s.floatColors?.FT || '#ff3b30';
            document.getElementById('floatWW').value = s.floatColors?.WW || '#8e8e93';


            document.getElementById('hideHoverContent').checked = s.hideHoverContent || false;
        });

    }

    document.getElementById('saveBtn').addEventListener('click', () => {
        const rareSidsStr = document.getElementById('rareSids').value;
        const rareSids = rareSidsStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

        const newSettings = {
            enableSid: document.getElementById('enableSid').checked,
            enableId: document.getElementById('enableId').checked,
            enableFloat: document.getElementById('enableFloat').checked,
            enableSt: document.getElementById('enableSt').checked,
            hideHoverContent: document.getElementById('hideHoverContent').checked,

            // SID
            sidShowAll: document.getElementById('sidShowAll').checked,
            rareSids,
            sidRareAnimate: document.getElementById('sidRareAnimate').checked,
            sidRareColor: document.getElementById('sidRareColor').value,
            sidNormalColor: document.getElementById('sidNormalColor').value,

            // ID
            idShowAll: document.getElementById('idShowAll').checked,
            rareIdsThreshold: parseInt(document.getElementById('rareIdsThreshold').value, 10) || 10000,
            idRareColor: document.getElementById('idRareColor').value,
            idNormalColor: document.getElementById('idNormalColor').value,
            idRareAnimate: document.getElementById('idRareAnimate').checked,

            // Float
            floatShowAll: document.getElementById('floatShowAll').checked,
            floatColors: {
                FN: document.getElementById('floatFN').value,
                MW: document.getElementById('floatMW').value,
                FT: document.getElementById('floatFT').value,
                WW: document.getElementById('floatWW').value,

            }


        };

        chrome.storage.local.set({ fbcs_settings: newSettings }, () => {
            document.getElementById('status').textContent = 'Сохранено!';
            setTimeout(() => document.getElementById('status').textContent = '', 1500);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_SETTINGS', settings: newSettings });
                }
            });
        });
    });

    loadSettings();
});
