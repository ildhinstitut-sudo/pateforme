import type { CertificateItem, CVPayload, CVTemplate, DatedItem, EducationItem, ExperienceItem } from './cvTypes'

const labels = {
  fr: {
    cvTitle: 'Curriculum Vitae',
    profile: 'Profil',
    personal: 'Informations personnelles',
    education: 'Formation',
    experiences: 'Expériences professionnelles',
    internships: 'Stages',
    languages: 'Langues',
    skills: 'Compétences',
    softSkills: 'Qualités personnelles',
    certificates: 'Certificats',
    hobbies: 'Centres d’intérêt',
    references: 'Références',
    birthDate: 'Date de naissance',
    birthPlace: 'Lieu de naissance',
    nationality: 'Nationalité',
    address: 'Adresse',
    phone: 'Téléphone',
    email: 'Email',
    target: 'Objectif',
    today: 'Aujourd’hui'
  },
  de: {
    cvTitle: 'Lebenslauf',
    profile: 'Profil',
    personal: 'Persönliche Daten',
    education: 'Schulbildung / Ausbildung',
    experiences: 'Berufserfahrung',
    internships: 'Praktika',
    languages: 'Sprachkenntnisse',
    skills: 'Kenntnisse',
    softSkills: 'Persönliche Stärken',
    certificates: 'Zertifikate',
    hobbies: 'Interessen',
    references: 'Referenzen',
    birthDate: 'Geburtsdatum',
    birthPlace: 'Geburtsort',
    nationality: 'Staatsangehörigkeit',
    address: 'Adresse',
    phone: 'Telefon',
    email: 'E-Mail',
    target: 'Ziel',
    today: 'Heute'
  },
  fr_de: {
    cvTitle: 'Curriculum Vitae / Lebenslauf',
    profile: 'Profil / Profil',
    personal: 'Informations personnelles / Persönliche Daten',
    education: 'Formation / Ausbildung',
    experiences: 'Expériences / Erfahrungen',
    internships: 'Stages / Praktika',
    languages: 'Langues / Sprachen',
    skills: 'Compétences / Kenntnisse',
    softSkills: 'Qualités / Stärken',
    certificates: 'Certificats / Zertifikate',
    hobbies: 'Centres d’intérêt / Interessen',
    references: 'Références / Referenzen',
    birthDate: 'Date de naissance / Geburtsdatum',
    birthPlace: 'Lieu de naissance / Geburtsort',
    nationality: 'Nationalité / Staatsangehörigkeit',
    address: 'Adresse / Adresse',
    phone: 'Téléphone / Telefon',
    email: 'Email / E-Mail',
    target: 'Objectif / Ziel',
    today: 'Aujourd’hui / Heute'
  }
}

function t(payload: CVPayload) {
  return labels[payload.language ?? 'fr'] ?? labels.fr
}

function esc(value?: string | number | null) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function cleanList(values: string[] = []) {
  return values.map((v) => v.trim()).filter(Boolean)
}

function dateRange(item: DatedItem, today: string) {
  if (!item.startDate && !item.endDate) return ''
  return `${esc(item.startDate || '')}${item.startDate || item.endDate ? ' – ' : ''}${esc(item.endDate || today)}`
}

function place(item: DatedItem) {
  return [item.organization, item.city, item.country].filter(Boolean).map(esc).join(' · ')
}

function renderPersonal(payload: CVPayload) {
  const L = t(payload)
  const p = payload.personal
  const rows = [
    [L.birthDate, p.birthDate],
    [L.birthPlace, p.birthPlace],
    [L.nationality, p.nationality],
    [L.address, [p.address, p.city, p.country].filter(Boolean).join(', ')],
    [L.phone, p.phone],
    [L.email, p.email],
  ].filter(([, value]) => Boolean(value))

  return `<div class="personal-list">${rows
    .map(([label, value]) => `<div><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`)
    .join('')}</div>`
}

function renderEducation(items: EducationItem[], payload: CVPayload) {
  if (!items?.length) return ''
  const L = t(payload)
  return section(L.education, items.map((item) => itemBlock({
    title: item.diploma || item.title,
    meta: [dateRange(item, L.today), place(item), item.level].filter(Boolean).join(' · '),
    description: item.description,
  })).join(''))
}

function renderExperience(items: ExperienceItem[], title: string, payload: CVPayload) {
  if (!items?.length) return ''
  const L = t(payload)
  return section(title, items.map((item) => {
    const missions = cleanList(item.missions ?? [])
    return itemBlock({
      title: item.title,
      meta: [dateRange(item, L.today), place(item)].filter(Boolean).join(' · '),
      description: item.description,
      extra: missions.length ? `<ul>${missions.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''
    })
  }).join(''))
}

function renderLanguages(payload: CVPayload) {
  if (!payload.languages?.length) return ''
  const L = t(payload)
  const html = `<div class="language-grid">${payload.languages.map((item) => `<div class="lang-pill"><strong>${esc(item.language)}</strong><span>${esc(item.level)}${item.certificate ? ` · ${esc(item.certificate)}` : ''}</span></div>`).join('')}</div>`
  return section(L.languages, html)
}

function renderCertificates(items: CertificateItem[], payload: CVPayload) {
  if (!items?.length) return ''
  const L = t(payload)
  return section(L.certificates, items.map((item) => itemBlock({
    title: item.name,
    meta: [item.organization, item.city, item.date].filter(Boolean).map(esc).join(' · '),
  })).join(''))
}

function renderChips(title: string, values: string[]) {
  const list = cleanList(values)
  if (!list.length) return ''
  return section(title, `<div class="chip-list">${list.map((value) => `<span>${esc(value)}</span>`).join('')}</div>`)
}

function section(title: string, body: string) {
  if (!body) return ''
  return `<section class="cv-section"><h2>${esc(title)}</h2>${body}</section>`
}

function itemBlock({ title, meta, description, extra }: { title?: string, meta?: string, description?: string, extra?: string }) {
  return `<article class="cv-item">
    ${title ? `<h3>${esc(title)}</h3>` : ''}
    ${meta ? `<p class="meta">${meta}</p>` : ''}
    ${description ? `<p>${esc(description)}</p>` : ''}
    ${extra ?? ''}
  </article>`
}

function fallbackProfile(payload: CVPayload) {
  const target = payload.targetTitle || objectiveLabel(payload.objective, payload.language)
  if (payload.language === 'de') return `Motivierte Kandidatin / motivierter Kandidat mit Interesse an ${target}. Lernbereit, zuverlässig und offen für neue berufliche Erfahrungen in Deutschland.`
  if (payload.language === 'fr_de') return `Candidat(e) motivé(e) / motivierte Kandidatin bzw. motivierter Kandidat avec intérêt pour ${target}. Sérieux(se), fiable et prêt(e) à apprendre.`
  return `Candidat(e) motivé(e) avec un intérêt particulier pour ${target}. Sérieux(se), fiable et prêt(e) à développer ses compétences dans un environnement professionnel.`
}

function objectiveLabel(objective: string, lang: CVPayload['language']) {
  const fr: Record<string, string> = {
    au_pair: 'Au Pair', fsj_bfd: 'FSJ/BFD', ausbildung_pflege: 'Ausbildung Pflege', gastronomie_koch: 'Gastronomie/Koch', hotellerie: 'Hôtellerie', kita_education: 'Kita/Éducation', administration_comptabilite: 'Administration/Comptabilité', informatique_digital: 'Informatique/Digital', emploi_stage: 'Emploi/Stage', general_allemagne: 'Candidature en Allemagne'
  }
  const de: Record<string, string> = {
    au_pair: 'Au-pair', fsj_bfd: 'FSJ/BFD', ausbildung_pflege: 'Ausbildung in der Pflege', gastronomie_koch: 'Gastronomie/Koch', hotellerie: 'Hotellerie', kita_education: 'Kita/Erziehung', administration_comptabilite: 'Verwaltung/Buchhaltung', informatique_digital: 'IT/Digital', emploi_stage: 'Arbeit/Praktikum', general_allemagne: 'Bewerbung in Deutschland'
  }
  return (lang === 'de' ? de : fr)[objective] ?? objective
}

export function renderCVHtml(payload: CVPayload, template: CVTemplate, options: { printReady?: boolean } = {}) {
  const L = t(payload)
  const p = payload.personal
  const fullName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim().toUpperCase()
  const target = payload.targetTitle || objectiveLabel(payload.objective, payload.language)
  const profile = payload.profile?.trim() || fallbackProfile(payload)
  const hasPhoto = template.withPhoto && Boolean(p.photoDataUrl)

  const profileSection = section(L.profile, `<p class="lead">${esc(profile)}</p>`)
  const personalSection = section(L.personal, renderPersonal(payload))
  const educationSection = renderEducation(payload.education, payload)
  const internshipsSection = renderExperience(payload.internships, L.internships, payload)
  const experiencesSection = renderExperience(payload.experiences, L.experiences, payload)
  const languageSection = renderLanguages(payload)
  const skillsSection = renderChips(L.skills, payload.skills)
  const softSkillsSection = renderChips(L.softSkills, payload.softSkills)
  const certificatesSection = renderCertificates(payload.certificates, payload)
  const hobbiesSection = renderChips(L.hobbies, payload.hobbies)
  const referencesSection = payload.references ? section(L.references, `<p>${esc(payload.references)}</p>`) : ''

  const sidebarSections = [personalSection, languageSection, skillsSection, softSkillsSection, hobbiesSection].join('')
  const mainSections = [profileSection, experiencesSection, internshipsSection, educationSection, certificatesSection, referencesSection].join('')
  const classicSections = [profileSection, personalSection, educationSection, experiencesSection, internshipsSection, languageSection, skillsSection, softSkillsSection, certificatesSection, hobbiesSection, referencesSection].join('')

  const body = ['sidebar', 'bilingual'].includes(template.layout)
    ? `<div class="layout-sidebar"><aside>${sidebarSections}</aside><main>${mainSections}</main></div>`
    : `<main class="layout-${template.layout}">${classicSections}</main>`

  return `<!doctype html>
<html lang="${payload.language === 'de' ? 'de' : 'fr'}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(L.cvTitle)} - ${esc(fullName)}</title>
<style>
:root { --accent: ${template.accent}; --secondary: ${template.secondary}; --ink: #172033; --muted: #64748b; --line: #dbe3ef; }
* { box-sizing: border-box; }
body { margin: 0; background: #f3f5f8; color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
.cv-page { width: 210mm; min-height: 297mm; margin: ${options.printReady ? '0' : '24px auto'}; background: #fff; box-shadow: ${options.printReady ? 'none' : '0 20px 60px rgba(15,23,42,.16)'}; overflow: hidden; }
.cv-header { padding: 34px 42px; background: linear-gradient(135deg, var(--accent), #0f172a); color: white; display: flex; align-items: center; gap: 24px; }
.cv-header.minimal, .cv-header.classic { background: #fff; color: var(--ink); border-bottom: 5px solid var(--accent); }
.identity { flex: 1; }
.identity h1 { margin: 0; font-size: 31px; letter-spacing: .06em; line-height: 1.05; }
.identity p { margin: 10px 0 0; font-size: 15px; opacity: .9; }
.photo { width: 112px; height: 112px; object-fit: cover; border-radius: ${template.layout === 'classic' ? '8px' : '999px'}; border: 4px solid rgba(255,255,255,.75); background: #fff; }
.cv-body { padding: 34px 42px 42px; }
.layout-sidebar { display: grid; grid-template-columns: 33% 1fr; gap: 30px; }
.layout-sidebar aside { background: var(--secondary); border-radius: 20px; padding: 22px; align-self: start; }
.layout-sidebar aside .cv-section { margin-bottom: 22px; }
.cv-section { margin: 0 0 24px; break-inside: avoid; }
.cv-section h2 { margin: 0 0 12px; color: var(--accent); font-size: 15px; text-transform: uppercase; letter-spacing: .1em; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
.cv-item { margin: 0 0 16px; padding-left: ${template.layout === 'timeline' ? '16px' : '0'}; border-left: ${template.layout === 'timeline' ? '3px solid var(--accent)' : 'none'}; }
.layout-cards .cv-item, .layout-premium .cv-item { background: var(--secondary); border-radius: 14px; padding: 14px 16px; border-left: 4px solid var(--accent); }
.cv-item h3 { margin: 0; font-size: 16px; }
.cv-item p { margin: 6px 0 0; }
.meta { color: var(--muted); font-size: 13px; }
.lead { font-size: 15px; margin: 0; }
ul { margin: 8px 0 0; padding-left: 18px; }
.personal-list { display: grid; gap: 8px; }
.personal-list div { display: grid; gap: 2px; }
.personal-list strong { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.personal-list span { font-size: 14px; }
.chip-list, .language-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-list span, .lang-pill { background: var(--secondary); color: var(--ink); border: 1px solid rgba(15,23,42,.08); padding: 7px 10px; border-radius: 999px; font-size: 13px; }
.lang-pill { border-radius: 12px; display: grid; gap: 2px; }
.lang-pill span { color: var(--muted); font-size: 12px; }
.layout-compact .cv-section, .layout-minimal .cv-section { margin-bottom: 18px; }
.layout-european .cv-section { display: grid; grid-template-columns: 34% 1fr; gap: 20px; border-bottom: 1px solid var(--line); padding-bottom: 18px; }
.layout-european .cv-section h2 { border: none; margin: 0; }
.footer-note { padding: 0 42px 22px; color: #94a3b8; font-size: 11px; text-align: right; }
@media print { body { background: #fff; } .cv-page { width: 100%; min-height: auto; margin: 0; box-shadow: none; } }
@media (max-width: 800px) { .cv-page { width: 100%; margin: 0; } .layout-sidebar { grid-template-columns: 1fr; } .cv-header { flex-direction: column-reverse; align-items: flex-start; } .cv-body { padding: 24px; } }
</style>
</head>
<body>
  <article class="cv-page">
    <header class="cv-header ${template.layout}">
      <div class="identity"><h1>${esc(fullName || 'NOM PRÉNOM')}</h1><p>${esc(target)}</p></div>
      ${hasPhoto ? `<img class="photo" src="${esc(p.photoDataUrl)}" alt="Photo" />` : ''}
    </header>
    <div class="cv-body">${body}</div>
    <div class="footer-note">${esc(template.name)}</div>
  </article>
</body>
</html>`
}
