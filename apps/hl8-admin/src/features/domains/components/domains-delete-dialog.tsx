'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { domainService } from '@/lib/services/domain.service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Domain } from '../data/schema'
import { useDomains } from './domains-provider'

type DomainDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Domain
}

export function DomainsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: DomainDeleteDialogProps) {
  const [value, setValue] = useState('')
  const { setOpen, refreshDomains } = useDomains()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.code) return

    try {
      await domainService.deleteDomain(currentRow.id)
      toast.success('Domain deleted successfully')
      onOpenChange(false)
      setOpen(null)
      // 刷新域列表
      refreshDomains?.()
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
          Delete Domain
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>{currentRow.name}</span> (Code:{' '}
            <span className='font-bold'>{currentRow.code}</span>)?
            <br />
            This action will permanently remove the domain from the system. This
            cannot be undone.
          </p>

          <Label className='my-2'>
            Domain Code:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Enter domain code to confirm deletion.'
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
