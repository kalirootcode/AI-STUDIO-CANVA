/**
 * KR-CLIDN TikTok Intelligence — Content Script
 * Runs on tiktok.com — extracts trending data, viral video metrics, profile analytics
 * Sends data to background service_worker.js via chrome.runtime.sendMessage
 */

(function () {
    'use strict';

    console.log('[KR-TikTok] Content script loaded on:', window.location.href);

    // ── Page Type Detection ────────────────────────────────────────────────

    function getPageType() {
        const path = window.location.pathname;
        if (path === '/' || path === '/foryou') return 'FEED';
        if (path.includes('/trending') || path.includes('/explore')) return 'TRENDING';
        if (path.match(/^\/@[\w.]+\/video\//)) return 'VIDEO';
        if (path.match(/^\/@[\w.]+\/?$/)) return 'PROFILE';
        if (path.includes('/search')) return 'SEARCH';
        return 'OTHER';
    }

    // ── Utility: Safe Text Extraction ─────────────────────────────────────

    function safeText(selector, root = document) {
        try { return root.querySelector(selector)?.textContent?.trim() || ''; } catch { return ''; }
    }

    function safeAttr(selector, attr, root = document) {
        try { return root.querySelector(selector)?.getAttribute(attr) || ''; } catch { return ''; }
    }

    function parseCount(str) {
        if (!str) return 0;
        str = str.replace(',', '.').trim().toUpperCase();
        if (str.includes('B')) return parseFloat(str) * 1_000_000_000;
        if (str.includes('M')) return parseFloat(str) * 1_000_000;
        if (str.includes('K')) return parseFloat(str) * 1_000;
        return parseInt(str.replace(/\D/g, '')) || 0;
    }

    // ── Extractor: Current Video ───────────────────────────────────────────

    function extractCurrentVideo() {
        // Selectors vary by TikTok version — try multiple
        const videoSelectors = [
            '[data-e2e="video-desc"]',
            '.video-meta-description',
            '[class*="DivVideoDesc"]',
            'h1[class*="SpanTitle"]',
            '[data-e2e="browse-video-desc"]',
            '.tiktok-1p5rrw6-DivVideoDesc', // Common hash class
            '.tiktok-j2a19r-SpanText',      // Another common one
            'div[class*="Desc"] span'       // Generic fallback
        ];

        let caption = '';
        for (const sel of videoSelectors) {
            caption = safeText(sel);
            if (caption) break;
        }

        // Broaden metric selectors
        const metricSelectors = {
            likes: ['[data-e2e="like-count"]', '[class*="LikeCount"]', 'strong[data-e2e="like-icon"] + strong', '[data-e2e="browse-like-count"]'],
            comments: ['[data-e2e="comment-count"]', '[class*="CommentCount"]', '[data-e2e="browse-comment-count"]'],
            saves: ['[data-e2e="undefined-count"]', '[class*="CollectCount"]', '[data-e2e="browse-undefined-count"]'], // 'undefined-count' is often used for saves/bookmarks
            shares: ['[data-e2e="share-count"]', '[class*="ShareCount"]', '[data-e2e="browse-share-count"]']
        };

        const metrics = {};
        for (const [key, sels] of Object.entries(metricSelectors)) {
            for (const sel of sels) {
                const val = safeText(sel);
                if (val) { metrics[key] = parseCount(val); break; }
            }
            if (!metrics[key]) metrics[key] = 0;
        }

        // Extract sound name
        const soundSelectors = [
            '[data-e2e="video-music"]',
            '[class*="MusicTitle"]',
            'a[href*="/music/"]'
        ];
        let sound = '';
        for (const sel of soundSelectors) {
            sound = safeText(sel);
            if (sound) break;
        }

        // Extract hashtags from caption
        const hashtags = (caption.match(/#[\w\u00C0-\u017F]+/g) || []).map(h => h.toLowerCase());

        // Get video URL
        const videoUrl = window.location.href;
        const authorMatch = videoUrl.match(/\/@([\w.]+)\//);
        const author = authorMatch ? authorMatch[1] : '';

        // Virality score (heuristic: likes/1000 + saves*5 = weighted score)
        const viralScore = Math.round((metrics.likes / 1000) + (metrics.saves * 5) + (metrics.shares * 3));

        // Hook = first sentence of caption
        const hook = caption.split(/[.!?]/)[0]?.trim() || caption.substring(0, 100);

        return {
            type: 'VIDEO_DATA',
            url: videoUrl,
            author,
            caption,
            hook,
            hashtags,
            sound,
            metrics,
            viralScore,
            timestamp: Date.now()
        };
    }

    // ── Extractor: Profile Analytics ──────────────────────────────────────

    function extractProfile() {
        const username = window.location.pathname.replace('/@', '').split('/')[0];

        // Robust selectors for profile metrics
        const followers = parseCount(
            safeText('[data-e2e="followers-count"]') ||
            safeText('[title="Followers"]') ||
            safeText('[class*="FollowersCount"]') ||
            safeText('strong[data-e2e="followers-count"]')
        );

        const following = parseCount(
            safeText('[data-e2e="following-count"]') ||
            safeText('[title="Following"]') ||
            safeText('[class*="FollowingCount"]') ||
            safeText('strong[data-e2e="following-count"]')
        );

        const likes = parseCount(
            safeText('[data-e2e="likes-count"]') ||
            safeText('[title="Likes"]') ||
            safeText('[class*="LikesCount"]') ||
            safeText('strong[data-e2e="likes-count"]')
        );

        const bio = safeText('[data-e2e="user-bio"]') ||
            safeText('[class*="UserBio"]') ||
            safeText('[class*="DivBio"]');

        // Extract recent videos
        const videoItems = document.querySelectorAll('[data-e2e="user-post-item"], [class*="DivItemContainer"]');
        const recentVideos = [];

        videoItems.forEach((item, idx) => {
            if (idx >= 12) return; // Limit to 12 most recent
            const link = item.querySelector('a')?.href || '';
            const viewCount = parseCount(safeText('[class*="ViewCount"]', item) || safeText('strong', item));
            recentVideos.push({ link, views: viewCount });
        });

        // Viral rate: posts with >10x avg views
        const avgViews = recentVideos.length > 0
            ? recentVideos.reduce((s, v) => s + v.views, 0) / recentVideos.length
            : 0;
        const viralPosts = recentVideos.filter(v => v.views > avgViews * 10).length;

        return {
            type: 'PROFILE_DATA',
            username,
            followers,
            following,
            likes,
            bio,
            avgViews: Math.round(avgViews),
            viralPosts,
            recentVideos: recentVideos.slice(0, 6), // Send top 6
            timestamp: Date.now()
        };
    }

    // ── Extractor: Search / Trending Results ──────────────────────────────

    function extractTrending() {
        // Hashtags from trending/explore page
        const hashtagCards = document.querySelectorAll(
            '[data-e2e="search-hashtag-item"], [class*="HashtagCard"], [class*="ChallengeItem"]'
        );

        const trendingHashtags = [];
        hashtagCards.forEach((card, idx) => {
            if (idx >= 20) return;
            const name = safeText('[class*="HashtagTitle"], [class*="ChallengeTitle"], h3, h4', card) || safeText('a', card);
            const views = parseCount(safeText('[class*="ViewCount"], [class*="VideoCount"], span', card));
            if (name) trendingHashtags.push({ name: name.startsWith('#') ? name : '#' + name, views });
        });

        // Sounds from current page (if visible)
        const soundCards = document.querySelectorAll('[class*="SoundCard"], [class*="MusicCard"]');
        const trendingSounds = [];
        soundCards.forEach((card, idx) => {
            if (idx >= 10) return;
            const name = safeText('[class*="SoundTitle"], [class*="MusicTitle"]', card);
            const uses = parseCount(safeText('[class*="UseCount"], span', card));
            if (name) trendingSounds.push({ name, uses });
        });

        // FALLBACK: If no hashtag cards found (e.g. Video Search), extract hashtags from video descriptions
        if (trendingHashtags.length === 0) {
            const videoItems = document.querySelectorAll('[data-e2e="search_video-item"], [class*="DivItemContainer"]');
            const tagCounts = {};

            videoItems.forEach((item, idx) => {
                if (idx >= 15) return;
                // Try to find description/caption
                const desc = safeText('[data-e2e="search-card-desc"], [class*="Desc"], [class*="Caption"]', item);
                if (desc) {
                    const foundTags = desc.match(/#[\w\u00C0-\u017F]+/g) || [];
                    foundTags.forEach(t => {
                        const tag = t.toLowerCase();
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            });

            // Convert to array and sort by frequency
            Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1]) // Sort by count desc
                .slice(0, 15)
                .forEach(([name, count]) => {
                    // Estimate views based on frequency in search results (proxy metric)
                    trendingHashtags.push({ name, views: count * 10000 });
                });
        }

        return {
            type: 'TREND_DATA',
            hashtags: trendingHashtags,
            sounds: trendingSounds,
            url: window.location.href,
            timestamp: Date.now()
        };
    }

    // ── Auto-Extraction on Page Load ──────────────────────────────────────

    function runExtraction() {
        const pageType = getPageType();
        let data = null;

        try {
            switch (pageType) {
                case 'VIDEO':
                    data = extractCurrentVideo();
                    break;
                case 'PROFILE':
                    data = extractProfile();
                    break;
                case 'TRENDING':
                case 'SEARCH':
                    data = extractTrending();
                    break;
                case 'FEED':
                    // On feed, extract the currently visible video
                    data = extractCurrentVideo();
                    data.source = 'FEED';
                    break;
            }

            if (data && Object.keys(data).length > 2) {
                console.log('[KR-TikTok] Sending to background:', data.type);
                showToast(`⚡ KR-CLIDN: ${data.type.replace('_DATA', '')} EXTRACTED`);
                chrome.runtime.sendMessage({ type: 'CONTENT_DATA', payload: data });
            }
        } catch (e) {
            console.error('[KR-TikTok] Extraction error:', e);
        }
    }

    // ── UI: Visual Feedback ────────────────────────────────────────────────

    function showToast(msg) {
        let toast = document.getElementById('kr-tiktok-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'kr-tiktok-toast';
            toast.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: #000; color: #00f2ea; border: 1px solid #00f2ea;
                padding: 10px 20px; border-radius: 8px; font-family: sans-serif;
                font-size: 12px; font-weight: bold; z-index: 9999;
                box-shadow: 0 0 10px rgba(0, 242, 234, 0.3);
                transition: opacity 0.5s; pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    // ── Listen for Manual Extraction Request (from background) ────────────

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data?.type === 'KR_EXTRACT_REQUEST') {
            console.log('[KR-TikTok] Manual extraction triggered');
            runExtraction();
        }
    });

    // ── Listen for URL Changes (SPA navigation) ───────────────────────────

    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            // Wait for new page content to render
            setTimeout(runExtraction, 1500);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ── Inject Interceptor Script ──────────────────────────────────────────

    function injectInterceptor() {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content/interceptor.js');
        script.onload = function () {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(script);
        console.log('[KR-TikTok] Interceptor injected');
    }

    // ── Handle Intercepted API Data ────────────────────────────────────────

    window.addEventListener('message', (event) => {
        // Only accept messages from same window
        if (event.source !== window || !event.data || event.data.type !== 'KR_INTERCEPTED_DATA') return;

        const { url, data } = event.data;
        console.log('[KR-TikTok] API Data Intercepted:', url);

        // 1. Video List (Trending/User Feed)
        if (url.includes('/api/post/item_list') || url.includes('/api/search/item')) {
            const items = data.itemList || data.item_list || [];
            if (items.length > 0) {
                showToast(`⚡ DATA STREAM: ${items.length} Videos Captured`);

                // Process each video
                items.forEach(item => {
                    const videoData = {
                        type: 'VIDEO_DATA',
                        url: `https://www.tiktok.com/@${item.author?.uniqueId}/video/${item.id}`,
                        author: item.author?.uniqueId,
                        caption: item.desc || '',
                        hook: (item.desc || '').split(/[.!?\n]/)[0],
                        hashtags: (item.challenges || []).map(c => '#' + c.titleName),
                        sound: item.music?.title,
                        metrics: {
                            likes: item.stats?.diggCount,
                            comments: item.stats?.commentCount,
                            shares: item.stats?.shareCount,
                            saves: item.stats?.collectCount
                        },
                        timestamp: Date.now()
                    };
                    chrome.runtime.sendMessage({ type: 'CONTENT_DATA', payload: videoData });
                });
            }
        }

        // 2. User Detail (Profile)
        if (url.includes('/api/user/detail')) {
            const user = data.userInfo?.user || {};
            const stats = data.userInfo?.stats || {};

            showToast(`👤 PROFILE DATA: @${user.uniqueId}`);

            const profileData = {
                type: 'PROFILE_DATA',
                username: user.uniqueId,
                followers: stats.followerCount,
                following: stats.followingCount,
                likes: stats.heartCount,
                bio: user.signature,
                timestamp: Date.now()
            };
            chrome.runtime.sendMessage({ type: 'CONTENT_DATA', payload: profileData });
        }
    });

    // ── Initial Run ────────────────────────────────────────────────────────

    injectInterceptor();
    setTimeout(runExtraction, 2000); // Keep DOM fallback just in case

})();
