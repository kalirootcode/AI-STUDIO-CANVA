/**
 * KR-CLIDN TikTok Intelligence — Background Service Worker
 * Manages WebSocket connection to Cyber-Canvas Electron app (ws://localhost:7890)
 * Routes messages between content script ↔ Electron app
 */

const WS_URL = 'ws://localhost:7890';
const RECONNECT_DELAY_MS = 5000;

let ws = null;
let isConnected = false;
let pendingMessages = [];
let reconnectTimer = null;

// ── Connection Management ──────────────────────────────────────────────────

function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    console.log('[KR-TikTok] Connecting to Cyber-Canvas...', WS_URL);

    try {
        ws = new WebSocket(WS_URL);
    } catch (e) {
        console.warn('[KR-TikTok] WebSocket init failed:', e.message);
        scheduleReconnect();
        return;
    }

    ws.onopen = () => {
        console.log('[KR-TikTok] ✅ Connected to Cyber-Canvas');
        isConnected = true;
        clearTimeout(reconnectTimer);

        // Flush pending messages
        pendingMessages.forEach(msg => sendToApp(msg));
        pendingMessages = [];

        // Notify all extension UIs
        broadcastStatus('CONNECTED');

        // Send hello
        sendToApp({ type: 'EXTENSION_HELLO', version: '1.0.0', timestamp: Date.now() });
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleAppMessage(msg);
        } catch (e) {
            console.warn('[KR-TikTok] Bad message from app:', e);
        }
    };

    ws.onclose = () => {
        console.warn('[KR-TikTok] ⚠️ Disconnected from Cyber-Canvas');
        isConnected = false;
        ws = null;
        broadcastStatus('DISCONNECTED');
        scheduleReconnect();
    };

    ws.onerror = (err) => {
        console.error('[KR-TikTok] WS Error:', err.message || err);
        isConnected = false;
    };
}

function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
}

function sendToApp(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
    } else {
        pendingMessages.push(msg);
        connect(); // Auto-reconnect on send attempt
    }
}

function broadcastStatus(status) {
    chrome.runtime.sendMessage({ type: 'WS_STATUS', status }).catch(() => { });
}

// ── Handle Messages from Electron App ─────────────────────────────────────

function handleAppMessage(msg) {
    console.log('[KR-TikTok] Message from app:', msg.type);

    switch (msg.type) {
        case 'REQUEST_TRENDS':
            // App wants fresh trend data — trigger content script extraction
            triggerExtraction(msg.niche || 'general');
            break;

        case 'APP_READY':
            console.log('[KR-TikTok] Cyber-Canvas ready ✅');
            broadcastStatus('APP_READY');
            break;

        default:
            console.log('[KR-TikTok] Unknown message type:', msg.type);
    }
}

// ── Trigger Content Script Extraction ─────────────────────────────────────

async function triggerExtraction(niche = 'general') {
    const [tab] = await chrome.tabs.query({ url: '*://www.tiktok.com/*', active: true });
    if (!tab) {
        console.warn('[KR-TikTok] No active TikTok tab found');
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (requestedNiche) => {
            window.postMessage({ type: 'KR_EXTRACT_REQUEST', niche: requestedNiche }, '*');
        },
        args: [niche]
    });
}

// ── Handle Messages from Content Script / Popup ────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.type === 'GET_STATUS') {
        sendResponse({ connected: isConnected });
        return true;
    }

    if (msg.type === 'SEND_TO_APP') {
        // From popup or content script — forward to Electron
        sendToApp(msg.payload);
        sendResponse({ ok: true });
        return true;
    }

    if (msg.type === 'CONTENT_DATA') {
        // Save to storage for Popup display
        const data = msg.payload;
        console.log('[KR-Background] Received CONTENT_DATA:', data.type);

        if (data.type === 'TREND_DATA') {
            chrome.storage.local.get(['trendData'], (res) => {
                const current = res.trendData || { hashtags: [], sounds: [] };
                // Merge strategies could go here, for now overwrite
                chrome.storage.local.set({
                    trendData: data,
                    lastSync: Date.now()
                });
            });
        } else if (data.type === 'VIDEO_DATA') {
            // Append to viral list
            chrome.storage.local.get(['viralVideos'], (res) => {
                const videos = res.viralVideos || [];
                // Avoid duplicates by url
                if (!videos.find(v => v.url === data.url)) {
                    chrome.storage.local.set({ viralVideos: videos });
                }
            });
        } else if (data.type === 'PROFILE_DATA') {
            chrome.storage.local.set({ lastProfile: data });
        }

        // Forward scraped data to Electron
        sendToApp(data);
        return true;
    }

    if (msg.type === 'MANUAL_CONNECT') {
        connect();
        sendResponse({ ok: true });
        return true;
    }

    if (msg.type === 'TRIGGER_EXTRACTION') {
        triggerExtraction();
        sendResponse({ ok: true });
        return true;
    }
});

// ── Init ───────────────────────────────────────────────────────────────────

connect(); // Auto-connect on install/reload
