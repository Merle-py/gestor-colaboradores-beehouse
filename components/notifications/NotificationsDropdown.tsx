'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Bell,
    AlertTriangle,
    Calendar,
    FileText,
    DollarSign,
    X,
    Clock,
    CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface Notification {
    id: string
    type: 'bill_due' | 'bill_overdue' | 'document' | 'recess' | 'general'
    title: string
    message: string
    link?: string
    date: Date
    read: boolean
}

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (open) {
            fetchNotifications()
        }
    }, [open])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token')
            if (!token) {
                setLoading(false)
                return
            }

            const headers = { 'Authorization': `Bearer ${token}` }

            const notifs: Notification[] = []

            // Fetch bills due soon
            const billsRes = await fetch('/api/bills', { headers })
            const billsData = await billsRes.json()

            if (billsData.success && billsData.data) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const nextWeek = new Date(today)
                nextWeek.setDate(nextWeek.getDate() + 7)

                for (const bill of billsData.data) {
                    if (bill.status === 'paid') continue

                    const dueDate = new Date(bill.due_date)
                    dueDate.setHours(0, 0, 0, 0)

                    if (dueDate < today) {
                        // Overdue
                        notifs.push({
                            id: `bill-overdue-${bill.id}`,
                            type: 'bill_overdue',
                            title: 'Conta Vencida!',
                            message: `${bill.description} - R$ ${bill.amount?.toFixed(2)}`,
                            link: '/financeiro/kanban',
                            date: dueDate,
                            read: false,
                        })
                    } else if (dueDate.getTime() === today.getTime()) {
                        // Due today
                        notifs.push({
                            id: `bill-today-${bill.id}`,
                            type: 'bill_due',
                            title: 'Vence Hoje!',
                            message: `${bill.description} - R$ ${bill.amount?.toFixed(2)}`,
                            link: '/financeiro/kanban',
                            date: dueDate,
                            read: false,
                        })
                    } else if (dueDate <= nextWeek) {
                        // Due this week
                        notifs.push({
                            id: `bill-week-${bill.id}`,
                            type: 'bill_due',
                            title: 'Conta a Vencer',
                            message: `${bill.description} vence em ${dueDate.toLocaleDateString('pt-BR')}`,
                            link: '/financeiro/kanban',
                            date: dueDate,
                            read: false,
                        })
                    }
                }
            }

            // Sort by date (most recent first) and priority (overdue first)
            notifs.sort((a, b) => {
                if (a.type === 'bill_overdue' && b.type !== 'bill_overdue') return -1
                if (b.type === 'bill_overdue' && a.type !== 'bill_overdue') return 1
                return b.date.getTime() - a.date.getTime()
            })

            setNotifications(notifs.slice(0, 10))
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
        setLoading(false)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'bill_overdue':
                return <AlertTriangle className="w-4 h-4 text-red-500" />
            case 'bill_due':
                return <Clock className="w-4 h-4 text-yellow-500" />
            case 'document':
                return <FileText className="w-4 h-4 text-blue-500" />
            case 'recess':
                return <Calendar className="w-4 h-4 text-green-500" />
            default:
                return <Bell className="w-4 h-4 text-gray-500" />
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length
    const overdueCount = notifications.filter(n => n.type === 'bill_overdue').length

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold ${overdueCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-primary-500'
                            }`}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <span className="font-semibold">Notificações</span>
                    {overdueCount > 0 && (
                        <Badge variant="error" className="text-xs">
                            {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>

                {loading ? (
                    <div className="p-4 text-center text-gray-500">
                        <Clock className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Carregando...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">Nenhuma notificação</p>
                        <p className="text-xs text-gray-400">Você está em dia!</p>
                    </div>
                ) : (
                    <>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.map((notif) => (
                                <DropdownMenuItem key={notif.id} asChild>
                                    <Link
                                        href={notif.link || '#'}
                                        className={`flex items-start gap-3 p-3 cursor-pointer ${notif.type === 'bill_overdue' ? 'bg-red-50' : ''
                                            }`}
                                    >
                                        <div className="mt-0.5">{getIcon(notif.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${notif.type === 'bill_overdue' ? 'text-red-700' : 'text-gray-900'
                                                }`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {notif.message}
                                            </p>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </div>
                        <DropdownMenuSeparator />
                        <Link href="/financeiro/kanban">
                            <DropdownMenuItem className="text-center text-primary-600 font-medium justify-center">
                                Ver todas as contas
                            </DropdownMenuItem>
                        </Link>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
