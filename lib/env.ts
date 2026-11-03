import { z } from 'zod';

const supabaseEnvSchema = z.object({
  url: z.url(),
  anonKey: z.string().min(1),
});

const result = supabaseEnvSchema.safeParse({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

export const supabaseEnv: SupabaseEnv | null = result.success ? result.data : null;

export const supabaseEnvError: string | null = result.success
  ? null
  : 'Faltan EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env.local, completa los valores y reinicia Metro.';
