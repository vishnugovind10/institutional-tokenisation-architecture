import { createContext, useContext } from 'react';
import type { AuthSession, AuditEvent, CloudAssessment, Organization } from './client';
export type SaaSContextValue = {
 enabled:boolean; session:AuthSession|null; organization:Organization|null; organizations:Organization[];
 assessments:CloudAssessment[]; auditEvents:AuditEvent[]; busy:boolean; error:string; refreshAssessments:()=>Promise<void>;
 saveAssessment:(args:{id?:string|null;title:string;useCase:string;inputs:Record<string,unknown>;decision:Record<string,unknown>})=>Promise<{id:string;version:number}>;
 submitForReview:(assessmentId:string)=>Promise<{id:string;status:string;version:number}>;
 reviewAssessment:(assessmentId:string,action:'approved'|'rejected',comment:string)=>Promise<{id:string;status:string;version:number}>;
};
export const SaaSContext=createContext<SaaSContextValue>({enabled:false,session:null,organization:null,organizations:[],assessments:[],auditEvents:[],busy:false,error:'',refreshAssessments:async()=>{},saveAssessment:async()=>({id:'',version:0}),submitForReview:async()=>({id:'',status:'',version:0}),reviewAssessment:async()=>({id:'',status:'',version:0})});
export const useSaaS=()=>useContext(SaaSContext);
