import { z } from 'zod'

/**
 * 产品模板状态
 */
const productTemplateStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
])
export type ProductTemplateStatus = z.infer<typeof productTemplateStatusSchema>

/**
 * 产品模板类型
 */
const productTemplateTypeSchema = z.union([
  z.literal('product'),
  z.literal('service'),
  z.literal('consu'),
])
export type ProductTemplateType = z.infer<typeof productTemplateTypeSchema>

/**
 * 产品模板 Schema
 */
const productTemplateSchema = z.object({
  /**
   * 产品模板 ID
   */
  id: z.string(),
  /**
   * 产品模板名称
   */
  name: z.string(),
  /**
   * 产品模板编码
   */
  code: z.string(),
  /**
   * 标签 ID 列表
   */
  tagIds: z.array(z.string()).optional(),
  /**
   * 产品类型
   */
  type: productTemplateTypeSchema,
  /**
   * 类别 ID
   */
  categoryId: z.string().optional(),
  /**
   * 图片 URL
   */
  image: z.string().optional(),
  /**
   * 是否可销售
   */
  canSale: z.boolean().optional(),
  /**
   * 是否可采购
   */
  canPurchase: z.boolean().optional(),
  /**
   * 是否激活
   */
  active: z.boolean().optional(),
  /**
   * 属性行 ID 列表
   */
  attributeLineIds: z.array(z.string()).optional(),
  /**
   * 产品变体 ID 列表
   */
  productVariantIds: z.array(z.string()).optional(),
  /**
   * 描述
   */
  description: z.string().optional(),
  /**
   * 创建时间
   */
  createdAt: z.coerce.date().optional(),
  /**
   * 更新时间
   */
  updatedAt: z.coerce.date().optional(),
})
export type ProductTemplate = z.infer<typeof productTemplateSchema>

/**
 * 产品模板列表 Schema
 */
export const productTemplateListSchema = z.array(productTemplateSchema)
