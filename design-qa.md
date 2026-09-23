# Design QA — Report reader accordion refinement

**Source visual truth**

- `/Users/juliancreha/.codex/generated_images/01a0cf2c-0aaf-7180-8cd3-7cfb04b332f6/exec-c1939350-14c3-49af-890a-4cfe91c27266.png`
- Source dimensions: 853 × 1844 px.
- Intended CSS viewport: 390 × 844 px; the generated reference uses the same aspect ratio at approximately 2.19× density.
- Selected target: the second generated option, a compact grouped list with claim details expanding in place.

**Implementation evidence**

- Browser URL: `http://localhost:3000/r/QDVPDSMlLZoY`
- Implementation screenshots: inline Codex in-app Browser captures at 390 × 844 and 1375 × 899 CSS px; the browser surface did not expose filesystem paths for the captures.
- Capture density: 1×.
- State: Spanish interface, screenshot-sourced report, evaluation details visible without a nested disclosure, claim 1 expanded by default.
- The source visual and the full mobile implementation capture were emitted together in the same comparison result.
- Additional interaction evidence: claims 1 and 2 remained expanded simultaneously, as did the first two evidence sources inside claim 1.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation keeps the product's established Arial/Helvetica stack and heavy editorial labels. Claim text was reduced from an initially over-bold weight to a regular reading weight, matching the reference hierarchy while retaining clear verdict emphasis.
- Spacing and layout rhythm: the complete reading flow uses one 920 px column centered inside the 1375 px desktop viewport, with equal 228 px side gutters. At 390 px the same regions use equal 10 px gutters and no horizontal overflow. Details open directly beneath their claim.
- Colors and visual tokens: the implementation reuses the existing paper, ink, muted, yellow, mint, coral, and verdict tokens. The real report's neutral verdict color replaces the mock's positive mint treatment because the persisted verdict is `insufficient_evidence`.
- Image quality and asset fidelity: no new raster assets were required. The existing brand image and Colombia Icons components remain sharp and consistent; no CSS art, Unicode icons, or inline SVG approximations were introduced.
- Copy and content: persisted report claims, verdicts, explanations, source names, and dates remain authoritative. The mock's illustrative Spanish claim copy was not substituted for real report data. New labels are localized in English, Spanish, French, and Portuguese.
- Interaction: claim rows and evidence rows maintain independent expanded sets, so opening one does not close another. Evaluation details are no longer a nested disclosure; they remain visible wherever the associated result or claim is shown. The translation/original control keeps its own state.
- Evidence language: only one fragment is rendered at a time. A materially different translation is the default and exposes a control to show the original; identical translations are suppressed entirely.
- Source origin: screenshot reports render no empty `Página original` panel. URL reports retain the linked original-page panel.
- Browser console: no errors or warnings were reported during the final desktop pass.

## Accessibility and responsive checks

- Claim and evidence controls use native buttons with `aria-expanded` and `aria-controls`.
- Touch controls are at least 44 px in the mobile layout.
- Focus styling continues to use the existing high-contrast global focus token.
- Reading order follows the visible order: claim, verdict, strength, explanation, then sources.
- The 390 × 844 and 1375 × 899 layouts were inspected; neither reintroduces the former master-detail separation.

## Comparison history

1. Initial comparison found two P2 differences: `Afirmaciones revisadas (3)` wrapped at 390 px, and claim text was visibly heavier than the reference. The mobile heading scale was reduced and kept on one line; claim weight was reduced.
2. Browser interaction testing found the active claim reopened immediately after being closed. The state recovery effect now preserves an intentional all-collapsed state.
3. The final aligned comparison found no remaining P0, P1, or P2 issues. Differences in verdict color and report prose are intentional consequences of real persisted data.
4. The refinement pass made evaluation details permanently visible, converted claim and evidence disclosure state from single selection to independent multi-selection, and centered every main report region. Browser measurements confirmed symmetric gutters in both viewports and no console warnings or errors.

## Implementation checklist

- [x] One-column claim accordion on mobile and desktop
- [x] Verdict and evidence strength always adjacent to each claim
- [x] Evaluation details visible without an extra disclosure
- [x] Multiple claims and evidence sources can remain expanded
- [x] Main report regions centered at desktop and mobile widths
- [x] Expanded result directly below its claim
- [x] One evidence language visible at a time
- [x] Duplicate translations suppressed
- [x] Screenshot reports omit the original-page panel
- [x] URL reports retain the original-page link
- [x] Localized labels in four supported languages
- [x] Mobile and desktop browser verification
- [x] Primary interactions and console checked

## Follow-up polish

- P3: future reports could persist the translation target language explicitly so a later interface-language change can label the translated excerpt more precisely.

final result: passed
