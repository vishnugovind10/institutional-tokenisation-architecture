import { describe, expect, it } from 'vitest';
import { simulate, type Scenario } from './model';
const base:Scenario={failure:'none',custody:'MPC 2-of-3',money:'Tokenised deposits',model:'Mirror',topology:'Multiple ledgers',settlement:'Coordinated'};
describe('synthetic settlement simulator',()=>{
 it('completes normal flow without asserting legal finality',()=>{const r=simulate(base);expect(r.outcome).toContain('SETTLED');expect(r.legalFinality).toBe('Not assessed');});
 it('blocks when signing quorum is unavailable',()=>expect(simulate({...base,failure:'quorum'}).outcome).toBe('BLOCKED'));
 it('does not claim completion while finality is uncertain',()=>expect(simulate({...base,failure:'finality'}).outcome).toBe('PENDING'));
 it('raises an exception on a cash failure after reservation',()=>expect(simulate({...base,failure:'cash'}).asset).toBe('Reservation released'));
 it('suppresses a duplicate payment while proceeding once',()=>{const r=simulate({...base,failure:'duplicate'});expect(r.events.some(e=>e.title==='Duplicate payment instruction')).toBe(true);expect(r.outcome).toContain('SETTLED');});
 it('blocks closeout on reconciliation mismatch',()=>expect(simulate({...base,failure:'reconciliation'}).outcome).toBe('EXCEPTION'));
});
