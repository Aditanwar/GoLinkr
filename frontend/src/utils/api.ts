const BASE_URL = 'http://localhost:8080/api/v1';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let url = `${BASE_URL}${path}`;
  if (options.params) {
    const query = new URLSearchParams(options.params).toString();
    url += `?${query}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Handle PNG binary outputs
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('image/png')) {
    const blob = await response.blob();
    return blob as any;
  }

  return response.json();
}
