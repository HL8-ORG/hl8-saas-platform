'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { menuService } from '@/lib/services/menu.service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Menu } from '../data/schema'
import { useMenus } from './menus-provider'

type MenuDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Menu
}

export function MenusDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: MenuDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { setOpen, refreshMenus } = useMenus()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.routeName) return

    try {
      await menuService.deleteMenu(currentRow.id)
      toast.success('Menu deleted successfully')
      onOpenChange(false)
      setOpen(null)
      // 刷新菜单列表
      refreshMenus?.()
    } catch (error) {
      handleServerError(error)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.routeName}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Delete Menu
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>{currentRow.menuName}</span> (Route:{' '}
            <span className='font-bold'>{currentRow.routeName}</span>)?
            <br />
            This action will permanently remove the menu from the system. This
            cannot be undone.
          </p>

          <Label className='my-2'>
            Route Name:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Enter route name to confirm deletion.'
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  )
}
