# Amantusi Trading — Brand and Interface Standards

Status: technical design reference, **not** a legal or trademark approval document. Grounded in the public site and its company logo source.

## 1. Core identity and logo
- Primary logo: `/assets/amantusi-logo.svg`. Deep navy backdrop, warm metallic gold monogram, white wordmark.
- Alternate vector marks: `/assets/amantusi-logo-mono.svg`, `/assets/amantusi-logo-negative.svg`, `/assets/amantusi-logo-clear.svg`.
- Keep logo geometry unchanged and preserve the square viewBox. Never stretch, tilt, crop wordmarks, or add unrelated logos inside the primary mark.
- Minimum digital logo size: test at 40–48 px; full wordmark should only be used when legible. Avoid placing the negative logo on light or gold surfaces.

## 2. Design tokens
| Element | Token | Example |
|---|---|---|
| Corporate navy | `--amt-ink` | `#071923` |
| Amantusi gold | `--amt-gold` | `#B89E56` |
| Warm cream | `--amt-cream` | `#F7F2E8` |
| Text surface | `--amt-surface` | `#FFFFFF` |
| Input and card borders | `--amt-border` | `#D8E0DF` |
| Small radius | `--amt-radius-sm` | `8px` |
| Standard card radius | `--amt-radius-md` | `14px` |
| Hero surface radius | `--amt-radius-lg` | `22px` |
| Hover animation duration | `--amt-ease` | `180ms ease` |

Prefer navy backgrounds with off-white body copy; use gold for emphasis and premium CTAs, not dense text on white.

## 3. Type hierarchy
Display headings use Georgia (or an approved legible serif) at fluid sizes. Body copy and controls use system sans-serif. Hero headings should be limited to a practical 850 px measure; body copy roughly 60–75 characters per line where possible.

## 4. Grid and spacing
Base container width: `min(1180px, calc(100% - 2.5rem))`. Full-width hero, two-column story blocks, three-column desktop service/resource cards, a two-column mid-size layout, and one-column narrow-screen presentation. Minimize 100vw decorative overflow.

## 5. Interactive controls
Links and buttons must have visible text names. Minimum practical touch size: 44 × 44 px. Use a 3 px visible focus ring and high-contrast hover states. Avoid redundant hover-only interactions on touch devices.

## 6. Image direction
Use images that are genuinely representative of the service; do not describe generic portfolio photography as a verified completed project. Prefer optimized WebP assets with width and height set and lazy loading below the fold. Keep decorative imagery out of the accessibility tree.

## 7. Background motif
Use restrained concentric orbital lines, a specification-line grid and warm gold separators as the signature procurement motif. It should never interfere with body text or interactive controls. Standardized sector layouts already implement this language.

## 8. Print and document standards
Capability statements and company-profile copies use the same legal company name, registration number, CSD reference, address and logo. They must specify version and avoid unsupported credentials. A4 print layout should disable decorative animations and navigation.

## 9. Motion and performance
Honor `prefers-reduced-motion`, respect Data Saver and low-end devices, and avoid autoplaying expensive WebGL on mobile. New modules should initialize only where relevant and never replace real content with a mandatory cinematic loader.

## Accessibility sign-off
Automated semantic validation alone is not a complete WCAG audit. Before production, manually verify contrast in browser across all states, keyboard traversal, 200% text zoom and screen-reader announcements.
