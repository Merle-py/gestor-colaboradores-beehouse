/**
 * Helper to make authenticated API calls
 * Automatically includes the JWT token from localStorage
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    }

    return fetch(url, {
        ...options,
        headers,
    })
}

/**
 * GET request with authentication
 */
export async function authGet(url: string) {
    return authFetch(url, { method: 'GET' })
}

/**
 * POST request with authentication
 */
export async function authPost(url: string, body: any) {
    return authFetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
    })
}

/**
 * PUT request with authentication
 */
export async function authPut(url: string, body: any) {
    return authFetch(url, {
        method: 'PUT',
        body: JSON.stringify(body),
    })
}

/**
 * DELETE request with authentication
 */
export async function authDelete(url: string) {
    return authFetch(url, { method: 'DELETE' })
}
