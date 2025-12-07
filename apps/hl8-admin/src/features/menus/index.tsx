import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { adaptMenuListResponse } from '@/lib/adapters/menu.adapter'
import { handleServerError } from '@/lib/handle-server-error'
import { menuService } from '@/lib/services/menu.service'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { MenusDialogs } from './components/menus-dialogs'
import { MenusPrimaryButtons } from './components/menus-primary-buttons'
import { MenusProvider } from './components/menus-provider'
import { MenusTable } from './components/menus-table'
import type { Menu } from './data/schema'

const route = getRouteApi('/_authenticated/menus/')

export function Menus() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [menus, setMenus] = useState<Menu[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * 获取菜单列表
   */
  useEffect(() => {
    async function fetchMenus() {
      setIsLoading(true)
      try {
        // 从 URL 搜索参数获取分页和筛选信息
        const current = search.page || 1
        const pageSize = search.pageSize || 10
        const menuName = search.menuName as string | undefined
        const routeName = search.routeName as string | undefined
        const statusFilter = search.status as string[] | undefined
        const menuTypeFilter = search.menuType as string[] | undefined

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

        // 将前端菜单类型转换为后端菜单类型
        let backendMenuType: 'MENU' | 'DIRECTORY' | 'BUTTON' | undefined
        if (menuTypeFilter && menuTypeFilter.length > 0) {
          // 使用第一个选中的类型
          const firstType = menuTypeFilter[0].toUpperCase()
          if (['MENU', 'DIRECTORY', 'BUTTON'].includes(firstType)) {
            backendMenuType = firstType as 'MENU' | 'DIRECTORY' | 'BUTTON'
          }
        }

        const response = await menuService.getMenuList({
          current,
          size: pageSize,
          menuName,
          routeName,
          menuType: backendMenuType,
          status: backendStatus,
        })

        if (response.data) {
          const adapted = adaptMenuListResponse(response.data)
          setMenus(adapted.menus)
          setTotal(adapted.total)
        }
      } catch (error) {
        handleServerError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenus()
  }, [
    search.page,
    search.pageSize,
    search.menuName,
    search.routeName,
    search.status,
    search.menuType,
    refreshKey,
  ])

  /**
   * 刷新菜单列表
   */
  const refreshMenus = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <MenusProvider refreshMenus={refreshMenus}>
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
            <h2 className='text-2xl font-bold tracking-tight'>Menu List</h2>
            <p className='text-muted-foreground'>
              Manage your menus and routes here.
            </p>
          </div>
          <MenusPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        ) : (
          <MenusTable
            data={menus}
            search={search}
            navigate={navigate}
            total={total}
          />
        )}
      </Main>

      <MenusDialogs />
    </MenusProvider>
  )
}
