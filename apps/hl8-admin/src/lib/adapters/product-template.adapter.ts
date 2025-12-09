import type { ProductTemplate } from '@/features/product-templates/data/schema'
import type { BackendProductTemplateProperties } from '../services/product-template.service'

/**
 * 将后端产品模板属性转换为前端产品模板对象
 *
 * @param backendProductTemplate - 后端产品模板属性
 * @returns 前端产品模板对象
 */
export function adaptBackendProductTemplateToFrontend(
  backendProductTemplate: BackendProductTemplateProperties
): ProductTemplate {
  return {
    id: backendProductTemplate.id,
    name: backendProductTemplate.name,
    code: backendProductTemplate.code,
    tagIds: backendProductTemplate.tagIds || [],
    type: backendProductTemplate.type,
    categoryId: backendProductTemplate.categoryId,
    image: backendProductTemplate.image,
    canSale: backendProductTemplate.canSale,
    canPurchase: backendProductTemplate.canPurchase,
    active: backendProductTemplate.active,
    attributeLineIds: backendProductTemplate.attributeLineIds || [],
    productVariantIds: backendProductTemplate.productVariantIds || [],
    description: backendProductTemplate.description,
    createdAt: backendProductTemplate.createdAt
      ? new Date(backendProductTemplate.createdAt)
      : undefined,
    updatedAt: backendProductTemplate.updatedAt
      ? new Date(backendProductTemplate.updatedAt)
      : undefined,
  }
}

/**
 * 后端分页结果格式
 */
export interface BackendPaginationResult {
  /**
   * 数据列表（后端使用 records）
   */
  records: BackendProductTemplateProperties[]
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
 * 将后端产品模板列表响应转换为前端产品模板列表
 *
 * @param response - 后端产品模板列表响应（使用 records 字段）
 * @returns 前端产品模板列表
 */
export function adaptProductTemplateListResponse(
  response: BackendPaginationResult
): {
  productTemplates: ProductTemplate[]
  total: number
  current: number
  size: number
} {
  const productTemplates = (response.records || []).map(
    (backendProductTemplate) =>
      adaptBackendProductTemplateToFrontend(backendProductTemplate)
  )

  return {
    productTemplates,
    total: response.total,
    current: response.current,
    size: response.size,
  }
}
