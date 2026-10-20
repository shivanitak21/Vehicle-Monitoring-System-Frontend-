import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  role: z.enum(['guardian', 'passenger']),
  accepted: z.boolean().refine((value) => value, {
    message: 'Consent is required to create an account',
  }),
});

export const memberSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name'),
  relationship: z.string().trim().min(2, 'Enter a relationship'),
  phone: z.string().trim().min(7, 'Enter a phone number'),
  role: z.enum(['guardian', 'passenger', 'driver']),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name'),
  relationship: z.string().trim().min(2, 'Enter a relationship'),
  phone: z.string().trim().min(7, 'Enter a phone number'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  phone: z.string().trim().min(7, 'Enter a phone number').or(z.literal('')),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type MemberValues = z.infer<typeof memberSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
