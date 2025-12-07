import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Domains } from '@/features/domains'

const domainsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
  // Per-column text filter (example for name)
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/domains/')({
  validateSearch: domainsSearchSchema,
  component: Domains,
})
