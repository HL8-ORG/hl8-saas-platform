import { useCallback, useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { adaptDomainListResponse } from '@/lib/adapters/domain.adapter'
import { handleServerError } from '@/lib/handle-server-error'
import { domainService } from '@/lib/services/domain.service'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DomainsDialogs } from './components/domains-dialogs'
import { DomainsPrimaryButtons } from './components/domains-primary-buttons'
import { DomainsProvider } from './components/domains-provider'
import { DomainsTable } from './components/domains-table'
import type { Domain } from './data/schema'

const route = getRouteApi('/_authenticated/domains/')

export function Domains() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [domains, setDomains] = useState<Domain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * 获取域列表
   */
  useEffect(() => {
    async function fetchDomains() {
      setIsLoading(true)
      try {
        // 从 URL 搜索参数获取分页和筛选信息
        const current = search.page || 1
        const pageSize = search.pageSize || 10
        const name = search.name as string | undefined
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

        const response = await domainService.getDomainList({
          current,
          size: pageSize,
          name,
          status: backendStatus,
        })

        if (response.data) {
          const adapted = adaptDomainListResponse(response.data)
          setDomains(adapted.domains)
          setTotal(adapted.total)
        }
      } catch (error) {
        handleServerError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDomains()
  }, [search.page, search.pageSize, search.name, search.status, refreshKey])

  /**
   * 刷新域列表
   */
  const refreshDomains = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <DomainsProvider refreshDomains={refreshDomains}>
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
            <h2 className='text-2xl font-bold tracking-tight'>Domain List</h2>
            <p className='text-muted-foreground'>
              Manage your Casbin domains here.
            </p>
          </div>
          <DomainsPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        ) : (
          <DomainsTable
            data={domains}
            search={search}
            navigate={navigate}
            total={total}
          />
        )}
      </Main>

      <DomainsDialogs />
    </DomainsProvider>
  )
}
