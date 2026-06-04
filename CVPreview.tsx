import type { CVPayload } from '../../shared/cvTypes'
import { getTemplateById } from '../../shared/templateCatalog'
import { chooseTemplate } from '../../shared/templateRules'
import { renderCVHtml } from '../../shared/htmlRenderer'

export function CVPreview({ payload }: { payload: CVPayload }) {
  const template = payload.templateId && payload.templateId !== 'auto' ? getTemplateById(payload.templateId) : chooseTemplate(payload)
  const html = renderCVHtml(payload, template)
  return <div className="preview-shell">
    <div className="preview-bar">
      <strong>Aperçu</strong>
      <span>{template.name}</span>
    </div>
    <iframe title="Aperçu du CV" srcDoc={html} />
  </div>
}
