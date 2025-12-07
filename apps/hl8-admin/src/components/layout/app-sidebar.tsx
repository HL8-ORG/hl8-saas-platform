import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { auth } = useAuthStore()

  /**
   * 从认证状态获取当前用户信息，转换为 NavUser 需要的格式
   */
  const currentUser = useMemo(() => {
    if (auth.user) {
      // 优先使用昵称，否则使用用户名
      const name = auth.user.nickName || auth.user.username || 'User'
      const email = auth.user.email || ''
      // 使用头像，如果没有则使用默认头像
      const avatar = auth.user.avatar || sidebarData.user.avatar

      return {
        name,
        email,
        avatar,
      }
    }
    // 如果没有登录用户，使用默认数据
    return sidebarData.user
  }, [auth.user])

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
