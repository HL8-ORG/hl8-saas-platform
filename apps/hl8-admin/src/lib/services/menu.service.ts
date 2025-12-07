/**
 * 菜单服务
 *
 * 提供菜单相关的 API 调用方法，包括：
 * - 获取菜单列表（分页）
 * - 创建菜单
 * - 更新菜单
 * - 删除菜单
 *
 * @module lib/services/menu.service
 */
import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 后端菜单属性（来自后端API）
 */
export interface BackendMenuProperties {
  /**
   * 菜单 ID
   */
  id: number
  /**
   * 菜单类型
   */
  menuType: 'MENU' | 'DIRECTORY' | 'BUTTON'
  /**
   * 菜单名称
   */
  menuName: string
  /**
   * 路由名称
   */
  routeName: string
  /**
   * 路由路径
   */
  routePath: string
  /**
   * 组件路径
   */
  component: string
  /**
   * 菜单状态
   */
  status: 'ENABLED' | 'DISABLED'
  /**
   * 父菜单 ID
   */
  pid: number
  /**
   * 排序
   */
  order: number
  /**
   * 图标类型
   */
  iconType: number | null
  /**
   * 图标
   */
  icon: string | null
  /**
   * 路径参数
   */
  pathParam: string | null
  /**
   * 激活菜单
   */
  activeMenu: string | null
  /**
   * 是否在菜单中隐藏
   */
  hideInMenu: boolean | null
  /**
   * 国际化键
   */
  i18nKey: string | null
  /**
   * 是否保持活跃
   */
  keepAlive: boolean | null
  /**
   * 是否常量路由
   */
  constant: boolean
  /**
   * 外部链接
   */
  href: string | null
  /**
   * 是否支持多标签
   */
  multiTab: boolean | null
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string | null
}

/**
 * 分页查询参数
 */
export interface PageMenusParams {
  /**
   * 当前页码（从1开始）
   */
  current?: number
  /**
   * 每页大小
   */
  size?: number
  /**
   * 菜单名称（模糊查询）
   */
  menuName?: string
  /**
   * 路由名称（模糊查询）
   */
  routeName?: string
  /**
   * 菜单类型筛选
   */
  menuType?: 'MENU' | 'DIRECTORY' | 'BUTTON'
  /**
   * 状态筛选
   */
  status?: 'ENABLED' | 'DISABLED'
}

/**
 * 分页结果
 */
export interface PaginationResult<T> {
  /**
   * 数据列表
   */
  data: T[]
  /**
   * 总记录数
   */
  total: number
  /**
   * 当前页码
   */
  current: number
  /**
   * 每页大小
   */
  size: number
}

/**
 * 菜单列表响应数据（后端使用 data 字段）
 */
export interface MenuListResponseData {
  /**
   * 菜单列表
   */
  data: BackendMenuProperties[]
  /**
   * 总记录数
   */
  total: number
  /**
   * 当前页码
   */
  current: number
  /**
   * 每页大小
   */
  size: number
}

/**
 * 创建菜单请求参数
 */
export interface CreateMenuRequest {
  menuName: string
  menuType: 'MENU' | 'DIRECTORY' | 'BUTTON'
  iconType?: number | null
  icon?: string | null
  routeName: string
  routePath: string
  component: string
  pathParam?: string | null
  status: 'ENABLED' | 'DISABLED'
  activeMenu?: string | null
  hideInMenu?: boolean | null
  pid: number
  order: number
  i18nKey?: string | null
  keepAlive?: boolean | null
  constant: boolean
  href?: string | null
  multiTab?: boolean | null
}

/**
 * 更新菜单请求参数
 */
export interface UpdateMenuRequest extends CreateMenuRequest {
  id: number
}

/**
 * 菜单服务
 */
export const menuService = {
  /**
   * 获取菜单列表（分页）
   *
   * @param params - 分页查询参数
   * @returns 分页结果
   */
  async getMenuList(
    params?: PageMenusParams
  ): Promise<ApiResponse<MenuListResponseData>> {
    const queryParams = new URLSearchParams()
    if (params?.current) {
      queryParams.append('current', params.current.toString())
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.menuName) {
      queryParams.append('menuName', params.menuName)
    }
    if (params?.routeName) {
      queryParams.append('routeName', params.routeName)
    }
    if (params?.menuType) {
      queryParams.append('menuType', params.menuType)
    }
    if (params?.status) {
      queryParams.append('status', params.status)
    }

    const response = await apiClient.get<{
      code: number
      message: string
      data: {
        data: BackendMenuProperties[]
        total: number
        current: number
        size: number
      }
    }>(`/route?${queryParams.toString()}`, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<MenuListResponseData>
  },

  /**
   * 创建菜单
   *
   * @param data - 菜单创建数据
   * @returns 操作结果
   */
  async createMenu(data: CreateMenuRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: null
    }>('/route', data, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 更新菜单
   *
   * @param data - 菜单更新数据
   * @returns 操作结果
   */
  async updateMenu(data: UpdateMenuRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.put<{
      code: number
      message: string
      data: null
    }>('/route', data, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 删除菜单
   *
   * @param id - 菜单 ID
   * @returns 操作结果
   */
  async deleteMenu(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<{
      code: number
      message: string
      data: null
    }>(`/route/${id}`, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },
}
