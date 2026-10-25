// src/api.js 
export const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';

async function fetchApi(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot reach the API at ${API}. Start the backend in another terminal with "npm run server".`,
      );
    }
    throw error;
  }
}

export async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const res = await fetchApi(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
