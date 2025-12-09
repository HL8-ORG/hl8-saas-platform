import { type Account } from './schema'

/**
 * 科目模拟数据
 * 用于开发和测试环境
 */
export const mockAccounts: Account[] = [
  {
    id: '1',
    code: '1001',
    name: '库存现金',
    placeholderCode: '1001',
    accountType: 'asset_cash',
    internalGroup: 'asset',
    reconcile: true,
    active: true,
    currentBalance: 50000.0,
    relatedTaxesAmount: 0,
    currencyId: 'CNY',
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    code: '1002',
    name: '银行存款',
    placeholderCode: '1002',
    accountType: 'asset_cash',
    internalGroup: 'asset',
    reconcile: true,
    active: true,
    currentBalance: 1500000.0,
    relatedTaxesAmount: 0,
    currencyId: 'CNY',
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    code: '1121',
    name: '应收票据',
    placeholderCode: '1121',
    accountType: 'asset_receivable',
    internalGroup: 'asset',
    reconcile: true,
    active: true,
    nonTrade: false,
    currentBalance: 200000.0,
    relatedTaxesAmount: 1,
    taxIds: ['tax-vat'],
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '4',
    code: '1122',
    name: '应收账款',
    placeholderCode: '1122',
    accountType: 'asset_receivable',
    internalGroup: 'asset',
    reconcile: true,
    active: true,
    nonTrade: false,
    currentBalance: 850000.0,
    relatedTaxesAmount: 2,
    taxIds: ['tax-vat', 'tax-city'],
    tagIds: ['trade', 'domestic'],
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '5',
    code: '1401',
    name: '材料采购',
    placeholderCode: '1401',
    accountType: 'asset_current',
    internalGroup: 'asset',
    active: true,
    currentBalance: 300000.0,
    relatedTaxesAmount: 1,
    taxIds: ['tax-vat'],
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '6',
    code: '1601',
    name: '固定资产',
    placeholderCode: '1601',
    accountType: 'asset_fixed',
    internalGroup: 'asset',
    active: true,
    currentBalance: 5000000.0,
    relatedTaxesAmount: 0,
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '7',
    code: '2201',
    name: '应付票据',
    placeholderCode: '2201',
    accountType: 'liability_payable',
    internalGroup: 'liability',
    reconcile: true,
    active: true,
    nonTrade: false,
    currentBalance: 150000.0,
    relatedTaxesAmount: 1,
    taxIds: ['tax-vat'],
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: '8',
    code: '2202',
    name: '应付账款',
    placeholderCode: '2202',
    accountType: 'liability_payable',
    internalGroup: 'liability',
    reconcile: true,
    active: true,
    nonTrade: false,
    currentBalance: 680000.0,
    relatedTaxesAmount: 2,
    taxIds: ['tax-vat', 'tax-city'],
    tagIds: ['trade', 'domestic'],
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '9',
    code: '2203',
    name: '预收账款',
    placeholderCode: '2203',
    accountType: 'liability_current',
    internalGroup: 'liability',
    active: true,
    currentBalance: 120000.0,
    relatedTaxesAmount: 0,
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '10',
    code: '3001',
    name: '实收资本',
    placeholderCode: '3001',
    accountType: 'equity',
    internalGroup: 'equity',
    active: true,
    currentBalance: 10000000.0,
    relatedTaxesAmount: 0,
    companyIds: ['company-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '11',
    code: '4001',
    name: '主营业务收入',
    placeholderCode: '4001',
    accountType: 'income',
    internalGroup: 'income',
    active: true,
    currentBalance: 0.0,
    relatedTaxesAmount: 1,
    taxIds: ['tax-vat'],
    tagIds: ['main-business'],
    companyIds: ['company-1'],
    used: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '12',
    code: '5001',
    name: '主营业务成本',
    placeholderCode: '5001',
    accountType: 'expense_direct_cost',
    internalGroup: 'expense',
    active: true,
    currentBalance: 0.0,
    relatedTaxesAmount: 0,
    tagIds: ['main-business'],
    companyIds: ['company-1'],
    used: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-08'),
  },
  {
    id: '13',
    code: '5101',
    name: '制造费用',
    placeholderCode: '5101',
    accountType: 'expense',
    internalGroup: 'expense',
    active: true,
    currentBalance: 0.0,
    relatedTaxesAmount: 0,
    companyIds: ['company-1'],
    used: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '14',
    code: '6001',
    name: '销售费用',
    placeholderCode: '6001',
    accountType: 'expense',
    internalGroup: 'expense',
    active: true,
    currentBalance: 0.0,
    relatedTaxesAmount: 0,
    tagIds: ['sales'],
    companyIds: ['company-1'],
    used: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-12'),
  },
  {
    id: '15',
    code: '6601',
    name: '管理费用',
    placeholderCode: '6601',
    accountType: 'expense',
    internalGroup: 'expense',
    active: true,
    currentBalance: 0.0,
    relatedTaxesAmount: 0,
    tagIds: ['admin'],
    companyIds: ['company-1'],
    used: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '16',
    code: '6602',
    name: '财务费用',
    placeholderCode: '6602',
    accountType: 'expense',
    internalGroup: 'expense',
    active: true,
    currentBalance: 0.0,
    relatedTaxesAmount: 0,
    tagIds: ['finance'],
    companyIds: ['company-1'],
    used: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-14'),
  },
  {
    id: '17',
    code: '9999',
    name: '已停用科目',
    placeholderCode: '9999',
    accountType: 'expense',
    internalGroup: 'expense',
    active: false,
    currentBalance: 0.0,
    relatedTaxesAmount: 0,
    companyIds: ['company-1'],
    used: false,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

/**
 * 获取模拟的科目列表（支持分页和筛选）
 */
export function getMockAccounts(params?: {
  current?: number
  size?: number
  name?: string
  code?: string
  accountType?: Account['accountType']
  internalGroup?: Account['internalGroup']
  active?: boolean
  used?: boolean
}): {
  records: Account[]
  total: number
  current: number
  size: number
} {
  let filtered = [...mockAccounts]

  // 按名称筛选
  if (params?.name) {
    const nameLower = params.name.toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(nameLower) ||
        item.code.toLowerCase().includes(nameLower)
    )
  }

  // 按编码筛选
  if (params?.code) {
    const codeLower = params.code.toLowerCase()
    filtered = filtered.filter((item) =>
      item.code.toLowerCase().includes(codeLower)
    )
  }

  // 按账户类型筛选
  if (params?.accountType) {
    filtered = filtered.filter(
      (item) => item.accountType === params.accountType
    )
  }

  // 按内部组筛选
  if (params?.internalGroup) {
    filtered = filtered.filter(
      (item) => item.internalGroup === params.internalGroup
    )
  }

  // 按激活状态筛选
  if (params?.active !== undefined) {
    filtered = filtered.filter((item) => item.active === params.active)
  }

  // 按使用状态筛选
  if (params?.used !== undefined) {
    filtered = filtered.filter((item) => item.used === params.used)
  }

  const total = filtered.length
  const current = params?.current || 1
  const size = params?.size || 10
  const start = (current - 1) * size
  const end = start + size

  return {
    records: filtered.slice(start, end),
    total,
    current,
    size,
  }
}
