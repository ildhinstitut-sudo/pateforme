export type CVObjective =
  | 'au_pair'
  | 'fsj_bfd'
  | 'ausbildung_pflege'
  | 'gastronomie_koch'
  | 'hotellerie'
  | 'kita_education'
  | 'administration_comptabilite'
  | 'informatique_digital'
  | 'emploi_stage'
  | 'general_allemagne'

export type CVLanguage = 'fr' | 'de' | 'fr_de'

export type CVLayout =
  | 'classic'
  | 'sidebar'
  | 'timeline'
  | 'cards'
  | 'minimal'
  | 'european'
  | 'compact'
  | 'premium'
  | 'bilingual'

export interface CVTemplate {
  id: string
  name: string
  shortName: string
  category: string
  objectiveHints: CVObjective[]
  layout: CVLayout
  accent: string
  secondary: string
  withPhoto: boolean
  description: string
  bestFor: string[]
  sections: string[]
}

export interface DatedItem {
  title: string
  organization?: string
  city?: string
  country?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface EducationItem extends DatedItem {
  diploma?: string
  level?: string
}

export interface ExperienceItem extends DatedItem {
  missions?: string[]
}

export interface LanguageItem {
  language: string
  level: string
  certificate?: string
}

export interface CertificateItem {
  name: string
  organization?: string
  date?: string
  city?: string
}

export interface CVPayload {
  objective: CVObjective
  targetTitle?: string
  language: CVLanguage
  templateId?: string
  stylePreference?: 'auto' | 'simple' | 'modern' | 'premium'
  personal: {
    firstName: string
    lastName: string
    gender?: string
    birthDate?: string
    birthPlace?: string
    nationality?: string
    address?: string
    city?: string
    country?: string
    phone?: string
    email?: string
    maritalStatus?: string
    photoDataUrl?: string
  }
  profile?: string
  education: EducationItem[]
  experiences: ExperienceItem[]
  internships: ExperienceItem[]
  languages: LanguageItem[]
  skills: string[]
  softSkills: string[]
  certificates: CertificateItem[]
  hobbies: string[]
  references?: string
  consent: boolean
}

export interface GeneratedFileRecord {
  id: string
  submission_id: string
  file_type: 'pdf' | 'docx' | 'html'
  storage_path: string
  template_id: string
  created_at: string
}

export interface CVSubmissionRecord {
  id: string
  created_at: string
  updated_at: string
  tracking_code: string
  status: 'submitted' | 'generated' | 'reviewed' | 'sent' | 'error'
  template_id: string
  language: CVLanguage
  payload: CVPayload
  photo_path?: string | null
  source?: string | null
  notes?: string | null
}
