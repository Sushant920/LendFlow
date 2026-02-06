
// Logic to determine the API URL
// In production (Render/Vercel):
// - If VITE_API_URL is set (Render), use it.
// - If not set (Vercel), default to '' (relative path) so calls go to /api/... on same domain
// In development, it falls back to localhost:3000
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
