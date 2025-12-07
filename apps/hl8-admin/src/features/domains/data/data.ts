import { Building2, CheckCircle2, XCircle } from 'lucide-react'

/**
 * 域状态选项
 */
export const statuses = [
  {
    value: 'active',
    label: 'Active',
    icon: CheckCircle2,
  },
  {
    value: 'inactive',
    label: 'Inactive',
    icon: XCircle,
  },
] as const

/**
 * 状态颜色映射
 */
export const statusColors = new Map<
  'active' | 'inactive',
  { className: string }
>([
  ['active', { className: 'bg-green-500/10 text-green-500' }],
  ['inactive', { className: 'bg-red-500/10 text-red-500' }],
])

/**
 * 域图标
 */
export const domainIcon = Building2
