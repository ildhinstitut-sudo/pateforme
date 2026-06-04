import type { Config } from '@netlify/functions'
import { createSupabaseAdmin, requireAdmin } from './_shared/supabaseAdmin.mts'
import { signedUrl } from './_shared/storage.mts'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)
  try {
    await requireAdmin(req)
    const { path } = await req.json() as { path: string }
    if (!path) return json({ error: 'Chemin de fichier manquant' }, 422)
    const admin = createSupabaseAdmin()
    const url = await signedUrl(admin, 'cv-files', path, 900)
    return json({ ok: Boolean(url), url })
  } catch (error) {
    const message = error instanceof Response ? await error.text() : error instanceof Error ? error.message : 'Erreur inconnue'
    const status = error instanceof Response ? error.status : 500
    return json({ error: message }, status)
  }
}

export const config: Config = { path: '/api/sign-file' }
