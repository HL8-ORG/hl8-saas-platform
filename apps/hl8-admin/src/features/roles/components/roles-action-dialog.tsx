'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { roleService } from '@/lib/services/role.service'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { statuses } from '../data/data'
import { type Role } from '../data/schema'
import { useRoles } from './roles-provider'

const formSchema = z.object({
  code: z.string().min(1, 'Code is required.'),
  name: z.string().min(1, 'Name is required.'),
  pid: z.string(), // 父角色ID，空字符串表示根角色
  status: z.enum(['active', 'inactive']),
  description: z.string().optional(),
})

type RoleForm = z.infer<typeof formSchema>

type RoleActionDialogProps = {
  currentRow?: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: RoleActionDialogProps) {
  const isEdit = !!currentRow
  const { setOpen, refreshRoles } = useRoles()
  const form = useForm<RoleForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          code: currentRow.code,
          name: currentRow.name,
          pid: currentRow.pid,
          status: currentRow.status,
          description: currentRow.description || '',
        }
      : {
          code: '',
          name: '',
          pid: '',
          status: 'active',
          description: '',
        },
  })

  const onSubmit = async (values: RoleForm) => {
    try {
      if (isEdit && currentRow) {
        await roleService.updateRole({
          id: currentRow.id,
          code: values.code,
          name: values.name,
          pid: values.pid,
          status: values.status === 'active' ? 'ENABLED' : 'DISABLED',
          description: values.description || null,
        })
        toast.success('Role updated successfully')
      } else {
        await roleService.createRole({
          code: values.code,
          name: values.name,
          pid: values.pid,
          status: values.status === 'active' ? 'ENABLED' : 'DISABLED',
          description: values.description || null,
        })
        toast.success('Role created successfully')
      }
      form.reset()
      onOpenChange(false)
      setOpen(null)
      // 刷新角色列表
      refreshRoles?.()
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
          <DialogTitle>{isEdit ? 'Edit Role' : 'Add New Role'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the role here. ' : 'Create new role here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='role-form'
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
                        placeholder='admin'
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
                        placeholder='管理员'
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
                name='pid'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Parent ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='父角色ID（空字符串表示根角色）'
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
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Status
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select status'
                      className='col-span-4'
                      isControlled={true}
                      items={statuses.map((status) => ({
                        label: status.label,
                        value: status.value,
                      }))}
                    />
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
                        placeholder='角色描述信息'
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
          <Button type='submit' form='role-form'>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
