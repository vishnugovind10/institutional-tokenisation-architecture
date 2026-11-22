import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://institutional-tokenisation-architec.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};
const respond=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return respond(405,{error:'Method not allowed'});
  const authHeader=req.headers.get('Authorization');
  if(!authHeader?.startsWith('Bearer '))return respond(401,{error:'Authentication required'});
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!service)return respond(500,{error:'Function secrets are not configured'});
  const token=authHeader.slice(7);
  const callerClient=createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false}});
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:{user},error:userError}=await callerClient.auth.getUser();
  if(userError||!user)return respond(401,{error:'Invalid session'});
  let body:{organization_id?:string;email?:string;role?:string};
  try{body=await req.json();}catch{return respond(400,{error:'Invalid JSON body'});}
  const email=String(body.email||'').trim().toLowerCase();
  const organizationId=String(body.organization_id||'');
  const role=String(body.role||'viewer');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return respond(400,{error:'Enter a valid email address'});
  if(!/^[0-9a-f-]{36}$/i.test(organizationId))return respond(400,{error:'Invalid organisation'});
  if(!['admin','editor','reviewer','viewer'].includes(role))return respond(400,{error:'Unsupported role'});
  const {data:membership,error:membershipError}=await admin.from('organization_memberships').select('role').eq('organization_id',organizationId).eq('user_id',user.id).maybeSingle();
  if(membershipError||!membership||!['owner','admin'].includes(membership.role))return respond(403,{error:'Only organisation owners and admins can invite members'});
  const {data:existing}=await admin.from('organization_memberships').select('id').eq('organization_id',organizationId);
  const {data:invited,error}=await admin.auth.admin.inviteUserByEmail(email,{data:{organization_id:organizationId,organization_role:role},redirectTo:Deno.env.get('APP_ORIGIN')??undefined});
  if(error)return respond(400,{error:error.message});
  return respond(200,{invited:true,user_id:invited.user.id,email,role,existing_members:(existing||[]).length});
});
