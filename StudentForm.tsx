import { useMemo, useState } from 'react'
import type { CVPayload } from '../../shared/cvTypes'
import { emptyPayload, normalizePayload, validatePayload } from '../../shared/validation'
import { chooseTemplate } from '../../shared/templateRules'
import { TemplateGallery } from '../components/TemplateGallery'
import { CVPreview } from '../components/CVPreview'
import { CertificatesList, DatedList, LanguagesList, TagsInput } from '../components/DynamicLists'
import { languageOptions, objectiveOptions } from '../lib/options'

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return <label className="field"><span>{label}{required ? ' *' : ''}</span><input required={required} type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>
}

function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: { value: T; label: string }[] }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value as T)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field wide"><span>{label}</span><textarea value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>
}

export function StudentForm() {
  const [payload, setPayload] = useState<CVPayload>(() => emptyPayload())
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ trackingCode: string; templateName: string; warning?: string | null } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)

  const selectedTemplate = useMemo(() => chooseTemplate(payload), [payload])

  const update = (patch: Partial<CVPayload>) => setPayload((current) => normalizePayload({ ...current, ...patch }))
  const updatePersonal = (patch: Partial<CVPayload['personal']>) => setPayload((current) => normalizePayload({ ...current, personal: { ...current.personal, ...patch } }))

  async function handlePhoto(file?: File) {
    if (!file) return updatePersonal({ photoDataUrl: undefined })
    if (file.size > 4 * 1024 * 1024) {
      setErrors(['La photo dépasse 4 Mo.'])
      return
    }
    const reader = new FileReader()
    reader.onload = () => updatePersonal({ photoDataUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    const validation = validatePayload(payload)
    if (!validation.ok) {
      setErrors(validation.errors)
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/submit-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, source: window.location.hostname }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.details?.join('\n') || data.error || 'Erreur pendant la soumission')
      setResult({ trackingCode: data.trackingCode, templateName: data.templateName, warning: data.warning })
      setPayload(emptyPayload())
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Erreur inconnue'])
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="app-shell form-shell">
    <section className="hero compact-hero">
      <div>
        <p className="eyebrow">DEUTSCHHAUS INSTITUT</p>
        <h1>Formulaire de création de CV</h1>
        <p>Remplissez les informations. Le serveur sélectionnera le modèle adapté et générera le CV en PDF et Word.</p>
      </div>
      <button className="secondary" type="button" onClick={() => setShowPreview(!showPreview)}>{showPreview ? 'Masquer aperçu' : 'Afficher aperçu'}</button>
    </section>

    {result && <div className="success-card">
      <h2>Formulaire envoyé avec succès</h2>
      <p>Code de suivi : <strong>{result.trackingCode}</strong></p>
      <p>Modèle choisi : <strong>{result.templateName}</strong></p>
      {result.warning && <p className="warning">Données reçues, mais génération automatique à revérifier : {result.warning}</p>}
    </div>}

    {errors.length > 0 && <div className="error-card"><strong>À corriger :</strong><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}

    <div className="workbench">
      <form className="cv-form" onSubmit={submit}>
        <section className="panel">
          <h2>1. Objectif et modèle</h2>
          <div className="row three">
            <SelectField label="Objectif du CV" value={payload.objective} onChange={(value) => update({ objective: value })} options={objectiveOptions} />
            <Field label="Titre souhaité" value={payload.targetTitle} onChange={(v) => update({ targetTitle: v })} placeholder="Ex: Ausbildung als Pflegefachfrau" />
            <SelectField label="Langue du CV" value={payload.language} onChange={(value) => update({ language: value })} options={languageOptions} />
          </div>
          <div className="row two">
            <label className="field"><span>Style préféré</span><select value={payload.stylePreference} onChange={(e) => update({ stylePreference: e.target.value as CVPayload['stylePreference'] })}>
              <option value="auto">Automatique</option><option value="simple">Simple</option><option value="modern">Moderne</option><option value="premium">Premium</option>
            </select></label>
            <div className="auto-choice"><span>Suggestion automatique :</span><strong>{selectedTemplate.name}</strong></div>
          </div>
          <TemplateGallery selected={payload.templateId} onSelect={(id) => update({ templateId: id })} compact />
        </section>

        <section className="panel">
          <h2>2. Informations personnelles</h2>
          <div className="row three">
            <Field required label="Prénom" value={payload.personal.firstName} onChange={(v) => updatePersonal({ firstName: v })} />
            <Field required label="Nom" value={payload.personal.lastName} onChange={(v) => updatePersonal({ lastName: v })} />
            <Field label="Nationalité" value={payload.personal.nationality} onChange={(v) => updatePersonal({ nationality: v })} />
          </div>
          <div className="row three">
            <Field label="Date de naissance" type="date" value={payload.personal.birthDate} onChange={(v) => updatePersonal({ birthDate: v })} />
            <Field label="Lieu de naissance" value={payload.personal.birthPlace} onChange={(v) => updatePersonal({ birthPlace: v })} />
            <Field label="Situation familiale" value={payload.personal.maritalStatus} onChange={(v) => updatePersonal({ maritalStatus: v })} />
          </div>
          <div className="row three">
            <Field label="Adresse" value={payload.personal.address} onChange={(v) => updatePersonal({ address: v })} />
            <Field label="Ville" value={payload.personal.city} onChange={(v) => updatePersonal({ city: v })} />
            <Field label="Pays" value={payload.personal.country} onChange={(v) => updatePersonal({ country: v })} />
          </div>
          <div className="row three">
            <Field label="Téléphone" value={payload.personal.phone} onChange={(v) => updatePersonal({ phone: v })} />
            <Field label="Email" type="email" value={payload.personal.email} onChange={(v) => updatePersonal({ email: v })} />
            <label className="field"><span>Photo</span><input type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0])} /></label>
          </div>
        </section>

        <section className="panel">
          <h2>3. Profil</h2>
          <TextArea label="Résumé personnel" value={payload.profile} onChange={(v) => update({ profile: v })} placeholder="Ex: Je suis une personne motivée, sérieuse et intéressée par..." />
        </section>

        <section className="panel">
          <DatedList title="4. Formation" kind="education" items={payload.education} onChange={(items) => update({ education: items })} />
        </section>

        <section className="panel">
          <DatedList title="5. Expériences professionnelles" kind="experience" items={payload.experiences} onChange={(items) => update({ experiences: items })} />
        </section>

        <section className="panel">
          <DatedList title="6. Stages" kind="experience" items={payload.internships} onChange={(items) => update({ internships: items })} />
        </section>

        <section className="panel">
          <LanguagesList items={payload.languages} onChange={(items) => update({ languages: items })} />
          <TagsInput label="Compétences techniques/pratiques" values={payload.skills} onChange={(values) => update({ skills: values })} placeholder="Ex: Soins de base\nMicrosoft Word\nCuisine\nGarde d'enfants" />
          <TagsInput label="Qualités personnelles" values={payload.softSkills} onChange={(values) => update({ softSkills: values })} placeholder="Ex: Sérieux(se)\nPonctuel(le)\nPatient(e)" />
        </section>

        <section className="panel">
          <CertificatesList items={payload.certificates} onChange={(items) => update({ certificates: items })} />
          <TagsInput label="Centres d’intérêt" values={payload.hobbies} onChange={(values) => update({ hobbies: values })} placeholder="Sport\nLecture\nCuisine" />
          <TextArea label="Références / remarques" value={payload.references} onChange={(v) => update({ references: v })} />
        </section>

        <section className="panel consent-panel">
          <label className="check"><input type="checkbox" checked={payload.consent} onChange={(e) => update({ consent: e.target.checked })} /> <span>J’accepte que mes informations soient utilisées pour générer mon CV.</span></label>
          <button type="submit" className="primary big" disabled={submitting}>{submitting ? 'Envoi en cours...' : 'Soumettre et générer le CV'}</button>
        </section>
      </form>
      {showPreview && <CVPreview payload={payload} />}
    </div>
  </main>
}
