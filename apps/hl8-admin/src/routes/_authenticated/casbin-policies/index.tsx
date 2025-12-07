import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { CasbinPolicies } from '@/features/casbin-policies'

const casbinPoliciesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  ptype: z.union([z.literal('p'), z.literal('g')]).optional(),
  subject: z.string().optional(),
  object: z.string().optional(),
  action: z.string().optional(),
  domain: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/casbin-policies/')({
  validateSearch: casbinPoliciesSearchSchema,
  component: CasbinPolicies,
})
