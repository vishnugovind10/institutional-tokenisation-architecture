-- Institutional Tokenisation Architecture SaaS foundation.
-- Apply with: supabase db push (or the Supabase SQL editor).
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','reviewer','viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id,user_id)
);
create index if not exists organization_memberships_user_idx on public.organization_memberships(user_id);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  use_case text not null check (use_case in ('tokenised-bond','fund-units','private-credit','collateral')),
  status text not null default 'draft' check (status in ('draft','in_review','approved','rejected','archived')),
  inputs jsonb not null,
  decision jsonb not null,
  engine_version text not null default 'use-case-decision/1.2',
  version integer not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assessments_org_updated_idx on public.assessments(organization_id,updated_at desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_org_created_idx on public.audit_events(organization_id,created_at desc);

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path=public,auth
as $$ select exists(select 1 from public.organization_memberships m where m.organization_id=p_org and m.user_id=auth.uid()); $$;

create or replace function public.has_org_role(p_org uuid,p_roles text[])
returns boolean language sql stable security definer set search_path=public,auth
as $$ select exists(select 1 from public.organization_memberships m where m.organization_id=p_org and m.user_id=auth.uid() and m.role=any(p_roles)); $$;

create or replace function public.create_organization(p_name text)
returns jsonb language plpgsql security definer set search_path=public,auth
as $$
declare v_org public.organizations;
declare v_slug text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_name)) not between 2 and 80 then raise exception 'Organisation name must be 2–80 characters'; end if;
  v_slug:=trim(both '-' from regexp_replace(lower(trim(p_name)),'[^a-z0-9]+','-','g'))||'-'||substr(encode(gen_random_bytes(4),'hex'),1,8);
  insert into public.organizations(name,slug,created_by) values(trim(p_name),v_slug,auth.uid()) returning * into v_org;
  insert into public.organization_memberships(organization_id,user_id,role) values(v_org.id,auth.uid(),'owner');
  return jsonb_build_object('organization_id',v_org.id,'name',v_org.name,'slug',v_org.slug);
end; $$;

create or replace function public.set_assessment_updated_at()
returns trigger language plpgsql set search_path=public
as $$ begin new.updated_at:=now(); new.version:=old.version+1; return new; end; $$;
drop trigger if exists assessments_updated_at on public.assessments;
create trigger assessments_updated_at before update on public.assessments for each row execute function public.set_assessment_updated_at();

create or replace function public.write_assessment_audit()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare v_action text;
begin
  v_action:=case when tg_op='INSERT' then 'assessment.created' else 'assessment.updated' end;
  insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,payload)
  values(new.organization_id,new.updated_by,'assessment',new.id,v_action,jsonb_build_object('version',new.version,'title',new.title,'use_case',new.use_case,'status',new.status,'inputs',new.inputs,'decision',new.decision,'engine_version',new.engine_version));
  return new;
end; $$;
drop trigger if exists assessments_audit on public.assessments;
create trigger assessments_audit after insert or update on public.assessments for each row execute function public.write_assessment_audit();

create or replace function public.reject_audit_mutation()
returns trigger language plpgsql
as $$ begin raise exception 'Audit events are append-only'; end; $$;
drop trigger if exists audit_events_no_update on public.audit_events;
create trigger audit_events_no_update before update or delete on public.audit_events for each row execute function public.reject_audit_mutation();

create or replace function public.save_assessment(
 p_assessment_id uuid,p_organization_id uuid,p_title text,p_use_case text,p_inputs jsonb,p_decision jsonb
) returns jsonb language plpgsql set search_path=public,auth
as $$
declare v_row public.assessments;
begin
  if not public.has_org_role(p_organization_id,array['owner','admin','editor']) then raise exception 'Insufficient organisation role'; end if;
  if char_length(trim(p_title)) not between 2 and 160 then raise exception 'Assessment title must be 2–160 characters'; end if;
  if p_use_case not in ('tokenised-bond','fund-units','private-credit','collateral') then raise exception 'Unsupported use case'; end if;
  if p_inputs is null or p_decision is null then raise exception 'Inputs and decision are required'; end if;
  if p_assessment_id is null then
    insert into public.assessments(organization_id,title,use_case,inputs,decision,created_by,updated_by)
    values(p_organization_id,trim(p_title),p_use_case,p_inputs,p_decision,auth.uid(),auth.uid()) returning * into v_row;
  else
    update public.assessments set title=trim(p_title),use_case=p_use_case,inputs=p_inputs,decision=p_decision,status='draft',updated_by=auth.uid()
    where id=p_assessment_id and organization_id=p_organization_id and status in ('draft','rejected') returning * into v_row;
    if v_row.id is null then raise exception 'Assessment not found in this organisation'; end if;
  end if;
  return jsonb_build_object('id',v_row.id,'version',v_row.version,'updated_at',v_row.updated_at);
end; $$;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.assessments enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated using(public.is_org_member(id));
drop policy if exists memberships_select_scoped on public.organization_memberships;
create policy memberships_select_scoped on public.organization_memberships for select to authenticated using(user_id=auth.uid() or public.has_org_role(organization_id,array['owner','admin']));
drop policy if exists assessments_select_member on public.assessments;
create policy assessments_select_member on public.assessments for select to authenticated using(public.is_org_member(organization_id));
drop policy if exists assessments_insert_editor on public.assessments;
create policy assessments_insert_editor on public.assessments for insert to authenticated with check(public.has_org_role(organization_id,array['owner','admin','editor']) and created_by=auth.uid() and updated_by=auth.uid() and status='draft');
drop policy if exists assessments_update_editor on public.assessments;
create policy assessments_update_editor on public.assessments for update to authenticated using(public.has_org_role(organization_id,array['owner','admin','editor']) and status in ('draft','rejected')) with check(public.has_org_role(organization_id,array['owner','admin','editor']) and updated_by=auth.uid() and status in ('draft','rejected'));
drop policy if exists audit_select_member on public.audit_events;
create policy audit_select_member on public.audit_events for select to authenticated using(public.is_org_member(organization_id));

revoke all on public.organizations from anon,authenticated;
grant select on public.organizations to authenticated;
revoke all on public.organization_memberships from anon,authenticated;
grant select on public.organization_memberships to authenticated;
revoke all on public.assessments from anon,authenticated;
grant select on public.assessments to authenticated;
revoke all on public.audit_events from anon,authenticated;
grant select on public.audit_events to authenticated;
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
revoke all on function public.has_org_role(uuid,text[]) from public;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;
revoke all on function public.attach_invited_user_to_organization() from public,anon,authenticated;
revoke all on function public.create_organization(text) from public;
grant execute on function public.create_organization(text) to authenticated;
revoke all on function public.save_assessment(uuid,uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
drop function public.save_assessment(uuid,uuid,text,text,jsonb,jsonb);

-- Invitations are intentionally delegated to a server-side Supabase Edge Function.
-- Never expose a service-role key to the browser.

-- An organisation invite carries the target organisation and role in Auth user metadata.
-- The membership is created server-side when the invited identity is provisioned.
create or replace function public.attach_invited_user_to_organization()
returns trigger language plpgsql security definer set search_path=public,auth
as $$
declare v_org uuid;
declare v_role text;
begin
  v_org:=nullif(new.raw_user_meta_data->>'organization_id','')::uuid;
  v_role:=coalesce(new.raw_user_meta_data->>'organization_role','viewer');
  if v_org is not null and v_role in ('admin','editor','reviewer','viewer')
     and exists(select 1 from public.organizations where id=v_org) then
    insert into public.organization_memberships(organization_id,user_id,role)
    values(v_org,new.id,v_role)
    on conflict(organization_id,user_id) do nothing;
    insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,payload)
    values(v_org,null,'membership',new.id,'membership.invited',jsonb_build_object('email',new.email,'role',v_role));
  end if;
  return new;
end; $$;
drop trigger if exists auth_user_organization_invite on auth.users;
create trigger auth_user_organization_invite after insert on auth.users
for each row execute function public.attach_invited_user_to_organization();

-- Independent review is separate from the authoring path.
create table if not exists public.assessment_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  action text not null check (action in ('approved','rejected')),
  comment text not null check (char_length(trim(comment)) >= 8),
  assessment_version integer not null,
  created_at timestamptz not null default now()
);
create index if not exists assessment_reviews_org_created_idx on public.assessment_reviews(organization_id,created_at desc);
alter table public.assessment_reviews enable row level security;
drop policy if exists assessment_reviews_select_member on public.assessment_reviews;
create policy assessment_reviews_select_member on public.assessment_reviews for select to authenticated using(public.is_org_member(organization_id));
revoke all on public.assessment_reviews from anon,authenticated;
grant select on public.assessment_reviews to authenticated;

create or replace function public.reject_review_mutation()
returns trigger language plpgsql
as $$ begin raise exception 'Assessment reviews are append-only'; end; $$;
drop trigger if exists assessment_reviews_no_update on public.assessment_reviews;
create trigger assessment_reviews_no_update before update or delete on public.assessment_reviews for each row execute function public.reject_review_mutation();
revoke all on function public.reject_review_mutation() from public,anon,authenticated;

create or replace function public.submit_assessment_for_review(p_assessment_id uuid,p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth
as $$
declare v_row public.assessments;
begin
  if not public.has_org_role(p_organization_id,array['owner','admin','editor']) then raise exception 'Insufficient organisation role'; end if;
  update public.assessments set status='in_review',updated_by=auth.uid()
  where id=p_assessment_id and organization_id=p_organization_id and status in ('draft','rejected')
  returning * into v_row;
  if v_row.id is null then raise exception 'Assessment cannot be submitted from its current state'; end if;
  return jsonb_build_object('id',v_row.id,'status',v_row.status,'version',v_row.version);
end; $$;

create or replace function public.review_assessment(p_assessment_id uuid,p_organization_id uuid,p_action text,p_comment text)
returns jsonb language plpgsql security definer set search_path=public,auth
as $$
declare v_row public.assessments;
declare v_status text;
begin
  if p_action not in ('approved','rejected') then raise exception 'Review action must be approved or rejected'; end if;
  if char_length(trim(coalesce(p_comment,''))) < 8 then raise exception 'A review comment of at least 8 characters is required'; end if;
  if not public.has_org_role(p_organization_id,array['owner','admin','reviewer']) then raise exception 'Insufficient reviewer role'; end if;
  update public.assessments set status=p_action,updated_by=auth.uid()
  where id=p_assessment_id and organization_id=p_organization_id and status='in_review'
    and created_by<>auth.uid() and updated_by<>auth.uid()
  returning * into v_row;
  if v_row.id is null then raise exception 'Independent review required; author cannot approve or reject their own submission'; end if;
  insert into public.assessment_reviews(organization_id,assessment_id,reviewer_id,action,comment,assessment_version)
  values(p_organization_id,p_assessment_id,auth.uid(),p_action,trim(p_comment),v_row.version);
  insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,payload)
  values(p_organization_id,auth.uid(),'assessment',p_assessment_id,'assessment.'||p_action,jsonb_build_object('comment',trim(p_comment),'version',v_row.version));
  return jsonb_build_object('id',v_row.id,'status',v_row.status,'version',v_row.version);
end; $$;

revoke all on function public.submit_assessment_for_review(uuid,uuid) from public;
grant execute on function public.submit_assessment_for_review(uuid,uuid) to authenticated;
revoke all on function public.review_assessment(uuid,uuid,text,text) from public;
grant execute on function public.review_assessment(uuid,uuid,text,text) to authenticated;
