export type Failure = 'none'|'cash'|'quorum'|'duplicate'|'finality'|'reconciliation';
export type Scenario = { failure: Failure; custody: 'MPC 2-of-3'|'HSM'; money: string; model: 'Mirror'|'Omnibus'; topology: 'Single ledger'|'Multiple ledgers'; settlement: 'Atomic'|'Coordinated'; };
export type Result = { outcome:string; asset:string; cash:string; custody:string; reconciliation:string; technicalFinality:string; legalFinality:string; events:{time:string;title:string;detail:string;state:string}[]; evidence:string[]; remediation:string };
export function simulate(s: Scenario): Result {
 const events:{time:string;title:string;detail:string;state:string}[]=[];
 const add=(time:string,title:string,detail:string,state='complete')=>events.push({time,title,detail,state});
 add('09:00','Trade instruction received','Synthetic bond trade · €5,000,000 · investor portfolio P-104');
 add('09:01','Investor and asset checks','Eligibility valid · €100M issue register confirms available position');
 add('09:02','Liquidity and custody checks',`${s.money} cash leg · ${s.custody} authorization policy`);
 if(s.failure==='quorum') { add('09:03','Signing quorum unavailable','Only one of three signers responded; threshold is 2-of-3','exception'); return finish('BLOCKED','Reserved','Not submitted','Quorum unavailable','Not run','Not reached','Not assessed',events,['EV-CUSTODY-QUORUM-01'],'Restore signer availability, verify signer health and obtain a fresh authorized instruction.'); }
 add('09:03','Custody authorization obtained','Maker-checker approval and transaction limits passed');
 add('09:04','Asset and cash reserved',s.settlement==='Atomic'?'Both legs reserved in modeled atomic design.':'Independent systems reserve their respective legs.');
 if(s.failure==='duplicate') { add('09:05','Duplicate payment instruction','Idempotency key PAY-7781 already processed; duplicate suppressed','warning'); add('09:06','Settlement proceeds once','Exactly one cash instruction retained; no second debit created'); }
 else if(s.failure==='cash') { add('09:05','Cash leg failed','Payment rail returned rejection after asset reservation','exception'); add('09:06','Asset reservation released','Recovery instruction applied; no completed-settlement claim','warning'); return finish('EXCEPTION','Reservation released','Failed','Authorized','Exception','Asset technical finality not reached','Not assessed',events,['EV-CASH-FAIL-02','EV-RECOVERY-03'],'Investigate payment rejection, confirm release at both systems and resubmit only after fresh funds checks.'); }
 else if(s.failure==='finality') { add('09:05','Network finality uncertain','No authoritative finality receipt within the configured observation window','exception'); return finish('PENDING','Reserved','Pending','Authorized','Open exception','Uncertain','Not assessed',events,['EV-FINALITY-OBS-04'],'Pause further instructions; query independent observations and reconcile before retry or release.'); }
 else add('09:05','Settlement instructions processed','Asset transfer and cash payment acknowledged by their respective systems');
 add('09:06','Ledger states synchronized',`${s.topology}; ${s.model.toLowerCase()} deposit accounting model`);
 if(s.failure==='reconciliation') { add('09:07','Reconciliation mismatch','Core bank position differs from tokenised deposit ledger by €5M','exception'); return finish('EXCEPTION','Transferred','Reported paid','Authorized','Mismatch · €5M','Asset confirmed; cash claim disputed','Not assessed',events,['EV-RECON-05','EV-CORE-LEDGER-06'],'Block closeout, preserve both source records and route to operations for break investigation.'); }
 add('09:07','Reconciliation completed','Asset register, token ledger, core banking and deposit ledger agree');
 add('09:08','Evidence bundle recorded','Instruction, eligibility, authorization, acknowledgements and reconciliation references captured');
 return finish('SETTLED / OPERATIONALLY COMPLETED','Transferred','Paid','Authorized','Matched','Confirmed by modeled sources','Not assessed',events,['EV-TRADE-7781','EV-AUTH-4410','EV-DVP-7781','EV-RECON-7781'],'Normal synthetic flow; retain evidence and monitor subsequent servicing events.');
 function finish(outcome:string,asset:string,cash:string,custody:string,reconciliation:string,technicalFinality:string,legalFinality:string,evts:Result['events'],evidence:string[],remediation:string):Result{return {outcome,asset,cash,custody,reconciliation,technicalFinality,legalFinality,events:evts,evidence,remediation};}
}
