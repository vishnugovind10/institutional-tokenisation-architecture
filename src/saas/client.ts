export type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
export type AuthSession = { access_token: string; refresh_token: string; expires_at: number; user: AuthUser };
export type Organization = { id: string; name: string; slug: string; role: 'owner'|'admin'|'editor'|'reviewer'|'viewer' };
export type CloudAssessment = { id: string; title: string; use_case: string; status: string; inputs: Record<string, unknown>; decision: Record<string, unknown>; engine_version: string; version: number; created_at: string; updated_at: string };
export type AuditEvent = { id: string; entity_type: string; entity_id: string; action: string; payload: Record<string, unknown>; created_at: string; actor_id: string|null };
const env = import.meta.env as Record<string, string|boolean|undefined>;
export const saasConfig = {
  enabled: env.VITE_SAAS_MODE === 'true',
  url: String(env.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
  anonKey: String(env.VITE_SUPABASE_ANON_KEY || ''),
};
export const isSaasConfigured = Boolean(saasConfig.url && saasConfig.anonKey);
const SESSION_KEY = 'ita-saas-session-v1';
export function readSession(): AuthSession|null {
  try { const raw=localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as AuthSession : null; } catch { return null; }
}
function writeSession(session: AuthSession|null) {
  if (session) localStorage.setItem(SESSION_KEY,JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY);
}
async function request<T>(path:string,token?:string,body?:unknown,method='GET',extra:Record<string,string>={}):Promise<T>{
  const response=await fetch(saasConfig.url+path,{method,headers:{apikey:saasConfig.anonKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const raw=await response.text();let data:unknown=null;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
  if(!response.ok){const message=typeof data==='object'&&data&&'message'in data?String((data as {message:unknown}).message):typeof data==='object'&&data&&'msg'in data?String((data as {msg:unknown}).msg):'Request failed ('+response.status+')';throw new Error(message);}
  return data as T;
}
export async function signIn(email:string,password:string):Promise<AuthSession>{
  const data=await request<Omit<AuthSession,'expires_at'> & {expires_in:number}>('/auth/v1/token?grant_type=password',undefined,{email,password},'POST');
  const session={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};writeSession(session);return session;
}
export async function signUp(email:string,password:string):Promise<{session:AuthSession|null;confirmationRequired:boolean}>{
  const data=await request<Partial<AuthSession> & {expires_in?:number}>('/auth/v1/signup',undefined,{email,password},'POST');
  if(data.access_token&&data.refresh_token&&data.user){const session={access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)};writeSession(session);return {session,confirmationRequired:false};}
  return {session:null,confirmationRequired:true};
}
export async function refreshSession(session:AuthSession):Promise<AuthSession>{
  const data=await request<Omit<AuthSession,'expires_at'>&{expires_in:number}>('/auth/v1/token?grant_type=refresh_token',undefined,{refresh_token:session.refresh_token},'POST');
  const next={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};writeSession(next);return next;
}
export async function getCurrentUser(token:string){return request<AuthUser>('/auth/v1/user',token);}
export async function signOut(token:string){try{await request('/auth/v1/logout',token,undefined,'POST');}finally{writeSession(null);}}
export async function rpc<T>(name:string,token:string,args:Record<string,unknown>):Promise<T>{return request<T>('/rest/v1/rpc/'+name,token,args,'POST');}
export async function getOrganizations(token:string):Promise<Organization[]>{
 const rows=await request<Array<{organization:Organization;role:Organization['role']}>>('/rest/v1/organization_memberships?select=role,organization:organizations(id,name,slug)&order=created_at.asc',token);
 return rows.filter(x=>x.organization).map(x=>({...x.organization,role:x.role}));
}
export async function listAssessments(token:string,organizationId:string):Promise<CloudAssessment[]>{
 return request<CloudAssessment[]>('/rest/v1/assessments?select=id,title,use_case,status,inputs,decision,engine_version,version,created_at,updated_at&organization_id=eq.'+encodeURIComponent(organizationId)+'&order=updated_at.desc',token);
}
export async function listAuditEvents(token:string,organizationId:string):Promise<AuditEvent[]>{
 return request<AuditEvent[]>('/rest/v1/audit_events?select=id,entity_type,entity_id,action,payload,created_at,actor_id&organization_id=eq.'+encodeURIComponent(organizationId)+'&order=created_at.desc&limit=100',token);
}
export async function saveCloudAssessment(token:string,args:{assessment_id:string|null;organization_id:string;title:string;use_case:string;inputs:Record<string,unknown>;decision:Record<string,unknown>}){
 return rpc<{id:string;version:number}>('save_assessment',token,{p_assessment_id:args.assessment_id,p_organization_id:args.organization_id,p_title:args.title,p_use_case:args.use_case,p_inputs:args.inputs,p_decision:args.decision});
}
export function persistSession(session:AuthSession|null){writeSession(session);}

export async function inviteOrganizationMember(token:string,organizationId:string,email:string,role:'admin'|'editor'|'reviewer'|'viewer'){
 const response=await fetch(saasConfig.url+'/functions/v1/invite-member',{method:'POST',headers:{apikey:saasConfig.anonKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({organization_id:organizationId,email,role})});
 const raw=await response.text();let data:unknown=null;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
 if(!response.ok){const message=typeof data==='object'&&data&&'error'in data?String((data as {error:unknown}).error):'Invitation failed ('+response.status+')';throw new Error(message);}
 return data as {invited:boolean;user_id:string;email:string;role:string};
}
