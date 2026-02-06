
// Logic to determine the API URL
// In production (Render), VITE_API_URL should be set in environment variables
// In development, it falls back to localhost:3000
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
