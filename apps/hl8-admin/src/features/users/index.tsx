import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { adaptUserListResponse } from '@/lib/adapters/user.adapter'
import { handleServerError } from '@/lib/handle-server-error'
import { userService } from '@/lib/services/user.service'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import type { User } from './data/schema'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)

  /**
   * 获取用户列表
   */
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      try {
        // 从 URL 搜索参数获取分页和筛选信息
        const current = search.page || 1
        const pageSize = search.pageSize || 10
        const username = search.username as string | undefined
        const statusFilter = search.status as string[] | undefined

        // 将前端状态转换为后端状态
        let backendStatus: 'ACTIVE' | 'INACTIVE' | undefined
        if (statusFilter && statusFilter.length > 0) {
          // 如果包含 active，使用 ACTIVE；否则使用 INACTIVE
          if (statusFilter.includes('active')) {
            backendStatus = 'ACTIVE'
          } else if (statusFilter.includes('inactive')) {
            backendStatus = 'INACTIVE'
          }
        }

        const response = await userService.getUserList({
          current,
          size: pageSize,
          username,
          status: backendStatus,
        })

        if (response.data) {
          const adapted = adaptUserListResponse(response.data)
          setUsers(adapted.users)
          setTotal(adapted.total)
        }
      } catch (error) {
        handleServerError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [search.page, search.pageSize, search.username, search.status])

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        ) : (
          <UsersTable
            data={users}
            search={search}
            navigate={navigate}
            total={total}
          />
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
