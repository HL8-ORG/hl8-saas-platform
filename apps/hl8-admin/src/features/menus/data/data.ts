import { Menu, CheckCircle2, XCircle } from 'lucide-react'

/**
 * 菜单状态选项
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
 * 菜单类型选项
 */
export const menuTypes = [
  {
    value: 'MENU',
    label: 'Menu',
    icon: Menu,
  },
  {
    value: 'DIRECTORY',
    label: 'Directory',
    icon: Menu,
  },
  {
    value: 'BUTTON',
    label: 'Button',
    icon: Menu,
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
 * 菜单类型颜色映射
 */
export const menuTypeColors = new Map<
  'MENU' | 'DIRECTORY' | 'BUTTON',
  { className: string }
>([
  ['MENU', { className: 'bg-blue-500/10 text-blue-500' }],
  ['DIRECTORY', { className: 'bg-purple-500/10 text-purple-500' }],
  ['BUTTON', { className: 'bg-orange-500/10 text-orange-500' }],
])

/**
 * 菜单图标
 */
export const menuIcon = Menu
