import { z } from 'zod';

// User roles (type-only)
export const UserRole = {
  EMPLOYER: 'EMPLOYER',
  CANDIDATE: 'CANDIDATE',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];


// Sign up schema
export const signUpSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['EMPLOYER', 'CANDIDATE']), // z.enum uses uppercase string literals
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms of service',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// API types
export interface SignUpRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    role: UserRole;
  };
  token: string;
}
