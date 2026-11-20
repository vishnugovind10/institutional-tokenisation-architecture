import { resolveSettlement, type ArchitectureConfig } from './architecture';

export type LifecycleEvent = { id:string; type:string; detail:string; evidence:string; status:'APPLIED'|'REJECTED'|'DUPLICATE'; at:string };
export type LedgerState = {
  asOfDate:string; issuanceAuthorized:boolean; registerIssuedUnits:number; assetBalances:Record<string,number>; eligibleInvestors:string[];
  bankCashMinor:Record<string,number>; tokenCashMinor:Record<string,number>; cashInstrumentMinor:Record<string,number>; omnibusBackingMinor:number;
  processedInstructions:string[]; events:LifecycleEvent[];
};
export type LifecycleCommand =
 | {type:'authorize-issuance'}
 | {type:'issue'; units:number}
 | {type:'onboard'; investor:string; eligible:boolean}
 | {type:'fund'; account:string; amountMinor:number}
 | {type:'subscribe'; investor:string; units:number; amountMinor:number; instructionId:string}
 | {type:'dvp'; buyer:string; seller:string; units:number; amountMinor:number; instructionId:string; custodyAuthorized:boolean}
 | {type:'coupon'; issuer:string; asOfDate:string; paymentsPerYear:number}
 | {type:'redeem'; investor:string; units:number; amountMinor:number; asOfDate:string; custodyAuthorized:boolean}
 | {type:'inject-divergence'; ledger:'asset'|'deposit'|'backing'; account:string; amount:number}
 | {type:'reconcile'};

export const createLedgerState = (asOfDate='2026-11-20'):LedgerState=>({asOfDate,issuanceAuthorized:false,registerIssuedUnits:0,assetBalances:{},eligibleInvestors:[],bankCashMinor:{},tokenCashMinor:{},cashInstrumentMinor:{},omnibusBackingMinor:0,processedInstructions:[],events:[]});
const positive=(n:number)=>Number.isSafeInteger(n)&&n>0;
function custodyAvailable(c:ArchitectureConfig){
 if(c.custody==='mpc')return c.mpcThreshold>0&&c.mpcAvailableSigners>=c.mpcThreshold&&c.custodyPolicy;
 if(c.custody==='hsm')return c.hsmAvailable&&c.custodyPolicy;
 if(c.custody==='hybrid')return c.hsmAvailable&&c.mpcThreshold>0&&c.mpcAvailableSigners>=c.mpcThreshold&&c.custodyPolicy;
 return c.custodyPolicy;
}
function record(s:LedgerState,command:string,detail:string,status:LifecycleEvent['status']='APPLIED'){
 s.events.push({id:`EV-${String(s.events.length+1).padStart(4,'0')}`,type:command,detail,evidence:`EVID-${command.toUpperCase()}-${String(s.events.length+1).padStart(4,'0')}`,status,at:s.asOfDate});
}
function ensureEligible(s:LedgerState,investor:string,c:ArchitectureConfig){if(c.transferRestrictions&&!s.eligibleInvestors.includes(investor))throw new Error(`Investor ${investor} is not eligible for this restricted instrument.`);}
function cashAvailable(s:LedgerState,account:string,amount:number,c:ArchitectureConfig){
 if(c.money==='deposit'&&c.depositModel==='mirror'){
  if((s.bankCashMinor[account]||0)<amount)throw new Error(`Insufficient bank cash for ${account}.`);
  if((s.tokenCashMinor[account]||0)<amount)throw new Error(`Insufficient tokenised deposit balance for ${account}.`);
 }else if(c.money==='deposit'){
  if((s.tokenCashMinor[account]||0)<amount)throw new Error(`Insufficient omnibus entitlement balance for ${account}.`);
  const liabilities=Object.values(s.tokenCashMinor).reduce((a,b)=>a+b,0);
  if(liabilities>s.omnibusBackingMinor)throw new Error('Omnibus backing is below aggregate token cash liabilities.');
 }else if((s.cashInstrumentMinor[account]||0)<amount)throw new Error(`Insufficient ${c.money} cash position for ${account}.`);
}
function debit(s:LedgerState,account:string,amount:number,c:ArchitectureConfig){
 if(c.money==='deposit'&&c.depositModel==='mirror'){s.bankCashMinor[account]=(s.bankCashMinor[account]||0)-amount;s.tokenCashMinor[account]=(s.tokenCashMinor[account]||0)-amount;}
 else if(c.money==='deposit')s.tokenCashMinor[account]=(s.tokenCashMinor[account]||0)-amount;
 else s.cashInstrumentMinor[account]=(s.cashInstrumentMinor[account]||0)-amount;
}
function credit(s:LedgerState,account:string,amount:number,c:ArchitectureConfig){
 if(c.money==='deposit'&&c.depositModel==='mirror'){s.bankCashMinor[account]=(s.bankCashMinor[account]||0)+amount;s.tokenCashMinor[account]=(s.tokenCashMinor[account]||0)+amount;}
 else if(c.money==='deposit')s.tokenCashMinor[account]=(s.tokenCashMinor[account]||0)+amount;
 else s.cashInstrumentMinor[account]=(s.cashInstrumentMinor[account]||0)+amount;
}
function duplicate(s:LedgerState,id:string){return s.processedInstructions.includes(id);}
function finish(s:LedgerState,command:string,detail:string){record(s,command,detail);return s;}

export function executeLifecycle(state:LedgerState,config:ArchitectureConfig,command:LifecycleCommand):LedgerState{
 const s=structuredClone(state);
 switch(command.type){
  case 'authorize-issuance':
   if(s.issuanceAuthorized)throw new Error('Issuance is already authorized.');
   s.issuanceAuthorized=true;return finish(s,'authorize-issuance','Issuer governance authority approved the configured issue supply.');
  case 'issue':
   if(!s.issuanceAuthorized)throw new Error('Issuance requires prior authorization.');
   if(!positive(command.units)||s.registerIssuedUnits+command.units>config.issueSizeUnits)throw new Error('Mint would exceed the authorized issue supply or contains invalid units.');
   s.registerIssuedUnits+=command.units;s.assetBalances.ISSUER=(s.assetBalances.ISSUER||0)+command.units;
   return finish(s,'issue',`${command.units} units minted and recorded in the legal register.`);
  case 'onboard':
   if(!command.investor.trim())throw new Error('Investor identifier is required.');
   if(command.eligible&&!s.eligibleInvestors.includes(command.investor))s.eligibleInvestors.push(command.investor);
   if(!command.eligible)s.eligibleInvestors=s.eligibleInvestors.filter(x=>x!==command.investor);
   return finish(s,'onboard',`${command.investor} eligibility set to ${command.eligible}.`);
  case 'fund':
   if(!command.account.trim()||!positive(command.amountMinor))throw new Error('A named account and positive integer minor-unit amount are required.');
   if(config.money==='deposit'&&config.depositModel==='mirror'){
    s.bankCashMinor[command.account]=(s.bankCashMinor[command.account]||0)+command.amountMinor;
    s.tokenCashMinor[command.account]=(s.tokenCashMinor[command.account]||0)+command.amountMinor;
   }else if(config.money==='deposit'){
    s.bankCashMinor.OMNIBUS_POOL=(s.bankCashMinor.OMNIBUS_POOL||0)+command.amountMinor;
    s.omnibusBackingMinor+=command.amountMinor;s.tokenCashMinor[command.account]=(s.tokenCashMinor[command.account]||0)+command.amountMinor;
   }else s.cashInstrumentMinor[command.account]=(s.cashInstrumentMinor[command.account]||0)+command.amountMinor;
   return finish(s,'fund',`${command.amountMinor} minor units credited to ${command.account}${config.money==='deposit'&&config.depositModel==='omnibus'?' as investor entitlement against a separately recorded pool asset':''}.`);
  case 'subscribe':
   if(duplicate(s,command.instructionId)){record(s,'duplicate',`Subscription ${command.instructionId} suppressed by idempotency.`, 'DUPLICATE');return s;}
   ensureEligible(s,command.investor,config);
   if(!positive(command.units)||!positive(command.amountMinor))throw new Error('Subscription units and amount must be positive integer values.');
   if((s.assetBalances.ISSUER||0)<command.units)throw new Error('Issuer has insufficient minted units for the subscription.');
   cashAvailable(s,command.investor,command.amountMinor,config);
   debit(s,command.investor,command.amountMinor,config);credit(s,'ISSUER',command.amountMinor,config);
   s.assetBalances.ISSUER-=command.units;s.assetBalances[command.investor]=(s.assetBalances[command.investor]||0)+command.units;
   s.processedInstructions.push(command.instructionId);
   return finish(s,'subscribe',`${command.units} units allocated to ${command.investor}; cash debit ${command.amountMinor} minor units.`);
  case 'dvp': {
   if(duplicate(s,command.instructionId)){record(s,'duplicate',`Settlement ${command.instructionId} suppressed by idempotency.`, 'DUPLICATE');return s;}
   if(!command.custodyAuthorized||!custodyAvailable(config))throw new Error('Custody authorization or selected signing service is unavailable.');
   ensureEligible(s,command.buyer,config);ensureEligible(s,command.seller,config);
   if(!positive(command.units)||!positive(command.amountMinor))throw new Error('Trade units and cash amount must be positive integer values.');
   if((s.assetBalances[command.seller]||0)<command.units)throw new Error('Seller has insufficient available asset units.');
   cashAvailable(s,command.buyer,command.amountMinor,config);
   debit(s,command.buyer,command.amountMinor,config);credit(s,command.seller,command.amountMinor,config);
   s.assetBalances[command.seller]-=command.units;s.assetBalances[command.buyer]=(s.assetBalances[command.buyer]||0)+command.units;
   s.processedInstructions.push(command.instructionId);
   const settlement=resolveSettlement(config);
   return finish(s,'dvp',`${command.units} units and ${command.amountMinor} minor units settled using ${settlement.effective} settlement (${settlement.reason}); operational result does not establish legal finality.`);
  }
  case 'coupon': {
   if(!Number.isInteger(command.paymentsPerYear)||command.paymentsPerYear<1)throw new Error('Coupon frequency must be a positive integer.');
   const holders=Object.entries(s.assetBalances).filter(([account,units])=>account!=='ISSUER'&&units>0);
   const totalMinor=holders.reduce((total,[,units])=>total+calculateCouponMinor(units,config.faceValueMinor,config.couponBps,command.paymentsPerYear),0);
   if(!positive(totalMinor))throw new Error('No coupon is due for current holdings or configured terms.');
   cashAvailable(s,command.issuer,totalMinor,config);
   for(const [investor,units] of holders){const amount=calculateCouponMinor(units,config.faceValueMinor,config.couponBps,command.paymentsPerYear);if(amount){debit(s,command.issuer,amount,config);credit(s,investor,amount,config);}}
   return finish(s,'coupon',`Coupon distributed to ${holders.length} holders at ${config.couponBps} bps; aggregate scheduled amount ${totalMinor} minor units.`);
  }
  case 'redeem':
   if(new Date(command.asOfDate)<new Date(config.maturityDate))throw new Error('Redemption is blocked before instrument maturity.');
   if(!command.custodyAuthorized||!custodyAvailable(config))throw new Error('Redemption requires custody authorization and an available signing service.');
   if(!positive(command.units)||!positive(command.amountMinor))throw new Error('Redemption units and amount must be positive integer values.');
   if((s.assetBalances[command.investor]||0)<command.units)throw new Error('Investor holds insufficient units for redemption.');
   cashAvailable(s,'ISSUER',command.amountMinor,config);
   debit(s,'ISSUER',command.amountMinor,config);credit(s,command.investor,command.amountMinor,config);
   s.assetBalances[command.investor]-=command.units;s.registerIssuedUnits-=command.units;
   return finish(s,'redeem',`${command.units} units cancelled and ${command.amountMinor} minor units paid to ${command.investor}. Legal discharge remains governed by instrument terms.`);
  case 'inject-divergence':
   if(!Number.isSafeInteger(command.amount)||command.amount===0)throw new Error('Divergence must be a non-zero integer.');
   if(command.ledger==='asset')s.assetBalances[command.account]=(s.assetBalances[command.account]||0)+command.amount;
   else if(command.ledger==='deposit')s.tokenCashMinor[command.account]=(s.tokenCashMinor[command.account]||0)+command.amount;
   else s.omnibusBackingMinor+=command.amount;
   return finish(s,'inject-divergence',`${command.ledger} record intentionally changed by ${command.amount} units for exception testing.`);
  case 'reconcile': {
   const tokenUnits=Object.values(s.assetBalances).reduce((sum,units)=>sum+units,0);
   const assetMatched=tokenUnits===s.registerIssuedUnits;
   const cashAccounts=new Set([...Object.keys(s.bankCashMinor),...Object.keys(s.tokenCashMinor)]);
   const mirrorMatched=config.money!=='deposit'||config.depositModel!=='mirror'||[...cashAccounts].every(account=>(s.bankCashMinor[account]||0)===(s.tokenCashMinor[account]||0));
   const omnibusLiability=Object.values(s.tokenCashMinor).reduce((sum,amount)=>sum+amount,0);
   const omnibusMatched=config.money!=='deposit'||config.depositModel!=='omnibus'||(omnibusLiability<=s.omnibusBackingMinor&&(s.bankCashMinor.OMNIBUS_POOL||0)===s.omnibusBackingMinor);
   if(!assetMatched||!mirrorMatched||!omnibusMatched)throw new Error(`Reconciliation exception: asset=${assetMatched}; mirror=${mirrorMatched}; omnibusCoverage=${omnibusMatched}. No balances were silently adjusted.`);
   return finish(s,'reconcile',`Asset register and token supply agree; configured cash records reconcile.${config.money==='deposit'&&config.depositModel==='omnibus'?` Pool assets ${s.omnibusBackingMinor}; token cash liabilities ${omnibusLiability}.`:''} Legal finality is not assessed.`);
  }
 }
}

export function calculateCouponMinor(units:number,faceValueMinor:number,couponBps:number,paymentsPerYear=2):number{
 if(!Number.isSafeInteger(units)||units<0||!Number.isSafeInteger(faceValueMinor)||faceValueMinor<0||!Number.isSafeInteger(couponBps)||couponBps<0||!Number.isSafeInteger(paymentsPerYear)||paymentsPerYear<1)throw new Error('Coupon inputs must be non-negative safe integers and frequency must be positive.');
 const numerator=units*faceValueMinor*couponBps;if(!Number.isSafeInteger(numerator))throw new Error('Coupon calculation exceeds safe integer precision.');
 return Math.floor(numerator/(10_000*paymentsPerYear));
}
