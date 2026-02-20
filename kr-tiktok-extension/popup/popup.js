/**
 * KR-CLIDN TikTok Intelligence — Popup Logic
 * Manages UI state, WebSocket status, and data display
 */

// ── State ─────────────────────────────────────────────────────────────────

const state = {
    connected: false,
    trendData: { hashtags: [], sounds: [] },
    viralVideos: [],
    selectedHashtag: null,
    selectedSound: null,
    selectedViral: null,
    activeTab: 'trending'
};

// ── DOM References ─────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);
const $statusDot = $('statusDot');
const $statusText = $('statusText');
const $lastSync = $('lastSync');
const $hashtagList = $('hashtagList');
const $soundList = $('soundList');
const $viralList = $('viralList');
const $selectedTrend = $('selectedTrend');
const $generateStatus = $('generateStatus');

// ── WebSocket Status ───────────────────────────────────────────────────────

function updateStatus(connected) {
    state.connected = connected;
    $statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    $statusText.textContent = connected ? 'Conectado' : 'Sin conexión';
}

// ── Tab Navigation ─────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(`tab-${tab.dataset.tab}`);
        if (target) target.classList.add('active');
        state.activeTab = tab.dataset.tab;
    });
});

// ── Render Functions ───────────────────────────────────────────────────────

function renderHashtags(hashtags) {
    if (!hashtags || hashtags.length === 0) {
        $hashtagList.innerHTML = '<div class="empty-state">Navega a TikTok/Trending para cargar</div>';
        return;
    }

    $hashtagList.innerHTML = hashtags.slice(0, 20).map(h => {
        const views = h.views > 1_000_000 ? (h.views / 1_000_000).toFixed(1) + 'M' :
            h.views > 1000 ? (h.views / 1000).toFixed(0) + 'K' : h.views;
        const selected = state.selectedHashtag === h.name ? 'selected' : '';
        return `<div class="tag-chip ${selected}" data-hashtag="${h.name}">
            ${h.name}<span class="tag-views">${views || ''}</span>
        </div>`;
    }).join('');

    $hashtagList.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.dataset.hashtag;
            state.selectedHashtag = (state.selectedHashtag === tag) ? null : tag;
            renderHashtags(state.trendData.hashtags);
            updateSelectedTrend();
        });
    });
}

function renderSounds(sounds) {
    if (!sounds || sounds.length === 0) {
        $soundList.innerHTML = '<div class="empty-state">Sin datos de sonidos aún</div>';
        return;
    }

    $soundList.innerHTML = sounds.slice(0, 8).map(s => {
        const uses = s.uses > 1_000_000 ? (s.uses / 1_000_000).toFixed(1) + 'M' :
            s.uses > 1000 ? (s.uses / 1000).toFixed(0) + 'K' : (s.uses || '?');
        const selected = state.selectedSound === s.name ? 'selected' : '';
        return `<div class="sound-item ${selected}" data-sound="${s.name}">
            <span class="sound-name">🎵 ${s.name}</span>
            <span class="sound-uses">${uses} usos</span>
        </div>`;
    }).join('');

    $soundList.querySelectorAll('.sound-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.sound;
            state.selectedSound = (state.selectedSound === name) ? null : name;
            renderSounds(state.trendData.sounds);
            updateSelectedTrend();
        });
    });
}

function renderViralVideos() {
    if (state.viralVideos.length === 0) {
        $viralList.innerHTML = '<div class="empty-state">Ve a un video viral en TikTok para capturarlo</div>';
        return;
    }

    $viralList.innerHTML = state.viralVideos.slice(0, 10).map((v, i) => {
        const score = v.viralScore || 0;
        const scoreLabel = score > 1000 ? '🔥 MEGA VIRAL' : score > 500 ? '⚡ VIRAL' : '📈 TRENDING';
        const likes = v.metrics?.likes > 1_000 ? (v.metrics.likes / 1000).toFixed(0) + 'K' : (v.metrics?.likes || '?');
        const saves = v.metrics?.saves > 1_000 ? (v.metrics.saves / 1000).toFixed(0) + 'K' : (v.metrics?.saves || '?');
        const selected = state.selectedViral === i ? 'selected' : '';
        return `<div class="viral-card ${selected}" data-idx="${i}">
            <div class="viral-hook">"${v.hook || v.caption?.substring(0, 100) || 'Sin hook detectado'}"</div>
            <div class="viral-meta">
                <div class="viral-stat">❤️ <span>${likes}</span></div>
                <div class="viral-stat">🔖 <span>${saves}</span></div>
                <div class="viral-stat">@<span>${v.author || '?'}</span></div>
            </div>
            <div class="viral-score">${scoreLabel} · Score: ${score}</div>
        </div>`;
    }).join('');

    $viralList.querySelectorAll('.viral-card').forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.dataset.idx);
            state.selectedViral = (state.selectedViral === idx) ? null : idx;
            renderViralVideos();
            if (state.selectedViral !== null) {
                const v = state.viralVideos[state.selectedViral];
                updateSelectedTrend(v.hook);
            }
        });
    });
}

function updateSelectedTrend(customText = null) {
    const parts = [];
    if (customText) parts.push(customText);
    if (state.selectedHashtag) parts.push(state.selectedHashtag);
    if (state.selectedSound) parts.push(`🎵 ${state.selectedSound}`);

    if (parts.length > 0) {
        $selectedTrend.innerHTML = parts.map(p => `<span class="tag-chip selected" style="margin:2px;">${p}</span>`).join('');
    } else {
        $selectedTrend.innerHTML = '<span class="no-trend">Sin tendencia seleccionada</span>';
    }
}

// ── Message Listener (from background) ────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'WS_STATUS') {
        updateStatus(msg.status === 'CONNECTED' || msg.status === 'APP_READY');
    }
});

// ── Check Initial Status ───────────────────────────────────────────────────

// ── Check Initial Status & Poll ────────────────────────────────────────────

function checkStatus() {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
        if (chrome.runtime.lastError) {
            console.log('Autoreload wait...');
            return;
        }
        if (typeof res?.connected === 'boolean') {
            updateStatus(res.connected);
        }

        // Also refresh data if connected
        if (res?.connected) {
            loadData();
        }
    });
}

// Poll every 2 seconds to keep UI in sync
setInterval(checkStatus, 2000);
checkStatus(); // Immediate check


// ── Profile Rendering ──────────────────────────────────────────────────────

function renderProfile(data) {
    const container = $('profileContainer');
    if (!data) {
        container.innerHTML = '<div class="empty-state">Visita un perfil de TikTok para analizarlo</div>';
        return;
    }

    const { username, followers, following, likes, bio, avgViews, viralPosts } = data;

    // Calculate Engagement Rate (heuristic)
    const er = followers > 0 ? ((likes / followers) * 100).toFixed(2) + '%' : '0%';
    const viralRate = viralPosts > 0 ? 'ALTO' : 'NORMAL';

    const html = `
        <div class="profile-header">
            <div class="profile-avatar">${username.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
                <h3>@${username}</h3>
                <p>${bio || 'Sin biografía'}</p>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-box">
                <span class="stat-value">${formatNumber(followers)}</span>
                <span class="stat-label">Seguidores</span>
            </div>
            <div class="stat-box">
                <span class="stat-value">${formatNumber(likes)}</span>
                <span class="stat-label">Likes Totales</span>
            </div>
            <div class="stat-box">
                <span class="stat-value">${er}</span>
                <span class="stat-label">Engagement</span>
            </div>
            <div class="stat-box">
                <span class="stat-value" style="color:${viralRate === 'ALTO' ? '#ff0055' : '#00ff9d'}">${viralRate}</span>
                <span class="stat-label">Potencial Viral</span>
            </div>
        </div>

        <div class="section-title">VIDEOS RECIENTES</div>
        <div class="recent-grid">
            ${data.recentVideos ? data.recentVideos.slice(0, 6).map(v => `
                <div class="recent-item">
                    <div class="recent-views">👁 ${formatNumber(v.views)}</div>
                </div>
            `).join('') : '<div class="empty-state">No videos</div>'}
        </div>
        
        <div class="action-row">
             <button class="btn-primary" id="injectProfileBtn">↑ Usar Estilo</button>
        </div>
    `;

    container.innerHTML = html;

    // Bind inject button
    const btn = document.getElementById('injectProfileBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'SEND_TO_APP', payload: { type: 'PROFILE_DATA', ...data } });
            btn.textContent = '✅ Enviado!';
            setTimeout(() => btn.textContent = '↑ Usar Estilo', 2000);
        });
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

// ── Load Stored Data ───────────────────────────────────────────────────────

function loadData() {
    chrome.storage.local.get(['trendData', 'viralVideos', 'lastSync', 'lastProfile'], (data) => {
        if (data.trendData && (!state.trendData.hashtags || state.trendData.hashtags.length === 0)) {
            state.trendData = data.trendData || { hashtags: [], sounds: [] };
            renderHashtags(state.trendData.hashtags);
            renderSounds(state.trendData.sounds);
        }
        if (data.viralVideos && state.viralVideos.length === 0) {
            state.viralVideos = data.viralVideos;
            renderViralVideos();
        }
        if (data.lastProfile) {
            state.lastProfile = data.lastProfile;
            renderProfile(data.lastProfile);
        }
        if (data.lastSync) {
            const d = new Date(data.lastSync);
            const timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            if ($lastSync) $lastSync.textContent = `Sync: ${timeStr}`;
        }
    });
}
loadData();

// ── Storage Listener (Reactivity) ──────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.trendData) {
            state.trendData = changes.trendData.newValue || { hashtags: [], sounds: [] };
            if (state.activeTab === 'trending') {
                renderHashtags(state.trendData.hashtags);
                renderSounds(state.trendData.sounds);
            }
        }
        if (changes.viralVideos) {
            state.viralVideos = changes.viralVideos.newValue || [];
            if (state.activeTab === 'viral') {
                renderViralVideos();
            }
        }
        if (changes.lastProfile) {
            console.log('[KR-Popup] New profile data received');
            state.lastProfile = changes.lastProfile.newValue;
            renderProfile(state.lastProfile);
            // Auto-switch to profile tab if we receive profile data
            if (state.activeTab !== 'profile') {
                document.querySelector('[data-tab="profile"]').click();
            }
        }
        if (changes.lastSync) {
            const d = new Date(changes.lastSync.newValue);
            const timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            if ($lastSync) $lastSync.textContent = `Sync: ${timeStr}`;
        }
    }
});

// ── Button Actions ─────────────────────────────────────────────────────────

// Refresh: trigger extraction from active TikTok tab
// Refresh: trigger extraction from active TikTok tab
$('refreshBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'TRIGGER_EXTRACTION' });
    $('refreshBtn').textContent = '⚡ Extrayendo...';
    setTimeout(() => { $('refreshBtn').textContent = '↻ Actualizar'; }, 2000);
});

// Inject trend data to Studio
$('injectTrendBtn').addEventListener('click', () => {
    const payload = {
        type: 'TREND_DATA',
        payload: {
            ...state.trendData,
            selectedHashtag: state.selectedHashtag,
            selectedSound: state.selectedSound,
            timestamp: Date.now()
        }
    };
    chrome.runtime.sendMessage({ type: 'SEND_TO_APP', payload: payload.payload });
    $('injectTrendBtn').textContent = '✅ Enviado!';
    setTimeout(() => { $('injectTrendBtn').textContent = '↑ Enviar a Studio'; }, 2000);
});

// Inject viral video data
$('injectViralBtn').addEventListener('click', () => {
    if (state.selectedViral === null) {
        alert('Selecciona un video viral primero');
        return;
    }
    const viral = state.viralVideos[state.selectedViral];
    chrome.runtime.sendMessage({ type: 'SEND_TO_APP', payload: { type: 'VIRAL_VIDEO', ...viral } });
    $('injectViralBtn').textContent = '✅ Enviado!';
    setTimeout(() => { $('injectViralBtn').textContent = '↑ Usar en Studio'; }, 2000);
});

// Clear viral list
$('clearViralBtn').addEventListener('click', () => {
    state.viralVideos = [];
    state.selectedViral = null;
    chrome.storage.local.set({ viralVideos: [] });
    renderViralVideos();
});

// Generate content
$('generateBtn').addEventListener('click', () => {
    const topic = $('topicInput').value.trim();
    const mode = $('modeSelect').value;
    if (!topic) { $generateStatus.textContent = '⚠️ Ingresa un tema primero'; return; }

    const payload = {
        type: 'GENERATE_REQUEST',
        topic,
        mode,
        trendSignal: {
            hashtag: state.selectedHashtag,
            sound: state.selectedSound,
            viralHook: state.selectedViral !== null ? state.viralVideos[state.selectedViral]?.hook : null
        }
    };

    chrome.runtime.sendMessage({ type: 'SEND_TO_APP', payload });
    $generateStatus.textContent = '✅ Solicitud enviada a Cyber-Canvas Studio';
    setTimeout(() => { $generateStatus.textContent = ''; }, 3000);
});

// Reconnect button
$('connectBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'MANUAL_CONNECT' });
    $connectBtn.textContent = 'Conectando...';
    setTimeout(() => { $connectBtn.textContent = 'Reconectar'; }, 3000);
});
