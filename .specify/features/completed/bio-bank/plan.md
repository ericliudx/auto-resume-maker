# Plan: bio-bank

## Approach

1. **Align `GET /api/bio/bank` with `bio/README.md`**  
   Aggregate `bio/summaries/*.json` and `bio/certifications/*.json` the same way as other dirs (read JSON files, tolerate missing dirs).

2. **Types**  
   Extend `BioBank` with optional `summaries` and `certifications` arrays (`unknown[]`) so extra docs do not force a rigid schema before content stabilizes.

3. **Tailor / resume pipeline**  
   `applyTailorResult` already spreads `base`; new fields pass through. `makeBankForPrompt` includes the new arrays so tailor prompts see full material.

4. **UI**  
   Bio bank tab lives under `frontend/src/components/bioBankViewer/`: `BioBankViewer.tsx` composes sections; `useBioBankPanelData` loads bank + contact; readable cards and `CollapsibleJson` live in small sibling modules. Import from `components/bioBankViewer` (barrel `index.ts`).

5. **Docs**  
   `api-shapes.md` records the expanded bank shape. `architecture/index.md` notes new folders in the bank response.

## Ownership

- Adapter: `frontend/vite.config.ts`
- Types + client fetch: `frontend/src/resume/data/bioTypes.ts`, `frontend/src/resume/api/bioApi.ts`
- Viewer: `frontend/src/components/bioBankViewer/`
- Prompt payload: `frontend/src/tailor/tailorBank.ts`

## Verification

```bash
cd frontend && npm run lint && npm run build
```

Manual: `npm run dev`, open **Bio bank** tab—confirm readable sections, contact row, empty summaries/certifications messaging, tailored subtitle when patch active, raw JSON toggle.
