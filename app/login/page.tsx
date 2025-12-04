'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

declare global {
    interface Window {
        BX24?: {
            init: (callback: () => void) => void
            callMethod: (method: string, params: object, callback: (result: any) => void) => void
            getAuth: () => { access_token: string; domain: string; member_id: string } | null
        }
    }
}

function LoginContent() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [statusMessage, setStatusMessage] = useState('Conectando ao Bitrix24...')
    const [debugInfo, setDebugInfo] = useState<string>('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        // Log URL params for debugging
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
            params[key] = value
        })
        console.log('URL Params:', params)
        setDebugInfo(JSON.stringify(params, null, 2))

        initBitrixAuth()
    }, [])

    const initBitrixAuth = async () => {
        // Get params from URL (passed by Bitrix)
        const memberId = searchParams.get('MEMBER_ID') || searchParams.get('member_id')
        const authId = searchParams.get('AUTH_ID') || searchParams.get('auth_id')
        const domain = searchParams.get('DOMAIN') || searchParams.get('domain')
        const appSid = searchParams.get('APP_SID')

        console.log('Bitrix params:', { memberId, authId, domain, appSid })

        // Method 1: If we have MEMBER_ID from URL, use it to get user via webhook
        if (memberId && domain) {
            setStatusMessage('Obtendo dados do usuário...')
            await authenticateWithMemberId(memberId, domain)
            return
        }

        // Method 2: Try BX24 SDK if available
        if (typeof window !== 'undefined' && window.BX24) {
            setStatusMessage('Carregando SDK do Bitrix24...')
            try {
                window.BX24.init(() => {
                    console.log('BX24 initialized')

                    // Try to get auth info
                    const auth = window.BX24?.getAuth()
                    console.log('BX24 auth:', auth)

                    window.BX24?.callMethod('user.current', {}, async (result: any) => {
                        console.log('BX24 user.current result:', result)
                        if (result.data && result.data()) {
                            const user = result.data()
                            setStatusMessage(`Bem-vindo, ${user.NAME}!`)
                            await authenticateWithBitrixId(user.ID)
                        } else if (result.error && result.error()) {
                            console.error('BX24 error:', result.error())
                            setError('Erro ao obter usuário: ' + result.error().error_description)
                            setLoading(false)
                        } else {
                            setError('Não foi possível obter dados do usuário')
                            setLoading(false)
                        }
                    })
                })
            } catch (e: any) {
                console.error('BX24 init error:', e)
                setError('Erro ao inicializar SDK: ' + e.message)
                setLoading(false)
            }
            return
        }

        // Method 3: Check if we have APP_SID (means we're in Bitrix context but SDK not loaded yet)
        if (appSid) {
            setStatusMessage('Aguardando SDK do Bitrix24...')
            // Wait a bit for SDK to load
            setTimeout(() => {
                if (window.BX24) {
                    initBitrixAuth() // Retry
                } else {
                    setError('SDK do Bitrix24 não carregou. Tente recarregar a página.')
                    setLoading(false)
                }
            }, 2000)
            return
        }

        // No Bitrix context detected
        setStatusMessage('Bitrix24 não detectado')
        setLoading(false)
    }

    const authenticateWithMemberId = async (memberId: string, domain: string) => {
        try {
            // Call API to get user info using the webhook
            const response = await fetch('/api/auth/bitrix/user-by-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, domain }),
            })

            const data = await response.json()

            if (!response.ok) {
                // Fallback: try direct authentication with member_id as bitrix_id
                await authenticateWithBitrixId(memberId)
                return
            }

            if (data.user_id) {
                await authenticateWithBitrixId(data.user_id)
            } else {
                throw new Error('User ID not found')
            }
        } catch (e: any) {
            // Fallback to using member_id directly
            console.log('Fallback: using member_id as user_id')
            await authenticateWithBitrixId(memberId)
        }
    }

    const authenticateWithBitrixId = async (bitrixId: string) => {
        try {
            setStatusMessage('Validando usuário...')

            const response = await fetch('/api/auth/bitrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bitrix_id: bitrixId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro na autenticação')
            }

            await setSessionAndRedirect(data.token)
        } catch (e: any) {
            setError(e.message)
            setLoading(false)
        }
    }

    const setSessionAndRedirect = async (token: string) => {
        setSuccess(true)
        setStatusMessage('Entrando no sistema...')

        // Store token in localStorage as backup
        localStorage.setItem('auth_token', token)

        // Set session
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
        })

        if (sessionError) {
            console.error('Session error:', sessionError)
            // Even if there's an error, try to redirect with token
        }

        // Redirect with token in URL as fallback
        setTimeout(() => {
            window.location.href = `/colaboradores?token=${encodeURIComponent(token)}`
        }, 500)
    }

    const handleDevLogin = async () => {
        try {
            setLoading(true)
            setError(null)
            setStatusMessage('Entrando em modo desenvolvimento...')

            const response = await fetch('/api/auth/dev', { method: 'POST' })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao realizar login')
            }

            await setSessionAndRedirect(data.token)
        } catch (e: any) {
            setError(e.message)
            setLoading(false)
        }
    }

    const handleRetry = () => {
        setError(null)
        setLoading(true)
        initBitrixAuth()
    }

    return (
        <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-primary-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                    Gestor de Colaboradores
                </CardTitle>
                <CardDescription>
                    Sistema de gestão de RH - Beehouse
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {success ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900">{statusMessage}</p>
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mt-4 text-gray-400" />
                    </div>
                ) : loading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                        <p className="text-gray-600">{statusMessage}</p>
                    </div>
                ) : error ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Erro</p>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                        <Button onClick={handleRetry} className="w-full">
                            Tentar Novamente
                        </Button>

                        {/* Debug info */}
                        <details className="text-xs text-gray-400">
                            <summary>Debug Info</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                                {debugInfo}
                            </pre>
                        </details>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800">
                                <strong>Acesso via Bitrix24:</strong> Este aplicativo deve ser acessado
                                através do menu de aplicativos do Bitrix24.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-400 text-center mb-3">
                                Modo Desenvolvimento
                            </p>
                            <Button
                                onClick={handleDevLogin}
                                variant="outline"
                                className="w-full"
                            >
                                Entrar como Admin (Dev)
                            </Button>
                        </div>

                        {/* Debug info */}
                        <details className="text-xs text-gray-400">
                            <summary>Debug Info</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                                {debugInfo}
                            </pre>
                        </details>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
            <Suspense fallback={
                <Card className="w-full max-w-md shadow-xl border-0">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                        <p className="text-gray-600">Carregando...</p>
                    </CardContent>
                </Card>
            }>
                <LoginContent />
            </Suspense>
        </div>
    )
}
