import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Menus } from '@/features/menus'

const menusSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
  menuType: z
    .array(
      z.union([z.literal('MENU'), z.literal('DIRECTORY'), z.literal('BUTTON')])
    )
    .optional()
    .catch([]),
  // Per-column text filter
  menuName: z.string().optional().catch(''),
  routeName: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/menus/')({
  validateSearch: menusSearchSchema,
  component: Menus,
})
