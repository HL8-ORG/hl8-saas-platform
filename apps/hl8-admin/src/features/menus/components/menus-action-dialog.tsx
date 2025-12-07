'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { menuService } from '@/lib/services/menu.service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { statuses, menuTypes } from '../data/data'
import { type Menu } from '../data/schema'
import { useMenus } from './menus-provider'

const formSchema = z.object({
  menuName: z.string().min(1, 'Menu name is required.'),
  menuType: z.enum(['MENU', 'DIRECTORY', 'BUTTON']),
  routeName: z.string().min(1, 'Route name is required.'),
  routePath: z.string().min(1, 'Route path is required.'),
  component: z.string().min(1, 'Component is required.'),
  status: z.enum(['active', 'inactive']),
  pid: z.number(),
  order: z.number().min(0),
  iconType: z.number().nullable().optional(),
  icon: z.string().nullable().optional(),
  pathParam: z.string().nullable().optional(),
  activeMenu: z.string().nullable().optional(),
  hideInMenu: z.boolean().nullable().optional(),
  i18nKey: z.string().nullable().optional(),
  keepAlive: z.boolean().nullable().optional(),
  constant: z.boolean(),
  href: z.string().nullable().optional(),
  multiTab: z.boolean().nullable().optional(),
})

type MenuForm = z.infer<typeof formSchema>

type MenuActionDialogProps = {
  currentRow?: Menu
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MenusActionDialog({
  currentRow,
  open,
  onOpenChange,
}: MenuActionDialogProps) {
  const isEdit = !!currentRow
  const { setOpen, refreshMenus } = useMenus()
  const form = useForm<MenuForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          menuName: currentRow.menuName,
          menuType: currentRow.menuType,
          routeName: currentRow.routeName,
          routePath: currentRow.routePath,
          component: currentRow.component,
          status: currentRow.status,
          pid: currentRow.pid,
          order: currentRow.order,
          iconType: currentRow.iconType,
          icon: currentRow.icon,
          pathParam: currentRow.pathParam,
          activeMenu: currentRow.activeMenu,
          hideInMenu: currentRow.hideInMenu,
          i18nKey: currentRow.i18nKey,
          keepAlive: currentRow.keepAlive,
          constant: currentRow.constant,
          href: currentRow.href,
          multiTab: currentRow.multiTab,
        }
      : {
          menuName: '',
          menuType: 'MENU',
          routeName: '',
          routePath: '',
          component: '',
          status: 'active',
          pid: 0,
          order: 0,
          iconType: null,
          icon: null,
          pathParam: null,
          activeMenu: null,
          hideInMenu: null,
          i18nKey: null,
          keepAlive: null,
          constant: false,
          href: null,
          multiTab: null,
        },
  })

  const onSubmit = async (values: MenuForm) => {
    try {
      const menuData = {
        menuName: values.menuName,
        menuType: values.menuType,
        routeName: values.routeName,
        routePath: values.routePath,
        component: values.component,
        status: (values.status === 'active' ? 'ENABLED' : 'DISABLED') as
          | 'ENABLED'
          | 'DISABLED',
        pid: values.pid,
        order: values.order,
        iconType: values.iconType ?? null,
        icon: values.icon ?? null,
        pathParam: values.pathParam ?? null,
        activeMenu: values.activeMenu ?? null,
        hideInMenu: values.hideInMenu ?? null,
        i18nKey: values.i18nKey ?? null,
        keepAlive: values.keepAlive ?? null,
        constant: values.constant,
        href: values.href ?? null,
        multiTab: values.multiTab ?? null,
      }

      if (isEdit && currentRow) {
        await menuService.updateMenu({
          id: currentRow.id,
          ...menuData,
        })
        toast.success('Menu updated successfully')
      } else {
        await menuService.createMenu(menuData)
        toast.success('Menu created successfully')
      }
      form.reset()
      onOpenChange(false)
      setOpen(null)
      // 刷新菜单列表
      refreshMenus?.()
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
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Menu' : 'Add New Menu'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the menu here. ' : 'Create new menu here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='w-full overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='menu-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='menuName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Menu Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='用户管理'
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
                name='menuType'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Menu Type
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select menu type'
                      className='col-span-4'
                      isControlled={true}
                      items={menuTypes.map((type) => ({
                        label: type.label,
                        value: type.value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='routeName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Route Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='user-management'
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
                name='routePath'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Route Path
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='/user'
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
                name='component'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Component
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='UserManagement'
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
                        type='number'
                        placeholder='0'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='order'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Order</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='icon'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Icon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='user'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                        value={field.value ?? ''}
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
                name='constant'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Constant
                    </FormLabel>
                    <FormControl>
                      <div className='col-span-4 flex items-center space-x-2'>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className='text-muted-foreground text-sm'>
                          是否常量路由
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='menu-form'>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
