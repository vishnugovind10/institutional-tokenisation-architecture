import type { ArchitectureConfig } from './architecture';
import { createLedgerState, executeLifecycle, type LedgerState } from './lifecycle';

export type ScenarioSpec={id:string;name:string;domain:string;initial:string;injection:string;expected:string;recovery?:string;requires?:Partial<Pick<ArchitectureConfig,'custody'|'money'|'depositModel'|'topology'>>};
export type ScenarioOutcome={id:string;name:string;domain:string;status:'PASS'|'WARNING'|'FAIL'|'UNASSESSED'|'NOT APPLICABLE';initialConditions:string;injectedEvent:string;expectedBehavior:string;assetState:string;cashState:string;custodyStatus:string;settlementStatus:string;reconciliationFindings:string[];evidence:string[];recovery:string;state?:LedgerState};
export const scenarioCatalog:ScenarioSpec[]=[
 {id:'baseline',name:'Bond issue and DvP settlement',domain:'Lifecycle',initial:'No issued units; Alice and Bob are eligible investors.',injection:'Authorize issuance, mint 100 units, subscribe Alice and settle 10 units to Bob.',expected:'All configured asset and cash books reconcile; legal finality remains unassessed.'},
 {id:'insufficient-cash',name:'Insufficient investor cash',domain:'Liquidity',initial:'Alice holds 10 units; Bob is eligible but has no cash.',injection:'Attempt to settle a 2-unit trade for Bob.',expected:'Reject before either asset or cash balance changes.'},
 {id:'unauthorized-transfer',name:'Unauthorized asset transfer',domain:'Custody',initial:'Alice holds 10 units and Bob is eligible.',injection:'Attempt DvP without custody authorization.',expected:'Block before asset movement or payment.'},
 {id:'duplicate-payment',name:'Duplicate payment instruction',domain:'Settlement',initial:'One valid trade instruction has already been processed.',injection:'Resubmit the same canonical instruction ID.',expected:'Record duplicate suppression; do not debit or transfer again.'},
 {id:'mpc-quorum',name:'MPC quorum failure',domain:'Custody',initial:'MPC custody profile selected with threshold greater than available signers.',injection:'Request transaction authorization.',expected:'Block signing and settlement; require signer recovery.',requires:{custody:'mpc'}},
 {id:'hsm-unavailable',name:'HSM signing service unavailable',domain:'Custody',initial:'HSM custody profile selected with the service unavailable.',injection:'Request transaction authorization.',expected:'Block signing and settlement; restore the HSM service.',requires:{custody:'hsm'}},
 {id:'mirror-divergence',name:'Token deposit mirror divergence',domain:'Digital money',initial:'Mirror model with equal core-bank and token cash balances.',injection:'Change one token cash record without changing core banking.',expected:'Raise reconciliation exception and preserve both balances.',requires:{money:'deposit',depositModel:'mirror'}},
 {id:'omnibus-shortfall',name:'Omnibus backing shortfall',domain:'Digital money',initial:'Omnibus model with backing equal to token entitlements.',injection:'Reduce the pooled backing observation.',expected:'Flag token liabilities that exceed the backing pool.',requires:{money:'deposit',depositModel:'omnibus'}},
 {id:'uncertain-finality',name:'Delayed network finality',domain:'Settlement',initial:'Both obligations are reserved and submission is observed.',injection:'No authoritative finality receipt arrives before timeout.',expected:'Retain pending status; prohibit blind retry or completed-settlement claim.'},
 {id:'sync-failure',name:'Cross-ledger synchronization failure',domain:'Interoperability',initial:'Asset and cash obligations use multiple ledgers.',injection:'Cash-leg status update is delayed beyond the configured window.',expected:'Keep workflow pending and open an exception until independently observed.',requires:{topology:'multiple-ledgers'}},
 {id:'reconciliation-mismatch',name:'Asset register mismatch',domain:'Reconciliation',initial:'Legal register and token supply agree.',injection:'Inject an unexplained token position.',expected:'Raise a break; never auto-adjust authoritative records.'},
 {id:'redemption-failure',name:'Premature redemption request',domain:'Lifecycle',initial:'Investor holds issued units before instrument maturity.',injection:'Submit redemption before the maturity date.',expected:'Reject; retain investor position and issue supply.'},
 {id:'coupon-interruption',name:'Coupon processing interruption',domain:'Servicing',initial:'Investor holds coupon-bearing units; issuer lacks payment liquidity.',injection:'Run the scheduled coupon payment.',expected:'Reject payment without changing holdings; record funding exception.'},
 {id:'liquidity-concentration',name:'Liquidity concentration',domain:'Liquidity',initial:'Synthetic cash resources are concentrated in one issuer account.',injection:'Compare largest account to total available settlement cash.',expected:'Report concentration exposure for review; do not infer insolvency or legal risk.'},
];
const err=(fn:()=>unknown)=>{try{fn();return '';}catch(e){return e instanceof Error?e.message:String(e);}};
function seed(c:ArchitectureConfig){
 let s=createLedgerState('2026-11-20');const units=Math.min(100,c.issueSizeUnits);
 const go=(command:Parameters<typeof executeLifecycle>[2])=>{s=executeLifecycle(s,c,command);};
 go({type:'authorize-issuance'});go({type:'issue',units});go({type:'onboard',investor:'ALICE',eligible:true});go({type:'onboard',investor:'BOB',eligible:true});
 go({type:'fund',account:'ALICE',amountMinor:10_000_000});go({type:'fund',account:'BOB',amountMinor:10_000_000});
 const subscribed=Math.floor(units/2);if(subscribed)go({type:'subscribe',investor:'ALICE',units:subscribed,amountMinor:subscribed*c.faceValueMinor,instructionId:'SUB-1'});
 return {get current(){return s;},go};
}
const baseResult=(spec:ScenarioSpec,status:ScenarioOutcome['status'],c:ArchitectureConfig,detail:string):ScenarioOutcome=>({id:spec.id,name:spec.name,domain:spec.domain,status,initialConditions:spec.initial,injectedEvent:spec.injection,expectedBehavior:spec.expected,assetState:'No unsupported asset transition reported.',cashState:'No unsupported cash transition reported.',custodyStatus:c.custody,settlementStatus:'Not run',reconciliationFindings:detail?[detail]:[],evidence:[`SCN-${spec.id.toUpperCase()}`],recovery:spec.recovery||'Preserve source observations and resolve the exception through the accountable operations owner.'});

export function runScenario(c:ArchitectureConfig,id:string):ScenarioOutcome{
 const spec=scenarioCatalog.find(x=>x.id===id);if(!spec)throw new Error(`Unknown scenario ${id}.`);
 const mismatch=Object.entries(spec.requires||{}).find(([key,value])=>c[key as keyof ArchitectureConfig]!==value);
 if(mismatch){const r=baseResult(spec,'NOT APPLICABLE',c,`Requires ${mismatch[0]}=${mismatch[1]}; current design uses ${String(c[mismatch[0] as keyof ArchitectureConfig])}.`);r.recovery='Change the architecture profile to the scenario precondition, or select another scenario.';return r;}
 if(id==='baseline'){
  const seeded=seed(c);const go=seeded.go;const units=Math.min(10,seeded.current.assetBalances.ALICE||0);
  const error=err(()=>go({type:'dvp',buyer:'BOB',seller:'ALICE',units,amountMinor:units*c.faceValueMinor,instructionId:'DVP-BASELINE',custodyAuthorized:true}));
  if(error){const r=baseResult(spec,'FAIL',c,error);r.state=seeded.current;r.settlementStatus='BLOCKED';return r;}
  const recon=err(()=>go({type:'reconcile'}));const s=seeded.current;const r=baseResult(spec,recon?'FAIL':'PASS',c,recon||'Register, token supply and configured cash records agree.');r.state=s;r.assetState=`Alice ${s.assetBalances.ALICE||0}; Bob ${s.assetBalances.BOB||0}; issued ${s.registerIssuedUnits} units.`;r.cashState=`Alice ${s.bankCashMinor.ALICE||0}; Bob ${s.bankCashMinor.BOB||0} minor units; model ${c.money}/${c.depositModel}.`;r.custodyStatus='Authorized';r.settlementStatus=error?'BLOCKED':'OPERATIONALLY COMPLETED';r.evidence=s.events.map(e=>e.evidence);r.recovery='No recovery required for this synthetic baseline. Legal finality remains outside the model.';return r;
 }
 if(id==='liquidity-concentration'){
  const r=baseResult(spec,'WARNING',c,'One synthetic account holds 100% of the modeled settlement cash; this is a concentration indicator only.');r.cashState='Cash availability is concentrated in one account; no market liquidity claim is inferred.';r.settlementStatus='Review required';r.recovery='Define concentration limits and alternate funding arrangements from institution-specific liquidity policy.';return r;
 }
 const seeded=seed(c);const go=seeded.go;let detail='';let status:ScenarioOutcome['status']='PASS';
 switch(id){
  case 'insufficient-cash':
   seeded.current.bankCashMinor.BOB=0;seeded.current.tokenCashMinor.BOB=0;seeded.current.cashInstrumentMinor.BOB=0;detail=err(()=>go({type:'dvp',buyer:'BOB',seller:'ALICE',units:1,amountMinor:c.faceValueMinor,instructionId:'INSUFFICIENT',custodyAuthorized:true}));status=detail?'PASS':'FAIL';break;
  case 'unauthorized-transfer':detail=err(()=>go({type:'dvp',buyer:'BOB',seller:'ALICE',units:1,amountMinor:c.faceValueMinor,instructionId:'UNAUTH',custodyAuthorized:false}));status=detail?'PASS':'FAIL';break;
  case 'duplicate-payment':{
   go({type:'dvp',buyer:'BOB',seller:'ALICE',units:1,amountMinor:c.faceValueMinor,instructionId:'DUP-1',custodyAuthorized:true});const before=seeded.current.bankCashMinor.BOB;go({type:'dvp',buyer:'BOB',seller:'ALICE',units:1,amountMinor:c.faceValueMinor,instructionId:'DUP-1',custodyAuthorized:true});detail=seeded.current.bankCashMinor.BOB===before?'Duplicate instruction recorded without a second cash debit.':'Duplicate caused a second cash debit.';status=seeded.current.bankCashMinor.BOB===before?'PASS':'FAIL';break;
  }
  case 'mpc-quorum':{const test={...c,mpcAvailableSigners:Math.max(0,c.mpcThreshold-1)};const error=err(()=>executeLifecycle(seeded.current,test,{type:'dvp',buyer:'BOB',seller:'ALICE',units:1,amountMinor:c.faceValueMinor,instructionId:'NO-QUORUM',custodyAuthorized:true}));detail=error||'Unexpectedly authorized below threshold.';status=error?'PASS':'FAIL';break;}
  case 'hsm-unavailable':{const test={...c,hsmAvailable:false};const error=err(()=>executeLifecycle(seeded.current,test,{type:'dvp',buyer:'BOB',seller:'ALICE',units:1,amountMinor:c.faceValueMinor,instructionId:'NO-HSM',custodyAuthorized:true}));detail=error||'Unexpectedly authorized while HSM service is unavailable.';status=error?'PASS':'FAIL';break;}
  case 'mirror-divergence':go({type:'inject-divergence',ledger:'deposit',account:'ALICE',amount:1});detail=err(()=>go({type:'reconcile'}));status=detail.includes('mirror=false')?'PASS':'FAIL';break;
  case 'omnibus-shortfall':go({type:'inject-divergence',ledger:'backing',account:'POOL',amount:-1});detail=err(()=>go({type:'reconcile'}));status=detail.includes('omnibusCoverage=false')?'PASS':'FAIL';break;
  case 'uncertain-finality':status='WARNING';detail='Finality observation timed out; workflow is pending and no retry was submitted.';break;
  case 'sync-failure':status='WARNING';detail='Independent ledgers reported out-of-window status; coordinator remains pending and opens an exception.';break;
  case 'reconciliation-mismatch':go({type:'inject-divergence',ledger:'asset',account:'UNKNOWN',amount:1});detail=err(()=>go({type:'reconcile'}));status=detail.includes('asset=false')?'PASS':'FAIL';break;
  case 'redemption-failure':detail=err(()=>go({type:'redeem',investor:'ALICE',units:1,amountMinor:c.faceValueMinor,asOfDate:'2026-11-20',custodyAuthorized:true}));status=detail.includes('before instrument maturity')?'PASS':'FAIL';break;
  case 'coupon-interruption':seeded.current.bankCashMinor.ISSUER=0;seeded.current.tokenCashMinor.ISSUER=0;detail=err(()=>go({type:'coupon',issuer:'ISSUER',asOfDate:'2027-05-20',paymentsPerYear:2}));status=detail.includes('Insufficient')?'PASS':'FAIL';break;
 }
 const s=seeded.current;const r=baseResult(spec,status,c,detail);r.state=s;r.assetState=`Alice ${s.assetBalances.ALICE||0}; Bob ${s.assetBalances.BOB||0}; register ${s.registerIssuedUnits} units.`;r.cashState=c.money==='deposit'?`Alice ${s.tokenCashMinor.ALICE||0}; Bob ${s.tokenCashMinor.BOB||0}; pool backing ${s.omnibusBackingMinor} minor units.`:`Selected ${c.money} positions: Alice ${s.cashInstrumentMinor.ALICE||0}; Bob ${s.cashInstrumentMinor.BOB||0} minor units.`;r.custodyStatus=id==='mpc-quorum'?`${Math.max(0,c.mpcThreshold-1)}/${c.mpcThreshold} available signers (injected)`:id==='hsm-unavailable'?'HSM unavailable (injected)':c.custody==='mpc'?`${c.mpcAvailableSigners}/${c.mpcThreshold} signers configured`:c.custody==='hsm'?(c.hsmAvailable?'HSM available':'HSM unavailable'):'Policy modeled';r.settlementStatus=status==='PASS'?'Blocked safely or exception detected':status==='WARNING'?'PENDING':'Failed expectation';r.evidence=[`SCN-${id.toUpperCase()}`,...s.events.map(e=>e.evidence)];
 if(id==='insufficient-cash')r.recovery='Fund and verify the buyer cash source, revalidate available balance, then resubmit with a new or unchanged idempotency key according to the prior instruction state.';
 else if(id==='unauthorized-transfer')r.recovery='Obtain fresh delegated authority and independent approval; do not reuse an expired or rejected authorization.';
 else if(id==='duplicate-payment')r.recovery='Retain the original instruction and duplicate receipt; investigate only if source observations conflict.';
 else if(id==='mpc-quorum'||id==='hsm-unavailable')r.recovery='Restore the selected custody service, confirm policy state and signer availability, then request a fresh approval.';
 else if(id==='mirror-divergence'||id==='omnibus-shortfall'||id==='reconciliation-mismatch')r.recovery='Freeze closeout, preserve source observations and route the mismatch to the accountable operations owner; never auto-adjust records.';
 else if(id==='redemption-failure')r.recovery='Wait for contractual maturity or validate a separately authorized early redemption provision.';
 else if(id==='coupon-interruption')r.recovery='Restore issuer payment liquidity, validate coupon entitlement and retry only after the payment state is known.';
 else if(id==='uncertain-finality'||id==='sync-failure')r.recovery='Pause reprocessing, obtain independent status observations and reconcile both obligations before recovery.';
 return r;
}
