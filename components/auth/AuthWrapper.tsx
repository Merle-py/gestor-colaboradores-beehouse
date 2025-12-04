'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AuthWrapperProps {
    children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const [isReady, setIsReady] = useState(false)
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const supabase = createClient()

    useEffect(() => {
        restoreSession()
    }, [pathname]) // Run on every route change

    const restoreSession = async () => {
        // Check if there's a token in the URL (first time after login)
        const urlToken = searchParams.get('token')

        // Check localStorage for token
        const storedToken = localStorage.getItem('auth_token')

        const token = urlToken || storedToken

        if (token) {
            console.log('Restoring session from token...')

            try {
                // Always set session from token (both fresh and stored)
                const { error } = await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: token,
                })

                if (error) {
                    console.error('Session restore error:', error)
                    // If token is invalid, clear it and redirect to login
                    if (error.message.includes('invalid') || error.message.includes('expired')) {
                        localStorage.removeItem('auth_token')
                        window.location.href = '/login'
                        return
                    }
                }

                // If token was in URL, save to localStorage and clean URL
                if (urlToken) {
                    localStorage.setItem('auth_token', urlToken)
                    const url = new URL(window.location.href)
                    url.searchParams.delete('token')
                    window.history.replaceState({}, '', url.pathname)
                }
            } catch (error) {
                console.error('Error restoring session:', error)
            }
        } else {
            // No token available - redirect to login
            console.log('No token found, redirecting to login')
            window.location.href = '/login'
            return
        }

        setIsReady(true)
    }

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return <>{children}</>
}
