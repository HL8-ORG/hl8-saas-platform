import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { statusColors, accountTypeColors } from '../data/data'
import { type Account } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

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

export const accountsColumns: ColumnDef<Account>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='代码' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('code')}</LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='名称' />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return <LongText className='max-w-36'>{name}</LongText>
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'accountType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='账户类型' />
    ),
    cell: ({ row }) => {
      const accountType = row.getValue('accountType') as Account['accountType']
      const badgeColor = accountTypeColors.get(accountType)
      return (
        <div className='flex space-x-2'>
          <Badge
            variant='outline'
            className={cn('capitalize', badgeColor?.className)}
          >
            {accountTypeLabels[accountType] || accountType}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'groupId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='组' />
    ),
    cell: ({ row }) => {
      const groupId = row.getValue('groupId') as string | undefined
      return (
        <div className='w-fit max-w-[200px] truncate ps-2 text-nowrap'>
          {groupId || '-'}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'reconcile',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='可对账' />
    ),
    cell: ({ row }) => {
      const reconcile = row.getValue('reconcile') as boolean | undefined
      const accountType = row.original.accountType
      // 某些账户类型不应显示对账选项
      if (
        accountType === 'asset_cash' ||
        accountType === 'liability_credit_card' ||
        accountType === 'off_balance'
      ) {
        return <span className='text-muted-foreground'>-</span>
      }
      return reconcile ? (
        <Badge variant='outline' className='bg-green-500/10 text-green-500'>
          是
        </Badge>
      ) : (
        <Badge variant='outline' className='bg-gray-500/10 text-gray-500'>
          否
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'active',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const active = row.getValue('active') as boolean | undefined
      const status = active ? 'active' : 'inactive'
      const badgeColor = statusColors.get(status)
      return (
        <div className='flex space-x-2'>
          <Badge
            variant='outline'
            className={cn('capitalize', badgeColor?.className)}
          >
            {status === 'active' ? '激活' : '未激活'}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const active = row.getValue(id) as boolean | undefined
      const status = active ? 'active' : 'inactive'
      return value.includes(status)
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'nonTrade',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='非贸易' />
    ),
    cell: ({ row }) => {
      const nonTrade = row.getValue('nonTrade') as boolean | undefined
      const accountType = row.original.accountType
      // 仅应收应付账户显示非贸易选项
      if (
        accountType !== 'asset_receivable' &&
        accountType !== 'liability_payable'
      ) {
        return <span className='text-muted-foreground'>-</span>
      }
      return nonTrade ? (
        <Badge variant='outline' className='bg-orange-500/10 text-orange-500'>
          是
        </Badge>
      ) : (
        <Badge variant='outline' className='bg-gray-500/10 text-gray-500'>
          否
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'taxIds',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='税种' />
    ),
    cell: ({ row }) => {
      const taxIds = row.getValue('taxIds') as string[] | undefined
      if (!taxIds || taxIds.length === 0) {
        return <span className='text-muted-foreground'>-</span>
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {taxIds.slice(0, 2).map((taxId) => (
            <Badge key={taxId} variant='secondary' className='text-xs'>
              {taxId}
            </Badge>
          ))}
          {taxIds.length > 2 && (
            <Badge variant='secondary' className='text-xs'>
              +{taxIds.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'tagIds',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='标签' />
    ),
    cell: ({ row }) => {
      const tagIds = row.getValue('tagIds') as string[] | undefined
      if (!tagIds || tagIds.length === 0) {
        return <span className='text-muted-foreground'>-</span>
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {tagIds.slice(0, 2).map((tagId) => (
            <Badge key={tagId} variant='secondary' className='text-xs'>
              {tagId}
            </Badge>
          ))}
          {tagIds.length > 2 && (
            <Badge variant='secondary' className='text-xs'>
              +{tagIds.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'currencyId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='货币' />
    ),
    cell: ({ row }) => {
      const currencyId = row.getValue('currencyId') as string | undefined
      return (
        <div className='w-fit max-w-[100px] truncate ps-2 text-nowrap'>
          {currencyId || '-'}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'companyIds',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='公司' />
    ),
    cell: ({ row }) => {
      const companyIds = row.getValue('companyIds') as string[] | undefined
      if (!companyIds || companyIds.length === 0) {
        return <span className='text-muted-foreground'>-</span>
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {companyIds.slice(0, 1).map((companyId) => (
            <Badge key={companyId} variant='secondary' className='text-xs'>
              {companyId}
            </Badge>
          ))}
          {companyIds.length > 1 && (
            <Badge variant='secondary' className='text-xs'>
              +{companyIds.length - 1}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
