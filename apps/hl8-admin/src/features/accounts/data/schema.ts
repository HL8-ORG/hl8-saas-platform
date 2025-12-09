import { z } from 'zod'

/**
 * 账户类型
 */
const accountTypeSchema = z.union([
  z.literal('asset_receivable'),
  z.literal('asset_cash'),
  z.literal('asset_current'),
  z.literal('asset_non_current'),
  z.literal('asset_fixed'),
  z.literal('asset_prepayments'),
  z.literal('liability_payable'),
  z.literal('liability_credit_card'),
  z.literal('liability_current'),
  z.literal('liability_non_current'),
  z.literal('equity'),
  z.literal('equity_unaffected'),
  z.literal('income'),
  z.literal('expense'),
  z.literal('expense_depreciation'),
  z.literal('expense_direct_cost'),
  z.literal('off_balance'),
])
export type AccountType = z.infer<typeof accountTypeSchema>

/**
 * 内部组类型
 */
const internalGroupSchema = z.union([
  z.literal('asset'),
  z.literal('liability'),
  z.literal('equity'),
  z.literal('income'),
  z.literal('expense'),
])
export type InternalGroup = z.infer<typeof internalGroupSchema>

/**
 * 科目 Schema
 */
const accountSchema = z.object({
  /**
   * 科目 ID
   */
  id: z.string(),
  /**
   * 科目代码
   */
  code: z.string(),
  /**
   * 科目名称
   */
  name: z.string(),
  /**
   * 占位符代码（用于显示）
   */
  placeholderCode: z.string().optional(),
  /**
   * 账户类型
   */
  accountType: accountTypeSchema,
  /**
   * 内部组
   */
  internalGroup: internalGroupSchema,
  /**
   * 是否可对账
   */
  reconcile: z.boolean().optional(),
  /**
   * 是否激活
   */
  active: z.boolean().optional(),
  /**
   * 是否非贸易（仅应收应付账户）
   */
  nonTrade: z.boolean().optional(),
  /**
   * 税种 ID 列表
   */
  taxIds: z.array(z.string()).optional(),
  /**
   * 标签 ID 列表
   */
  tagIds: z.array(z.string()).optional(),
  /**
   * 货币 ID
   */
  currencyId: z.string().optional(),
  /**
   * 公司 ID 列表
   */
  companyIds: z.array(z.string()).optional(),
  /**
   * 当前余额
   */
  currentBalance: z.number().optional(),
  /**
   * 关联税种数量
   */
  relatedTaxesAmount: z.number().optional(),
  /**
   * 组 ID
   */
  groupId: z.string().optional(),
  /**
   * 描述
   */
  description: z.string().optional(),
  /**
   * 是否已使用（有分录）
   */
  used: z.boolean().optional(),
  /**
   * 根科目 ID（用于搜索面板）
   */
  rootId: z.string().optional(),
  /**
   * 创建时间
   */
  createdAt: z.coerce.date().optional(),
  /**
   * 更新时间
   */
  updatedAt: z.coerce.date().optional(),
})
export type Account = z.infer<typeof accountSchema>

/**
 * 科目列表 Schema
 */
export const accountListSchema = z.array(accountSchema)
