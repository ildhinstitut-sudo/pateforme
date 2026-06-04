import type { Config } from '@netlify/functions'
import { createSupabaseAdmin } from './_shared/supabaseAdmin.mts'
import { parseDataUrl, uploadBuffer } from './_shared/storage.mts'
import { chooseTemplate } from '../../shared/templateRules'
import { renderCVHtml } from '../../shared/htmlRenderer'
import { buildPdfBuffer } from '../../shared/pdfRenderer'
import { buildDocxBuffer } from '../../shared/docxRenderer'
import { normalizePayload, stripPhoto, trackingCode, validatePayload } from '../../shared/validation'
import type { CVPayload } from '../../shared/cvTypes'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  try {
    const body = await req.json() as { payload: CVPayload; source?: string }
    const validation = validatePayload(normalizePayload(body.payload))
    if (!validation.ok) return json({ error: 'Formulaire incomplet', details: validation.errors }, 422)

    const admin = createSupabaseAdmin()
    const payload = validation.payload
    const selectedTemplate = chooseTemplate(payload)
    const code = trackingCode()
    let photoPath: string | null = null

    const photo = parseDataUrl(payload.personal.photoDataUrl)
    if (photo) {
      photoPath = `${code}/photo.${photo.extension}`
      await uploadBuffer(admin, 'cv-photos', photoPath, photo.buffer, photo.mime)
    }

    const payloadForDb = stripPhoto(payload)
    const { data: submission, error: insertError } = await admin
      .from('cv_submissions')
      .insert({
        tracking_code: code,
        status: 'submitted',
        template_id: selectedTemplate.id,
        language: payload.language,
        payload: payloadForDb,
        photo_path: photoPath,
        source: body.source ?? 'public-form',
      })
      .select('id, tracking_code, template_id')
      .single()

    if (insertError) throw insertError

    let generated = false
    let generationWarning: string | null = null
    try {
      const payloadForGeneration = { ...payload, templateId: selectedTemplate.id }
      const html = renderCVHtml(payloadForGeneration, selectedTemplate, { printReady: true })
      const pdf = await buildPdfBuffer(payloadForGeneration, selectedTemplate)
      const docx = await buildDocxBuffer(payloadForGeneration, selectedTemplate)
      const base = `${submission.id}/${selectedTemplate.id}`
      await uploadBuffer(admin, 'cv-files', `${base}.html`, Buffer.from(html, 'utf-8'), 'text/html; charset=utf-8')
      await uploadBuffer(admin, 'cv-files', `${base}.pdf`, pdf, 'application/pdf')
      await uploadBuffer(admin, 'cv-files', `${base}.docx`, docx, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      await admin.from('cv_generated_files').insert([
        { submission_id: submission.id, file_type: 'html', template_id: selectedTemplate.id, storage_path: `${base}.html` },
        { submission_id: submission.id, file_type: 'pdf', template_id: selectedTemplate.id, storage_path: `${base}.pdf` },
        { submission_id: submission.id, file_type: 'docx', template_id: selectedTemplate.id, storage_path: `${base}.docx` },
      ])
      await admin.from('cv_submissions').update({ status: 'generated' }).eq('id', submission.id)
      generated = true
    } catch (error) {
      generationWarning = error instanceof Error ? error.message : 'La génération automatique a échoué.'
      await admin.from('cv_submissions').update({ status: 'error', notes: generationWarning }).eq('id', submission.id)
    }

    return json({
      ok: true,
      id: submission.id,
      trackingCode: submission.tracking_code,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      generated,
      warning: generationWarning,
    })
  } catch (error) {
    const message = error instanceof Response ? await error.text() : error instanceof Error ? error.message : 'Erreur inconnue'
    const status = error instanceof Response ? error.status : 500
    return json({ error: message }, status)
  }
}

export const config: Config = { path: '/api/submit-cv' }
