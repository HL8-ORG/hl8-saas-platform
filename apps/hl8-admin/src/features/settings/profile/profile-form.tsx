import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { userService } from '@/lib/services/user.service'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'

const profileFormSchema = z.object({
  username: z
    .string()
    .min(1, '请输入用户名')
    .min(2, '用户名至少需要 2 个字符')
    .max(30, '用户名不能超过 30 个字符'),
  nickName: z
    .string()
    .min(1, '请输入昵称')
    .min(2, '昵称至少需要 2 个字符')
    .max(30, '昵称不能超过 30 个字符'),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  avatar: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  bio: z.string().max(160, '简介不能超过 160 个字符').optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const { auth } = useAuthStore()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      nickName: '',
      email: '',
      avatar: '',
      bio: '',
    },
    mode: 'onChange',
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

          // 设置邮箱验证状态（确保正确处理布尔值）
          // userInfo.isEmailVerified 应该是布尔值，但为了安全起见，使用 Boolean() 转换
          const emailVerified = Boolean(userInfo.isEmailVerified)
          setIsEmailVerified(emailVerified)

          // 如果邮箱已验证，显示邮箱；否则显示空字符串
          // 注意：即使已验证，如果邮箱为空，也不显示
          const verifiedEmail =
            emailVerified && userInfo.email ? userInfo.email : ''

          // 开发环境下输出调试信息
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('用户信息:', {
              isEmailVerified: userInfo.isEmailVerified,
              isEmailVerifiedType: typeof userInfo.isEmailVerified,
              email: userInfo.email,
              emailVerified,
              verifiedEmail,
            })
          }

          form.reset({
            username: userInfo.userName || '',
            nickName: userInfo.nickName || '',
            email: verifiedEmail,
            avatar: userInfo.avatar || '',
            bio: '', // 后端暂无 bio 字段，保留为空
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
   * 更新用户信息
   */
  async function onSubmit(data: ProfileFormValues) {
    if (!auth.user) {
      toast.error('请先登录')
      return
    }

    setIsLoading(true)

    try {
      await userService.updateUserInfo({
        id: auth.user.id,
        username: data.username,
        nickName: data.nickName,
        avatar: data.avatar || null,
        email: data.email || null,
      })

      // 更新本地用户信息
      const updatedUser = {
        ...auth.user,
        username: data.username,
        email: data.email || '',
      }
      auth.setUser(updatedUser)

      toast.success('个人资料更新成功')
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
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder='请输入用户名' {...field} />
              </FormControl>
              <FormDescription>
                这是您的登录用户名。用户名在域内必须唯一。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                这是您的公开显示名称。可以是真实姓名或昵称。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='name@example.com'
                  {...field}
                  value={field.value || ''}
                  disabled={!isEmailVerified}
                />
              </FormControl>
              <FormDescription>
                {isEmailVerified
                  ? '您的已验证邮箱地址，可用于登录和接收通知。'
                  : '您的邮箱尚未验证，请先验证邮箱后再使用。'}
              </FormDescription>
              {!isEmailVerified && (
                <p className='text-muted-foreground text-sm'>
                  提示：如果您的邮箱已经验证，请刷新页面或重新登录以更新验证状态。
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='avatar'
          render={({ field }) => (
            <FormItem>
              <FormLabel>头像 URL</FormLabel>
              <FormControl>
                <Input
                  type='url'
                  placeholder='https://example.com/avatar.jpg'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>您的头像图片 URL 地址。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>简介</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='介绍一下自己...'
                  className='resize-none'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                简短的个人简介，最多 160 个字符。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isLoading}>
          {isLoading ? '更新中...' : '更新个人资料'}
        </Button>
      </form>
    </Form>
  )
}
