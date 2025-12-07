import type { Menu } from '@/features/menus/data/schema'
import type { BackendMenuProperties } from '../services/menu.service'

/**
 * 将后端状态转换为前端状态
 *
 * @param status - 后端状态（ENABLED/DISABLED）
 * @returns 前端状态（active/inactive）
 */
function mapStatus(status: 'ENABLED' | 'DISABLED'): Menu['status'] {
  switch (status) {
    case 'ENABLED':
      return 'active'
    case 'DISABLED':
      return 'inactive'
    default:
      return 'inactive'
  }
}

/**
 * 将后端菜单属性转换为前端菜单对象
 *
 * @param backendMenu - 后端菜单属性
 * @returns 前端菜单对象
 */
export function adaptBackendMenuToFrontend(
  backendMenu: BackendMenuProperties
): Menu {
  return {
    id: backendMenu.id,
    menuType: backendMenu.menuType,
    menuName: backendMenu.menuName,
    routeName: backendMenu.routeName,
    routePath: backendMenu.routePath,
    component: backendMenu.component,
    status: mapStatus(backendMenu.status),
    pid: backendMenu.pid,
    order: backendMenu.order,
    iconType: backendMenu.iconType,
    icon: backendMenu.icon,
    pathParam: backendMenu.pathParam,
    activeMenu: backendMenu.activeMenu,
    hideInMenu: backendMenu.hideInMenu,
    i18nKey: backendMenu.i18nKey,
    keepAlive: backendMenu.keepAlive,
    constant: backendMenu.constant,
    href: backendMenu.href,
    multiTab: backendMenu.multiTab,
    createdAt: new Date(backendMenu.createdAt),
    updatedAt: backendMenu.updatedAt ? new Date(backendMenu.updatedAt) : null,
  }
}

/**
 * 后端分页结果格式
 */
export interface BackendPaginationResult {
  /**
   * 数据列表（后端使用 data）
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
 * 将后端菜单列表响应转换为前端菜单列表
 *
 * @param response - 后端菜单列表响应（使用 data 字段）
 * @returns 前端菜单列表
 */
export function adaptMenuListResponse(response: BackendPaginationResult): {
  menus: Menu[]
  total: number
  current: number
  size: number
} {
  const menus = (response.data || []).map((backendMenu) =>
    adaptBackendMenuToFrontend(backendMenu)
  )

  return {
    menus,
    total: response.total,
    current: response.current,
    size: response.size,
  }
}
