'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutGrid,
    Users,
    FileText,
    Calendar,
    Package,
    Banknote,
    BarChart3,
    Search,
    Plus,
    Menu,
    LogOut,
    User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navLinks = [
    { label: 'Dashboard', icon: LayoutGrid, href: '/' },
    { label: 'Colaboradores', icon: Users, href: '/colaboradores' },
    { label: 'Admissão & Docs', icon: FileText, href: '/documentos' },
    { label: 'Ausências', icon: Calendar, href: '/ausencias' },
    { label: 'Materiais & EPIs', icon: Package, href: '/materiais' },
    { label: 'Financeiro', icon: Banknote, href: '/financeiro' },
    { label: 'Relatórios', icon: BarChart3, href: '/relatorios' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const routeName = (() => {
        if (pathname === '/' || !pathname) return 'Dashboard'
        const segment = pathname.replace(/^\//, '').split('/')[0]
        if (!segment) return 'Dashboard'
        return segment.charAt(0).toUpperCase() + segment.slice(1)
    })()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="flex h-screen overflow-hidden font-sans bg-gray-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-72 flex-col relative z-20 bg-zinc-950 border-r border-white/10">
                <div className="h-20 flex items-center px-8 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-3 cursor-pointer">
                        <div className="w-9 h-9 rounded-xl bg-[#f9b410] flex items-center justify-center shadow-[0_0_15px_rgba(249,180,16,0.4)]">
                            <Package className="w-6 h-6 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-wide text-white leading-none">
                                Beehouse
                            </span>
                            <span className="text-[10px] text-[#f9b410] font-bold tracking-widest mt-0.5">
                                RH
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 py-8 px-0 overflow-y-auto space-y-1">
                    <p className="px-8 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                        Menu Principal
                    </p>

                    {navLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/' && pathname.startsWith(link.href))
                        const Icon = link.icon

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'flex items-center gap-3 px-8 py-3.5 text-sm transition-all duration-200 group relative border-l-4',
                                    isActive
                                        ? 'text-[#f9b410] font-bold border-[#f9b410] bg-white/5'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium border-transparent'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'w-5 h-5 transition-colors',
                                        isActive
                                            ? 'text-[#f9b410]'
                                            : 'text-zinc-500 group-hover:text-white'
                                    )}
                                />
                                <span>{link.label}</span>
                            </Link>
                        )
                    })}
                </div>

                <div className="p-6 border-t border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#f9b410]/30 transition-all cursor-pointer group">
                        <Avatar size="sm" className="bg-[#f9b410] text-black ring-2 ring-black group-hover:ring-[#f9b410]">
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-[#f9b410] transition-colors">
                                Admin User
                            </p>
                            <p className="text-xs text-zinc-400 truncate">admin@beehouse.com</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-zinc-500 hover:text-red-400 hover:bg-transparent"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h2 className="text-xl font-bold text-gray-800 hidden md:block capitalize border-l-4 border-[#f9b410] pl-3">
                            {routeName}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:block w-64 mr-2">
                            <Input
                                icon={Search}
                                placeholder="Buscar..."
                                className="w-full rounded-full bg-gray-50 border-gray-200"
                            />
                        </div>

                        <Link href="/colaboradores/novo">
                            <Button
                                size="icon"
                                className="rounded-full w-10 h-10 shadow-md hover:scale-105 transition-transform bg-[#f9b410] text-black hover:bg-[#e0a20e]"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </Link>

                        <div className="h-8 w-px bg-gray-200 mx-2" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full p-1 hover:bg-gray-100">
                                    <Avatar size="md" className="bg-zinc-900 text-[#f9b410] ring-2 ring-gray-100">
                                        <AvatarFallback>A</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <User className="w-4 h-4 mr-2" />
                                    Meu Perfil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50 scroll-smooth">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    )
}
