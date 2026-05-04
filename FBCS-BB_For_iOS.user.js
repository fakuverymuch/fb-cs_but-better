// ==UserScript==
// @name         FBCS-BB For iOS
// @version      1.0
// @description  SID, Float, ID, StatTrak на карточках fb-cs.ru с настройками через #fbcs-settings
// @author       fakuverymuch
// @match        *://*.fb-cs.ru/*
// @match        *://fb-cs.ru/*
// @inject-into  content
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const DEFAULT_SETTINGS = {
        enableSid: true,
        enableFloat: true,
        enableId: true,
        enableSt: true,
        sidShowAll: true,
        idShowAll: true,
        floatShowAll: true,
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
            'WW': '#8e8e93',
            'BS': '#5856d6'
        }
    };

    let settings = loadSettings();

    function loadSettings() {
        try {
            const saved = localStorage.getItem('fbcs_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_SETTINGS, ...parsed, floatColors: { ...DEFAULT_SETTINGS.floatColors, ...(parsed.floatColors || {}) } };
            }
        } catch (e) {}
        return { ...DEFAULT_SETTINGS, floatColors: { ...DEFAULT_SETTINGS.floatColors } };
    }

    function saveSettings() {
        try {
            localStorage.setItem('fbcs_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    const style = document.createElement('style');
    style.textContent = `
        /* Бейджи */
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

        /* Модальное окно настроек */
        .fbcs-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
        }
        .fbcs-modal-overlay.fbcs-visible {
            opacity: 1;
            pointer-events: auto;
        }
        .fbcs-modal {
            background: #1e1e2f;
            color: #eee;
            border-radius: 20px;
            max-height: 90vh;
            width: 92%;
            max-width: 500px;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            padding: 20px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            position: relative;
            -webkit-overflow-scrolling: touch;
        }
        .fbcs-modal h2 {
            margin: 0 0 15px;
            font-size: 22px;
            text-align: center;
            color: #fff;
        }
        .fbcs-modal .fbcs-section {
            margin-bottom: 20px;
        }
        .fbcs-modal .fbcs-section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            border-bottom: 1px solid #444;
            padding-bottom: 4px;
        }
        .fbcs-modal .fbcs-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        .fbcs-modal label {
            font-size: 14px;
            flex: 1;
        }
        .fbcs-modal input[type="checkbox"] {
            width: 20px;
            height: 20px;
            accent-color: #2ecc71;
        }
        .fbcs-modal input[type="color"] {
            width: 32px;
            height: 28px;
            border: none;
            background: transparent;
            padding: 0;
            border-radius: 4px;
        }
        .fbcs-modal input[type="text"],
        .fbcs-modal input[type="number"] {
            background: #2a2a3c;
            border: 1px solid #555;
            color: #eee;
            border-radius: 8px;
            padding: 6px 8px;
            font-size: 14px;
            width: 120px;
            box-sizing: border-box;
        }
        .fbcs-modal .fbcs-hint {
            font-size: 11px;
            color: #aaa;
            margin-left: 8px;
        }
        .fbcs-modal .fbcs-color-preset {
            display: inline-block;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            margin-right: 4px;
            vertical-align: middle;
            border: 1px solid #888;
        }
        .fbcs-modal .fbcs-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            gap: 10px;
        }
        .fbcs-modal button {
            background: #2ecc71;
            border: none;
            color: #000;
            border-radius: 10px;
            padding: 10px 16px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            flex: 1;
        }
        .fbcs-modal button.fbcs-close-btn {
            background: #555;
            color: #fff;
        }
        .fbcs-modal button:active {
            opacity: 0.8;
        }
        /* Адаптация под iPhone с челкой */
        @supports (padding-top: env(safe-area-inset-top)) {
            .fbcs-modal {
                margin-top: env(safe-area-inset-top);
                margin-bottom: env(safe-area-inset-bottom);
            }
        }
    `;
    (document.head || document.documentElement).appendChild(style);

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

    function parseFloatFromDom(rawText) {
        const map = {
            'Прямо с завода': 'FN',
            'Немного поношенное': 'MW',
            'После полевых испытаний': 'FT',
            'Поношенное': 'WW',
            'Закаленное в боях': 'BS'
        };
        return map[rawText.trim()] || rawText.trim();
    }

    function parseSid(rawText) {
        const num = parseFloat(rawText);
        return isNaN(num) ? null : Math.round(num * 1000);
    }

    function isSidRare(sid) {
        if (!sid && sid !== 0) return false;
        return settings.rareSids.includes(sid);
    }

    function isIdRare(itemId) {
        const idNum = parseInt(itemId, 10);
        return !isNaN(idNum) && idNum < settings.rareIdsThreshold;
    }

    function formatSid(sid) {
        if (sid === undefined || sid === null) return '';
        return sid.toString().padStart(3, '0');
    }

    function parseCard(card) {
        const weaponEl = card.querySelector('.sc-jbvGK');
        const skinEl = card.querySelector('.sc-ceBarN');
        const priceEl = card.querySelector('.bLtkdH');

        const weapon = weaponEl ? weaponEl.textContent.trim() : '';
        const skin = skinEl ? skinEl.childNodes[0]?.textContent.trim() || '' : '';
        const price = priceEl ? parseInt(priceEl.textContent.replace(/\D/g, '')) || null : null;

        let itemId = null;
        let floatName = null;
        let sid = null;
        let isStattrack = false;

        const spans = card.querySelectorAll('span');
        for (const span of spans) {
            const text = span.textContent.trim();
            if (!itemId && text.startsWith('ID:')) {
                itemId = text.split(':')[1].trim();
            }
            if (!floatName && text.includes('FLOAT:')) {
                floatName = parseFloatFromDom(text.split(':')[1].trim());
            }
            if (!sid && text.includes('SID:')) {
                sid = parseSid(text.split(':')[1].trim());
            }
            if (text === '★' || span.innerHTML.includes('★')) {
                isStattrack = true;
            }
        }

        return { weapon, skin, price, floatName, sid, itemId, isStattrack };
    }

    function renderBadges(card, data) {
        card.querySelectorAll('.fbcs-badge').forEach(el => el.remove());

        if (!data) return;
        card.style.position = 'relative';

        const rareSid = isSidRare(data.sid);
        const rareId = isIdRare(data.itemId);

        if (rareSid && settings.sidRareAnimate) {
            card.classList.add('fbcs-rare-glow-sid');
            const rgb = hexToRgb(settings.sidRareColor);
            card.style.setProperty('--glow-color-sid', `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
            card.style.animationDelay = (parseInt(data.itemId) % 20) * 0.1 + 's';
        } else {
            card.classList.remove('fbcs-rare-glow-sid');
            card.style.removeProperty('--glow-color-sid');
            card.style.removeProperty('animation-delay');
        }

        if (rareId && settings.idRareAnimate) {
            card.classList.add('fbcs-rare-glow-id');
            const rgb = hexToRgb(settings.idRareColor);
            card.style.setProperty('--glow-color-id', `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
            card.style.animationDelay = (parseInt(data.itemId) % 17) * 0.12 + 's';
        } else {
            card.classList.remove('fbcs-rare-glow-id');
            card.style.removeProperty('--glow-color-id');
        }

        if (settings.enableSid && data.sid !== null) {
            const sidStr = formatSid(data.sid);
            const show = settings.sidShowAll || rareSid;
            if (sidStr && show) {
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
            if (!hasFloat) {
                el.classList.add('fbcs-st-no-float');
            }
            card.appendChild(el);
        }

        if (settings.enableId && data.itemId) {
            const show = settings.idShowAll || rareId;
            if (show) {
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
        const data = parseCard(card);
        renderBadges(card, data);
    }

    function reprocessAllCards() {
        document.querySelectorAll('div.sc-jOdwRd').forEach(card => {
            card.dataset.fbcsProcessed = '0';
            processCard(card);
        });
    }

    function startObserver() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('div.sc-jOdwRd:not([data-fbcs-processed="1"])').forEach(processCard);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll('div.sc-jOdwRd').forEach(processCard);
    }

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
                    <div class="fbcs-row">
                        <label for="fbcs-enableSid">SID</label>
                        <input type="checkbox" id="fbcs-enableSid" ${settings.enableSid ? 'checked' : ''}>
                    </div>
                    <div class="fbcs-row">
                        <label for="fbcs-enableId">ID</label>
                        <input type="checkbox" id="fbcs-enableId" ${settings.enableId ? 'checked' : ''}>
                    </div>
                    <div class="fbcs-row">
                        <label for="fbcs-enableFloat">Float (износ)</label>
                        <input type="checkbox" id="fbcs-enableFloat" ${settings.enableFloat ? 'checked' : ''}>
                    </div>
                    <div class="fbcs-row">
                        <label for="fbcs-enableSt">StatTrak</label>
                        <input type="checkbox" id="fbcs-enableSt" ${settings.enableSt ? 'checked' : ''}>
                    </div>
                    <div class="fbcs-row">
                        <label for="fbcs-hideHover">Скрыть hover-контент</label>
                        <input type="checkbox" id="fbcs-hideHover" ${settings.hideHoverContent ? 'checked' : ''}>
                    </div>
                </div>

                <div class="fbcs-section">
                    <div class="fbcs-section-title">SID</div>
                    <div class="fbcs-row">
                        <label for="fbcs-sidShowAll">Показывать все SID</label>
                        <input type="checkbox" id="fbcs-sidShowAll" ${settings.sidShowAll ? 'checked' : ''}>
                    </div>
                    <div class="fbcs-row">
                        <label>Редкие SID (через запятую)</label>
                        <input type="text" id="fbcs-rareSids" value="${settings.rareSids.join(',')}" style="width:150px;">
                    </div>
                    <div class="fbcs-row">
                        <label>Цвет редкого SID</label>
                        <input type="color" id="fbcs-sidRareColor" value="${settings.sidRareColor}">
                    </div>
                    <div class="fbcs-row">
                        <label>Цвет обычного SID</label>
                        <input type="color" id="fbcs-sidNormalColor" value="${settings.sidNormalColor}">
                    </div>
                    <div class="fbcs-row">
                        <label>Анимация редких SID</label>
                        <input type="checkbox" id="fbcs-sidRareAnimate" ${settings.sidRareAnimate ? 'checked' : ''}>
                    </div>
                </div>

                <div class="fbcs-section">
                    <div class="fbcs-section-title">ID</div>
                    <div class="fbcs-row">
                        <label for="fbcs-idShowAll">Показывать все ID</label>
                        <input type="checkbox" id="fbcs-idShowAll" ${settings.idShowAll ? 'checked' : ''}>
                    </div>
                    <div class="fbcs-row">
                        <label>Порог редкого ID (число меньше N)</label>
                        <input type="number" id="fbcs-rareIdsThreshold" value="${settings.rareIdsThreshold}" style="width:100px;">
                    </div>
                    <div class="fbcs-row">
                        <label>Цвет редкого ID</label>
                        <input type="color" id="fbcs-idRareColor" value="${settings.idRareColor}">
                    </div>
                    <div class="fbcs-row">
                        <label>Цвет обычного ID</label>
                        <input type="color" id="fbcs-idNormalColor" value="${settings.idNormalColor}">
                    </div>
                    <div class="fbcs-row">
                        <label>Анимация редких ID</label>
                        <input type="checkbox" id="fbcs-idRareAnimate" ${settings.idRareAnimate ? 'checked' : ''}>
                    </div>
                </div>

                <div class="fbcs-section">
                    <div class="fbcs-section-title">Float (износ)</div>
                    <div class="fbcs-row">
                        <label for="fbcs-floatShowAll">Показывать Float</label>
                        <input type="checkbox" id="fbcs-floatShowAll" ${settings.floatShowAll !== false ? 'checked' : ''}>
                    </div>
                    <div class="fbcs-row">
                        <label><span class="fbcs-color-preset" style="background:${settings.floatColors['FN']}"></span> FN</label>
                        <input type="color" id="fbcs-floatFN" value="${settings.floatColors['FN']}">
                    </div>
                    <div class="fbcs-row">
                        <label><span class="fbcs-color-preset" style="background:${settings.floatColors['MW']}"></span> MW</label>
                        <input type="color" id="fbcs-floatMW" value="${settings.floatColors['MW']}">
                    </div>
                    <div class="fbcs-row">
                        <label><span class="fbcs-color-preset" style="background:${settings.floatColors['FT']}"></span> FT</label>
                        <input type="color" id="fbcs-floatFT" value="${settings.floatColors['FT']}">
                    </div>
                    <div class="fbcs-row">
                        <label><span class="fbcs-color-preset" style="background:${settings.floatColors['WW']}"></span> WW</label>
                        <input type="color" id="fbcs-floatWW" value="${settings.floatColors['WW']}">
                    </div>
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
            applySettingsGlobally();
            closeModal();
        });

        requestAnimationFrame(() => {
            overlay.classList.add('fbcs-visible');
        });
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
        const rareSidsStr = document.getElementById('fbcs-rareSids').value;
        settings.rareSids = rareSidsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        settings.sidRareColor = document.getElementById('fbcs-sidRareColor').value;
        settings.sidNormalColor = document.getElementById('fbcs-sidNormalColor').value;
        settings.sidRareAnimate = document.getElementById('fbcs-sidRareAnimate').checked;

        settings.idShowAll = document.getElementById('fbcs-idShowAll').checked;
        settings.rareIdsThreshold = parseInt(document.getElementById('fbcs-rareIdsThreshold').value, 10) || 10000;
        settings.idRareColor = document.getElementById('fbcs-idRareColor').value;
        settings.idNormalColor = document.getElementById('fbcs-idNormalColor').value;
        settings.idRareAnimate = document.getElementById('fbcs-idRareAnimate').checked;

        settings.floatShowAll = document.getElementById('fbcs-floatShowAll').checked;
        settings.floatColors['FN'] = document.getElementById('fbcs-floatFN').value;
        settings.floatColors['MW'] = document.getElementById('fbcs-floatMW').value;
        settings.floatColors['FT'] = document.getElementById('fbcs-floatFT').value;
        settings.floatColors['WW'] = document.getElementById('fbcs-floatWW').value;
    }

    function applySettingsGlobally() {
        if (settings.hideHoverContent) {
            document.body.classList.add('fbcs-hide-hover');
        } else {
            document.body.classList.remove('fbcs-hide-hover');
        }
        reprocessAllCards();
    }

    function checkHash() {
        if (window.location.hash === '#nastroyki') {
            if (!document.querySelector('.fbcs-modal-overlay')) {
                createSettingsModal();
            }
        } else {
            const overlay = document.querySelector('.fbcs-modal-overlay');
            if (overlay) {
                overlay.classList.remove('fbcs-visible');
                setTimeout(() => overlay.remove(), 300);
            }
        }
    }

    window.addEventListener('hashchange', checkHash);

    if (document.body) {
        startObserver();
        applySettingsGlobally();
        checkHash();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            startObserver();
            applySettingsGlobally();
            checkHash();
        });
    }
})();