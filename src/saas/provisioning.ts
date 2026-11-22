import { rpc } from './client';
export async function createOrganization(token:string,name:string){
 return rpc<{organization_id:string}>('create_organization',token,{p_name:name});
}
