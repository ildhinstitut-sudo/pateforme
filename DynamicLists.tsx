import type { CertificateItem, DatedItem, EducationItem, ExperienceItem, LanguageItem } from '../../shared/cvTypes'

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="field"><span>{label}</span><input type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field wide"><span>{label}</span><textarea value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>
}

export function TagsInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder?: string }) {
  return <label className="field wide"><span>{label}</span><textarea value={values.join('\n')} placeholder={placeholder ?? 'Un élément par ligne'} onChange={(e) => onChange(e.target.value.split('\n').map(v => v.trim()).filter(Boolean))} /></label>
}

export function DatedList<T extends DatedItem>({ title, items, onChange, kind }: { title: string; items: T[]; onChange: (items: T[]) => void; kind: 'education' | 'experience' }) {
  const empty = kind === 'education'
    ? { title: '', diploma: '', organization: '', city: '', country: '', startDate: '', endDate: '', description: '' } as unknown as T
    : { title: '', organization: '', city: '', country: '', startDate: '', endDate: '', description: '', missions: [] } as unknown as T
  const update = (index: number, patch: Partial<T>) => onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item))
  return <div className="repeat-box">
    <div className="repeat-head"><h3>{title}</h3><button type="button" className="secondary" onClick={() => onChange([...items, empty])}>+ Ajouter</button></div>
    {!items.length && <p className="hint">Aucun élément ajouté.</p>}
    {items.map((item, index) => <div className="repeat-item" key={index}>
      <div className="row two">
        {kind === 'education'
          ? <Field label="Diplôme / Niveau" value={(item as EducationItem).diploma ?? item.title} onChange={(v) => update(index, { diploma: v, title: v } as unknown as Partial<T>)} />
          : <Field label="Poste / Activité" value={item.title} onChange={(v) => update(index, { title: v } as Partial<T>)} />}
        <Field label="Structure / École" value={item.organization} onChange={(v) => update(index, { organization: v } as Partial<T>)} />
      </div>
      <div className="row four">
        <Field label="Ville" value={item.city} onChange={(v) => update(index, { city: v } as Partial<T>)} />
        <Field label="Pays" value={item.country} onChange={(v) => update(index, { country: v } as Partial<T>)} />
        <Field label="Début" type="month" value={item.startDate} onChange={(v) => update(index, { startDate: v } as Partial<T>)} />
        <Field label="Fin" type="month" value={item.endDate} onChange={(v) => update(index, { endDate: v } as Partial<T>)} />
      </div>
      <TextArea label="Description" value={item.description} onChange={(v) => update(index, { description: v } as Partial<T>)} />
      {kind === 'experience' && <TagsInput label="Missions principales" values={(item as ExperienceItem).missions ?? []} onChange={(v) => update(index, { missions: v } as unknown as Partial<T>)} />}
      <button type="button" className="danger small" onClick={() => onChange(items.filter((_, i) => i !== index))}>Supprimer</button>
    </div>)}
  </div>
}

export function LanguagesList({ items, onChange }: { items: LanguageItem[]; onChange: (items: LanguageItem[]) => void }) {
  const update = (index: number, patch: Partial<LanguageItem>) => onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item))
  return <div className="repeat-box">
    <div className="repeat-head"><h3>Langues</h3><button type="button" className="secondary" onClick={() => onChange([...items, { language: '', level: '', certificate: '' }])}>+ Ajouter</button></div>
    {items.map((item, index) => <div className="row three inline-repeat" key={index}>
      <Field label="Langue" value={item.language} onChange={(v) => update(index, { language: v })} />
      <Field label="Niveau" value={item.level} onChange={(v) => update(index, { level: v })} />
      <Field label="Certificat" value={item.certificate} onChange={(v) => update(index, { certificate: v })} />
      <button type="button" className="danger small" onClick={() => onChange(items.filter((_, i) => i !== index))}>Supprimer</button>
    </div>)}
  </div>
}

export function CertificatesList({ items, onChange }: { items: CertificateItem[]; onChange: (items: CertificateItem[]) => void }) {
  const update = (index: number, patch: Partial<CertificateItem>) => onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item))
  return <div className="repeat-box">
    <div className="repeat-head"><h3>Certificats</h3><button type="button" className="secondary" onClick={() => onChange([...items, { name: '', organization: '', date: '', city: '' }])}>+ Ajouter</button></div>
    {items.map((item, index) => <div className="row four inline-repeat" key={index}>
      <Field label="Nom" value={item.name} onChange={(v) => update(index, { name: v })} />
      <Field label="Organisation" value={item.organization} onChange={(v) => update(index, { organization: v })} />
      <Field label="Date" value={item.date} onChange={(v) => update(index, { date: v })} />
      <Field label="Ville" value={item.city} onChange={(v) => update(index, { city: v })} />
      <button type="button" className="danger small" onClick={() => onChange(items.filter((_, i) => i !== index))}>Supprimer</button>
    </div>)}
  </div>
}
