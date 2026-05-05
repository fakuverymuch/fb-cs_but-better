(function () {
    if (window.__fbcsCore) return;
    window.__fbcsCore = { debug: false };

    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function (...args) {
        const ws = new OriginalWebSocket(...args);
        ws.addEventListener('message', function (event) {
            if (typeof event.data !== 'string') return;
            if (!event.data.startsWith('42')) return;
            try {
                const parsed = JSON.parse(event.data.substring(2));
                window.postMessage({ type: 'FBCS_WS_MESSAGE', data: parsed }, '*');
            } catch (e) {}
        });
        return ws;
    };
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    window.WebSocket.prototype = OriginalWebSocket.prototype;

    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    const style = document.createElement('style');
    style.textContent = `
.fbcs-badge {
    position: absolute;
    z-index: 50;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 600;
    white-space: nowrap;
    text-align: center;
}
.fbcs-sid-badge {
    top: 6px;
    right: 6px;
    padding: 3px 8px;
    font-size: 13px;
    border-radius: 6px;
    background: #95a5a6;
    color: #fff;
}
.fbcs-float-badge {
    bottom: 6px;
    right: 6px;
    padding: 3px 6px;
    font-size: 12px;
    border-radius: 6px;
    background: #34495e;
    color: #fff;
}
.fbcs-id-badge {
    top: 6px;
    left: 6px;
    padding: 3px 6px;
    font-size: 13px;
    border-radius: 6px;
    background: #9b59b6;
    color: #fff;
}
.fbcs-st-badge {
    top: 33px;
    right: 6px;
    width: 24px;
    height: 24px;
    padding: 0;
    font-size: 14px;
    line-height: 24px;
    text-align: center;
    border-radius: 50%;
    background: #e67e22;
    color: #fff;
}
.fbcs-st-badge.fbcs-st-no-float {
    bottom: 6px;
    right: 6px;
}
.fbcs-rare-glow-sid {
    animation: rareGlowSid 2s ease-in-out infinite;
}
.fbcs-rare-glow-id {
    animation: rareGlowId 2.5s ease-in-out infinite;
}
@keyframes rareGlowSid {
    0% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
    30% { box-shadow: 0 0 4px 2px var(--glow-color-sid, rgba(0,0,0,0.2)); }
    60% { box-shadow: 0 0 8px 4px var(--glow-color-sid, rgba(0,0,0,0.4)); }
    100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
}
@keyframes rareGlowId {
    0% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
    30% { box-shadow: 0 0 4px 2px var(--glow-color-id, rgba(0,0,0,0.2)); }
    60% { box-shadow: 0 0 8px 4px var(--glow-color-id, rgba(0,0,0,0.4)); }
    100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
}
body.fbcs-hide-hover .hoverContent {
    display: none !important;
}
.sc-jOdwRd .sc-cvlVIG {
    display: none !important;
}
`;

    function addStyles() {
        if (!document.head) {
            const observer = new MutationObserver(() => {
                if (document.head) {
                    observer.disconnect();
                    addStyles();
                }
            });
            observer.observe(document.documentElement, { childList: true });
            return;
        }
        document.head.appendChild(style);
    }
    addStyles();

    const floatMap = {1:'FN',2:'MW',3:'FT',4:'WW'};
    function normalizeItem(raw) {
        return {
            itemId: String(raw.itemId ?? raw.item_id ?? raw.id ?? ''),
            marketId: String(raw.id ?? ''),
            steamid: raw.steamid || '',
            weapon: raw.weapon || '',
            skin: raw.skin || '',
            rarity: raw.rarity,
            float: raw.float,
            floatName: floatMap[raw.float] || '',
            sid: raw.sid,
            price: raw.price,
            isStattrack: !!raw.isStattrack
        };
    }

    let settings = {
        enableSid: true,
        enableFloat: true,
        enableId: true,
        enableSt: true,
        sidShowAll: true,
        idShowAll: true,
        rareSids: [111, 222, 333, 444, 555, 666, 777, 888, 999],
        rareIdsThreshold: 10000,
        sidRareColor: '#2ecc71',
        sidNormalColor: '#95a5a6',
        sidRareAnimate: true,
        idRareColor: '#e67e22',
        idNormalColor: '#9b59b6',
        idRareAnimate: false,
        hideHoverContent: false,
        floatColors: {
            'FN': '#4cd964',
            'MW': '#ff9500',
            'FT': '#ff3b30',
            'WW': '#8e8e93'
        }
    };

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data.type === 'FBCS_SETTINGS') {
            settings = { ...settings, ...event.data.settings };
            applySettingsToBadges();
        }
        if (event.data.type === 'FBCS_WS_MESSAGE') {
            const parsed = event.data.data;
            if (parsed[0] !== 'marketUpdate') return;
            const { action, item } = parsed[1];
            applyWsAction(action, item);
        }
    });

    function applyWsAction(action, item) {
        if (activeTab === 'market') {
            if (action === 'ADD' || action === 'UPDATE') Storage.upsert(item);
            if (action === 'DELETE') Storage.remove(item);
        }
        if (activeTab === 'selling') {
            if (action === 'UPDATE') Storage.upsert(item);
            if (action === 'DELETE') Storage.remove(item);
        }
        if (activeTab === 'inventory') {
            if (action === 'ADD') Storage.remove(item);
        }
    }

    function applySettingsToBadges() {
        document.querySelectorAll('div.sc-jOdwRd').forEach(processCard);
        if (document.body) {
            if (settings.hideHoverContent) {
                document.body.classList.add('fbcs-hide-hover');
            } else {
                document.body.classList.remove('fbcs-hide-hover');
            }
        } else {
            const observer = new MutationObserver(() => {
                if (document.body) {
                    observer.disconnect();
                    applySettingsToBadges();
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
    }

    function detectActiveTab() {
        const url = location.pathname;
        if (url.includes('/profile/') && url.includes('/inventory')) return 'inventory';
        if (url.startsWith('/place')) {
            const active = document.querySelector('.sc-JfKsv.jVwgVQ');
            if (!active) return 'market';
            const t = active.textContent.trim();
            if (t === 'Покупка') return 'market';
            if (t === 'Продажа') return 'inventory';
            if (t === 'В продаже') return 'selling';
            if (t === 'История') return 'history';
        }
        return 'market';
    }

    let activeTab = detectActiveTab();

    const Storage = (() => {
        let items = [];
        let map = new Map();

        function setAll(rawItems) {
            const newItems = rawItems.map(normalizeItem);
            items = newItems;
            map.clear();
            newItems.forEach(i => map.set(i.itemId, i));
            notify();
        }

        function upsert(raw) {
            const incoming = normalizeItem(raw);
            const existing = map.get(incoming.itemId);
            if (existing) {
                for (const key in incoming) {
                    if (incoming[key] !== undefined && incoming[key] !== '') {
                        existing[key] = incoming[key];
                    }
                }
            } else {
                items.push(incoming);
                map.set(incoming.itemId, incoming);
            }
            notify();
        }

        function remove(raw) {
            const id = String(raw.itemId ?? raw.item_id ?? raw.id ?? '');
            if (!map.has(id)) return;
            map.delete(id);
            items = items.filter(i => i.itemId !== id);
            notify();
        }

        function clear() {
            items = [];
            map.clear();
            notify();
        }

        function get() { return items; }
        function getById(id) { return map.get(id); }
        function notify() { window.dispatchEvent(new CustomEvent('fbcs:update', { detail: items })); }

        return { setAll, upsert, remove, clear, get, getById };
    })();

    window.addEventListener('fbcs:update', () => {
        document.querySelectorAll('div.sc-jOdwRd').forEach(processCard);
    });

    function parseCard(card) {
        const weapon = card.querySelector('.sc-jbvGK')?.textContent.trim() || '';
        const skin = card.querySelector('.sc-ceBarN')?.childNodes[0]?.textContent.trim() || '';
        const price = parseInt(card.querySelector('.bLtkdH')?.textContent.replace(/\D/g,'')) || null;

        let itemId = null;
        let floatName = null;
        let sid = null;

        const spans = card.querySelectorAll('span');
        for (const s of spans) {
            const t = s.textContent;
            if (!itemId && t.includes('ID:')) itemId = t.split(':')[1].trim();
            if (!floatName && t.includes('FLOAT:')) floatName = t.split(':')[1].trim();
            if (!sid && t.includes('SID:')) sid = parseFloat(t.split(':')[1]);
        }

        return { weapon, skin, price, floatName, sid, itemId };
    }

    function matchItem(dom, storage) {
        if (dom.itemId) {
            const exact = Storage.getById(dom.itemId);
            if (exact) return exact;
        }

        let best = null;
        let bestScore = 0;
        for (const item of storage) {
            let score = 0;
            if (dom.weapon && item.weapon && dom.weapon === item.weapon) score += 3;
            if (dom.skin === item.skin) score += 3;
            if (dom.price && item.price && dom.price === item.price) score += 2;
            if (dom.floatName === item.floatName) score += 2;
            if (dom.sid !== null && dom.sid !== undefined && !isNaN(dom.sid) &&
                item.sid !== null && item.sid !== undefined &&
                dom.sid === item.sid) score += 6;
            if (score > bestScore) {
                bestScore = score;
                best = item;
            }
        }
        return bestScore >= 4 ? best : null;
    }

    function cleanupBadges(card) {
        card.querySelectorAll('.fbcs-badge').forEach(e => e.remove());
    }

    function resetAllBadges() {
        document.querySelectorAll('div.sc-jOdwRd').forEach(card => {
            cleanupBadges(card);
            card.__itemId = null;
            card.__hash = null;
        });
    }

    function formatSid(sid) {
        if (sid === undefined || sid === null) return '';
        const num = typeof sid === 'number' ? sid : parseFloat(sid);
        if (isNaN(num)) return '';
        const intVal = Math.round(num * 1000);
        return intVal.toString().padStart(3, '0');
    }

    function isSidRare(sid) {
        if (!sid && sid !== 0) return false;
        const intVal = Math.round(parseFloat(sid) * 1000);
        return settings.rareSids.includes(intVal);
    }

    function isIdRare(itemId) {
        const idNum = parseInt(itemId, 10);
        return !isNaN(idNum) && idNum < settings.rareIdsThreshold;
    }

    function renderBadges(card, item) {
        if (!item) return;

        if (card.__itemId && card.__itemId !== item.itemId) {
            cleanupBadges(card);
        }
        card.__itemId = item.itemId;
        card.style.position = 'relative';

        const isRareSid = isSidRare(item.sid);
        if (isRareSid && settings.sidRareAnimate) {
            card.classList.add('fbcs-rare-glow-sid');
            const color = settings.sidRareColor;
            const rgb = hexToRgb(color);
            card.style.setProperty('--glow-color-sid', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
            const delay = (parseInt(item.itemId, 10) % 20) * 0.1;
            card.style.animationDelay = `${delay}s`;
        } else {
            card.classList.remove('fbcs-rare-glow-sid');
            card.style.removeProperty('--glow-color-sid');
            card.style.removeProperty('animation-delay');
        }

        const isRareId = isIdRare(item.itemId);
        if (isRareId && settings.idRareAnimate) {
            card.classList.add('fbcs-rare-glow-id');
            const color = settings.idRareColor;
            const rgb = hexToRgb(color);
            card.style.setProperty('--glow-color-id', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
            const delay = (parseInt(item.itemId, 10) % 17) * 0.12;
            card.style.animationDelay = `${delay}s`;
        } else {
            card.classList.remove('fbcs-rare-glow-id');
            card.style.removeProperty('--glow-color-id');
        }

        if (settings.enableSid) {
            const sidFormatted = formatSid(item.sid);
            const shouldShow = settings.sidShowAll || (!settings.sidShowAll && isRareSid);
            if (sidFormatted && shouldShow) {
                let sidEl = card.querySelector('.fbcs-sid-badge');
                if (!sidEl) {
                    sidEl = document.createElement('div');
                    sidEl.className = 'fbcs-sid-badge fbcs-badge';
                    card.appendChild(sidEl);
                }
                sidEl.textContent = sidFormatted;
                sidEl.style.background = isRareSid ? settings.sidRareColor : settings.sidNormalColor;
            } else {
                card.querySelector('.fbcs-sid-badge')?.remove();
            }
        } else {
            card.querySelector('.fbcs-sid-badge')?.remove();
        }

        let hasFloat = false;
        if (settings.enableFloat && item.floatName) {
            hasFloat = true;
            let floatEl = card.querySelector('.fbcs-float-badge');
            if (!floatEl) {
                floatEl = document.createElement('div');
                floatEl.className = 'fbcs-float-badge fbcs-badge';
                card.appendChild(floatEl);
            }
            floatEl.textContent = item.floatName;
            floatEl.style.background = settings.floatColors[item.floatName] || '#34495e';
        } else {
            card.querySelector('.fbcs-float-badge')?.remove();
        }

        if (settings.enableSt && item.isStattrack) {
            let stEl = card.querySelector('.fbcs-st-badge');
            if (!stEl) {
                stEl = document.createElement('div');
                stEl.className = 'fbcs-st-badge fbcs-badge';
                card.appendChild(stEl);
            }
            stEl.textContent = '★';
            if (hasFloat) {
                stEl.classList.remove('fbcs-st-no-float');
            } else {
                stEl.classList.add('fbcs-st-no-float');
            }
        } else {
            card.querySelector('.fbcs-st-badge')?.remove();
        }

        if (settings.enableId && item.itemId) {
            const isRareIdLocal = isIdRare(item.itemId);
            const shouldShow = settings.idShowAll || (!settings.idShowAll && isRareIdLocal);
            if (shouldShow) {
                let idEl = card.querySelector('.fbcs-id-badge');
                if (!idEl) {
                    idEl = document.createElement('div');
                    idEl.className = 'fbcs-id-badge fbcs-badge';
                    card.appendChild(idEl);
                }
                idEl.textContent = item.itemId;
                idEl.style.background = isRareIdLocal ? settings.idRareColor : settings.idNormalColor;
            } else {
                card.querySelector('.fbcs-id-badge')?.remove();
            }
        } else {
            card.querySelector('.fbcs-id-badge')?.remove();
        }
    }

    function processCard(card) {
        const hash = card.innerText;
        if (card.__hash === hash && card.__itemId) return;
        card.__hash = hash;

        const dom = parseCard(card);
        const item = matchItem(dom, Storage.get());
        renderBadges(card, item);
    }

    function startObserver() {
        if (!document.body) return;
        let redrawTimeout;
        const observer = new MutationObserver(() => {
            clearTimeout(redrawTimeout);
            redrawTimeout = setTimeout(() => {
                document.querySelectorAll('div.sc-jOdwRd').forEach(card => {
                    card.dataset.fbcsProcessed = '0';
                    processCard(card);
                });
            }, 50);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll('div.sc-jOdwRd').forEach(card => {
            card.dataset.fbcsProcessed = '0';
            processCard(card);
        });
    }

    function extractItems(data) {
        if (!data) return null;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        if (data.data && Array.isArray(data.data.items)) return data.data.items;
        return null;
    }

    function handleApi(data, url) {
        const type =
            url.includes('/selling') ? 'selling' :
                url.includes('/history') ? 'history' :
                    url.includes('/inventory') ? 'inventory' :
                        url.includes('/market') ? 'market' : null;
        if (!type) return;

        const items = extractItems(data);
        if (!items) return;

        if (type === 'history') {
            resetAllBadges();
            Storage.clear();
            return;
        }

        if (type !== activeTab) return;

        if (type === 'selling' || type === 'inventory') {
            resetAllBadges();
            Storage.clear();
        }

        Storage.setAll(items);
    }

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const res = await origFetch.apply(this, args);
        let url = args[0];
        if (typeof url !== 'string') url = url.url;
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json') &&
            (url.includes('/market') || url.includes('/selling') || url.includes('/inventory') || url.includes('/history'))) {
            const clone = res.clone();
            clone.json().then(data => handleApi(data, url)).catch(() => {});
        }
        return res;
    };

    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function(method, url, ...rest) {
        this._url = url;
        return open.apply(this, [method, url, ...rest]);
    };

    XHR.send = function(...args) {
        this.addEventListener('load', () => {
            try {
                const ct = this.getResponseHeader('content-type') || '';
                if (!ct.includes('application/json')) return;
                let url = this._url;
                if (url && !url.startsWith('http')) url = 'https://api.fb-cs.ru' + url;
                const data = JSON.parse(this.responseText);
                handleApi(data, url);
            } catch {}
        });
        return send.apply(this, args);
    };

    function updateTab() {
        const newTab = detectActiveTab();
        if (newTab !== activeTab) {
            activeTab = newTab;
            resetAllBadges();
            Storage.clear();
        }
    }

    function waitForBody(cb) {
        if (document.body) return cb();
        const observer = new MutationObserver(() => {
            if (document.body) {
                observer.disconnect();
                cb();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const tabObserver = new MutationObserver(updateTab);
        tabObserver.observe(document.body, { childList: true, subtree: true });
        startObserver();
    });
})();
