import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Ingresa un correo válido.'));

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
