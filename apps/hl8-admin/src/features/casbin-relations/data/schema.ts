import { z } from 'zod'

/**
 * 角色继承关系 Schema
 */
const roleRelationSchema = z.object({
  id: z.number(),
  childSubject: z.string(),
  parentRole: z.string(),
  domain: z.string().optional(),
})

export type RoleRelation = z.infer<typeof roleRelationSchema>

export const roleRelationListSchema = z.array(roleRelationSchema)
