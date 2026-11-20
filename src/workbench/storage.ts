import { newWorkspace, parseWorkspace, type Workspace } from '../domain/architecture';
import type { ScenarioOutcome } from '../domain/scenarios';
const STORAGE_KEY='ita-workbench:v1';
export type StoredWorkspaces={schemaVersion:1;activeId:string;workspaces:Workspace[];runs:ScenarioOutcome[]};
export type StoragePort={getItem(key:string):string|null;setItem(key:string,value:string):void};
export function createStoredWorkspaces():StoredWorkspaces{const w=newWorkspace();return {schemaVersion:1,activeId:w.id,workspaces:[w],runs:[]};}
export function loadStoredWorkspaces(storage:StoragePort):StoredWorkspaces{
 try{const raw=storage.getItem(STORAGE_KEY);if(!raw)return createStoredWorkspaces();const value=JSON.parse(raw);if(value?.schemaVersion!==1||!Array.isArray(value.workspaces))return createStoredWorkspaces();const workspaces=value.workspaces.map(parseWorkspace);if(!workspaces.length)return createStoredWorkspaces();const activeId=workspaces.some((w:Workspace)=>w.id===value.activeId)?value.activeId:workspaces[0].id;return {schemaVersion:1,activeId,workspaces,runs:Array.isArray(value.runs)?value.runs.slice(-20):[]};}catch{return createStoredWorkspaces();}
}
export function persistStoredWorkspaces(storage:StoragePort,state:StoredWorkspaces){storage.setItem(STORAGE_KEY,JSON.stringify(state));}
export function upsertWorkspace(state:StoredWorkspaces,workspace:Workspace,activate=true):StoredWorkspaces{
 const items=state.workspaces.filter(w=>w.id!==workspace.id);items.push({...workspace,updatedAt:new Date().toISOString()});return {...state,workspaces:items,activeId:activate?workspace.id:state.activeId};
}
export function duplicateWorkspace(state:StoredWorkspaces,id:string):StoredWorkspaces{
 const source=state.workspaces.find(w=>w.id===id);if(!source)throw new Error('Workspace to duplicate was not found.');const copy={...structuredClone(source),id:crypto.randomUUID(),name:`${source.name} copy`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return upsertWorkspace(state,copy,true);
}
export function importWorkspace(state:StoredWorkspaces,value:unknown):StoredWorkspaces{return upsertWorkspace(state,parseWorkspace(value),true);}
export function deleteWorkspace(state:StoredWorkspaces,id:string):StoredWorkspaces{
 const items=state.workspaces.filter(w=>w.id!==id);if(!items.length)throw new Error('At least one workspace must remain.');return {...state,workspaces:items,activeId:state.activeId===id?items[0].id:state.activeId};
}
export function appendScenarioRun(state:StoredWorkspaces,run:ScenarioOutcome):StoredWorkspaces{return {...state,runs:[...state.runs,run].slice(-20)};}
export function downloadText(filename:string,content:string,mime='text/plain'){
 const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url);
}
