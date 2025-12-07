import { z } from 'zod'

const domainStatusSchema = z.union([z.literal('active'), z.literal('inactive')])
export type DomainStatus = z.infer<typeof domainStatusSchema>

const domainSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  status: domainStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Domain = z.infer<typeof domainSchema>

export const domainListSchema = z.array(domainSchema)
