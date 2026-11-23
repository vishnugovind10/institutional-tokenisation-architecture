# Collateral product demonstration

**Length:** about 90 seconds  
**Audience:** architecture committee, collateral operations, custody and settlement teams  
**Dataset:** `COLLATERAL-DEMO-001` (synthetic)

## Recording sequence and narration

| Time | Show | Narration |
| --- | --- | --- |
| 0:00–0:10 | Open Decision Studio with the collateral assessment. Point out the recommendation and open gates. | “This is a synthetic collateral allocation assessment. The engine recommends HOLD and shows what must be resolved before a pilot is considered.” |
| 0:10–0:28 | Show the economic objective and three measures. Highlight cost improvement, slower processing and higher exception rate. | “Cost is the selected primary objective. The model shows €110 lower cost per event, but processing time rises and the exception rate moves beyond the configured tolerance. The trade-off is not accepted, so the economic gate remains open.” |
| 0:28–0:40 | Show the hypothetical sensitivity label and evidence-quality tags. | “These values are assumptions. Sensitivity is explicitly hypothetical and does not verify evidence or turn a model into a measured result.” |
| 0:40–1:04 | Open Collateral Lifecycle. Reserve BOND-001, confirm delivery, discharge, release and reconcile. | “The lifecycle simulator keeps legal agreement, inventory, custody and settlement records separate while the sample obligation moves through allocation and release.” |
| 1:04–1:18 | Select BOND-002 and try to reserve it. Show BLOCKED event and preserved prior state. | “An ineligible asset is rejected. The blocked attempt is retained in the event history, with the original successful business state preserved.” |
| 1:18–1:30 | Run the failure scenarios and show the decision record export. | “The exception suite covers cash shortfall, ineligible collateral, failed delivery, stale observations and reconciliation mismatch. The committee memo records the recommendation, assumptions, architecture, owners and actions.” |

## Record checklist

- Use a clean browser window at 1280 × 800 or larger and the public demo or local build.
- Keep the synthetic dataset label and product limitations visible in the narration.
- Do not enter real institution, customer, account or transaction information.
- Show both the successful lifecycle and the blocked event; avoid implying a real custody or cash movement.
- Export the reproducible committee memo from [the sample assessment](../examples/collateral-committee-assessment.md).

Regenerate the assessment package with `npm run sample:collateral`. For deployment boundaries, see [deployment status](deployment-status.md).
