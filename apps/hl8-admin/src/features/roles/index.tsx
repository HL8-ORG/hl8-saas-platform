import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { adaptRoleListResponse } from '@/lib/adapters/role.adapter'
import { handleServerError } from '@/lib/handle-server-error'
import { roleService } from '@/lib/services/role.service'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { RolesDialogs } from './components/roles-dialogs'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesProvider } from './components/roles-provider'
import { RolesTable } from './components/roles-table'
import type { Role } from './data/schema'

const route = getRouteApi('/_authenticated/roles/')

export function Roles() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * 获取角色列表
   */
  useEffect(() => {
    async function fetchRoles() {
      setIsLoading(true)
      try {
        // 从 URL 搜索参数获取分页和筛选信息
        const current = search.page || 1
        const pageSize = search.pageSize || 10
        const name = search.name as string | undefined
        const code = search.code as string | undefined
        const statusFilter = search.status as string[] | undefined

        // 将前端状态转换为后端状态
        let backendStatus: 'ENABLED' | 'DISABLED' | undefined
        if (statusFilter && statusFilter.length > 0) {
          // 如果包含 active，使用 ENABLED；否则使用 DISABLED
          if (statusFilter.includes('active')) {
            backendStatus = 'ENABLED'
          } else if (statusFilter.includes('inactive')) {
            backendStatus = 'DISABLED'
          }
        }

        const response = await roleService.getRoleList({
          current,
          size: pageSize,
          name,
          code,
          status: backendStatus,
        })

        if (response.data) {
          const adapted = adaptRoleListResponse(response.data)
          setRoles(adapted.roles)
          setTotal(adapted.total)
        }
      } catch (error) {
        handleServerError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [
    search.page,
    search.pageSize,
    search.name,
    search.code,
    search.status,
    refreshKey,
  ])

  /**
   * 刷新角色列表
   */
  const refreshRoles = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <RolesProvider refreshRoles={refreshRoles}>
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
            <h2 className='text-2xl font-bold tracking-tight'>Role List</h2>
            <p className='text-muted-foreground'>
              Manage your roles and permissions here.
            </p>
          </div>
          <RolesPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        ) : (
          <RolesTable
            data={roles}
            search={search}
            navigate={navigate}
            total={total}
          />
        )}
      </Main>

      <RolesDialogs />
    </RolesProvider>
  )
}
