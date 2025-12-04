'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

interface DialogTriggerProps {
    asChild?: boolean
    children: React.ReactNode
}

interface DialogContentProps {
    children: React.ReactNode
    className?: string
}

interface DialogHeaderProps {
    children: React.ReactNode
    className?: string
}

interface DialogTitleProps {
    children: React.ReactNode
    className?: string
}

const DialogContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
}>({
    open: false,
    setOpen: () => { },
})

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen

    const setOpen = React.useCallback((value: boolean) => {
        if (controlledOpen === undefined) {
            setInternalOpen(value)
        }
        onOpenChange?.(value)
    }, [controlledOpen, onOpenChange])

    return (
        <DialogContext.Provider value={{ open, setOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
    const { setOpen } = React.useContext(DialogContext)

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                (children as React.ReactElement<any>).props?.onClick?.(e)
                setOpen(true)
            },
        })
    }

    return (
        <button onClick={() => setOpen(true)}>
            {children}
        </button>
    )
}

export function DialogContent({ children, className }: DialogContentProps) {
    const { open, setOpen } = React.useContext(DialogContext)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            {/* Content */}
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl p-6",
                    className
                )}
            >
                {/* Close button */}
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
                {children}
            </div>
        </div>
    )
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
    return (
        <div className={cn("mb-4", className)}>
            {children}
        </div>
    )
}

export function DialogTitle({ children, className }: DialogTitleProps) {
    return (
        <h2 className={cn("text-xl font-bold text-gray-900", className)}>
            {children}
        </h2>
    )
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <p className={cn("text-sm text-gray-500 mt-1", className)}>
            {children}
        </p>
    )
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex justify-end gap-3 mt-6", className)}>
            {children}
        </div>
    )
}
