import { CheckCircle2, XCircle, Package } from 'lucide-react'

/**
 * 产品模板状态选项
 */
export const statuses = [
  {
    value: 'active',
    label: '激活',
    icon: CheckCircle2,
  },
  {
    value: 'inactive',
    label: '未激活',
    icon: XCircle,
  },
] as const

/**
 * 产品模板类型选项
 */
export const types = [
  {
    value: 'product',
    label: '产品',
    icon: Package,
  },
  {
    value: 'service',
    label: '服务',
    icon: Package,
  },
  {
    value: 'consu',
    label: '消耗品',
    icon: Package,
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
 * 类型颜色映射
 */
export const typeColors = new Map<
  'product' | 'service' | 'consu',
  { className: string }
>([
  ['product', { className: 'bg-blue-500/10 text-blue-500' }],
  ['service', { className: 'bg-purple-500/10 text-purple-500' }],
  ['consu', { className: 'bg-orange-500/10 text-orange-500' }],
])

/**
 * 产品模板图标
 */
export const productTemplateIcon = Package
