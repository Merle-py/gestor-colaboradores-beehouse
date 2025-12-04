import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
    'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current',
    {
        variants: {
            variant: {
                default: 'bg-white text-gray-900 border-gray-200',
                destructive: 'border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600',
                success: 'border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-600',
                warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600',
                info: 'border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

const iconMap = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
}

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
    title?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = 'default', title, children, ...props }, ref) => {
        const Icon = iconMap[variant || 'default']
        return (
            <div
                ref={ref}
                role="alert"
                className={cn(alertVariants({ variant }), className)}
                {...props}
            >
                <Icon className="h-4 w-4" />
                <div>
                    {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
                    {children && <div className="text-sm [&_p]:leading-relaxed">{children}</div>}
                </div>
            </div>
        )
    }
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }
