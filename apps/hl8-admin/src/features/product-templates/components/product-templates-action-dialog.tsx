'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { productTemplateService } from '@/lib/services/product-template.service'
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
import { type ProductTemplate } from '../data/schema'
import { useProductTemplates } from './product-templates-provider'

const formSchema = z.object({
  name: z.string().min(1, '名称是必填项'),
  code: z.string().min(1, '编码是必填项'),
  type: z.enum(['product', 'service', 'consu']),
  categoryId: z.string().optional(),
  image: z.string().optional(),
  canSale: z.boolean().optional(),
  canPurchase: z.boolean().optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
})

type ProductTemplateForm = z.infer<typeof formSchema>

type ProductTemplateActionDialogProps = {
  currentRow?: ProductTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductTemplatesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ProductTemplateActionDialogProps) {
  const isEdit = !!currentRow
  const { setOpen, refreshProductTemplates } = useProductTemplates()
  const form = useForm<ProductTemplateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          code: currentRow.code,
          type: currentRow.type,
          categoryId: currentRow.categoryId || '',
          image: currentRow.image || '',
          canSale: currentRow.canSale,
          canPurchase: currentRow.canPurchase,
          active: currentRow.active,
          description: currentRow.description || '',
        }
      : {
          name: '',
          code: '',
          type: 'product',
          categoryId: '',
          image: '',
          canSale: false,
          canPurchase: false,
          active: true,
          description: '',
        },
  })

  const onSubmit = async (values: ProductTemplateForm) => {
    try {
      if (isEdit && currentRow) {
        await productTemplateService.updateProductTemplate({
          id: currentRow.id,
          name: values.name,
          code: values.code,
          type: values.type,
          categoryId: values.categoryId || undefined,
          image: values.image || undefined,
          canSale: values.canSale,
          canPurchase: values.canPurchase,
          active: values.active,
          description: values.description || undefined,
        })
        toast.success('产品模板更新成功')
      } else {
        await productTemplateService.createProductTemplate({
          name: values.name,
          code: values.code,
          type: values.type,
          categoryId: values.categoryId || undefined,
          image: values.image || undefined,
          canSale: values.canSale,
          canPurchase: values.canPurchase,
          active: values.active,
          description: values.description || undefined,
        })
        toast.success('产品模板创建成功')
      }
      form.reset()
      onOpenChange(false)
      setOpen(null)
      // 刷新产品模板列表
      refreshProductTemplates?.()
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
          <DialogTitle>{isEdit ? '编辑产品模板' : '添加产品模板'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '在此更新产品模板信息。' : '在此创建新的产品模板。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <div className='h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='product-template-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>名称</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='产品模板名称'
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
                name='code'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>编码</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='PROD001'
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
                name='type'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>类型</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='col-span-4'>
                          <SelectValue placeholder='选择类型' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='product'>产品</SelectItem>
                        <SelectItem value='service'>服务</SelectItem>
                        <SelectItem value='consu'>消耗品</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='categoryId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      类别ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='类别ID（可选）'
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
                name='image'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      图片URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='图片URL（可选）'
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
                name='canSale'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      可销售
                    </FormLabel>
                    <FormControl>
                      <div className='col-span-4 flex items-center space-x-2'>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className='text-muted-foreground text-sm'>
                          是否可销售
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='canPurchase'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      可采购
                    </FormLabel>
                    <FormControl>
                      <div className='col-span-4 flex items-center space-x-2'>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className='text-muted-foreground text-sm'>
                          是否可采购
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='active'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      激活状态
                    </FormLabel>
                    <FormControl>
                      <div className='col-span-4 flex items-center space-x-2'>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className='text-muted-foreground text-sm'>
                          是否激活
                        </span>
                      </div>
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
                    <FormLabel className='col-span-2 text-end'>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='产品模板描述信息'
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
          <Button type='submit' form='product-template-form'>
            保存更改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
