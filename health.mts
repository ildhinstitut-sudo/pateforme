import type { Config, Context } from '@netlify/functions'

function hasEnv(name: string) {
  const value = Netlify.env.get(name)
  return Boolean(value && value.trim().length > 0)
}

export default async (_req: Request, _context: Context) => {
  const body = {
    ok: true,
    app: 'DEUTSCHHAUS CV Platform',
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: hasEnv('SUPABASE_URL'),
      SUPABASE_PUBLISHABLE_KEY: hasEnv('SUPABASE_PUBLISHABLE_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: hasEnv('SUPABASE_SERVICE_ROLE_KEY'),
      VITE_SUPABASE_URL: hasEnv('VITE_SUPABASE_URL'),
      VITE_SUPABASE_PUBLISHABLE_KEY: hasEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
      VITE_INSTITUTE_NAME: hasEnv('VITE_INSTITUTE_NAME')
    }
  }
  return Response.json(body)
}

export const config: Config = { path: '/api/health' }
