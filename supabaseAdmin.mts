import { createClient } from '@supabase/supabase-js'
import { env } from './env.mts'

export function createSupabaseAdmin() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export function createSupabaseUserClient(authHeader?: string | null) {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_PUBLISHABLE_KEY'), {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export async function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) throw new Response('Non autorisé', { status: 401 })
  const client = createSupabaseUserClient(auth)
  const { data: userData, error: userError } = await client.auth.getUser(auth.replace('Bearer ', ''))
  if (userError || !userData.user) throw new Response('Session invalide', { status: 401 })
  const { data, error } = await client.rpc('is_cv_admin')
  if (error || data !== true) throw new Response('Accès admin refusé', { status: 403 })
  return userData.user
}
