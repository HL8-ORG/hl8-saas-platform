import { z } from 'zod'

/**
 * 菜单状态 Schema
 */
const menuStatusSchema = z.union([z.literal('active'), z.literal('inactive')])
export type MenuStatus = z.infer<typeof menuStatusSchema>

/**
 * 菜单类型 Schema
 */
const menuTypeSchema = z.union([
  z.literal('MENU'),
  z.literal('DIRECTORY'),
  z.literal('BUTTON'),
])
export type MenuType = z.infer<typeof menuTypeSchema>

/**
 * 菜单 Schema
 */
const menuSchema = z.object({
  id: z.number(),
  menuType: menuTypeSchema,
  menuName: z.string(),
  routeName: z.string(),
  routePath: z.string(),
  component: z.string(),
  status: menuStatusSchema,
  pid: z.number(),
  order: z.number(),
  iconType: z.number().nullable(),
  icon: z.string().nullable(),
  pathParam: z.string().nullable(),
  activeMenu: z.string().nullable(),
  hideInMenu: z.boolean().nullable(),
  i18nKey: z.string().nullable(),
  keepAlive: z.boolean().nullable(),
  constant: z.boolean(),
  href: z.string().nullable(),
  multiTab: z.boolean().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
})

export type Menu = z.infer<typeof menuSchema>

export const menuListSchema = z.array(menuSchema)
