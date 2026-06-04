import type { CVObjective, CVLanguage } from '../../shared/cvTypes'

export const objectiveOptions: { value: CVObjective; label: string }[] = [
  { value: 'au_pair', label: 'Au Pair' },
  { value: 'fsj_bfd', label: 'FSJ / BFD' },
  { value: 'ausbildung_pflege', label: 'Ausbildung Pflege' },
  { value: 'gastronomie_koch', label: 'Gastronomie / Koch' },
  { value: 'hotellerie', label: 'Hôtellerie' },
  { value: 'kita_education', label: 'Kita / Éducation enfantine' },
  { value: 'administration_comptabilite', label: 'Administration / Comptabilité' },
  { value: 'informatique_digital', label: 'Informatique / Digital' },
  { value: 'emploi_stage', label: 'Emploi / Stage' },
  { value: 'general_allemagne', label: 'Candidature générale Allemagne' },
]

export const languageOptions: { value: CVLanguage; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Allemand' },
  { value: 'fr_de', label: 'Français + Allemand' },
]
