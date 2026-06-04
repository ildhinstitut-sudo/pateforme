import { CV_TEMPLATES } from '../../shared/templateCatalog'

interface Props {
  selected?: string
  onSelect?: (id: string) => void
  compact?: boolean
}

export function TemplateGallery({ selected, onSelect, compact = false }: Props) {
  return <div className={compact ? 'template-grid compact' : 'template-grid'}>
    <button
      type="button"
      className={selected === 'auto' || !selected ? 'template-card selected' : 'template-card'}
      onClick={() => onSelect?.('auto')}
    >
      <div className="template-swatch" style={{ background: 'linear-gradient(135deg,#111827,#64748b)' }} />
      <strong>Choix automatique</strong>
      <span>Le serveur choisit selon les réponses.</span>
    </button>
    {CV_TEMPLATES.map((template) => <button
      type="button"
      className={selected === template.id ? 'template-card selected' : 'template-card'}
      key={template.id}
      onClick={() => onSelect?.(template.id)}
    >
      <div className="template-swatch" style={{ background: `linear-gradient(135deg, ${template.accent}, ${template.secondary})` }} />
      <strong>{template.shortName}</strong>
      <span>{compact ? template.category : template.description}</span>
    </button>)}
  </div>
}
