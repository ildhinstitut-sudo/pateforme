import { TemplateGallery } from '../components/TemplateGallery'

export function Home() {
  return <main className="app-shell">
    <section className="hero">
      <div>
        <p className="eyebrow">DEUTSCHHAUS INSTITUT</p>
        <h1>Plateforme automatique de génération de CV professionnels</h1>
        <p>Collectez les informations des élèves, choisissez automatiquement le modèle adapté, puis générez un CV PDF et Word modifiable.</p>
        <div className="hero-actions">
          <a className="primary link-button" href="/formulaire">Ouvrir le formulaire élève</a>
          <a className="secondary link-button" href="/admin">Espace administrateur</a>
        </div>
      </div>
      <div className="stats-card">
        <strong>20</strong><span>templates modernes</span>
        <strong>PDF + DOCX</strong><span>génération serveur</span>
        <strong>Supabase</strong><span>base + fichiers</span>
      </div>
    </section>
    <section className="panel">
      <h2>Templates disponibles</h2>
      <TemplateGallery compact />
    </section>
  </main>
}
