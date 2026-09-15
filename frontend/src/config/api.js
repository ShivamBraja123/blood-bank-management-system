const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");
export const API_URL = `${API_BASE_URL}/api`;
