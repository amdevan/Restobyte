# Debug Session: running-order-flicker
- **Status**: [OPEN]
- **Issue**: Opening a live running order in POS visibly flickers more than 3 times before settling.
- **Debug Server**: Pending startup
- **Log File**: .dbg/trae-debug-log-running-order-flicker.ndjson

## Reproduction Steps
1. Open the live app.
2. Navigate to POS.
3. Open `Running Orders`.
4. Click an existing running order.
5. Observe repeated visible flicker/re-render on the Update Order view.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | The running-order click path triggers repeated route/state transitions that remount the POS screen multiple times. | High | Low | Pending |
| B | POS mount effects or order-loading effects are firing repeatedly for the selected running order and causing multiple commits. | High | Low | Pending |
| C | A shared store/context notification burst still happens after opening a running order, forcing the Update Order subtree to re-render several times. | Medium | Medium | Pending |
| D | The Running Orders modal/panel closes while a second order hydration path replays cart state, producing duplicate cart/order sync passes. | Medium | Medium | Pending |
| E | The visible flicker is mostly DOM churn in the order/cart subtree rather than full POS remounts, caused by unstable item/render props during load. | Medium | Medium | Pending |

## Log Evidence
- Dev-instrumented POS reproduction on `http://localhost:5174/app/panel/pos` showed repeated `PosPage` mount/unmount pairs and duplicate commit sequences while navigating into POS. Representative evidence from [.dbg/trae-debug-log-running-order-flicker.ndjson](file:///Users/devanthakur/restobyte---restaurant-management/.dbg/trae-debug-log-running-order-flicker.ndjson):
  - `PosPage mounted` / `PosPage unmounted` repeated back-to-back with `tableId: null`
  - `Observed POS commit` repeatedly reset to `commitCount: 1` then `commitCount: 2`, which indicates fresh remount cycles instead of a single stable screen updating in place
- Live Docker-served reproduction on `http://localhost/app/panel/pos`:
  1. Opened POS from dashboard
  2. Opened `Running Orders`
  3. Clicked `T5 Rs 1830.00 Walk-in 2d ago`
  4. URL changed immediately to `/app/panel/pos/e727c7c4-9a7f-4761-81ef-65ba36418176`
  5. A browser MutationObserver recorded:
     - `totalRaw: 1260`
     - `totalFiltered: 792`
     - `bucketCount: 10`
     - major buckets at ~`9.5s`, `10.0s`, `10.9s`, `11.4s`, `12.0s`, `13.2s`, `14.1s`, `15.0s`, `16.0s`
  This confirms visible multi-phase DOM churn well above the allowed threshold of 3 visible updates.

## Verification Conclusion
- Current status: issue reproduced on live app and still open.
- Hypothesis status:
  - `A` Confirmed in dev instrumentation: POS screen is not staying mounted cleanly during navigation.
  - `B` Inconclusive: current live reproduction used DOM observation, not order-hydration logs.
  - `C` Confirmed by live DOM evidence: opening a running order causes a large notify/render burst instead of a single settle.
  - `D` Inconclusive: modal-close overlap still possible, needs one more focused trace.
  - `E` Confirmed by live DOM evidence: the update-order subtree churns through multiple render buckets after route change.
