import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Beehouse RH - Gestão de Colaboradores',
    description: 'Sistema de gestão de recursos humanos da Beehouse',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <head>
                {/* Bitrix24 JS SDK for app integration */}
                <Script
                    src="https://api.bitrix24.com/api/v1/"
                    strategy="beforeInteractive"
                />
            </head>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}
