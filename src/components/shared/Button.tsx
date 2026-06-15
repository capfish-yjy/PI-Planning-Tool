import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
}

const variants = {
  primary: 'bg-slate-950 text-white hover:bg-slate-800',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50'
}

export const Button = ({ icon, variant = 'secondary', className = '', children, ...props }: ButtonProps) => (
  <button
    className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    {...props}
  >
    {icon}
    {children}
  </button>
)

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactElement<{ className?: string }>
  variant?: 'secondary' | 'danger'
}

export const IconButton = ({ icon, variant = 'secondary', className = '', ...props }: IconButtonProps) => (
  <button
    type="button"
    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    {...props}
  >
    <span className="inline-flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:stroke-[2.5]">
      {icon}
    </span>
  </button>
)
