/**
 * Enhanced API client with retry logic and better error handling
 */

import { fetchWithRetry } from './apiRetry';
import { API_URL } from '../config/api';

interface ApiOptions extends RequestInit {
  retry?: boolean;
  retryOptions?: {
    maxRetries?: number;
    initialDelay?: number;
  };
}

/**
 * Enhanced fetch wrapper with retry logic
 */
export async function apiFetch(
  endpoint: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { retry = true, retryOptions, ...fetchOptions } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token && !fetchOptions.headers) {
    fetchOptions.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } else if (token && fetchOptions.headers) {
    const headers = new Headers(fetchOptions.headers);
    headers.set('Authorization', `Bearer ${token}`);
    fetchOptions.headers = headers;
  }

  if (retry) {
    return fetchWithRetry(url, fetchOptions, retryOptions);
  }

  return fetch(url, fetchOptions);
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string, options?: ApiOptions): Promise<T> {
  const response = await apiFetch(endpoint, { ...options, method: 'GET' });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw { status: response.status, ...error };
  }
  
  return response.json();
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: ApiOptions
): Promise<T> {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw { status: response.status, ...error };
  }
  
  return response.json();
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: ApiOptions
): Promise<T> {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw { status: response.status, ...error };
  }
  
  return response.json();
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string, options?: ApiOptions): Promise<T> {
  const response = await apiFetch(endpoint, { ...options, method: 'DELETE' });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw { status: response.status, ...error };
  }
  
  // Some DELETE endpoints return no content
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

