import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { adaptRelationListResponse } from '@/lib/adapters/casbin-policy.adapter'
import { handleServerError } from '@/lib/handle-server-error'
import { casbinPolicyService } from '@/lib/services/casbin-policy.service'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import type { RoleRelation } from './data/schema'

const route = getRouteApi('/_authenticated/casbin-relations/')

/**
 * 角色关系管理页面
 *
 * @description 提供 Casbin 角色继承关系的管理界面，支持查看、创建、删除角色关系
 */
export function CasbinRelations() {
  const search = route.useSearch()
  const [relations, setRelations] = useState<RoleRelation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [refreshKey] = useState(0)

  /**
   * 获取角色继承关系列表
   */
  useEffect(() => {
    async function fetchRelations() {
      setIsLoading(true)
      try {
        const current = search.page || 1
        const pageSize = search.pageSize || 10
        const childSubject = search.childSubject as string | undefined
        const parentRole = search.parentRole as string | undefined
        const domain = search.domain as string | undefined

        const response = await casbinPolicyService.getRelationList({
          current,
          size: pageSize,
          childSubject,
          parentRole,
          domain,
        })

        if (response.data) {
          const adapted = adaptRelationListResponse(response.data)
          setRelations(adapted.relations)
          setTotal(adapted.total)
        }
      } catch (error) {
        handleServerError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelations()
  }, [
    search.page,
    search.pageSize,
    search.childSubject,
    search.parentRole,
    search.domain,
    refreshKey,
  ])

  return (
    <div className='flex min-h-screen w-full flex-col'>
      <Header />
      <Main className='flex-1'>
        <div className='container py-6'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold'>角色关系管理</h1>
            <p className='text-muted-foreground'>
              管理 Casbin 角色继承关系，定义用户与角色的绑定或角色之间的继承关系
            </p>
          </div>

          {/* TODO: 添加角色关系表格组件 */}
          <div className='rounded-lg border p-4'>
            {isLoading ? (
              <div>加载中...</div>
            ) : (
              <div>
                <p>共 {total} 条角色关系</p>
                {/* 表格组件将在后续实现 */}
                <pre>{JSON.stringify(relations.slice(0, 5), null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </Main>
    </div>
  )
}
