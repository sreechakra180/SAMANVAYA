import { z } from 'zod'

export const channelSchema = z.enum(['Phone call', 'SMS or WhatsApp', 'QR code', 'Fake website', 'UPI request', 'Something else'])
export type Channel = z.infer<typeof channelSchema>

export const identifierTypeSchema = z.enum(['phone', 'upi', 'url', 'sender_id'])
export type IdentifierType = z.infer<typeof identifierTypeSchema>

export const scamTypeSchema = z.enum([
  'digital-arrest', 'fake-kyc-link', 'upi-refund-qr', 'investment-group',
  'courier-customs', 'job-offer', 'lottery-prize', 'loan-app-harassment',
  'electricity-disconnection', 'fake-customer-care', 'otp-call', 'sextortion', 'other',
])
export type ScamType = z.infer<typeof scamTypeSchema>

export const reportInputSchema = z.object({
  report_id: z.string().min(1),
  occurred_at: z.string(),
  reported_at: z.string(),
  reporter_id: z.string().min(1),
  ip_prefix: z.string().min(1),
  channel: channelSchema,
  scam_type: scamTypeSchema,
  identifier_type: identifierTypeSchema,
  identifier_value: z.string().min(1),
  pincode: z.string().min(1).max(6),
  locality: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  has_screenshot: z.boolean(),
  amount_lost_inr: z.number().int().nonnegative(),
})
