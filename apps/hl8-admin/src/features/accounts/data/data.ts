import {
  CheckCircle2,
  XCircle,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Building2,
} from 'lucide-react'

/**
 * 科目状态选项
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
 * 账户类型选项
 */
export const accountTypes = [
  {
    value: 'asset_receivable',
    label: '应收资产',
    icon: TrendingUp,
  },
  {
    value: 'asset_cash',
    label: '现金资产',
    icon: Wallet,
  },
  {
    value: 'asset_current',
    label: '流动资产',
    icon: TrendingUp,
  },
  {
    value: 'asset_non_current',
    label: '非流动资产',
    icon: Building2,
  },
  {
    value: 'asset_fixed',
    label: '固定资产',
    icon: Building2,
  },
  {
    value: 'asset_prepayments',
    label: '预付资产',
    icon: TrendingUp,
  },
  {
    value: 'liability_payable',
    label: '应付负债',
    icon: TrendingDown,
  },
  {
    value: 'liability_credit_card',
    label: '信用卡负债',
    icon: CreditCard,
  },
  {
    value: 'liability_current',
    label: '流动负债',
    icon: TrendingDown,
  },
  {
    value: 'liability_non_current',
    label: '非流动负债',
    icon: TrendingDown,
  },
  {
    value: 'equity',
    label: '权益',
    icon: TrendingUp,
  },
  {
    value: 'equity_unaffected',
    label: '未影响权益',
    icon: TrendingUp,
  },
  {
    value: 'income',
    label: '收入',
    icon: TrendingUp,
  },
  {
    value: 'expense',
    label: '费用',
    icon: TrendingDown,
  },
  {
    value: 'expense_depreciation',
    label: '折旧费用',
    icon: TrendingDown,
  },
  {
    value: 'expense_direct_cost',
    label: '直接成本',
    icon: TrendingDown,
  },
  {
    value: 'off_balance',
    label: '表外',
    icon: XCircle,
  },
] as const

/**
 * 内部组选项
 */
export const internalGroups = [
  {
    value: 'asset',
    label: '资产',
    icon: TrendingUp,
  },
  {
    value: 'liability',
    label: '负债',
    icon: TrendingDown,
  },
  {
    value: 'equity',
    label: '权益',
    icon: TrendingUp,
  },
  {
    value: 'income',
    label: '收入',
    icon: TrendingUp,
  },
  {
    value: 'expense',
    label: '费用',
    icon: TrendingDown,
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
 * 账户类型颜色映射
 */
export const accountTypeColors = new Map<
  | 'asset_receivable'
  | 'asset_cash'
  | 'asset_current'
  | 'asset_non_current'
  | 'asset_fixed'
  | 'asset_prepayments'
  | 'liability_payable'
  | 'liability_credit_card'
  | 'liability_current'
  | 'liability_non_current'
  | 'equity'
  | 'equity_unaffected'
  | 'income'
  | 'expense'
  | 'expense_depreciation'
  | 'expense_direct_cost'
  | 'off_balance',
  { className: string }
>([
  ['asset_receivable', { className: 'bg-blue-500/10 text-blue-500' }],
  ['asset_cash', { className: 'bg-green-500/10 text-green-500' }],
  ['asset_current', { className: 'bg-cyan-500/10 text-cyan-500' }],
  ['asset_non_current', { className: 'bg-teal-500/10 text-teal-500' }],
  ['asset_fixed', { className: 'bg-purple-500/10 text-purple-500' }],
  ['asset_prepayments', { className: 'bg-indigo-500/10 text-indigo-500' }],
  ['liability_payable', { className: 'bg-orange-500/10 text-orange-500' }],
  ['liability_credit_card', { className: 'bg-red-500/10 text-red-500' }],
  ['liability_current', { className: 'bg-amber-500/10 text-amber-500' }],
  ['liability_non_current', { className: 'bg-yellow-500/10 text-yellow-500' }],
  ['equity', { className: 'bg-emerald-500/10 text-emerald-500' }],
  ['equity_unaffected', { className: 'bg-lime-500/10 text-lime-500' }],
  ['income', { className: 'bg-green-600/10 text-green-600' }],
  ['expense', { className: 'bg-rose-500/10 text-rose-500' }],
  ['expense_depreciation', { className: 'bg-pink-500/10 text-pink-500' }],
  ['expense_direct_cost', { className: 'bg-fuchsia-500/10 text-fuchsia-500' }],
  ['off_balance', { className: 'bg-gray-500/10 text-gray-500' }],
])

/**
 * 内部组颜色映射
 */
export const internalGroupColors = new Map<
  'asset' | 'liability' | 'equity' | 'income' | 'expense',
  { className: string }
>([
  ['asset', { className: 'bg-blue-500/10 text-blue-500' }],
  ['liability', { className: 'bg-orange-500/10 text-orange-500' }],
  ['equity', { className: 'bg-emerald-500/10 text-emerald-500' }],
  ['income', { className: 'bg-green-600/10 text-green-600' }],
  ['expense', { className: 'bg-rose-500/10 text-rose-500' }],
])

/**
 * 科目图标
 */
export const accountIcon = Wallet
