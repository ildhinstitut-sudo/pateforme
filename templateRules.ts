import type { CVPayload } from './cvTypes'
import { CV_TEMPLATES, getTemplateById } from './templateCatalog'

function normalize(value?: string) {
  return (value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function chooseTemplate(payload: CVPayload) {
  if (payload.templateId && payload.templateId !== 'auto') return getTemplateById(payload.templateId)

  const searchable = normalize([
    payload.objective,
    payload.targetTitle,
    payload.profile,
    ...payload.skills,
    ...payload.softSkills,
    ...payload.hobbies,
    ...payload.experiences.map((item) => `${item.title} ${item.organization} ${item.description} ${(item.missions ?? []).join(' ')}`),
    ...payload.internships.map((item) => `${item.title} ${item.organization} ${item.description} ${(item.missions ?? []).join(' ')}`),
    ...payload.education.map((item) => `${item.title} ${item.diploma} ${item.level} ${item.organization}`),
  ].join(' '))

  const score = CV_TEMPLATES.map((template) => {
    let points = 0
    if (template.objectiveHints.includes(payload.objective)) points += 50
    if (payload.language === 'fr_de' && template.id === 'cv-bilingue-fr-de') points += 40
    if (payload.stylePreference === 'premium' && template.layout === 'premium') points += 15
    if (payload.stylePreference === 'simple' && ['minimal', 'classic', 'timeline'].includes(template.layout)) points += 12
    if (payload.stylePreference === 'modern' && ['sidebar', 'cards', 'premium'].includes(template.layout)) points += 12

    const keywordMap: Record<string, string[]> = {
      'cv-aupair-modern': ['au pair', 'enfant', 'enfants', 'garde', 'famille', 'creche', 'maternelle'],
      'cv-fsj-bfd-social': ['fsj', 'bfd', 'volontaire', 'social', 'hopital', 'maison de retraite', 'senior', 'pflege'],
      'cv-pflegefachfrau': ['pflege', 'aide soignante', 'soin', 'soins', 'infirmier', 'hopital', 'malade'],
      'cv-gastronomie-koch': ['koch', 'cuisine', 'cuisinier', 'restaurant', 'serveur', 'serveuse', 'gastronomie'],
      'cv-hotellerie': ['hotel', 'hotellerie', 'reception', 'tourisme', 'service client'],
      'cv-kita-education': ['kita', 'creche', 'maternelle', 'enfant', 'education', 'animation'],
      'cv-comptabilite-administration': ['comptabilite', 'gestion', 'secretariat', 'administration', 'bureau'],
      'cv-informatique-digital': ['informatique', 'digital', 'web', 'ordinateur', 'bureautique'],
    }

    for (const word of keywordMap[template.id] ?? []) {
      if (searchable.includes(word)) points += 8
    }

    const experienceCount = payload.experiences.length + payload.internships.length
    if (experienceCount === 0 && template.id === 'cv-debutant-sans-experience') points += 25
    if (experienceCount > 3 && template.id === 'cv-professionnel-experimente') points += 18

    return { template, points }
  })

  score.sort((a, b) => b.points - a.points)
  return score[0]?.template ?? CV_TEMPLATES[0]
}
