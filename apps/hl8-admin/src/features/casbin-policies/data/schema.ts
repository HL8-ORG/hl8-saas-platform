import { z } from 'zod'

/**
 * 策略类型 Schema
 */
const policyTypeSchema = z.union([z.literal('p'), z.literal('g')])
export type PolicyType = z.infer<typeof policyTypeSchema>

/**
 * 策略规则 Schema
 */
const policyRuleSchema = z.object({
  id: z.number(),
  ptype: policyTypeSchema,
  subject: z.string().optional(),
  object: z.string().optional(),
  action: z.string().optional(),
  domain: z.string().optional(),
  effect: z.string().optional(),
  v4: z.string().optional(),
  v5: z.string().optional(),
})

export type PolicyRule = z.infer<typeof policyRuleSchema>

export const policyRuleListSchema = z.array(policyRuleSchema)
