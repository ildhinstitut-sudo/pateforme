create or replace function public.cv_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.is_cv_admin() from anon;
grant execute on function public.is_cv_admin() to authenticated;
