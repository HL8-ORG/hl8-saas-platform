import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { statusColors, typeColors } from '../data/data'
import { type ProductTemplate } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const productTemplatesColumns: ColumnDef<ProductTemplate>[] = [
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
      <DataTableColumnHeader column={column} title='编码' />
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
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类型' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as ProductTemplate['type']
      const badgeColor = typeColors.get(type)
      const typeLabels: Record<ProductTemplate['type'], string> = {
        product: '产品',
        service: '服务',
        consu: '消耗品',
      }
      return (
        <div className='flex space-x-2'>
          <Badge
            variant='outline'
            className={cn('capitalize', badgeColor?.className)}
          >
            {typeLabels[type] || type}
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
    accessorKey: 'categoryId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类别' />
    ),
    cell: ({ row }) => {
      const categoryId = row.getValue('categoryId') as string | undefined
      return (
        <div className='w-fit max-w-[200px] truncate ps-2 text-nowrap'>
          {categoryId || '-'}
        </div>
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
    accessorKey: 'image',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='图片' />
    ),
    cell: ({ row }) => {
      const image = row.getValue('image') as string | undefined
      return image ? (
        <img
          src={image}
          alt={row.original.name}
          className='h-10 w-10 rounded object-cover'
        />
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
