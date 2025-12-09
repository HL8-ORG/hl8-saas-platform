'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Account } from '../data/schema'
import { useAccounts } from './accounts-provider'

type AccountsDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Account
}

export function AccountsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: AccountsDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { setOpen, refreshAccounts } = useAccounts()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.code) return

    try {
      // TODO: 实现实际的 API 调用
      // await accountService.deleteAccount(currentRow.id)

      // 暂时使用模拟成功
      toast.success('科目删除成功')
      onOpenChange(false)
      setOpen(null)
      refreshAccounts?.()
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
          删除科目
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            确定要删除 <span className='font-bold'>{currentRow.name}</span>{' '}
            (代码: <span className='font-bold'>{currentRow.code}</span>)?
            <br />
            此操作将永久从系统中删除该科目。此操作无法撤销。
          </p>

          <Label className='my-2'>
            科目代码:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='输入科目代码以确认删除'
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
