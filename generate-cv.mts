import type { Config } from '@netlify/functions'
import { createSupabaseAdmin, requireAdmin } from './_shared/supabaseAdmin.mts'
import { uploadBuffer, signedUrl } from './_shared/storage.mts'
import { getTemplateById } from '../../shared/templateCatalog'
import { renderCVHtml } from '../../shared/htmlRenderer'
import { buildPdfBuffer } from '../../shared/pdfRenderer'
import { buildDocxBuffer } from '../../shared/docxRenderer'
import type { CVPayload } from '../../shared/cvTypes'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function mimeFromPath(path: string) {
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

async function withPhoto(admin: ReturnType<typeof createSupabaseAdmin>, payload: CVPayload, photoPath?: string | null): Promise<CVPayload> {
  if (!photoPath) return payload
  const { data, error } = await admin.storage.from('cv-photos').download(photoPath)
  if (error || !data) return payload
  const bytes = Buffer.from(await data.arrayBuffer())
  return { ...payload, personal: { ...payload.personal, photoDataUrl: `data:${mimeFromPath(photoPath)};base64,${bytes.toString('base64')}` } }
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  try {
    await requireAdmin(req)
    const { submissionId, templateId } = await req.json() as { submissionId: string; templateId?: string }
    if (!submissionId) return json({ error: 'submissionId manquant' }, 422)

    const admin = createSupabaseAdmin()
    const { data: submission, error } = await admin
      .from('cv_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()
    if (error) throw error

    const template = getTemplateById(templateId || submission.template_id)
    const payload = await withPhoto(admin, { ...(submission.payload as CVPayload), templateId: template.id }, submission.photo_path)

    const html = renderCVHtml(payload, template, { printReady: true })
    const pdf = await buildPdfBuffer(payload, template)
    const docx = await buildDocxBuffer(payload, template)
    const base = `${submission.id}/${template.id}`

    await uploadBuffer(admin, 'cv-files', `${base}.html`, Buffer.from(html, 'utf-8'), 'text/html; charset=utf-8')
    await uploadBuffer(admin, 'cv-files', `${base}.pdf`, pdf, 'application/pdf')
    await uploadBuffer(admin, 'cv-files', `${base}.docx`, docx, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    await admin.from('cv_generated_files').delete().eq('submission_id', submission.id).eq('template_id', template.id)
    await admin.from('cv_generated_files').insert([
      { submission_id: submission.id, file_type: 'html', template_id: template.id, storage_path: `${base}.html` },
      { submission_id: submission.id, file_type: 'pdf', template_id: template.id, storage_path: `${base}.pdf` },
      { submission_id: submission.id, file_type: 'docx', template_id: template.id, storage_path: `${base}.docx` },
    ])
    await admin.from('cv_submissions').update({ status: 'generated', template_id: template.id, notes: null }).eq('id', submission.id)

    const urls = {
      html: await signedUrl(admin, 'cv-files', `${base}.html`),
      pdf: await signedUrl(admin, 'cv-files', `${base}.pdf`),
      docx: await signedUrl(admin, 'cv-files', `${base}.docx`),
    }
    return json({ ok: true, templateId: template.id, templateName: template.name, urls })
  } catch (error) {
    const message = error instanceof Response ? await error.text() : error instanceof Error ? error.message : 'Erreur inconnue'
    const status = error instanceof Response ? error.status : 500
    return json({ error: message }, status)
  }
}

export const config: Config = { path: '/api/generate-cv' }
