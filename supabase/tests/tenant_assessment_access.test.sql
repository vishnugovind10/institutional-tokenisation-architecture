begin;
select plan(17);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
 ('30000000-0000-4000-8000-000000000001','authenticated','authenticated','owner@example.test','',now(),now(),now()),
 ('30000000-0000-4000-8000-000000000002','authenticated','authenticated','reviewer@example.test','',now(),now(),now()),
 ('30000000-0000-4000-8000-000000000003','authenticated','authenticated','editor@example.test','',now(),now(),now()),
 ('30000000-0000-4000-8000-000000000004','authenticated','authenticated','viewer@example.test','',now(),now(),now()),
 ('30000000-0000-4000-8000-000000000005','authenticated','authenticated','outsider@example.test','',now(),now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","email":"owner@example.test","role":"authenticated"}',true);
select set_config('test.organization_id',(public.create_organization('TokenOps Test Org')->>'organization_id'),true);
reset role;

insert into public.organization_memberships(organization_id,user_id,role)
values
 (current_setting('test.organization_id')::uuid,'30000000-0000-4000-8000-000000000002','reviewer'),
 (current_setting('test.organization_id')::uuid,'30000000-0000-4000-8000-000000000003','editor'),
 (current_setting('test.organization_id')::uuid,'30000000-0000-4000-8000-000000000004','viewer');

set local role authenticated;
select is((select count(*) from public.organizations where id=current_setting('test.organization_id')::uuid),1::bigint,'owner can read their organization');
select throws_ok(format($q$insert into public.assessments(organization_id,title,use_case,inputs,decision,created_by,updated_by) values(%L::uuid,'Denied write','tokenised-bond','{}'::jsonb,'{}'::jsonb,%L::uuid,%L::uuid)$q$,
 current_setting('test.organization_id'),'30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001'),'42501',null,'authenticated clients cannot bypass the server-side assessment writer');
reset role;
set local role service_role;
select lives_ok($q$
  with created as (
    insert into public.assessments(organization_id,title,use_case,inputs,decision,created_by,updated_by)
    values(current_setting('test.organization_id')::uuid,'Synthetic bond assessment','tokenised-bond','{"case":"synthetic"}'::jsonb,'{"outcome":"HOLD"}'::jsonb,auth.uid(),auth.uid()) returning id
  ) select set_config('test.assessment_id',(select id::text from created),true)
$q$,'privileged Edge Function writer can persist an assessment');
reset role;
set local role authenticated;
select is((select count(*) from public.audit_events where entity_id=current_setting('test.assessment_id')::uuid),1::bigint,'assessment creation writes one audit event');
select lives_ok(format('select public.submit_assessment_for_review(%L::uuid,%L::uuid)',current_setting('test.assessment_id'),current_setting('test.organization_id')),'author can submit the assessment for review');
select is((select status from public.assessments where id=current_setting('test.assessment_id')::uuid),'in_review','submission moves the assessment to review');
select throws_ok(format('select public.review_assessment(%L::uuid,%L::uuid,%L,%L)',current_setting('test.assessment_id'),current_setting('test.organization_id'),'approved','Owner cannot review own work'),
 'P0001','Independent review required; author cannot approve or reject their own submission','author cannot review their own assessment');

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","email":"reviewer@example.test","role":"authenticated"}',true);
select is((select count(*) from public.assessments where id=current_setting('test.assessment_id')::uuid),1::bigint,'reviewer can read the assigned assessment');
select lives_ok(format('select public.review_assessment(%L::uuid,%L::uuid,%L,%L)',current_setting('test.assessment_id'),current_setting('test.organization_id'),'approved','Independent review passed'),'independent reviewer can approve with a recorded comment');
select is((select status from public.assessments where id=current_setting('test.assessment_id')::uuid),'approved','independent review changes assessment status');
select is((select count(*) from public.audit_events where entity_id=current_setting('test.assessment_id')::uuid),4::bigint,'submit and approval changes are written to audit history');
select throws_ok(format('update public.audit_events set action=%L where entity_id=%L::uuid','tampered',current_setting('test.assessment_id')),'42501',null,'reviewer cannot mutate audit history');

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","email":"owner@example.test","role":"authenticated"}',true);
select is((public.create_organization('Second Test Org')->>'name'),'Second Test Org','account can create a second organization');
select is((select count(*) from public.organizations)::bigint,2::bigint,'owner can switch across multiple organizations');

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000005","email":"outsider@example.test","role":"authenticated"}',true);
select is((select count(*) from public.organizations)::bigint,0::bigint,'non-member cannot read organizations');
select is((select count(*) from public.assessments)::bigint,0::bigint,'non-member cannot read assessments');
select is((select count(*) from public.audit_events)::bigint,0::bigint,'non-member cannot read audit history');

select * from finish();
rollback;
