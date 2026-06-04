import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx'
import type { CertificateItem, CVPayload, CVTemplate, DatedItem, ExperienceItem } from './cvTypes'

function clean(value?: string | null) { return (value ?? '').toString().trim() }
function fullName(payload: CVPayload) { return `${clean(payload.personal.firstName)} ${clean(payload.personal.lastName)}`.trim().toUpperCase() }
function range(item: DatedItem) { return [item.startDate, item.endDate || (item.startDate ? 'Aujourd’hui' : '')].filter(Boolean).join(' – ') }
function place(item: DatedItem) { return [item.organization, item.city, item.country].filter(Boolean).join(' · ') }
function hex(color: string) { return color.replace('#', '').toUpperCase() }

function heading(text: string, color: string) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { color: 'D7DEE8', space: 1, style: BorderStyle.SINGLE, size: 4 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, color: hex(color), size: 22 })]
  })
}

function paragraph(text: string, opts: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}) {
  return new Paragraph({
    spacing: { after: 70 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, color: opts.color ? hex(opts.color) : '172033', size: opts.size ?? 21 })]
  })
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 50 },
    children: [new TextRun({ text, size: 20, color: '172033' })]
  })
}

function itemParagraphs(item: ExperienceItem | DatedItem) {
  const lines: Paragraph[] = []
  lines.push(paragraph(clean(item.title), { bold: true, size: 22 }))
  const meta = [range(item), place(item)].filter(Boolean).join(' · ')
  if (meta) lines.push(paragraph(meta, { color: '#64748B', size: 18 }))
  if (item.description) lines.push(paragraph(item.description, { size: 20 }))
  if ('missions' in item && item.missions?.length) item.missions.filter(Boolean).forEach((m) => lines.push(bullet(m)))
  return lines
}

function section(title: string, color: string, children: Paragraph[]) {
  if (!children.length) return []
  return [heading(title, color), ...children]
}

function chips(values: string[]) {
  return values.filter(Boolean).map((value) => bullet(value))
}

function contactParagraphs(payload: CVPayload) {
  const p = payload.personal
  return [
    p.birthDate && `Date de naissance: ${p.birthDate}`,
    p.birthPlace && `Lieu de naissance: ${p.birthPlace}`,
    p.nationality && `Nationalité: ${p.nationality}`,
    [p.address, p.city, p.country].filter(Boolean).length ? `Adresse: ${[p.address, p.city, p.country].filter(Boolean).join(', ')}` : '',
    p.phone && `Téléphone: ${p.phone}`,
    p.email && `Email: ${p.email}`,
  ].filter(Boolean).map((line) => paragraph(line as string, { size: 19 }))
}

function languages(payload: CVPayload) {
  return payload.languages.filter((l) => l.language || l.level).map((l) => paragraph(`${l.language}: ${l.level}${l.certificate ? ` · ${l.certificate}` : ''}`, { size: 20 }))
}

function certificates(items: CertificateItem[]) {
  return items.filter((c) => c.name).map((c) => paragraph(`${c.name}${c.organization ? ` · ${c.organization}` : ''}${c.date ? ` · ${c.date}` : ''}`, { size: 20 }))
}

export async function buildDocxBuffer(payload: CVPayload, template: CVTemplate): Promise<Buffer> {
  const accent = template.accent
  const name = fullName(payload) || 'NOM PRÉNOM'
  const target = payload.targetTitle || payload.objective.replaceAll('_', ' ')
  const profile = payload.profile || `Candidat(e) motivé(e) avec un intérêt pour ${target}.`

  const mainChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(accent) },
      spacing: { after: 150 },
      children: [new TextRun({ text: name, bold: true, color: 'FFFFFF', size: 34 })]
    }),
    new Paragraph({
      spacing: { after: 250 },
      children: [new TextRun({ text: target, color: hex(accent), bold: true, size: 24 })]
    }),
    ...section('Profil', accent, [paragraph(profile, { size: 21 })]),
    ...section('Expériences professionnelles', accent, payload.experiences.flatMap(itemParagraphs)),
    ...section('Stages', accent, payload.internships.flatMap(itemParagraphs)),
    ...section('Formation', accent, payload.education.flatMap((item) => itemParagraphs({ ...item, title: item.diploma || item.title }))),
    ...section('Langues', accent, languages(payload)),
    ...section('Compétences', accent, chips(payload.skills)),
    ...section('Qualités personnelles', accent, chips(payload.softSkills)),
    ...section('Certificats', accent, certificates(payload.certificates)),
    ...section('Centres d’intérêt', accent, chips(payload.hobbies)),
  ]

  const doc = new Document({
    creator: 'DEUTSCHHAUS INSTITUT',
    title: `CV - ${name}`,
    description: template.name,
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
      },
      children: template.layout === 'sidebar' || template.layout === 'bilingual'
        ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
              rows: [new TableRow({ children: [
                new TableCell({
                  width: { size: 32, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(template.secondary) },
                  margins: { top: 240, bottom: 240, left: 220, right: 220 },
                  children: [heading('Contact', accent), ...contactParagraphs(payload), heading('Langues', accent), ...languages(payload), heading('Compétences', accent), ...chips(payload.skills)]
                }),
                new TableCell({
                  width: { size: 68, type: WidthType.PERCENTAGE },
                  margins: { top: 0, bottom: 0, left: 360, right: 0 },
                  children: mainChildren
                })
              ]})]
            })
          ]
        : [
            ...mainChildren,
            ...section('Informations personnelles', accent, contactParagraphs(payload))
          ]
    }]
  })

  const arrayBuffer = await Packer.toBuffer(doc)
  return Buffer.from(arrayBuffer)
}
