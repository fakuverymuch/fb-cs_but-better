// ==UserScript==
// @name         FBCS-BB For MacOS
// @version      1.0
// @description  FB-CS But Better
// @author       fakuverymuch
// @match        *://*.fb-cs.ru/*
// @match        *://fb-cs.ru/*
// @inject-into  page
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    if (window.__fbcsFull) return;
    window.__fbcsFull = true;

    const DEFAULT_SETTINGS = {
        enableSid: true, enableFloat: true, enableId: true, enableSt: true,
        sidShowAll: true, idShowAll: true, floatShowAll: true,
        rareSids: [111, 222, 333, 444, 555, 666, 777, 888, 999],
        rareIdsThreshold: 10000,
        sidRareColor: '#2ecc71', sidNormalColor: '#95a5a6',
        sidRareAnimate: true,
        idRareColor: '#e67e22', idNormalColor: '#9b59b6',
        idRareAnimate: false,
        hideHoverContent: false,
        floatColors: {
            'FN': '#4cd964', 'MW': '#ff9500', 'FT': '#ff3b30',
            'WW': '#8e8e93', 'BS': '#5856d6'
        }
    };

    let settings = loadSettings();
    function loadSettings() {
        try {
            const saved = localStorage.getItem('fbcs_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_SETTINGS, ...parsed,
                    floatColors: { ...DEFAULT_SETTINGS.floatColors, ...(parsed.floatColors || {}) }
                };
            }
        } catch(e) {}
        return { ...DEFAULT_SETTINGS, floatColors: { ...DEFAULT_SETTINGS.floatColors } };
    }
    function saveSettings() {
        try { localStorage.setItem('fbcs_settings', JSON.stringify(settings)); } catch(e) {}
    }

    const style = document.createElement('style');
    style.textContent = `
        .fbcs-badge {
            position: absolute; z-index: 50; pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-weight: 600; white-space: nowrap; text-align: center;
        }
        .fbcs-sid-badge {
            top: 6px; right: 6px; padding: 3px 8px; font-size: 13px; border-radius: 6px;
            background: #95a5a6; color: #fff;
        }
        .fbcs-float-badge {
            bottom: 6px; right: 6px; padding: 3px 6px; font-size: 12px; border-radius: 6px;
            background: #34495e; color: #fff;
        }
        .fbcs-id-badge {
            top: 6px; left: 6px; padding: 3px 6px; font-size: 13px; border-radius: 6px;
            background: #9b59b6; color: #fff;
        }
        .fbcs-st-badge {
            top: 33px; right: 6px; width: 24px; height: 24px; padding: 0;
            font-size: 14px; line-height: 24px; text-align: center; border-radius: 50%;
            background: #e67e22; color: #fff;
        }
        .fbcs-st-badge.fbcs-st-no-float { bottom: 6px; right: 6px; }
        .fbcs-rare-glow-sid { animation: rareGlowSid 2s ease-in-out infinite; }
        .fbcs-rare-glow-id { animation: rareGlowId 2.5s ease-in-out infinite; }
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
        body.fbcs-hide-hover .hoverContent { display: none !important; }

        .fbcs-modal-overlay {
            position: fixed; top:0; left:0; right:0; bottom:0;
            background: rgba(0,0,0,0.6); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
            -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
        }
        .fbcs-modal-overlay.fbcs-visible { opacity: 1; pointer-events: auto; }
        .fbcs-modal {
            background: #1e1e2f; color: #eee; border-radius: 20px;
            max-height: 90vh; width: 92%; max-width: 500px; overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 20px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            position: relative; -webkit-overflow-scrolling: touch;
        }
        .fbcs-modal h2 { margin: 0 0 15px; font-size: 22px; text-align: center; }
        .fbcs-modal .fbcs-section { margin-bottom: 20px; }
        .fbcs-modal .fbcs-section-title {
            font-size: 16px; font-weight: 600; margin-bottom: 10px;
            border-bottom: 1px solid #444; padding-bottom: 4px;
        }
        .fbcs-modal .fbcs-row {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 10px; flex-wrap: wrap;
        }
        .fbcs-modal label { font-size: 14px; flex: 1; }
        .fbcs-modal input[type="checkbox"] { width: 20px; height: 20px; accent-color: #2ecc71; }
        .fbcs-modal input[type="color"] { width: 32px; height: 28px; border: none; background: transparent; }
        .fbcs-modal input[type="text"], .fbcs-modal input[type="number"] {
            background: #2a2a3c; border: 1px solid #555; color: #eee;
            border-radius: 8px; padding: 6px 8px; font-size: 14px; width: 120px;
        }
        .fbcs-modal .fbcs-hint { font-size: 11px; color: #aaa; margin-left: 8px; }
        .fbcs-modal .fbcs-color-preset {
            display: inline-block; width: 24px; height: 24px; border-radius: 50%;
            margin-right: 4px; vertical-align: middle; border: 1px solid #888;
        }
        .fbcs-modal .fbcs-buttons {
            display: flex; justify-content: space-between; margin-top: 20px; gap: 10px;
        }
        .fbcs-modal button {
            background: #2ecc71; border: none; color: #000; border-radius: 10px;
            padding: 10px 16px; font-weight: 600; font-size: 15px; cursor: pointer; flex: 1;
        }
        .fbcs-modal button.fbcs-close-btn { background: #555; color: #fff; }
        .fbcs-modal button:active { opacity: 0.8; }
    `;
    (document.head || document.documentElement).appendChild(style);

    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1],16), g: parseInt(result[2],16), b: parseInt(result[3],16) } : {r:0,g:0,b:0};
    }

    const floatMap = {1:'FN',2:'MW',3:'FT',4:'WW',5:'BS'};

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

    const Storage = (() => {
        let items = [];
        const map = new Map();
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
                Object.keys(incoming).forEach(k => { if (incoming[k] !== undefined && incoming[k] !== '') existing[k] = incoming[k]; });
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
        function clear() { items = []; map.clear(); notify(); }
        function get() { return items; }
        function getById(id) { return map.get(id); }
        function notify() { window.dispatchEvent(new CustomEvent('fbcs:storageUpdate', { detail: items })); }
        return { setAll, upsert, remove, clear, get, getById };
    })();

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
    let activeTab = 'market';

    function parseCard(card) {
        const weapon = card.querySelector('.sc-jbvGK')?.textContent.trim() || '';
        const skin = card.querySelector('.sc-ceBarN')?.childNodes[0]?.textContent.trim() || '';
        const price = parseInt(card.querySelector('.bLtkdH')?.textContent.replace(/\D/g,'')) || null;
        let itemId = null, floatName = null, sid = null, isStattrack = false;
        const spans = card.querySelectorAll('span');
        for (const s of spans) {
            const t = s.textContent.trim();
            if (!itemId && t.startsWith('ID:')) itemId = t.split(':')[1].trim();
            if (!floatName && t.includes('FLOAT:')) {
                const raw = t.split(':')[1].trim();
                const ru = {'Прямо с завода':'FN','Немного поношенное':'MW','После полевых испытаний':'FT','Поношенное':'WW','Закаленное в боях':'BS'};
                floatName = ru[raw] || raw;
            }
            if (!sid && t.includes('SID:')) sid = parseFloat(t.split(':')[1]);
            if (t === '★' || s.innerHTML.includes('★')) isStattrack = true;
        }
        return { weapon, skin, price, floatName, sid, itemId, isStattrack };
    }

    function matchItem(dom, storageItems) {
        if (dom.itemId) {
            const exact = Storage.getById(dom.itemId);
            if (exact) return exact;
        }
        let best = null, bestScore = 0;
        for (const item of storageItems) {
            let score = 0;
            if (dom.weapon && item.weapon && dom.weapon === item.weapon) score += 3;
            if (dom.skin === item.skin) score += 3;
            if (dom.price && item.price && dom.price === item.price) score += 2;
            if (dom.floatName && item.floatName && dom.floatName === item.floatName) score += 2;
            if (dom.sid !== null && dom.sid !== undefined && !isNaN(dom.sid) &&
                item.sid !== null && item.sid !== undefined &&
                Math.abs(dom.sid - item.sid) < 0.001) score += 6;
            if (score > bestScore) { bestScore = score; best = item; }
        }
        return bestScore >= 4 ? best : null;
    }

    function renderBadges(card, data) {
        card.querySelectorAll('.fbcs-badge').forEach(el => el.remove());
        card.classList.remove('fbcs-rare-glow-sid', 'fbcs-rare-glow-id');
        card.style.removeProperty('--glow-color-sid');
        card.style.removeProperty('--glow-color-id');
        card.style.removeProperty('animation-delay');
        if (!data) { card.style.position = ''; return; }
        card.style.position = 'relative';

        const rareSid = data.sid && settings.rareSids.includes(Math.round(data.sid * 1000));
        const rareId = data.itemId && parseInt(data.itemId,10) < settings.rareIdsThreshold;

        if (rareSid && settings.sidRareAnimate) {
            card.classList.add('fbcs-rare-glow-sid');
            const rgb = hexToRgb(settings.sidRareColor);
            card.style.setProperty('--glow-color-sid', `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
            card.style.animationDelay = (parseInt(data.itemId) % 20) * 0.1 + 's';
        }
        if (rareId && settings.idRareAnimate) {
            card.classList.add('fbcs-rare-glow-id');
            const rgb = hexToRgb(settings.idRareColor);
            card.style.setProperty('--glow-color-id', `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
            card.style.animationDelay = (parseInt(data.itemId) % 17) * 0.12 + 's';
        }


        if (settings.enableSid && data.sid != null) {
            const sidInt = Math.round(data.sid * 1000);
            const sidStr = sidInt.toString().padStart(3, '0');
            if ((settings.sidShowAll || rareSid) && sidStr) {
                const el = document.createElement('div');
                el.className = 'fbcs-sid-badge fbcs-badge';
                el.textContent = sidStr;
                el.style.background = rareSid ? settings.sidRareColor : settings.sidNormalColor;
                card.appendChild(el);
            }
        }

        let hasFloat = false;
        if (settings.enableFloat && data.floatName && settings.floatShowAll !== false) {
            hasFloat = true;
            const el = document.createElement('div');
            el.className = 'fbcs-float-badge fbcs-badge';
            el.textContent = data.floatName;
            el.style.background = settings.floatColors[data.floatName] || '#34495e';
            card.appendChild(el);
        }

        if (settings.enableSt && data.isStattrack) {
            const el = document.createElement('div');
            el.className = 'fbcs-st-badge fbcs-badge';
            el.textContent = '★';
            if (!hasFloat) el.classList.add('fbcs-st-no-float');
            card.appendChild(el);
        }

        if (settings.enableId && data.itemId) {
            if (settings.idShowAll || rareId) {
                const el = document.createElement('div');
                el.className = 'fbcs-id-badge fbcs-badge';
                el.textContent = data.itemId;
                el.style.background = rareId ? settings.idRareColor : settings.idNormalColor;
                card.appendChild(el);
            }
        }
    }

    function processCard(card) {
        if (card.dataset.fbcsProcessed === '1') return;
        card.dataset.fbcsProcessed = '1';

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
        if (type === 'history') { Storage.clear(); return; }
        if (type !== activeTab) return;
        if (type === 'selling' || type === 'inventory') Storage.clear();
        Storage.setAll(items);
    }

    const origFetch = window.fetch;
    window.fetch = async function(...args) {
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
    const origOpen = XHR.open;
    const origSend = XHR.send;
    XHR.open = function(method, url, ...rest) {
        this._url = url;
        return origOpen.apply(this, [method, url, ...rest]);
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
            } catch(e) {}
        });
        return origSend.apply(this, args);
    };

    const OrigWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
        const ws = new OrigWebSocket(...args);
        ws.addEventListener('message', (e) => {
            if (typeof e.data !== 'string' || !e.data.startsWith('42')) return;
            try {
                const parsed = JSON.parse(e.data.substring(2));
                if (parsed[0] !== 'marketUpdate') return;
                const { action, item } = parsed[1];
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
            } catch(e) {}
        });
        return ws;
    };
    window.WebSocket.prototype = OrigWebSocket.prototype;
    window.WebSocket.CONNECTING = OrigWebSocket.CONNECTING;
    window.WebSocket.OPEN = OrigWebSocket.OPEN;
    window.WebSocket.CLOSING = OrigWebSocket.CLOSING;
    window.WebSocket.CLOSED = OrigWebSocket.CLOSED;

    window.addEventListener('fbcs:storageUpdate', () => {
        document.querySelectorAll('div.sc-jOdwRd').forEach(card => {
            card.dataset.fbcsProcessed = '0';
            processCard(card);
        });
    });

    function createSettingsModal() {
        const existing = document.querySelector('.fbcs-modal-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.className = 'fbcs-modal-overlay';
        overlay.innerHTML = `
            <div class="fbcs-modal">
                <h2>Настройки отображения</h2>
                <div class="fbcs-section">
                    <div class="fbcs-section-title">Общие</div>
                    <div class="fbcs-row"><label>SID</label><input type="checkbox" id="fbcs-enableSid" ${settings.enableSid?'checked':''}></div>
                    <div class="fbcs-row"><label>ID</label><input type="checkbox" id="fbcs-enableId" ${settings.enableId?'checked':''}></div>
                    <div class="fbcs-row"><label>Float</label><input type="checkbox" id="fbcs-enableFloat" ${settings.enableFloat?'checked':''}></div>
                    <div class="fbcs-row"><label>StatTrak</label><input type="checkbox" id="fbcs-enableSt" ${settings.enableSt?'checked':''}></div>
                    <div class="fbcs-row"><label>Скрывать hover</label><input type="checkbox" id="fbcs-hideHover" ${settings.hideHoverContent?'checked':''}></div>
                </div>
                <div class="fbcs-section">
                    <div class="fbcs-section-title">SID</div>
                    <div class="fbcs-row"><label>Все SID</label><input type="checkbox" id="fbcs-sidShowAll" ${settings.sidShowAll?'checked':''}></div>
                    <div class="fbcs-row"><label>Редкие SID</label><input type="text" id="fbcs-rareSids" value="${settings.rareSids.join(',')}"></div>
                    <div class="fbcs-row"><label>Цвет редкого</label><input type="color" id="fbcs-sidRareColor" value="${settings.sidRareColor}"></div>
                    <div class="fbcs-row"><label>Цвет обычного</label><input type="color" id="fbcs-sidNormalColor" value="${settings.sidNormalColor}"></div>
                    <div class="fbcs-row"><label>Анимация редких</label><input type="checkbox" id="fbcs-sidRareAnimate" ${settings.sidRareAnimate?'checked':''}></div>
                </div>
                <div class="fbcs-section">
                    <div class="fbcs-section-title">ID</div>
                    <div class="fbcs-row"><label>Все ID</label><input type="checkbox" id="fbcs-idShowAll" ${settings.idShowAll?'checked':''}></div>
                    <div class="fbcs-row"><label>Порог редкого</label><input type="number" id="fbcs-rareIdsThreshold" value="${settings.rareIdsThreshold}"></div>
                    <div class="fbcs-row"><label>Цвет редкого</label><input type="color" id="fbcs-idRareColor" value="${settings.idRareColor}"></div>
                    <div class="fbcs-row"><label>Цвет обычного</label><input type="color" id="fbcs-idNormalColor" value="${settings.idNormalColor}"></div>
                    <div class="fbcs-row"><label>Анимация редких</label><input type="checkbox" id="fbcs-idRareAnimate" ${settings.idRareAnimate?'checked':''}></div>
                </div>
                <div class="fbcs-section">
                    <div class="fbcs-section-title">Float</div>
                    <div class="fbcs-row"><label>Показывать</label><input type="checkbox" id="fbcs-floatShowAll" ${settings.floatShowAll!==false?'checked':''}></div>
                    <div class="fbcs-row"><label><span class="fbcs-color-preset" style="background:${settings.floatColors['FN']}"></span>FN</label><input type="color" id="fbcs-floatFN" value="${settings.floatColors['FN']}"></div>
                    <div class="fbcs-row"><label><span class="fbcs-color-preset" style="background:${settings.floatColors['MW']}"></span>MW</label><input type="color" id="fbcs-floatMW" value="${settings.floatColors['MW']}"></div>
                    <div class="fbcs-row"><label><span class="fbcs-color-preset" style="background:${settings.floatColors['FT']}"></span>FT</label><input type="color" id="fbcs-floatFT" value="${settings.floatColors['FT']}"></div>
                    <div class="fbcs-row"><label><span class="fbcs-color-preset" style="background:${settings.floatColors['WW']}"></span>WW</label><input type="color" id="fbcs-floatWW" value="${settings.floatColors['WW']}"></div>
                </div>
                <div class="fbcs-buttons">
                    <button class="fbcs-close-btn" id="fbcs-close-modal">Отмена</button>
                    <button id="fbcs-save-modal">Сохранить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('fbcs-close-modal').addEventListener('click', closeModal);
        document.getElementById('fbcs-save-modal').addEventListener('click', () => {
            readModalValues();
            saveSettings();
            applySettingsToAll();
            closeModal();
        });
        requestAnimationFrame(() => overlay.classList.add('fbcs-visible'));
    }

    function closeModal() {
        const overlay = document.querySelector('.fbcs-modal-overlay');
        if (overlay) {
            overlay.classList.remove('fbcs-visible');
            setTimeout(() => overlay.remove(), 300);
        }
        if (window.location.hash === '#nastroyki') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    function readModalValues() {
        settings.enableSid = document.getElementById('fbcs-enableSid').checked;
        settings.enableId = document.getElementById('fbcs-enableId').checked;
        settings.enableFloat = document.getElementById('fbcs-enableFloat').checked;
        settings.enableSt = document.getElementById('fbcs-enableSt').checked;
        settings.hideHoverContent = document.getElementById('fbcs-hideHover').checked;
        settings.sidShowAll = document.getElementById('fbcs-sidShowAll').checked;
        settings.rareSids = document.getElementById('fbcs-rareSids').value.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n));
        settings.sidRareColor = document.getElementById('fbcs-sidRareColor').value;
        settings.sidNormalColor = document.getElementById('fbcs-sidNormalColor').value;
        settings.sidRareAnimate = document.getElementById('fbcs-sidRareAnimate').checked;
        settings.idShowAll = document.getElementById('fbcs-idShowAll').checked;
        settings.rareIdsThreshold = parseInt(document.getElementById('fbcs-rareIdsThreshold').value,10)||10000;
        settings.idRareColor = document.getElementById('fbcs-idRareColor').value;
        settings.idNormalColor = document.getElementById('fbcs-idNormalColor').value;
        settings.idRareAnimate = document.getElementById('fbcs-idRareAnimate').checked;
        settings.floatShowAll = document.getElementById('fbcs-floatShowAll').checked;
        settings.floatColors['FN'] = document.getElementById('fbcs-floatFN').value;
        settings.floatColors['MW'] = document.getElementById('fbcs-floatMW').value;
        settings.floatColors['FT'] = document.getElementById('fbcs-floatFT').value;
        settings.floatColors['WW'] = document.getElementById('fbcs-floatWW').value;
    }

    function applySettingsToAll() {
        if (settings.hideHoverContent) {
            document.body.classList.add('fbcs-hide-hover');
        } else {
            document.body.classList.remove('fbcs-hide-hover');
        }
        document.querySelectorAll('div.sc-jOdwRd').forEach(card => {
            card.dataset.fbcsProcessed = '0';
            processCard(card);
        });
    }

    function checkHash() {
        if (window.location.hash === '#nastroyki') {
            if (!document.querySelector('.fbcs-modal-overlay')) createSettingsModal();
        } else {
            const overlay = document.querySelector('.fbcs-modal-overlay');
            if (overlay) { overlay.classList.remove('fbcs-visible'); setTimeout(() => overlay.remove(), 300); }
        }
    }
    window.addEventListener('hashchange', checkHash);

    function updateTab() {
        const newTab = detectActiveTab();
        if (newTab !== activeTab) {
            activeTab = newTab;
            Storage.clear();
            document.querySelectorAll('div.sc-jOdwRd').forEach(card => {
                card.dataset.fbcsProcessed = '0';
                processCard(card);
            });
        }
    }

    function init() {
        startObserver();
        applySettingsToAll();
        checkHash();
        new MutationObserver(updateTab).observe(document.body, { childList: true, subtree: true });
        updateTab();
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
