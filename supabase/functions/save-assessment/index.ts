import { createClient } from 'npm:@supabase/supabase-js@2';
import { DECISION_ENGINE_VERSION, evaluateUseCase, type UseCaseInputs } from '../_shared/use-case-decision.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://institutional-tokenisation-architec.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};
const respond=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const useCases=['tokenised-bond','fund-units','private-credit','collateral'];
const mechanisms=['shared-state','programmable-rights','conditional-settlement','lifecycle-automation','portable-entitlements'];
const frictions=['reconciliation','settlement-delay','fragmented-register','servicing-cost','distribution-friction','manual-eligibility'];
function validInputs(value:unknown):value is UseCaseInputs{
 if(!value||typeof value!=='object')return false;
 const x=value as Record<string,unknown>,r=x.readiness as Record<string,unknown>;
 return useCases.includes(String(x.useCase))&&typeof x.annualEvents==='number'&&Number.isFinite(x.annualEvents)&&x.annualEvents>=0&&typeof x.participants==='number'&&Number.isFinite(x.participants)&&x.participants>=0
  &&Array.isArray(x.frictions)&&x.frictions.length<=6&&x.frictions.every(v=>frictions.includes(String(v)))
  &&Array.isArray(x.tokenisationMechanisms)&&x.tokenisationMechanisms.length<=5&&x.tokenisationMechanisms.every(v=>mechanisms.includes(String(v)))
  &&typeof x.baselineEvidence==='string'&&x.baselineEvidence.length<=5000&&typeof x.existingSystemGap==='string'&&x.existingSystemGap.length<=5000
  &&!!r&&['legalRegisterKnown','transferRulesDefined','settlementRouteKnown','accountableOwner','pilotCounterpartyIdentified','usableDataAvailable'].every(k=>typeof r[k]==='boolean');
}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return respond(405,{error:'Method not allowed'});
 const authHeader=req.headers.get('Authorization');
 if(!authHeader?.startsWith('Bearer '))return respond(401,{error:'Authentication required'});
 const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!anon||!service)return respond(500,{error:'Function secrets are not configured'});
 const token=authHeader.slice(7);
 const caller=createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false}});
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:{user},error:userError}=await caller.auth.getUser();
 if(userError||!user)return respond(401,{error:'Invalid session'});
 let body:{organization_id?:string;assessment_id?:string|null;title?:string;use_case?:string;inputs?:unknown};
 try{body=await req.json();}catch{return respond(400,{error:'Invalid JSON body'});}
 const organizationId=String(body.organization_id||''),title=String(body.title||'').trim(),useCase=String(body.use_case||'');
 if(!/^[0-9a-f-]{36}$/i.test(organizationId))return respond(400,{error:'Invalid organisation'});
 if(title.length<2||title.length>160)return respond(400,{error:'Assessment title must be 2–160 characters'});
 if(!useCases.includes(useCase)||!validInputs(body.inputs)||body.inputs.useCase!==useCase)return respond(400,{error:'Invalid or incomplete decision inputs'});
 const {data:membership,error:membershipError}=await admin.from('organization_memberships').select('role').eq('organization_id',organizationId).eq('user_id',user.id).maybeSingle();
 if(membershipError||!membership||!['owner','admin','editor'].includes(membership.role))return respond(403,{error:'Insufficient organisation role to save assessments'});
 const decision=evaluateUseCase(body.inputs);
 const values={title,use_case:useCase,inputs:body.inputs,decision,engine_version:DECISION_ENGINE_VERSION,status:'draft',updated_by:user.id};
 const assessmentId=body.assessment_id?String(body.assessment_id):null;
 let saved:{id:string;version:number;updated_at:string};
 if(assessmentId){
  const {data:existing,error:lookupError}=await admin.from('assessments').select('id,status,organization_id').eq('id',assessmentId).eq('organization_id',organizationId).maybeSingle();
  if(lookupError)return respond(500,{error:lookupError.message});
  if(!existing)return respond(404,{error:'Assessment not found in this organisation'});
  if(!['draft','rejected'].includes(existing.status))return respond(409,{error:'Only draft or rejected assessments can be edited'});
  const {data,error}=await admin.from('assessments').update(values).eq('id',assessmentId).eq('organization_id',organizationId).select('id,version,updated_at').single();
  if(error)return respond(400,{error:error.message});saved=data;
 }else{
  const {data,error}=await admin.from('assessments').insert({...values,organization_id:organizationId,created_by:user.id}).select('id,version,updated_at').single();
  if(error)return respond(400,{error:error.message});saved=data;
 }
 return respond(200,{...saved,decision,engine_version:DECISION_ENGINE_VERSION});
});
