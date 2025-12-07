import { z } from 'zod'

const roleStatusSchema = z.union([z.literal('active'), z.literal('inactive')])
export type RoleStatus = z.infer<typeof roleStatusSchema>

const roleSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  pid: z.string(),
  status: roleStatusSchema,
  description: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
})
export type Role = z.infer<typeof roleSchema>

export const roleListSchema = z.array(roleSchema)
