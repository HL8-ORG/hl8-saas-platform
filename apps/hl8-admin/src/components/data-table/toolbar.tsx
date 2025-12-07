import { useEffect, useState } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableFacetedFilter } from './faceted-filter'
import { DataTableViewOptions } from './view-options'

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  filters?: {
    columnId: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]
}

/**
 * 防抖 Hook
 * 延迟执行函数，避免频繁调用
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Filter...',
  searchKey,
  filters = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter

  // 使用本地状态管理输入值，避免立即更新表格状态
  const [localSearchValue, setLocalSearchValue] = useState<string>(() => {
    if (searchKey) {
      return (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
    }
    return table.getState().globalFilter ?? ''
  })

  // 使用防抖延迟更新表格状态
  const debouncedSearchValue = useDebounce(localSearchValue, 500)

  // 当防抖后的值变化时，更新表格状态
  useEffect(() => {
    if (searchKey) {
      const currentValue =
        (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
      if (debouncedSearchValue !== currentValue) {
        table.getColumn(searchKey)?.setFilterValue(debouncedSearchValue)
      }
    } else {
      const currentValue = table.getState().globalFilter ?? ''
      if (debouncedSearchValue !== currentValue) {
        table.setGlobalFilter(debouncedSearchValue)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue, searchKey])

  // 当表格状态从外部更新时（如重置），同步本地状态
  // 使用 ref 来跟踪是否是我们自己触发的更新，避免循环
  useEffect(() => {
    if (searchKey) {
      const tableValue =
        (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
      // 只有当表格值与本地值不同，且不是我们刚刚设置的值时，才同步
      if (
        tableValue !== localSearchValue &&
        tableValue !== debouncedSearchValue
      ) {
        setLocalSearchValue(tableValue)
      }
    } else {
      const tableValue = table.getState().globalFilter ?? ''
      if (
        tableValue !== localSearchValue &&
        tableValue !== debouncedSearchValue
      ) {
        setLocalSearchValue(tableValue)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnFilters, table.getState().globalFilter])

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        {searchKey ? (
          <Input
            placeholder={searchPlaceholder}
            value={localSearchValue}
            onChange={(event) => {
              setLocalSearchValue(event.target.value)
            }}
            className='h-8 w-[150px] lg:w-[250px]'
          />
        ) : (
          <Input
            placeholder={searchPlaceholder}
            value={localSearchValue}
            onChange={(event) => {
              setLocalSearchValue(event.target.value)
            }}
            className='h-8 w-[150px] lg:w-[250px]'
          />
        )}
        <div className='flex gap-x-2'>
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            )
          })}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ms-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
