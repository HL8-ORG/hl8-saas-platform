import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { IconFacebook, IconGithub } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { authService } from '@/lib/services/auth.service'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  email: z.string().min(1, '请输入邮箱地址').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码').min(7, '密码长度至少为 7 位'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  /**
   * 处理表单提交
   * 调用登录 API，成功后保存令牌和用户数据，跳转到目标页面
   */
  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const response = await authService.signIn({
        identifier: data.email,
        password: data.password,
      })

      // 保存令牌和用户数据
      auth.setTokens(response.tokens)
      auth.setUser(response.data)

      // 验证用户数据已正确设置
      const currentAuth = useAuthStore.getState().auth
      if (!currentAuth.user) {
        console.error('用户数据设置失败', response.data)
        toast.error('登录失败，请重试')
        return
      }

      // 显示成功消息
      const welcomeMessage = response.data.email
        ? `欢迎回来，${response.data.email}！`
        : `欢迎回来，${response.data.username}！`
      toast.success(welcomeMessage)

      // 跳转到目标页面或个人信息页
      // 如果 redirectTo 是完整 URL，提取路径部分
      let targetPath: string = '/settings/account'
      try {
        if (redirectTo) {
          if (redirectTo.startsWith('http')) {
            const url = new URL(redirectTo)
            targetPath = url.pathname + url.search
          } else if (redirectTo.startsWith('/')) {
            targetPath = redirectTo
          }
        }
      } catch {
        // 如果解析失败，使用默认路径（个人信息页）
        targetPath = '/settings/account'
      }

      // 确保路径以 / 开头
      if (!targetPath.startsWith('/')) {
        targetPath = '/' + targetPath
      }

      // 延迟导航，确保状态已更新
      setTimeout(() => {
        navigate({ to: targetPath, replace: true })
      }, 0)
    } catch (error) {
      // 检查是否为邮箱未验证错误
      const isEmailNotVerifiedError = (() => {
        // 检查 Error 对象
        if (
          error instanceof Error &&
          (error.message.includes('邮箱未验证') ||
            error.message.includes('请先验证邮箱'))
        ) {
          return true
        }

        // 检查 AxiosError
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response
        ) {
          const errorData = error.response.data as {
            message?: string | string[]
          }
          const errorMessage = Array.isArray(errorData.message)
            ? errorData.message[0]
            : errorData.message

          if (
            errorMessage &&
            (errorMessage.includes('邮箱未验证') ||
              errorMessage.includes('请先验证邮箱'))
          ) {
            return true
          }
        }

        return false
      })()

      if (isEmailNotVerifiedError) {
        // 自动发送验证码
        try {
          await authService.resendConfirmationEmail(data.email)
          toast.success('验证码已发送到您的邮箱，请查收')
        } catch (resendError) {
          // 如果发送失败，仍然跳转到 OTP 页面，用户可以手动重发
          handleServerError(resendError)
        }

        // 跳转到邮箱验证页面，传递邮箱地址
        navigate({
          to: '/otp',
          search: { email: data.email },
          replace: true,
        })
        return
      }

      // 其他错误使用通用错误处理
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                忘记密码？
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 animate-spin' />
              登录中...
            </>
          ) : (
            <>
              <LogIn className='mr-2' />
              登录
            </>
          )}
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              或使用以下方式继续
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}
