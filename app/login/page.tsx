'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleDevLogin = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/auth/dev', { method: 'POST' })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao realizar login')
            }

            if (data.token) {
                console.log('Login Dev: Token recebido, iniciando sessão...')

                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.token,
                    refresh_token: data.token,
                })

                if (sessionError) throw sessionError

                router.push('/colaboradores')
                router.refresh()
            }
        } catch (e: any) {
            console.error('Erro no login dev:', e)
            setError('Erro ao entrar como Dev: ' + (e.message || e))
        } finally {
            setLoading(false)
        }
    }

    const retryLogin = () => {
        window.location.reload()
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md text-center p-6">
                <CardContent className="pt-6">
                    <div className="flex justify-center mb-6">
                        <RefreshCw className="w-12 h-12 text-primary-500 animate-spin" />
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        Conectando ao Bitrix24...
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Validando suas credenciais de acesso.
                    </p>

                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-400 mb-2">Modo Desenvolvimento</p>
                        <Button
                            onClick={handleDevLogin}
                            loading={loading}
                            variant="secondary"
                            className="w-full"
                        >
                            Entrar como Admin (Bypass)
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm text-left">
                            <p className="font-bold">Erro de Autenticação:</p>
                            <p>{error}</p>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="mt-2"
                                onClick={retryLogin}
                            >
                                Tentar Novamente
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
