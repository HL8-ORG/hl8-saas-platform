import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { statusColors, accountTypeColors } from '../data/data'
import { type Account } from '../data/schema'
import { useAccounts } from './accounts-provider'

type AccountsKanbanProps = {
  data: Account[]
}

/**
 * 账户类型标签映射
 */
const accountTypeLabels: Record<Account['accountType'], string> = {
  asset_receivable: '应收资产',
  asset_cash: '现金资产',
  asset_current: '流动资产',
  asset_non_current: '非流动资产',
  asset_fixed: '固定资产',
  asset_prepayments: '预付资产',
  liability_payable: '应付负债',
  liability_credit_card: '信用卡负债',
  liability_current: '流动负债',
  liability_non_current: '非流动负债',
  equity: '权益',
  equity_unaffected: '未影响权益',
  income: '收入',
  expense: '费用',
  expense_depreciation: '折旧费用',
  expense_direct_cost: '直接成本',
  off_balance: '表外',
}

/**
 * 科目看板视图组件
 * 以卡片形式展示科目列表
 * 根据 XML 配置：显示代码、名称、账户类型
 */
export function AccountsKanban({ data }: AccountsKanbanProps) {
  const { setOpen, setCurrentRow } = useAccounts()

  if (data.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>暂无数据</p>
      </div>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {data.map((account) => {
        const status = account.active ? 'active' : 'inactive'
        const statusBadgeColor = statusColors.get(status)
        const typeBadgeColor = accountTypeColors.get(account.accountType)

        return (
          <Card
            key={account.id}
            className={cn(
              'hover:border-primary cursor-pointer transition-all hover:shadow-md'
            )}
            onClick={() => {
              setCurrentRow(account)
              setOpen('edit')
            }}
          >
            <CardContent className='p-4'>
              <div className='space-y-3'>
                {/* 代码和名称区域 */}
                <div>
                  <div className='mb-1 flex items-center justify-between'>
                    <h3 className='truncate text-base font-semibold'>
                      {account.name}
                    </h3>
                  </div>
                  <p className='text-muted-foreground truncate text-sm'>
                    {account.code}
                  </p>
                </div>

                {/* 账户类型和状态标签 */}
                <div className='flex flex-wrap gap-1'>
                  <Badge
                    variant='outline'
                    className={cn('text-xs', typeBadgeColor?.className)}
                  >
                    {accountTypeLabels[account.accountType] ||
                      account.accountType}
                  </Badge>
                  <Badge
                    variant='outline'
                    className={cn('text-xs', statusBadgeColor?.className)}
                  >
                    {status === 'active' ? '激活' : '未激活'}
                  </Badge>
                </div>

                {/* 余额信息 */}
                {account.currentBalance !== undefined && (
                  <div className='border-t pt-2'>
                    <p className='text-muted-foreground text-xs'>当前余额</p>
                    <p className='font-semibold'>
                      {account.currentBalance.toLocaleString('zh-CN', {
                        style: 'currency',
                        currency: account.currencyId || 'CNY',
                      })}
                    </p>
                  </div>
                )}

                {/* 税种数量 */}
                {account.relatedTaxesAmount !== undefined &&
                  account.relatedTaxesAmount > 0 && (
                    <div className='pt-1'>
                      <p className='text-muted-foreground text-xs'>
                        关联税种: {account.relatedTaxesAmount}
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
