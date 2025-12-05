import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface AuthResult {
    isValid: boolean
    userId?: string
    email?: string
    error?: string
}

/**
 * Validates the JWT token from the request headers or cookies
 * Returns the user info if valid, or an error if not
 */
export async function validateAuth(request: NextRequest): Promise<AuthResult> {
    try {
        // Get token from Authorization header or cookie
        const authHeader = request.headers.get('authorization')
        let token = authHeader?.replace('Bearer ', '')

        if (!token) {
            // Try to get from cookie
            const cookieToken = request.cookies.get('auth_token')?.value
            token = cookieToken
        }

        if (!token) {
            return { isValid: false, error: 'Token não fornecido' }
        }

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            console.error('JWT_SECRET not configured')
            return { isValid: false, error: 'Configuração de autenticação inválida' }
        }

        // Verify the token
        const decoded = jwt.verify(token, jwtSecret) as any

        // Check if token is expired
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            return { isValid: false, error: 'Token expirado' }
        }

        return {
            isValid: true,
            userId: decoded.sub,
            email: decoded.email,
        }
    } catch (error: any) {
        console.error('Auth validation error:', error.message)
        return { isValid: false, error: 'Token inválido' }
    }
}

/**
 * Helper to create an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Não autorizado') {
    return new Response(JSON.stringify({
        success: false,
        error: message
    }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    })
}
