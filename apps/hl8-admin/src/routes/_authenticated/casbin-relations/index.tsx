import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { CasbinRelations } from '@/features/casbin-relations'

const casbinRelationsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  childSubject: z.string().optional(),
  parentRole: z.string().optional(),
  domain: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/casbin-relations/')({
  validateSearch: casbinRelationsSearchSchema,
  component: CasbinRelations,
})
