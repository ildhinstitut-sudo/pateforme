import { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { CVSubmissionRecord, GeneratedFileRecord } from '../../shared/cvTypes'
import { CV_TEMPLATES } from '../../shared/templateCatalog'

type SubmissionWithFiles = CVSubmissionRecord & { cv_generated_files?: GeneratedFileRecord[] }

function statusLabel(status: string) {
  const map: Record<string, string> = {
    submitted: 'Soumis', generated: 'Généré', reviewed: 'Corrigé', sent: 'Envoyé', error: 'Erreur'
  }
  return map[status] ?? status
}

export function Admin() {
  const [email, setEmail] = useState('')
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<SubmissionWithFiles[]>([])
  const [selected, setSelected] = useState<SubmissionWithFiles | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadSubmissions()
  }, [session])

  const filtered = useMemo(() => rows.filter((row) => {
    const fullName = `${row.payload?.personal?.firstName ?? ''} ${row.payload?.personal?.lastName ?? ''}`.toLowerCase()
    const matchText = !search || fullName.includes(search.toLowerCase()) || row.tracking_code.toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'all' || row.status === status
    return matchText && matchStatus
  }), [rows, search, status])

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/admin' } })
    if (error) setMessage(error.message)
    else setMessage('Lien de connexion envoyé par email.')
  }

  async function signOut() {
    await supabase?.auth.signOut()
  }

  async function loadSubmissions() {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('cv_submissions')
      .select('*, cv_generated_files(*)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) setMessage(error.message)
    else {
      setRows((data ?? []) as SubmissionWithFiles[])
      if (!selected && data?.length) setSelected(data[0] as SubmissionWithFiles)
    }
    setLoading(false)
  }

  async function updateStatus(row: SubmissionWithFiles, newStatus: CVSubmissionRecord['status']) {
    if (!supabase) return
    const { error } = await supabase.from('cv_submissions').update({ status: newStatus }).eq('id', row.id)
    if (error) setMessage(error.message)
    else await loadSubmissions()
  }

  async function generate(row: SubmissionWithFiles, templateId?: string) {
    if (!session) return
    setMessage('Génération en cours...')
    const response = await fetch('/api/generate-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ submissionId: row.id, templateId: templateId || row.template_id }),
    })
    const data = await response.json()
    if (!response.ok) setMessage(data.error || 'Erreur pendant la génération')
    else {
      setMessage(`CV généré avec le modèle ${data.templateName}.`)
      await loadSubmissions()
    }
  }

  async function openFile(path: string) {
    if (!session) return
    const response = await fetch('/api/sign-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ path })
    })
    const data = await response.json()
    if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer')
    else setMessage(data.error || 'Impossible d’ouvrir le fichier.')
  }

  if (!isSupabaseConfigured) return <main className="app-shell"><div className="panel"><h1>Configuration manquante</h1><p>Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans les variables Netlify.</p></div></main>

  if (!session) return <main className="app-shell auth-shell">
    <section className="panel auth-card">
      <p className="eyebrow">Administration</p>
      <h1>Connexion administrateur</h1>
      <p>Entrez votre email administrateur pour recevoir un lien magique.</p>
      <form onSubmit={signIn} className="login-form">
        <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kpatonoujules@gmail.com" required /></label>
        <button className="primary" type="submit">Recevoir le lien</button>
      </form>
      {message && <p className="message">{message}</p>}
    </section>
  </main>

  return <main className="admin-layout">
    <aside className="admin-sidebar">
      <div className="brand-mini"><strong>DEUTSCHHAUS</strong><span>CV Admin</span></div>
      <button className="secondary" onClick={loadSubmissions}>Actualiser</button>
      <button className="ghost" onClick={signOut}>Déconnexion</button>
      <label className="field"><span>Recherche</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou code" /></label>
      <label className="field"><span>Statut</span><select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">Tous</option><option value="submitted">Soumis</option><option value="generated">Généré</option><option value="reviewed">Corrigé</option><option value="sent">Envoyé</option><option value="error">Erreur</option>
      </select></label>
      {message && <p className="message small-msg">{message}</p>}
    </aside>
    <section className="admin-list">
      <h1>Dossiers CV</h1>
      {loading && <p>Chargement...</p>}
      {filtered.map((row) => <button key={row.id} className={selected?.id === row.id ? 'submission-card active' : 'submission-card'} onClick={() => setSelected(row)}>
        <strong>{row.payload.personal.firstName} {row.payload.personal.lastName}</strong>
        <span>{row.tracking_code}</span>
        <em>{statusLabel(row.status)}</em>
      </button>)}
    </section>
    <section className="admin-detail">
      {!selected ? <div className="panel"><h2>Aucun dossier sélectionné</h2></div> : <div className="panel detail-card">
        <div className="detail-head">
          <div><p className="eyebrow">{selected.tracking_code}</p><h2>{selected.payload.personal.firstName} {selected.payload.personal.lastName}</h2><p>{selected.payload.targetTitle || selected.payload.objective}</p></div>
          <span className={`badge ${selected.status}`}>{statusLabel(selected.status)}</span>
        </div>
        <div className="detail-grid">
          <div><strong>Téléphone</strong><span>{selected.payload.personal.phone || '-'}</span></div>
          <div><strong>Email</strong><span>{selected.payload.personal.email || '-'}</span></div>
          <div><strong>Naissance</strong><span>{selected.payload.personal.birthDate || '-'} {selected.payload.personal.birthPlace || ''}</span></div>
          <div><strong>Langue CV</strong><span>{selected.language}</span></div>
        </div>

        <label className="field"><span>Changer de modèle et régénérer</span><select value={selected.template_id} onChange={(e) => generate(selected, e.target.value)}>
          {CV_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select></label>

        <div className="action-row">
          <button className="primary" onClick={() => generate(selected)}>Régénérer PDF + Word</button>
          <button className="secondary" onClick={() => updateStatus(selected, 'reviewed')}>Marquer corrigé</button>
          <button className="secondary" onClick={() => updateStatus(selected, 'sent')}>Marquer envoyé</button>
        </div>

        <h3>Fichiers générés</h3>
        <div className="file-list">
          {(selected.cv_generated_files ?? []).map((file) => <button type="button" key={file.id} onClick={() => openFile(file.storage_path)}>{file.file_type.toUpperCase()} · {file.template_id}</button>)}
          {!selected.cv_generated_files?.length && <p>Aucun fichier disponible. Cliquez sur Régénérer.</p>}
        </div>

        <h3>Résumé du formulaire</h3>
        <pre className="json-preview">{JSON.stringify(selected.payload, null, 2)}</pre>
      </div>}
    </section>
  </main>
}
