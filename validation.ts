import type { CVPayload } from './cvTypes'

export function emptyPayload(): CVPayload {
  return {
    objective: 'general_allemagne',
    language: 'fr',
    templateId: 'auto',
    stylePreference: 'auto',
    personal: {
      firstName: '',
      lastName: '',
      birthDate: '',
      birthPlace: '',
      nationality: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
    },
    profile: '',
    education: [],
    experiences: [],
    internships: [],
    languages: [{ language: 'Français', level: 'Langue maternelle' }, { language: 'Allemand', level: 'A1' }],
    skills: [],
    softSkills: [],
    certificates: [],
    hobbies: [],
    references: '',
    consent: false,
  }
}

export function normalizePayload(payload: CVPayload): CVPayload {
  const p = payload ?? emptyPayload()
  return {
    ...emptyPayload(),
    ...p,
    personal: { ...emptyPayload().personal, ...(p.personal ?? {}) },
    education: Array.isArray(p.education) ? p.education : [],
    experiences: Array.isArray(p.experiences) ? p.experiences : [],
    internships: Array.isArray(p.internships) ? p.internships : [],
    languages: Array.isArray(p.languages) ? p.languages : [],
    skills: Array.isArray(p.skills) ? p.skills : [],
    softSkills: Array.isArray(p.softSkills) ? p.softSkills : [],
    certificates: Array.isArray(p.certificates) ? p.certificates : [],
    hobbies: Array.isArray(p.hobbies) ? p.hobbies : [],
    consent: Boolean(p.consent),
  }
}

export function validatePayload(payload: CVPayload) {
  const errors: string[] = []
  const p = normalizePayload(payload)
  if (!p.personal.firstName?.trim()) errors.push('Le prénom est obligatoire.')
  if (!p.personal.lastName?.trim()) errors.push('Le nom est obligatoire.')
  if (!p.personal.phone?.trim() && !p.personal.email?.trim()) errors.push('Téléphone ou email obligatoire.')
  if (!p.consent) errors.push('Le consentement est obligatoire pour soumettre le formulaire.')
  if (!p.objective) errors.push('L’objectif du CV est obligatoire.')
  if (!p.language) errors.push('La langue du CV est obligatoire.')
  return { ok: errors.length === 0, errors, payload: p }
}

export function stripPhoto(payload: CVPayload): CVPayload {
  return {
    ...payload,
    personal: { ...payload.personal, photoDataUrl: undefined },
  }
}

export function trackingCode() {
  const now = new Date()
  const stamp = now.toISOString().slice(0, 10).replaceAll('-', '')
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `DH-CV-${stamp}-${random}`
}
