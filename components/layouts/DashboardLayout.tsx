'use client'

import { useState, useEffect } from 'react'
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
    Briefcase,
    X,
    Bell,
    ChevronRight,
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
    { label: 'Contratos', icon: Briefcase, href: '/contratos' },
    { label: 'Recessos', icon: Calendar, href: '/recessos' },
    { label: 'Materiais & EPIs', icon: Package, href: '/materiais' },
    { label: 'Financeiro', icon: Banknote, href: '/financeiro' },
    { label: 'Relatórios', icon: BarChart3, href: '/relatorios' },
    { label: 'Alertas', icon: Bell, href: '/alertas' },
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
    const [userName, setUserName] = useState('Usuário')

    useEffect(() => {
        // Get user info from localStorage token or session
        const token = localStorage.getItem('auth_token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                if (payload.user_metadata?.full_name) {
                    setUserName(payload.user_metadata.full_name)
                } else if (payload.email) {
                    setUserName(payload.email.split('@')[0])
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    const routeName = (() => {
        if (pathname === '/' || !pathname) return 'Dashboard'
        const segment = pathname.replace(/^\//, '').split('/')[0]
        if (!segment) return 'Dashboard'
        return segment.charAt(0).toUpperCase() + segment.slice(1)
    })()

    const handleLogout = async () => {
        localStorage.removeItem('auth_token')
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const userInitial = userName.charAt(0).toUpperCase()

    return (
        <div className="flex h-screen overflow-hidden font-sans bg-gray-50">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 flex-col z-50 bg-zinc-950 border-r border-white/10 transform transition-transform duration-300 ease-in-out md:hidden",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#f9b410] flex items-center justify-center">
                            <Package className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-lg font-bold text-white">Beehouse RH</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-white hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 py-4 overflow-y-auto">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/' && pathname.startsWith(link.href))
                        const Icon = link.icon

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 group relative',
                                    isActive
                                        ? 'text-[#f9b410] font-bold bg-white/5 border-l-4 border-[#f9b410]'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent'
                                )}
                            >
                                <Icon className={cn('w-5 h-5', isActive ? 'text-[#f9b410]' : 'text-zinc-500')} />
                                <span className="flex-1">{link.label}</span>
                                <ChevronRight className={cn('w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity', isActive && 'opacity-100')} />
                            </Link>
                        )
                    })}
                </div>

                {/* Mobile User Section */}
                <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <Avatar size="sm" className="bg-[#f9b410] text-black">
                            <AvatarFallback>{userInitial}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{userName}</p>
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

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 lg:w-72 flex-col relative z-20 bg-zinc-950 border-r border-white/10">
                <div className="h-16 lg:h-20 flex items-center px-6 lg:px-8 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-3 cursor-pointer">
                        <div className="w-8 lg:w-9 h-8 lg:h-9 rounded-xl bg-[#f9b410] flex items-center justify-center shadow-[0_0_15px_rgba(249,180,16,0.4)]">
                            <Package className="w-5 lg:w-6 h-5 lg:h-6 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base lg:text-lg font-bold tracking-wide text-white leading-none">
                                Beehouse
                            </span>
                            <span className="text-[10px] text-[#f9b410] font-bold tracking-widest mt-0.5">
                                RH
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 py-6 lg:py-8 px-0 overflow-y-auto space-y-1">
                    <p className="px-6 lg:px-8 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
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
                                    'flex items-center gap-3 px-6 lg:px-8 py-3 text-sm transition-all duration-200 group relative border-l-4',
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

                <div className="p-4 lg:p-6 border-t border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#f9b410]/30 transition-all cursor-pointer group">
                        <Avatar size="sm" className="bg-[#f9b410] text-black ring-2 ring-black group-hover:ring-[#f9b410]">
                            <AvatarFallback>{userInitial}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-[#f9b410] transition-colors">
                                {userName}
                            </p>
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
                <header className="h-14 md:h-16 lg:h-20 px-4 md:px-6 lg:px-8 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm z-30 sticky top-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        {/* Mobile: Show logo */}
                        <div className="md:hidden flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#f9b410] flex items-center justify-center">
                                <Package className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-bold text-gray-800">{routeName}</span>
                        </div>

                        {/* Desktop: Show route name */}
                        <h2 className="text-lg lg:text-xl font-bold text-gray-800 hidden md:block capitalize border-l-4 border-[#f9b410] pl-3">
                            {routeName}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Search - Desktop only */}
                        <div className="hidden lg:block w-48 xl:w-64 mr-2">
                            <Input
                                icon={Search}
                                placeholder="Buscar..."
                                className="w-full rounded-full bg-gray-50 border-gray-200"
                            />
                        </div>

                        {/* Quick Add Button */}
                        <Link href="/colaboradores/novo">
                            <Button
                                size="icon"
                                className="rounded-full w-9 h-9 md:w-10 md:h-10 shadow-md hover:scale-105 transition-transform bg-[#f9b410] text-black hover:bg-[#e0a20e]"
                            >
                                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            </Button>
                        </Link>

                        <div className="h-6 md:h-8 w-px bg-gray-200 mx-1 md:mx-2 hidden sm:block" />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full p-1 hover:bg-gray-100">
                                    <Avatar size="md" className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 text-[#f9b410] ring-2 ring-gray-100">
                                        <AvatarFallback className="text-sm">{userInitial}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5 text-sm font-medium text-gray-900 truncate">
                                    {userName}
                                </div>
                                <DropdownMenuSeparator />
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

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 scroll-smooth">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40">
                    <div className="flex justify-around items-center">
                        {navLinks.slice(0, 5).map((link) => {
                            const isActive = pathname === link.href ||
                                (link.href !== '/' && pathname.startsWith(link.href))
                            const Icon = link.icon

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]',
                                        isActive
                                            ? 'text-[#f9b410]'
                                            : 'text-gray-500 hover:text-gray-700'
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium truncate">{link.label.split(' ')[0]}</span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </div>
    )
}
