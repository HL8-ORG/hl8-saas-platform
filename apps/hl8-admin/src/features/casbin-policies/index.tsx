import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { adaptPolicyListResponse } from '@/lib/adapters/casbin-policy.adapter'
import { handleServerError } from '@/lib/handle-server-error'
import { casbinPolicyService } from '@/lib/services/casbin-policy.service'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import type { PolicyRule } from './data/schema'

const route = getRouteApi('/_authenticated/casbin-policies/')

/**
 * 权限规则管理页面
 *
 * @description 提供 Casbin 策略规则的管理界面，支持查看、创建、删除策略规则
 */
export function CasbinPolicies() {
  const search = route.useSearch()
  const [policies, setPolicies] = useState<PolicyRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [refreshKey] = useState(0)

  /**
   * 获取策略规则列表
   */
  useEffect(() => {
    async function fetchPolicies() {
      setIsLoading(true)
      try {
        const current = search.page || 1
        const pageSize = search.pageSize || 10
        const ptype = search.ptype as 'p' | 'g' | undefined
        const subject = search.subject as string | undefined
        const object = search.object as string | undefined
        const action = search.action as string | undefined
        const domain = search.domain as string | undefined

        const response = await casbinPolicyService.getPolicyList({
          current,
          size: pageSize,
          ptype,
          subject,
          object,
          action,
          domain,
        })

        if (response.data) {
          const adapted = adaptPolicyListResponse(response.data)
          setPolicies(adapted.policies)
          setTotal(adapted.total)
        }
      } catch (error) {
        handleServerError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicies()
  }, [
    search.page,
    search.pageSize,
    search.ptype,
    search.subject,
    search.object,
    search.action,
    search.domain,
    refreshKey,
  ])

  return (
    <div className='flex min-h-screen w-full flex-col'>
      <Header />
      <Main className='flex-1'>
        <div className='container py-6'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold'>权限规则管理</h1>
            <p className='text-muted-foreground'>
              管理 Casbin 策略规则，定义角色或用户对资源的访问权限
            </p>
          </div>

          {/* TODO: 添加策略规则表格组件 */}
          <div className='rounded-lg border p-4'>
            {isLoading ? (
              <div>加载中...</div>
            ) : (
              <div>
                <p>共 {total} 条策略规则</p>
                {/* 表格组件将在后续实现 */}
                <pre>{JSON.stringify(policies.slice(0, 5), null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </Main>
    </div>
  )
}
