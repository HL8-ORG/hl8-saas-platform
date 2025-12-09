'use client'

import { useState } from 'react'
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

type ProductTemplateDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: ProductTemplate
}

export function ProductTemplatesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: ProductTemplateDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { setOpen, refreshProductTemplates } = useProductTemplates()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.code) return

    try {
      await productTemplateService.deleteProductTemplate(currentRow.id)
      toast.success('产品模板删除成功')
      onOpenChange(false)
      setOpen(null)
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
      disabled={value.trim() !== currentRow.code}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          删除产品模板
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            确定要删除 <span className='font-bold'>{currentRow.name}</span>{' '}
            (编码: <span className='font-bold'>{currentRow.code}</span>)?
            <br />
            此操作将永久从系统中删除该产品模板。此操作无法撤销。
          </p>

          <Label className='my-2'>
            产品模板编码:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='输入产品模板编码以确认删除'
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
