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
    ChevronLeft,
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [userName, setUserName] = useState('Usuário')

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1280) {
                setSidebarCollapsed(true)
            } else {
                setSidebarCollapsed(false)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                if (payload.user_metadata?.full_name) {
                    setUserName(payload.user_metadata.full_name)
                } else if (payload.email) {
                    setUserName(payload.email.split('@')[0])
                }
            } catch (e) { }
        }
    }, [])

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
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 flex-col z-50 bg-zinc-950 border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:hidden",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#f9b410] flex items-center justify-center">
                            <Package className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-base font-bold text-white">Beehouse RH</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-white hover:bg-white/10 h-8 w-8"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 py-3 overflow-y-auto">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/' && pathname.startsWith(link.href))
                        const Icon = link.icon

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 text-sm transition-all group',
                                    isActive
                                        ? 'text-[#f9b410] font-bold bg-white/5 border-l-[3px] border-[#f9b410]'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', isActive ? 'text-[#f9b410]' : 'text-zinc-500')} />
                                <span className="flex-1">{link.label}</span>
                            </Link>
                        )
                    })}
                </div>

                <div className="p-3 border-t border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <Avatar size="sm" className="bg-[#f9b410] text-black w-7 h-7">
                            <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{userName}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-zinc-500 hover:text-red-400 h-7 w-7"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Desktop Sidebar - Collapsible */}
            <aside className={cn(
                "hidden lg:flex flex-col relative z-20 bg-zinc-950 border-r border-white/10 transition-all duration-300",
                sidebarCollapsed ? "w-16" : "w-52 xl:w-60"
            )}>
                <div className={cn(
                    "h-14 flex items-center border-b border-white/10",
                    sidebarCollapsed ? "justify-center px-2" : "px-4"
                )}>
                    <Link href="/" className="flex items-center gap-2 cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-[#f9b410] flex items-center justify-center shadow-[0_0_10px_rgba(249,180,16,0.3)]">
                            <Package className="w-5 h-5 text-black" />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white leading-none">Beehouse</span>
                                <span className="text-[9px] text-[#f9b410] font-bold tracking-widest">RH</span>
                            </div>
                        )}
                    </Link>
                </div>

                <div className="flex-1 py-4 overflow-y-auto">
                    {!sidebarCollapsed && (
                        <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                            Menu
                        </p>
                    )}

                    {navLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/' && pathname.startsWith(link.href))
                        const Icon = link.icon

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                title={sidebarCollapsed ? link.label : undefined}
                                className={cn(
                                    'flex items-center gap-2 text-sm transition-all duration-200 group relative',
                                    sidebarCollapsed
                                        ? 'justify-center py-3 mx-2 rounded-lg'
                                        : 'px-4 py-2.5 border-l-[3px]',
                                    isActive
                                        ? sidebarCollapsed
                                            ? 'text-[#f9b410] bg-white/10'
                                            : 'text-[#f9b410] font-bold border-[#f9b410] bg-white/5'
                                        : sidebarCollapsed
                                            ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', isActive ? 'text-[#f9b410]' : 'text-zinc-500 group-hover:text-white')} />
                                {!sidebarCollapsed && <span className="text-[13px]">{link.label}</span>}
                            </Link>
                        )
                    })}
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-30"
                >
                    {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                {/* User Section */}
                <div className={cn(
                    "border-t border-white/10 bg-zinc-900/50",
                    sidebarCollapsed ? "p-2" : "p-3"
                )}>
                    {sidebarCollapsed ? (
                        <div className="flex flex-col items-center gap-2">
                            <Avatar size="sm" className="bg-[#f9b410] text-black w-8 h-8">
                                <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                            </Avatar>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-zinc-500 hover:text-red-400 h-7 w-7"
                                title="Sair"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                            <Avatar size="sm" className="bg-[#f9b410] text-black w-7 h-7">
                                <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{userName}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-zinc-500 hover:text-red-400 h-6 w-6"
                            >
                                <LogOut className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                <header className="h-12 lg:h-14 px-3 lg:px-4 xl:px-6 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm z-30 sticky top-0">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-8 w-8"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu className="w-4 h-4" />
                        </Button>

                        <div className="lg:hidden flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#f9b410] flex items-center justify-center">
                                <Package className="w-3.5 h-3.5 text-black" />
                            </div>
                            <span className="font-bold text-sm text-gray-800">{routeName}</span>
                        </div>

                        <h2 className="text-sm xl:text-base font-bold text-gray-800 hidden lg:block capitalize border-l-[3px] border-[#f9b410] pl-2">
                            {routeName}
                        </h2>
                    </div>

                    <div className="flex items-center gap-1.5 lg:gap-2">
                        <div className="hidden xl:block w-40 2xl:w-48">
                            <Input
                                icon={Search}
                                placeholder="Buscar..."
                                className="w-full rounded-full bg-gray-50 border-gray-200 h-8 text-sm"
                            />
                        </div>

                        {/* Quick Add Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    className="rounded-full w-8 h-8 shadow-md hover:scale-105 transition-transform bg-[#f9b410] text-black hover:bg-[#e0a20e]"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase">
                                    Adicionar
                                </div>
                                <DropdownMenuSeparator />
                                <Link href="/colaboradores/novo">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Users className="w-4 h-4 mr-2" />
                                        Novo Colaborador
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/contratos/novo">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Briefcase className="w-4 h-4 mr-2" />
                                        Novo Contrato
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/recessos/novo">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Novo Recesso
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/materiais/entregas">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Package className="w-4 h-4 mr-2" />
                                        Entrega de EPI
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/documentos/upload">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Upload Documento
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full p-0.5 hover:bg-gray-100 h-8 w-8">
                                    <Avatar size="sm" className="w-7 h-7 bg-zinc-900 text-[#f9b410] ring-2 ring-gray-100">
                                        <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <div className="px-2 py-1 text-xs font-medium text-gray-900 truncate">
                                    {userName}
                                </div>
                                <DropdownMenuSeparator />
                                <Link href="/perfil">
                                    <DropdownMenuItem className="text-sm cursor-pointer">
                                        <User className="w-3.5 h-3.5 mr-2" />
                                        Meu Perfil
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 text-sm">
                                    <LogOut className="w-3.5 h-3.5 mr-2" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-3 lg:p-4 xl:p-6 bg-gray-50 scroll-smooth pb-16 lg:pb-4">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-1.5 z-40">
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
                                        'flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-colors min-w-[50px]',
                                        isActive
                                            ? 'text-[#f9b410]'
                                            : 'text-gray-500 hover:text-gray-700'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-[9px] font-medium truncate">{link.label.split(' ')[0]}</span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </div>
    )
}
