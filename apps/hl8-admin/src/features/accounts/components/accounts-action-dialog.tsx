'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { accountTypes } from '../data/data'
import { type Account, type AccountType } from '../data/schema'
import { useAccounts } from './accounts-provider'

const formSchema = z.object({
  name: z.string().min(1, '名称是必填项'),
  code: z.string().min(1, '代码是必填项'),
  accountType: z.enum([
    'asset_receivable',
    'asset_cash',
    'asset_current',
    'asset_non_current',
    'asset_fixed',
    'asset_prepayments',
    'liability_payable',
    'liability_credit_card',
    'liability_current',
    'liability_non_current',
    'equity',
    'equity_unaffected',
    'income',
    'expense',
    'expense_depreciation',
    'expense_direct_cost',
    'off_balance',
  ]),
  internalGroup: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  reconcile: z.boolean().optional(),
  active: z.boolean().optional(),
  nonTrade: z.boolean().optional(),
  currencyId: z.string().optional(),
  description: z.string().optional(),
})

type AccountForm = z.infer<typeof formSchema>

type AccountsActionDialogProps = {
  currentRow?: Account
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: AccountsActionDialogProps) {
  const isEdit = !!currentRow
  const { setOpen, refreshAccounts } = useAccounts()
  const form = useForm<AccountForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          code: currentRow.code,
          accountType: currentRow.accountType,
          internalGroup: currentRow.internalGroup,
          reconcile: currentRow.reconcile,
          active: currentRow.active,
          nonTrade: currentRow.nonTrade,
          currencyId: currentRow.currencyId || '',
          description: currentRow.description || '',
        }
      : {
          name: '',
          code: '',
          accountType: 'asset_current',
          internalGroup: 'asset',
          reconcile: false,
          active: true,
          nonTrade: false,
          currencyId: '',
          description: '',
        },
  })

  const accountType = form.watch('accountType')
  const showReconcile =
    accountType !== 'asset_cash' &&
    accountType !== 'liability_credit_card' &&
    accountType !== 'off_balance'
  const showNonTrade =
    accountType === 'asset_receivable' || accountType === 'liability_payable'

  const onSubmit = async (values: AccountForm) => {
    try {
      // TODO: 实现实际的 API 调用
      // if (isEdit && currentRow) {
      //   await accountService.updateAccount({...})
      // } else {
      //   await accountService.createAccount({...})
      // }

      // 暂时使用模拟成功
      toast.success(isEdit ? '科目更新成功' : '科目创建成功')
      form.reset()
      onOpenChange(false)
      setOpen(null)
      refreshAccounts?.()
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
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑科目' : '添加科目'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '在此更新科目信息。' : '在此创建新的科目。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>代码 *</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. 101000' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Current Assets' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='accountType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账户类型 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择账户类型' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='internalGroup'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内部组 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择内部组' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='asset'>资产</SelectItem>
                      <SelectItem value='liability'>负债</SelectItem>
                      <SelectItem value='equity'>权益</SelectItem>
                      <SelectItem value='income'>收入</SelectItem>
                      <SelectItem value='expense'>费用</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showReconcile && (
              <FormField
                control={form.control}
                name='reconcile'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>可对账</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name='active'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>激活</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {showNonTrade && (
              <FormField
                control={form.control}
                name='nonTrade'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>非贸易</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name='currencyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>货币</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. CNY' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='科目描述信息'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
              >
                取消
              </Button>
              <Button type='submit'>{isEdit ? '更新' : '创建'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
