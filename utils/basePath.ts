/**
 * Dynamically determines the base path for the app when deployed behind a reverse proxy.
 * 
 * When accessed via whatifmoney.in/sip-calculator, this detects "/sip-calculator" 
 * as the base path and prefixes all API/asset paths accordingly.
 * 
 * In local development (localhost), no prefix is applied since Vite serves from root.
 */

// Known app mount points - add more as needed
const KNOWN_MOUNT_POINTS = ['/sip-calculator'];

/**
 * Check if we're in local development (localhost or 127.0.0.1)
 */
function isLocalDevelopment(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
}

/**
 * Detects the base path from the current URL.
 * Returns the mount point if found and NOT in local dev, otherwise empty string.
 */
export function getBasePath(): string {
    if (typeof window === 'undefined') return '';

    // Don't apply base path in local development
    if (isLocalDevelopment()) return '';

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
 *   -> '/sip-calculator/api/gemini-recommendation' (when on whatifmoney.in/sip-calculator)
 *   -> '/api/gemini-recommendation' (when on localhost)
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
 *   -> '/sip-calculator/animations/financial-planning.lottie' (when on whatifmoney.in/sip-calculator)
 *   -> '/animations/financial-planning.lottie' (when on localhost)
 */
export function resolveAssetPath(path: string): string {
    const base = getBasePath();
    if (path.startsWith('/') && base) {
        return base + path;
    }
    return path;
}
