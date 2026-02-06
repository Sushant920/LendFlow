
// Logic to determine the API URL
// In production (Render/Vercel):
// - If VITE_API_URL is set (Render), use it.
// - If not set (Vercel), default to '' (relative path) so calls go to /api/... on same domain
// In development, it falls back to localhost:3000
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

let apiUrl = import.meta.env.VITE_API_URL;
// Safety check: Prevent localhost env var from leaking into production
if (!isLocal && (apiUrl?.includes('localhost') || apiUrl?.includes('127.0.0.1'))) {
    console.warn("IGNORING unsafe VITE_API_URL in production:", apiUrl);
    apiUrl = '';
}

// Fallback logic
export const API_BASE_URL = apiUrl || (isLocal ? 'http://localhost:3000' : '');
