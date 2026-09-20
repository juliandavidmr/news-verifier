# Design QA — Contraste brand rollout

**Source visual truth**

- `/Users/juliancreha/.codex/generated_images/01a0c0b6-f7a9-7021-8521-038fcb6a5f17/exec-bc30c748-456e-4f98-9bfd-30ea2d2799ea.png`
- Source dimensions: 1536 × 1024 px.
- Selected target: the large coral-and-ivory overlapping document mark.

**Implementation evidence**

- Browser-rendered home, methodology, privacy, and mobile states were inspected during implementation. Temporary visual comparison files were removed after the QA pass because they are not runtime assets.
- Browser URL: `http://127.0.0.1:3100/`
- Viewport: 1280 × 720 CSS px; browser device pixel ratio 2; captured output normalized to 1280 × 720 px.
- State: English home page, URL input mode, system light preference.

## Findings

No actionable P0, P1, or P2 mismatches remain.

- Fonts and typography: the existing Arial/Helvetica wordmark remains unchanged. Its heavy weight and compact tracking still match the site and balance the wider new symbol.
- Spacing and layout rhythm: the 46 px mark fits within the existing 84 px header without changing the header height or causing mobile overflow. The desktop and 390 px mobile captures preserve the existing layout.
- Colors and visual tokens: the light mark uses the selected coral, ivory, and ink palette. The dark variant preserves coral and inverts the outer linework to ivory against `#17140f`. Theme-color metadata follows the same light/dark backgrounds.
- Image quality and asset fidelity: the production mark is a transparent 512 px generated asset derived from the selected visual, not a CSS or inline-SVG approximation. Its two panels, central diamond, angular overlap, text bars, perspective, and heavy outline match the selected concept. Focused comparison found no material geometry drift at header size.
- Copy and content: no product copy changed. The localized wordmark continues to come from the existing locale strings.
- Headers: the home page, methodology page, privacy page, and report view use the shared `BrandLink`. Methodology and privacy now expose it inside a full top bar rather than as an unstructured standalone link.
- Metadata surfaces: light and dark 32 px favicon links, ICO fallback, Apple touch icon, PWA 192/512 icons, manifest entries, and Open Graph art all use the selected mark.
- Interaction regression check: Link and Upload screenshot modes both remain selectable and reveal their corresponding inputs. Browser console reported no errors.

## Open Questions

- None blocking. The in-app browser was running with a light OS preference, so the dark page palette was validated through its production CSS tokens and the final dark asset composite rather than a browser-level `prefers-color-scheme: dark` screenshot.

## Comparison history

- Initial implementation pass: no P0/P1/P2 issues found in the full-page and focused logo comparisons.
- No corrective visual iteration was required.

## Implementation checklist

- [x] Shared header mark
- [x] Header on every public page
- [x] Report header through shared component
- [x] Light and dark theme assets
- [x] Light and dark site tokens
- [x] Responsive mobile verification
- [x] Favicon, Apple icon, PWA manifest, and Open Graph coverage
- [x] Console and primary input-mode checks

## Follow-up polish

- P3: if a manual theme switcher is added later, reuse the same dark asset and token set instead of introducing a third logo treatment.

final result: passed
