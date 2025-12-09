'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { productTemplateService } from '@/lib/services/product-template.service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type ProductTemplate } from '../data/schema'
import { useProductTemplates } from './product-templates-provider'

type ProductTemplateMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'DELETE'

export function ProductTemplatesMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: ProductTemplateMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const { refreshProductTemplates } = useProductTemplates()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`请输入 "${CONFIRM_WORD}" 以确认。`)
      return
    }

    try {
      const productTemplates = selectedRows.map(
        (row) => row.original as ProductTemplate
      )
      const deletePromises = productTemplates.map((productTemplate) =>
        productTemplateService.deleteProductTemplate(productTemplate.id)
      )
      await Promise.all(deletePromises)
      toast.success(
        `成功删除 ${productTemplates.length} 个${
          productTemplates.length > 1 ? '产品模板' : '产品模板'
        }`
      )
      table.resetRowSelection()
      onOpenChange(false)
      // 刷新产品模板列表
      refreshProductTemplates?.()
    } catch (error) {
      handleServerError(error)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          删除 {selectedRows.length} 个
          {selectedRows.length > 1 ? '产品模板' : '产品模板'}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            确定要删除选中的产品模板吗？ <br />
            此操作无法撤销。
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>请输入 "{CONFIRM_WORD}" 以确认：</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`输入 "${CONFIRM_WORD}" 以确认。`}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>警告！</AlertTitle>
            <AlertDescription>请谨慎操作，此操作无法回滚。</AlertDescription>
          </Alert>
        </div>
      }
      confirmText='删除'
      destructive
    />
  )
}
