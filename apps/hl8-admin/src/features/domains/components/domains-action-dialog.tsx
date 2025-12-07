'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { domainService } from '@/lib/services/domain.service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type Domain } from '../data/schema'
import { useDomains } from './domains-provider'

const formSchema = z.object({
  code: z.string().min(1, 'Code is required.'),
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
})

type DomainForm = z.infer<typeof formSchema>

type DomainActionDialogProps = {
  currentRow?: Domain
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DomainsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: DomainActionDialogProps) {
  const isEdit = !!currentRow
  const { setOpen, refreshDomains } = useDomains()
  const form = useForm<DomainForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          code: currentRow.code,
          name: currentRow.name,
          description: currentRow.description || '',
        }
      : {
          code: '',
          name: '',
          description: '',
        },
  })

  const onSubmit = async (values: DomainForm) => {
    try {
      if (isEdit && currentRow) {
        await domainService.updateDomain({
          id: currentRow.id,
          code: values.code,
          name: values.name,
          description: values.description || null,
        })
        toast.success('Domain updated successfully')
      } else {
        await domainService.createDomain({
          code: values.code,
          name: values.name,
          description: values.description || null,
        })
        toast.success('Domain created successfully')
      }
      form.reset()
      onOpenChange(false)
      setOpen(null)
      // 刷新域列表
      refreshDomains?.()
    } catch (error) {
      handleServerError(error)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Domain' : 'Add New Domain'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the domain here. ' : 'Create new domain here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='domain-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='domain001'
                        className='col-span-4'
                        autoComplete='off'
                        disabled={isEdit}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='测试域'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='域描述信息'
                        className='col-span-4'
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='domain-form'>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
