/**
 * KR-CLIDN TikTok Intelligence — Network Interceptor
 * Injected into the MAIN world to monkey-patch fetch/XHR and capture internal API responses.
 */

(function () {
    console.log('[KR-TikTok] Interceptor loaded');

    // ── Monkey Patch: fetch ────────────────────────────────────────────────
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = args[0] instanceof Request ? args[0].url : args[0];

            // Filter only relevant API calls
            if (url.includes('/api/post/item_list') ||
                url.includes('/api/user/detail') ||
                url.includes('/api/search/item')) {

                const clone = response.clone();
                clone.json().then(data => {
                    window.postMessage({
                        type: 'KR_INTERCEPTED_DATA',
                        url: url,
                        data: data
                    }, '*');
                }).catch(() => { });
            }
        } catch (e) {
            // Passive capture, ignore errors
        }

        return response;
    };

    // ── Monkey Patch: XMLHttpRequest ───────────────────────────────────────
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        this.addEventListener('load', function () {
            try {
                if (this._url && (
                    this._url.includes('/api/post/item_list') ||
                    this._url.includes('/api/user/detail') ||
                    this._url.includes('/api/search/item')
                )) {
                    const data = JSON.parse(this.responseText);
                    window.postMessage({
                        type: 'KR_INTERCEPTED_DATA',
                        url: this._url,
                        data: data
                    }, '*');
                }
            } catch (e) { }
        });
        return originalSend.apply(this, arguments);
    };

})();
