/**
 * TataPlay Proxy Configuration
 * 
 * To bypass geo-restrictions, you can use a proxy service.
 * Options:
 * 
 * 1. ProxyMesh (https://proxymesh.com) - Rotating proxies with Indian IPs
 * 2. Bright Data (https://brightdata.com) - Premium residential proxies
 * 3. ScraperAPI (https://scraperapi.com) - Simple API-based proxy
 * 
 * Example configuration:
 */

export const PROXY_CONFIG = {
    enabled: false, // Set to true when you have a proxy service

    // For HTTP proxy (ProxyMesh, etc):
    // url: 'http://username:password@proxy-server.com:port',

    // For API-based proxy (ScraperAPI):
    // apiKey: 'your-api-key',
    // baseUrl: 'http://api.scraperapi.com'
};

/**
 * Make a proxied request to Tata Play
 */
export async function proxyFetch(url, options = {}) {
    if (!PROXY_CONFIG.enabled) {
        return fetch(url, options);
    }

    // If using ScraperAPI
    if (PROXY_CONFIG.apiKey) {
        const proxyUrl = `${PROXY_CONFIG.baseUrl}?api_key=${PROXY_CONFIG.apiKey}&url=${encodeURIComponent(url)}&country_code=in`;
        return fetch(proxyUrl, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json'
            }
        });
    }

    // If using HTTP proxy
    if (PROXY_CONFIG.url) {
        // Note: In Node.js/Edge Runtime, you might need a library like 'node-fetch' with proxy support
        // or configure the proxy at the environment level
        return fetch(url, {
            ...options,
            // Add proxy configuration here based on your runtime
        });
    }

    return fetch(url, options);
}
