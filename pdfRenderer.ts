import PDFDocument from 'pdfkit'
import type { CVPayload, CVTemplate, ExperienceItem, DatedItem } from './cvTypes'

function text(value?: string | null) {
  return (value ?? '').toString().trim()
}

function fullName(payload: CVPayload) {
  return `${text(payload.personal.firstName)} ${text(payload.personal.lastName)}`.trim().toUpperCase()
}

function objective(payload: CVPayload) {
  return text(payload.targetTitle) || payload.objective.replaceAll('_', ' ')
}

function range(item: DatedItem) {
  if (!item.startDate && !item.endDate) return ''
  return `${item.startDate || ''} – ${item.endDate || 'Aujourd’hui'}`
}

function place(item: DatedItem) {
  return [item.organization, item.city, item.country].filter(Boolean).join(' · ')
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, accent: string) {
  doc.moveDown(0.9)
  doc.fillColor(accent).font('Helvetica-Bold').fontSize(12).text(title.toUpperCase(), { characterSpacing: 0.8 })
  doc.moveTo(doc.x, doc.y + 3).lineTo(555, doc.y + 3).strokeColor('#d7dee8').lineWidth(0.5).stroke()
  doc.moveDown(0.5)
  doc.fillColor('#172033')
}

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  items.filter(Boolean).forEach((item) => {
    doc.font('Helvetica').fontSize(9.5).fillColor('#172033').text(`• ${item}`, { indent: 8 })
  })
}

function block(doc: PDFKit.PDFDocument, item: ExperienceItem | DatedItem) {
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#172033').text(text(item.title))
  const meta = [range(item), place(item)].filter(Boolean).join(' · ')
  if (meta) doc.font('Helvetica').fontSize(8.8).fillColor('#64748b').text(meta)
  if (item.description) doc.font('Helvetica').fontSize(9.4).fillColor('#172033').text(item.description, { lineGap: 1.5 })
  if ('missions' in item && item.missions?.length) bulletList(doc, item.missions)
  doc.moveDown(0.55)
}

function parsePhoto(dataUrl?: string) {
  if (!dataUrl?.startsWith('data:image/')) return null
  const [, base64] = dataUrl.split(',')
  if (!base64) return null
  return Buffer.from(base64, 'base64')
}

export async function buildPdfBuffer(payload: CVPayload, template: CVTemplate): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 36, left: 40, right: 40, bottom: 36 }, bufferPages: true })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const accent = template.accent
    const secondary = template.secondary

    // Header
    doc.rect(0, 0, 595, 116).fill(accent)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text(fullName(payload) || 'NOM PRÉNOM', 40, 34, { width: 390 })
    doc.font('Helvetica').fontSize(11).fillColor('#e8eef8').text(objective(payload), 40, 68, { width: 390 })

    const photo = template.withPhoto ? parsePhoto(payload.personal.photoDataUrl) : null
    if (photo) {
      try {
        doc.image(photo, 470, 26, { width: 78, height: 78, cover: [78, 78] })
      } catch {
        doc.circle(509, 65, 39).fill('#ffffff')
      }
    }

    doc.y = 142
    const leftX = 40
    const rightX = template.layout === 'sidebar' || template.layout === 'bilingual' ? 220 : 40
    const mainWidth = template.layout === 'sidebar' || template.layout === 'bilingual' ? 335 : 515

    if (template.layout === 'sidebar' || template.layout === 'bilingual') {
      doc.save()
      doc.rect(30, 130, 165, 680).fill(secondary)
      doc.restore()
      doc.x = leftX
      doc.y = 150
      doc.fillColor(accent).font('Helvetica-Bold').fontSize(10).text('CONTACT')
      const contactRows = [
        payload.personal.birthDate && `Né(e) le ${payload.personal.birthDate}`,
        payload.personal.birthPlace && `À ${payload.personal.birthPlace}`,
        payload.personal.nationality && payload.personal.nationality,
        [payload.personal.address, payload.personal.city, payload.personal.country].filter(Boolean).join(', '),
        payload.personal.phone,
        payload.personal.email,
      ].filter(Boolean) as string[]
      doc.moveDown(0.4)
      contactRows.forEach((row) => doc.fillColor('#172033').font('Helvetica').fontSize(8.8).text(row, { width: 140 }))

      if (payload.languages.length) {
        sectionTitle(doc, 'Langues', accent)
        payload.languages.forEach((lang) => doc.font('Helvetica').fontSize(8.8).fillColor('#172033').text(`${lang.language}: ${lang.level}${lang.certificate ? ` · ${lang.certificate}` : ''}`, { width: 140 }))
      }

      if (payload.skills.length) {
        sectionTitle(doc, 'Compétences', accent)
        bulletList(doc, payload.skills.slice(0, 12))
      }

      doc.x = rightX
      doc.y = 150
    }

    doc.x = rightX
    doc.y = template.layout === 'sidebar' || template.layout === 'bilingual' ? 150 : 140

    sectionTitle(doc, 'Profil', accent)
    doc.font('Helvetica').fontSize(10).fillColor('#172033').text(payload.profile || `Candidat(e) motivé(e) avec un intérêt pour ${objective(payload)}.`, { width: mainWidth, lineGap: 2 })

    if (payload.experiences.length) {
      sectionTitle(doc, 'Expériences professionnelles', accent)
      payload.experiences.forEach((item) => block(doc, item))
    }
    if (payload.internships.length) {
      sectionTitle(doc, 'Stages', accent)
      payload.internships.forEach((item) => block(doc, item))
    }
    if (payload.education.length) {
      sectionTitle(doc, 'Formation', accent)
      payload.education.forEach((item) => block(doc, { ...item, title: item.diploma || item.title }))
    }
    if (!['sidebar', 'bilingual'].includes(template.layout)) {
      if (payload.languages.length) {
        sectionTitle(doc, 'Langues', accent)
        payload.languages.forEach((lang) => doc.font('Helvetica').fontSize(9.3).fillColor('#172033').text(`${lang.language}: ${lang.level}${lang.certificate ? ` · ${lang.certificate}` : ''}`))
      }
      if (payload.skills.length) {
        sectionTitle(doc, 'Compétences', accent)
        bulletList(doc, payload.skills)
      }
    }
    if (payload.certificates.length) {
      sectionTitle(doc, 'Certificats', accent)
      payload.certificates.forEach((cert) => doc.font('Helvetica').fontSize(9.3).fillColor('#172033').text(`${cert.name}${cert.organization ? ` · ${cert.organization}` : ''}${cert.date ? ` · ${cert.date}` : ''}`))
    }
    if (payload.hobbies.length) {
      sectionTitle(doc, 'Centres d’intérêt', accent)
      doc.font('Helvetica').fontSize(9.3).fillColor('#172033').text(payload.hobbies.join(' · '), { width: mainWidth })
    }

    const pages = doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i)
      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(`${template.name} · DEUTSCHHAUS INSTITUT`, 40, 812, { width: 515, align: 'right' })
    }

    doc.end()
  })
}
