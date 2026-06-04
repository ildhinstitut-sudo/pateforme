import type { SupabaseClient } from '@supabase/supabase-js'

export function parseDataUrl(dataUrl?: string) {
  if (!dataUrl?.startsWith('data:')) return null
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const mime = match[1]
  const base64 = match[2]
  if (!mime.startsWith('image/')) return null
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > 4 * 1024 * 1024) throw new Error('La photo dépasse 4 Mo.')
  const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  return { mime, buffer, extension }
}

export async function uploadBuffer(client: SupabaseClient, bucket: string, path: string, buffer: Buffer, contentType: string) {
  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  })
  if (error) throw error
  return path
}

export async function signedUrl(client: SupabaseClient, bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) return null
  return data?.signedUrl ?? null
}
