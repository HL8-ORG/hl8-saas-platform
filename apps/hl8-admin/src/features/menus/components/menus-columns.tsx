import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { statusColors, menuTypeColors } from '../data/data'
import { type Menu } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const menusColumns: ColumnDef<Menu>[] = [
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
    accessorKey: 'menuName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Menu Name' />
    ),
    cell: ({ row }) => {
      const name = row.getValue('menuName') as string
      return <LongText className='max-w-36'>{name}</LongText>
    },
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'menuType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const menuType = row.getValue('menuType') as
        | 'MENU'
        | 'DIRECTORY'
        | 'BUTTON'
      const badgeColor = menuTypeColors.get(menuType)
      return (
        <div className='flex space-x-2'>
          <Badge
            variant='outline'
            className={cn('capitalize', badgeColor?.className)}
          >
            {menuType}
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
    accessorKey: 'routeName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Route Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('routeName')}</LongText>
    ),
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'routePath',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Route Path' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('routePath')}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'component',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Component' />
    ),
    cell: ({ row }) => (
      <div className='w-fit max-w-[200px] truncate ps-2 text-nowrap'>
        {row.getValue('component')}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'pid',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Parent ID' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('pid') || '-'}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'order',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('order')}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const { status } = row.original
      const badgeColor = statusColors.get(status)
      return (
        <div className='flex space-x-2'>
          <Badge
            variant='outline'
            className={cn('capitalize', badgeColor?.className)}
          >
            {row.getValue('status')}
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
    id: 'actions',
    cell: DataTableRowActions,
  },
]
