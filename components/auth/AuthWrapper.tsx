'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AuthWrapperProps {
    children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const [isReady, setIsReady] = useState(false)
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        // Check if there's a token in the URL
        const urlToken = searchParams.get('token')

        // Check localStorage for token
        const storedToken = localStorage.getItem('auth_token')

        const token = urlToken || storedToken

        if (token) {
            console.log('Setting session from token...')

            try {
                await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: token,
                })

                // Clear token from URL without reload
                if (urlToken) {
                    const url = new URL(window.location.href)
                    url.searchParams.delete('token')
                    window.history.replaceState({}, '', url.pathname)
                }
            } catch (error) {
                console.error('Error setting session:', error)
            }
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
