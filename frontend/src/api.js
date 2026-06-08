/**
 * Centralised API helper — automatically attaches the JWT Bearer token
 * from localStorage to every request so views don't handle auth manually.
 */

function getAuthHeaders(extra = {}) {
  const user = JSON.parse(localStorage.getItem('user'));
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  return headers;
}

export async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers || {})
  });
}

export async function apiGet(url) {
  return apiFetch(url, { method: 'GET' });
}

export async function apiPost(url, body) {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function apiPut(url, body) {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' });
}
