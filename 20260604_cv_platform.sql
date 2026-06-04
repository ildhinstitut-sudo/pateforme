-- DEUTSCHHAUS CV Platform schema
-- Non destructive migration: creates dedicated cv_* tables and private storage buckets.

create extension if not exists pgcrypto;

create table if not exists public.cv_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.cv_templates (
  id text primary key,
  name text not null,
  category text,
  description text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cv_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tracking_code text not null unique,
  status text not null default 'submitted' check (status in ('submitted', 'generated', 'reviewed', 'sent', 'error')),
  template_id text references public.cv_templates(id),
  language text not null default 'fr' check (language in ('fr', 'de', 'fr_de')),
  payload jsonb not null,
  photo_path text,
  source text,
  notes text
);

create table if not exists public.cv_generated_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_id uuid not null references public.cv_submissions(id) on delete cascade,
  file_type text not null check (file_type in ('pdf', 'docx', 'html')),
  storage_path text not null,
  template_id text not null references public.cv_templates(id),
  unique(submission_id, file_type, template_id)
);

insert into public.cv_templates (id, name, category, description, config) values
('cv-ausbildung-classic', 'CV Ausbildung Allemagne classique', 'Formation Allemagne', 'CV sérieux, propre et administratif pour dossiers de formation professionnelle en Allemagne.', '{"shortName": "Ausbildung Classique", "layout": "classic", "accent": "#1f4e79", "secondary": "#eef5fb"}'::jsonb),
('cv-aupair-modern', 'CV Au Pair moderne', 'Au Pair', 'Modèle chaleureux pour valoriser la garde d’enfants, la famille, les langues et la motivation.', '{"shortName": "Au Pair Moderne", "layout": "sidebar", "accent": "#b45309", "secondary": "#fff7ed"}'::jsonb),
('cv-fsj-bfd-social', 'CV FSJ/BFD social', 'Volontariat', 'CV orienté engagement social, maison de retraite, hôpital, crèche ou association.', '{"shortName": "FSJ/BFD Social", "layout": "timeline", "accent": "#047857", "secondary": "#ecfdf5"}'::jsonb),
('cv-pflegefachfrau', 'CV Pflegefachfrau/Pflegefachmann', 'Soins infirmiers', 'Modèle professionnel pour une candidature en soins infirmiers ou aide-soignante.', '{"shortName": "Pflege", "layout": "cards", "accent": "#be123c", "secondary": "#fff1f2"}'::jsonb),
('cv-gastronomie-koch', 'CV Gastronomie/Koch', 'Cuisine', 'CV adapté aux profils cuisine, restaurant, service, commis ou Ausbildung Koch/Köchin.', '{"shortName": "Cuisine", "layout": "sidebar", "accent": "#7c2d12", "secondary": "#fff7ed"}'::jsonb),
('cv-hotellerie', 'CV Hotellerie', 'Hôtellerie', 'Design élégant pour réception, service hôtelier, restauration et tourisme.', '{"shortName": "Hôtellerie", "layout": "premium", "accent": "#4338ca", "secondary": "#eef2ff"}'::jsonb),
('cv-kita-education', 'CV Kita/Éducation enfantine', 'Éducation', 'CV pour crèche, maternelle, garde d’enfants, éducation et animation.', '{"shortName": "Kita", "layout": "cards", "accent": "#0f766e", "secondary": "#f0fdfa"}'::jsonb),
('cv-debutant-sans-experience', 'CV Débutant sans expérience', 'Débutant', 'Modèle simple qui valorise la formation, les langues, les qualités et les objectifs.', '{"shortName": "Débutant", "layout": "minimal", "accent": "#334155", "secondary": "#f8fafc"}'::jsonb),
('cv-etudiant-stages', 'CV Étudiant avec stages', 'Étudiant', 'Très bon choix pour un profil scolaire avec quelques stages ou expériences courtes.', '{"shortName": "Étudiant + Stages", "layout": "timeline", "accent": "#2563eb", "secondary": "#eff6ff"}'::jsonb),
('cv-professionnel-experimente', 'CV Professionnel expérimenté', 'Professionnel', 'CV mature pour candidats ayant plusieurs expériences professionnelles.', '{"shortName": "Expérimenté", "layout": "premium", "accent": "#111827", "secondary": "#f3f4f6"}'::jsonb),
('cv-allemagne-sobre-photo', 'CV Allemagne sobre avec photo', 'Allemagne', 'Design sobre et rassurant, adapté aux documents officiels allemands.', '{"shortName": "Allemand sobre", "layout": "classic", "accent": "#0f172a", "secondary": "#f1f5f9"}'::jsonb),
('cv-allemagne-sans-photo', 'CV Allemagne sans photo', 'International', 'Version neutre et internationale, sans photo, avec mise en page claire.', '{"shortName": "Sans photo", "layout": "minimal", "accent": "#1e293b", "secondary": "#f8fafc"}'::jsonb),
('cv-bilingue-fr-de', 'CV bilingue Français-Allemand', 'Bilingue', 'CV avec intitulés en français et allemand pour montrer la compréhension des deux langues.', '{"shortName": "Bilingue FR-DE", "layout": "bilingual", "accent": "#6d28d9", "secondary": "#f5f3ff"}'::jsonb),
('cv-comptabilite-administration', 'CV Comptabilité/Administration', 'Bureau', 'CV pour gestion, secrétariat, comptabilité, accueil et administration.', '{"shortName": "Administration", "layout": "cards", "accent": "#0369a1", "secondary": "#f0f9ff"}'::jsonb),
('cv-informatique-digital', 'CV Informatique/Digital', 'Digital', 'Modèle moderne pour informatique, bureautique, web, design et digital.', '{"shortName": "Digital", "layout": "sidebar", "accent": "#4f46e5", "secondary": "#eef2ff"}'::jsonb),
('cv-creatif-moderne', 'CV Créatif moderne', 'Moderne', 'Design visuel, moderne et élégant sans perdre le sérieux professionnel.', '{"shortName": "Créatif", "layout": "cards", "accent": "#db2777", "secondary": "#fdf2f8"}'::jsonb),
('cv-europass-ameliore', 'CV Europass amélioré', 'Europass', 'Structure proche Europass, mais plus lisible et plus élégante.', '{"shortName": "Europass+", "layout": "european", "accent": "#164e63", "secondary": "#ecfeff"}'::jsonb),
('cv-chronologique-simple', 'CV chronologique simple', 'Simple', 'Mise en valeur claire des dates, de l’école aux expériences.', '{"shortName": "Chronologique", "layout": "timeline", "accent": "#475569", "secondary": "#f8fafc"}'::jsonb),
('cv-competences-first', 'CV compétences avant expériences', 'Compétences', 'Idéal quand le candidat a peu d’expérience, mais de bonnes compétences transférables.', '{"shortName": "Compétences+", "layout": "compact", "accent": "#15803d", "secondary": "#f0fdf4"}'::jsonb),
('cv-premium-une-page', 'CV premium une page', 'Premium', 'Version courte, élégante, très lisible et adaptée aux dossiers haut de gamme.', '{"shortName": "Premium 1 page", "layout": "premium", "accent": "#92400e", "secondary": "#fffbeb"}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  config = excluded.config,
  is_active = true;

create or replace function public.cv_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cv_submissions_set_updated_at on public.cv_submissions;
create trigger cv_submissions_set_updated_at
before update on public.cv_submissions
for each row execute function public.cv_set_updated_at();

create or replace function public.is_cv_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'kpatonoujules@gmail.com'
    or exists (
      select 1 from public.cv_admins admin
      where admin.user_id = auth.uid()
    );
$$;

grant usage on schema public to authenticated;
grant execute on function public.is_cv_admin() to authenticated;
grant select on public.cv_templates to anon, authenticated;
grant select, update on public.cv_submissions to authenticated;
grant select on public.cv_generated_files to authenticated;
grant select, insert, update, delete on public.cv_admins to authenticated;

alter table public.cv_admins enable row level security;
alter table public.cv_templates enable row level security;
alter table public.cv_submissions enable row level security;
alter table public.cv_generated_files enable row level security;

drop policy if exists "CV templates are readable" on public.cv_templates;
create policy "CV templates are readable" on public.cv_templates
for select to anon, authenticated using (is_active = true);

drop policy if exists "CV admins can manage admins" on public.cv_admins;
create policy "CV admins can manage admins" on public.cv_admins
for all to authenticated using (public.is_cv_admin()) with check (public.is_cv_admin());

drop policy if exists "CV admins can read submissions" on public.cv_submissions;
create policy "CV admins can read submissions" on public.cv_submissions
for select to authenticated using (public.is_cv_admin());

drop policy if exists "CV admins can update submissions" on public.cv_submissions;
create policy "CV admins can update submissions" on public.cv_submissions
for update to authenticated using (public.is_cv_admin()) with check (public.is_cv_admin());

drop policy if exists "CV admins can read generated files" on public.cv_generated_files;
create policy "CV admins can read generated files" on public.cv_generated_files
for select to authenticated using (public.is_cv_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('cv-photos', 'cv-photos', false, 4194304, array['image/jpeg','image/png','image/webp']),
  ('cv-files', 'cv-files', false, 10485760, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/html'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "CV admins can read storage files" on storage.objects;
create policy "CV admins can read storage files" on storage.objects
for select to authenticated
using (bucket_id in ('cv-photos', 'cv-files') and public.is_cv_admin());

create index if not exists cv_submissions_created_at_idx on public.cv_submissions(created_at desc);
create index if not exists cv_submissions_tracking_code_idx on public.cv_submissions(tracking_code);
create index if not exists cv_generated_files_submission_idx on public.cv_generated_files(submission_id);
