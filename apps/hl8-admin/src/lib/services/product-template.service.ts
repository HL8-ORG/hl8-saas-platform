import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 后端产品模板属性（来自后端API）
 */
export interface BackendProductTemplateProperties {
  /**
   * 产品模板 ID
   */
  id: string
  /**
   * 产品模板名称
   */
  name: string
  /**
   * 产品模板编码
   */
  code: string
  /**
   * 标签 ID 列表
   */
  tagIds?: string[]
  /**
   * 产品类型
   */
  type: 'product' | 'service' | 'consu'
  /**
   * 类别 ID
   */
  categoryId?: string
  /**
   * 图片 URL
   */
  image?: string
  /**
   * 是否可销售
   */
  canSale?: boolean
  /**
   * 是否可采购
   */
  canPurchase?: boolean
  /**
   * 是否激活
   */
  active?: boolean
  /**
   * 属性行 ID 列表
   */
  attributeLineIds?: string[]
  /**
   * 产品变体 ID 列表
   */
  productVariantIds?: string[]
  /**
   * 描述
   */
  description?: string
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string
}

/**
 * 分页查询参数
 */
export interface PageProductTemplatesParams {
  /**
   * 当前页码（从1开始）
   */
  current?: number
  /**
   * 每页大小
   */
  size?: number
  /**
   * 产品模板名称（模糊查询）
   */
  name?: string
  /**
   * 产品模板编码（模糊查询）
   */
  code?: string
  /**
   * 类别 ID（精确查询）
   */
  categoryId?: string
  /**
   * 标签 ID 列表（精确查询）
   */
  tagIds?: string[]
  /**
   * 产品类型（精确查询）
   */
  type?: 'product' | 'service' | 'consu'
  /**
   * 激活状态筛选
   */
  active?: boolean
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
 * 产品模板列表响应数据（后端使用 records 字段）
 */
export interface ProductTemplateListResponseData {
  /**
   * 产品模板列表（后端使用 records）
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
 * 创建产品模板请求数据
 */
export interface CreateProductTemplateRequest {
  /**
   * 产品模板名称
   */
  name: string
  /**
   * 产品模板编码
   */
  code: string
  /**
   * 标签 ID 列表
   */
  tagIds?: string[]
  /**
   * 产品类型
   */
  type: 'product' | 'service' | 'consu'
  /**
   * 类别 ID
   */
  categoryId?: string
  /**
   * 图片 URL
   */
  image?: string
  /**
   * 是否可销售
   */
  canSale?: boolean
  /**
   * 是否可采购
   */
  canPurchase?: boolean
  /**
   * 是否激活
   */
  active?: boolean
  /**
   * 属性行 ID 列表
   */
  attributeLineIds?: string[]
  /**
   * 产品变体 ID 列表
   */
  productVariantIds?: string[]
  /**
   * 描述
   */
  description?: string
}

/**
 * 更新产品模板请求数据
 */
export interface UpdateProductTemplateRequest {
  /**
   * 产品模板 ID
   */
  id: string
  /**
   * 产品模板名称
   */
  name: string
  /**
   * 产品模板编码
   */
  code: string
  /**
   * 标签 ID 列表
   */
  tagIds?: string[]
  /**
   * 产品类型
   */
  type: 'product' | 'service' | 'consu'
  /**
   * 类别 ID
   */
  categoryId?: string
  /**
   * 图片 URL
   */
  image?: string
  /**
   * 是否可销售
   */
  canSale?: boolean
  /**
   * 是否可采购
   */
  canPurchase?: boolean
  /**
   * 是否激活
   */
  active?: boolean
  /**
   * 属性行 ID 列表
   */
  attributeLineIds?: string[]
  /**
   * 产品变体 ID 列表
   */
  productVariantIds?: string[]
  /**
   * 描述
   */
  description?: string
}

/**
 * 产品模板信息服务
 * 提供产品模板相关的 API 调用，包括分页查询、创建、更新和删除
 */
export const productTemplateService = {
  /**
   * 获取产品模板列表（分页）
   * 根据查询条件分页获取产品模板列表，支持按名称、编码、类别、标签、类型和激活状态筛选
   *
   * @param params - 分页查询参数，包含页码、页大小、名称、编码、类别、标签、类型、激活状态等筛选条件
   * @returns Promise，解析为分页结果
   *
   * @example
   * ```ts
   * const result = await productTemplateService.getProductTemplateList({
   *   current: 1,
   *   size: 10,
   *   name: '测试产品',
   *   type: 'product',
   *   active: true
   * })
   * ```
   */
  async getProductTemplateList(
    params?: PageProductTemplatesParams
  ): Promise<ApiResponse<ProductTemplateListResponseData>> {
    const queryParams = new URLSearchParams()
    if (params?.current) {
      queryParams.append('current', params.current.toString())
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.name) {
      queryParams.append('name', params.name)
    }
    if (params?.code) {
      queryParams.append('code', params.code)
    }
    if (params?.categoryId) {
      queryParams.append('categoryId', params.categoryId)
    }
    if (params?.tagIds && params.tagIds.length > 0) {
      params.tagIds.forEach((tagId) => {
        queryParams.append('tagIds', tagId)
      })
    }
    if (params?.type) {
      queryParams.append('type', params.type)
    }
    if (params?.active !== undefined) {
      queryParams.append('active', params.active.toString())
    }

    const response = await apiClient.get<{
      code: number
      message: string
      data: {
        records: BackendProductTemplateProperties[]
        total: number
        current: number
        size: number
      }
    }>(`/product-template?${queryParams.toString()}`, {
      skipDataExtraction: true,
    })

    // 后端返回格式：{ code, message, data: { records, total, current, size } }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<ProductTemplateListResponseData>
  },

  /**
   * 创建产品模板
   * 创建一个新的产品模板
   *
   * @param data - 产品模板创建数据，包含名称、编码、类型等信息
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await productTemplateService.createProductTemplate({
   *   name: '测试产品',
   *   code: 'PROD001',
   *   type: 'product',
   *   active: true
   * })
   * ```
   */
  async createProductTemplate(
    data: CreateProductTemplateRequest
  ): Promise<ApiResponse<null>> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: null
    }>('/product-template', data, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 更新产品模板
   * 更新指定产品模板的信息
   *
   * @param data - 产品模板更新数据，包含产品模板 ID 和要更新的字段
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await productTemplateService.updateProductTemplate({
   *   id: 'product-template-id-123',
   *   name: '更新后的产品名称',
   *   code: 'PROD001',
   *   type: 'product',
   *   active: true
   * })
   * ```
   */
  async updateProductTemplate(
    data: UpdateProductTemplateRequest
  ): Promise<ApiResponse<null>> {
    const response = await apiClient.put<{
      code: number
      message: string
      data: null
    }>('/product-template', data, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 删除产品模板
   * 删除指定的产品模板
   *
   * @param id - 要删除的产品模板 ID
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await productTemplateService.deleteProductTemplate('product-template-id-123')
   * ```
   */
  async deleteProductTemplate(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<{
      code: number
      message: string
      data: null
    }>(`/product-template/${id}`, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },
}
