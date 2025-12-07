import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { authService } from '@/lib/services/auth.service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  /**
   * 处理登出
   * 调用登出 API，清除认证状态，跳转到登录页
   * 后端从 HttpOnly Cookie 中自动读取 refreshToken，无需传递参数
   */
  async function handleSignOut() {
    setIsLoading(true)

    try {
      // 调用登出 API（后端从 Cookie 中自动读取 refreshToken）
      await authService.signOut()

      // 清除认证状态
      auth.reset()

      // 显示成功消息
      toast.success('已成功登出')

      // 跳转到登录页
      navigate({ to: '/sign-in', replace: true })
    } catch (error) {
      // 即使登出 API 失败，也清除本地状态
      auth.reset()
      handleServerError(error)

      // 跳转到登录页
      navigate({ to: '/sign-in', replace: true })
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认登出</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要登出吗？登出后需要重新登录才能访问系统。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            disabled={isLoading}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isLoading ? '登出中...' : '确认登出'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
