'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { roleService } from '@/lib/services/role.service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Role } from '../data/schema'
import { useRoles } from './roles-provider'

type RoleDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Role
}

export function RolesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: RoleDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { setOpen, refreshRoles } = useRoles()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.code) return

    try {
      await roleService.deleteRole(currentRow.id)
      toast.success('Role deleted successfully')
      onOpenChange(false)
      setOpen(null)
      // 刷新角色列表
      refreshRoles?.()
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
          Delete Role
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>{currentRow.name}</span> (Code:{' '}
            <span className='font-bold'>{currentRow.code}</span>)?
            <br />
            This action will permanently remove the role from the system. This
            cannot be undone.
          </p>

          <Label className='my-2'>
            Role Code:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Enter role code to confirm deletion.'
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
