import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { userService } from '@/lib/services/user.service'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const

const accountFormSchema = z.object({
  nickName: z
    .string()
    .min(1, '请输入昵称')
    .min(2, '昵称至少需要 2 个字符')
    .max(30, '昵称不能超过 30 个字符'),
  phoneNumber: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional()
    .or(z.literal('')),
  language: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

export function AccountForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const { auth } = useAuthStore()

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      nickName: '',
      phoneNumber: '',
      language: 'zh',
    },
  })

  /**
   * 获取用户信息并填充表单
   */
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await userService.getUserInfo()
        if (response.data) {
          const userInfo = response.data
          form.reset({
            nickName: userInfo.nickName || '',
            phoneNumber: userInfo.phoneNumber || '',
            language: 'zh', // 后端暂无语言字段，使用默认值
          })
        }
      } catch (error) {
        handleServerError(error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchUserInfo()
  }, [form])

  /**
   * 处理表单提交
   * 更新账户信息
   */
  async function onSubmit(data: AccountFormValues) {
    if (!auth.user) {
      toast.error('请先登录')
      return
    }

    setIsLoading(true)

    try {
      await userService.updateUserInfo({
        id: auth.user.id,
        username: auth.user.username,
        nickName: data.nickName,
        phoneNumber: data.phoneNumber || null,
      })

      // 更新本地用户信息
      const updatedUser = {
        ...auth.user,
        username: auth.user.username,
      }
      auth.setUser(updatedUser)

      toast.success('账户信息更新成功')
    } catch (error) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-muted-foreground'>加载中...</p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='nickName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>昵称</FormLabel>
              <FormControl>
                <Input placeholder='请输入昵称' {...field} />
              </FormControl>
              <FormDescription>
                这是将显示在您的个人资料和邮件中的名称。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='phoneNumber'
          render={({ field }) => (
            <FormItem>
              <FormLabel>手机号</FormLabel>
              <FormControl>
                <Input
                  type='tel'
                  placeholder='13800138000'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                您的手机号码，可用于登录和找回密码。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='language'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>语言</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant='outline'
                      role='combobox'
                      className={cn(
                        'w-[200px] justify-between',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value
                        ? languages.find(
                            (language) => language.value === field.value
                          )?.label
                        : '选择语言'}
                      <CaretSortIcon className='ms-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-[200px] p-0'>
                  <Command>
                    <CommandInput placeholder='搜索语言...' />
                    <CommandEmpty>未找到语言</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              form.setValue('language', language.value)
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                'size-4',
                                language.value === field.value
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {language.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>这是将在仪表板中使用的语言。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isLoading}>
          {isLoading ? '更新中...' : '更新账户'}
        </Button>
      </form>
    </Form>
  )
}
