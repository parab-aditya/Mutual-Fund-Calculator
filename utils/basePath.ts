/**
 * Dynamically determines the base path for the app when deployed behind a reverse proxy.
 * 
 * When accessed via whatifmoney.in/sip-calculator, this detects "/sip-calculator" 
 * as the base path and prefixes all API/asset paths accordingly.
 * 
 * This is necessary because:
 * - Cloudflare Workers rewrites HTML attributes but not JavaScript fetch() calls
 * - Dynamic asset loading (like Lottie) also bypasses HTML rewriting
 */

// Known app mount points - add more as needed
const KNOWN_MOUNT_POINTS = ['/sip-calculator'];

/**
 * Detects the base path from the current URL.
 * Returns the mount point if found, otherwise empty string.
 */
export function getBasePath(): string {
    if (typeof window === 'undefined') return '';

    const pathname = window.location.pathname;

    for (const mount of KNOWN_MOUNT_POINTS) {
        if (pathname === mount || pathname.startsWith(mount + '/')) {
            return mount;
        }
    }

    return '';
}

/**
 * Resolves an API path relative to the base path.
 * Example: resolveApiPath('/api/gemini-recommendation') 
 *   -> '/sip-calculator/api/gemini-recommendation' (when on /sip-calculator)
 *   -> '/api/gemini-recommendation' (when on root)
 */
export function resolveApiPath(path: string): string {
    const base = getBasePath();
    if (path.startsWith('/') && base) {
        return base + path;
    }
    return path;
}

/**
 * Resolves an asset path relative to the base path.
 * Example: resolveAssetPath('/animations/financial-planning.lottie')
 *   -> '/sip-calculator/animations/financial-planning.lottie' (when on /sip-calculator)
 */
export function resolveAssetPath(path: string): string {
    const base = getBasePath();
    if (path.startsWith('/') && base) {
        return base + path;
    }
    return path;
}
