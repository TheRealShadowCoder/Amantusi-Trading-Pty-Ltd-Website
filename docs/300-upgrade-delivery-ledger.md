# 300 Upgrade Delivery Ledger| 121 |  | Integrated | category filters display item counts in catering.js || 127 |  | Integrated | sticky selected-options shortcut in catering-upgrades.js || 136 |  | Integrated | native dialog gallery lightbox supports mobile and keyboard || 241 |  | Integrated | validate-site-smoke.mjs syntax-checks all public, src and scripts JS |

This checklist is the source-of-truth implementation status for [the 300-item backlog](./300-visual-and-functional-upgrades.md). **Integrated** means the repository contains a relevant working implementation or pre-existing corresponding capability; this does **not** certify production behavior or full acceptance testing. **Pending** includes unimplemented, partial, or unverified ideas. Classifications are conservative.

**Branch:** `fix/website-smoke-accessibility-20261027` · **Review:** PR #59 · **Live production:** unchanged.

**Integrated:** 67/300 · **Pending / not yet verified:** 233/300.

| # | Upgrade | Status | Evidence |
|---:|---|---|---|
| 1 | Create a primary corporate design-token palette. | Integrated | shared colors in sector.css |
| 2 | Establish dark-navy and warm-gold contrast variants. | Pending |  |
| 3 | Set typography scale for all heading levels. | Integrated | fluid headings and typography hierarchy |
| 4 | Add a compact company credentials lockup. | Pending |  |
| 5 | Create a monochrome logo variant. | Pending |  |
| 6 | Standardize icon stroke widths. | Pending |  |
| 7 | Define border-radius tokens by component. | Pending |  |
| 8 | Replace decorative glyphs with coherent iconography. | Pending |  |
| 9 | Add light and dark logo usage rules. | Pending |  |
| 10 | Create a hero wordmark composition. | Pending |  |
| 11 | Add tasteful gold accent dividers. | Pending |  |
| 12 | Use a consistent 12-column grid. | Pending |  |
| 13 | Establish content maximum widths. | Pending |  |
| 14 | Design a consistent photography color grade. | Pending |  |
| 15 | Produce branded document thumbnail treatments. | Pending |  |
| 16 | Standardize card shadows and surfaces. | Pending |  |
| 17 | Create branded empty-state illustrations. | Pending |  |
| 18 | Define brand-safe animation durations. | Pending |  |
| 19 | Design a signature procurement motif. | Pending |  |
| 20 | Document accessible color combinations. | Pending |  |
| 21 | Add a succinct value proposition above the fold. | Integrated | clear public procurement proposition |
| 22 | Show prominent government and private-sector buyer paths. | Integrated | public and private-sector service links |
| 23 | Add a service-category visual navigator. | Integrated | six-section capability directory |
| 24 | Introduce a compact procurement journey diagram. | Integrated | four-step service process display |
| 25 | Add an RFQ request example. | Pending |  |
| 26 | Feature operational sectors served. | Pending |  |
| 27 | Include relevant procurement document previews. | Pending |  |
| 28 | Add a verified company credentials panel. | Pending |  |
| 29 | Add a dedicated catering callout. | Pending |  |
| 30 | Add a direct contact strip near the hero. | Pending |  |
| 31 | Add trust-building delivery workflow details. | Pending |  |
| 32 | Add a plain-language company mission section. | Pending |  |
| 33 | Provide a service availability qualifier. | Pending |  |
| 34 | Add prominent tender-specific CTA. | Pending |  |
| 35 | Surface contact turnaround policy if verified. | Pending |  |
| 36 | Show a structured enquiry preview. | Pending |  |
| 37 | Explain supplier sourcing methodology. | Pending |  |
| 38 | Add meaningful footer navigation. | Pending |  |
| 39 | Add company-profile download CTA. | Pending |  |
| 40 | Add related service discovery links. | Pending |  |
| 41 | Add breadcrumbs to secondary pages. | Pending |  |
| 42 | Highlight active navigation destinations. | Pending |  |
| 43 | Add keyboard-operable mobile menu dismissal. | Integrated | app-fast.js Escape handling |
| 44 | Close mobile nav on outside interaction. | Integrated | app-fast.js outside click dismissal |
| 45 | Restore menu focus after Escape. | Integrated | focus returned to menu on Escape |
| 46 | Add a skip-to-content link. | Integrated | home and sector skip links |
| 47 | Use consistent mobile menu button labels. | Integrated | expanded/collapsed labels |
| 48 | Add footer links to all public destinations. | Pending |  |
| 49 | Group catering pages under a clear parent label. | Pending |  |
| 50 | Add service-specific jump links. | Pending |  |
| 51 | Implement anchor offset for sticky header. | Pending |  |
| 52 | Prevent hidden-menu keyboard focus. | Pending |  |
| 53 | Add a sitemap link in the footer. | Pending |  |
| 54 | Provide a back-to-top control with clear label. | Pending |  |
| 55 | Add keyboard-visible focus styles. | Integrated | shared focus-visible styles |
| 56 | Use descriptive link text instead of generic labels. | Pending |  |
| 57 | Add mobile sticky quote CTA where unobtrusive. | Pending |  |
| 58 | Ensure focus remains visible after route navigation. | Pending |  |
| 59 | Add navigation checks to CI. | Pending |  |
| 60 | Provide clear 404 navigation recovery. | Pending |  |
| 61 | Use a 320px narrow-screen regression baseline. | Pending |  |
| 62 | Test 375px common phone layout. | Pending |  |
| 63 | Test 768px tablet portrait layout. | Pending |  |
| 64 | Test 1024px tablet landscape layout. | Pending |  |
| 65 | Tune hero typography with CSS clamp. | Integrated | responsive sector grids use minmax(0,1fr) |
| 66 | Reduce large orb visuals on compact screens. | Pending |  |
| 67 | Prevent card grid horizontal overflow. | Pending |  |
| 68 | Guarantee touch targets of at least 44px. | Integrated | new controls at least 44px |
| 69 | Refine mobile quotation form spacing. | Pending |  |
| 70 | Preserve readable mobile legal credentials. | Integrated | mobile company credentials wrap |
| 71 | Adapt catering filters to horizontal swiping. | Pending |  |
| 72 | Optimize brochure typography for small screens. | Pending |  |
| 73 | Respect viewport safe-area insets. | Pending |  |
| 74 | Improve portrait and landscape navigation. | Integrated | profile and catering navigation respond to viewport |
| 75 | Use native date and telephone keyboards. | Pending |  |
| 76 | Reduce parallax on touch devices. | Pending |  |
| 77 | Disable hover-only affordances on mobile. | Pending |  |
| 78 | Test dynamic text enlargement. | Pending |  |
| 79 | Optimize section stacking and whitespace. | Pending |  |
| 80 | Verify no offscreen modal content. | Pending |  |
| 81 | Audit keyboard navigation on every public page. | Pending |  |
| 82 | Ensure one primary h1 per page. | Pending |  |
| 83 | Create proper labels for uploaded files. | Integrated | RFQ file label and description |
| 84 | Add visible focus rings to all controls. | Integrated | focus rings for links and inputs |
| 85 | Add ARIA-expanded state to mobile toggles. | Integrated | ARIA-expanded menu state |
| 86 | Validate landmark hierarchy. | Pending |  |
| 87 | Confirm meaningful alt text on information images. | Pending |  |
| 88 | Mark decorative images with empty alt text. | Pending |  |
| 89 | Add screen reader descriptions for loading states. | Pending |  |
| 90 | Use aria-atomic on form status. | Integrated | RFQ status aria-atomic |
| 91 | Validate WCAG AA color contrast. | Pending |  |
| 92 | Respect reduced-motion settings. | Integrated | reduced-motion CSS handling |
| 93 | Avoid animation-triggered focus changes. | Pending |  |
| 94 | Provide clear errors linked to form fields. | Pending |  |
| 95 | Verify labels survive placeholder disappearance. | Pending |  |
| 96 | Make accordion components keyboard operable. | Pending |  |
| 97 | Test zoom up to 200 percent. | Pending |  |
| 98 | Avoid color-only success/error indication. | Pending |  |
| 99 | Add accessible names to icon-only buttons. | Integrated | buttons include accessible names |
| 100 | Add automated accessibility tests. | Pending |  |
| 101 | Make direct secure RFQ submission default. | Integrated | RFQ /api/quote POST |
| 102 | Show server-generated reference on success. | Integrated | server reference displayed |
| 103 | Allow up to five attached documents within limits. | Integrated | five attachment limit |
| 104 | Validate per-file and aggregate size in browser. | Integrated | 10MB each and 30MB total validation |
| 105 | Explain accepted RFQ file formats. | Integrated | accepted files explained |
| 106 | Highlight required fields consistently. | Pending |  |
| 107 | Add optional line-item quantity capture. | Pending |  |
| 108 | Add delivery address guidance. | Integrated | delivery location placeholder |
| 109 | Add required-by date help text. | Pending |  |
| 110 | Add conditional tender reference fields. | Pending |  |
| 111 | Add catering guest-count input. | Pending |  |
| 112 | Add event date and venue fields. | Pending |  |
| 113 | Preserve form draft locally with consent. | Integrated | opt-in saved RFQ draft |
| 114 | Warn before discarding an unfinished request. | Pending |  |
| 115 | Display descriptive network error recovery. | Integrated | network failure message and recovery |
| 116 | Prevent accidental duplicate submission. | Integrated | duplicate-submit guard |
| 117 | Show upload progress for large attachments. | Pending |  |
| 118 | Add post-submit next steps. | Pending |  |
| 119 | Offer an enquiry confirmation email when configured. | Pending |  |
| 120 | Add privacy notice beside submit. | Integrated | browser-draft privacy explanation |
| 121 | Add category filter count chips. | Pending |  |
| 122 | Support menu keyword search. | Integrated | catering text search and result totals |
| 123 | Add dietary tag filtering. | Pending |  |
| 124 | Display allergen information where verified. | Pending |  |
| 125 | Show portion or guest-count guidance. | Pending |  |
| 126 | Allow multi-item catering quote selection. | Integrated | multi-item quote basket |
| 127 | Add a sticky selected-items summary. | Pending |  |
| 128 | Offer gallery image keyboard controls. | Pending |  |
| 129 | Make gallery captions informative. | Integrated | captioned gallery cards |
| 130 | Add image placeholders while loading. | Pending |  |
| 131 | Use compressed responsive image variants. | Pending |  |
| 132 | Explain customization availability. | Pending |  |
| 133 | Add print-friendly menu version. | Pending |  |
| 134 | Feature corporate catering packages. | Integrated | corporate menu custom package |
| 135 | Add event-type selector. | Integrated | catering event type selector |
| 136 | Add mobile-friendly photo zoom. | Pending |  |
| 137 | Include platter ingredient examples where accurate. | Pending |  |
| 138 | Add catering enquiry hand-off confirmation. | Pending |  |
| 139 | Improve empty category messaging. | Pending |  |
| 140 | Add transparent indicative price policy. | Integrated | explicit request-pricing note |
| 141 | Create a downloadable capability statement. | Pending |  |
| 142 | Show registration number consistently. | Integrated | registration shown on public pages |
| 143 | Show CSD number consistently. | Integrated | CSD number shown on public pages |
| 144 | Create a supplier onboarding overview. | Pending |  |
| 145 | Explain scope of goods and services. | Pending |  |
| 146 | Add procurement service-area map. | Pending |  |
| 147 | Highlight document and specification handling. | Integrated | sector checklist specification requirements |
| 148 | Provide a formal contact-person pathway. | Pending |  |
| 149 | Offer a printable one-page company profile. | Pending |  |
| 150 | Include company address consistently. | Integrated | company address published consistently |
| 151 | Add verified certifications when available. | Pending |  |
| 152 | Avoid unverified accreditation claims. | Pending |  |
| 153 | Add service delivery process diagram. | Pending |  |
| 154 | Add public/private client suitability notes. | Pending |  |
| 155 | Add proof-of-delivery workflow explanation. | Pending |  |
| 156 | Include tender response checklist. | Pending |  |
| 157 | Add official document request mechanism. | Pending |  |
| 158 | Explain quotation terms expectations. | Pending |  |
| 159 | Add supplier relationship overview. | Pending |  |
| 160 | Add company profile version date. | Pending |  |
| 161 | Design compact KPI cards with explanatory labels. | Pending |  |
| 162 | Add dashboard empty states. | Pending |  |
| 163 | Add searchable lead lists. | Pending |  |
| 164 | Allow lead status filtering. | Pending |  |
| 165 | Add supplier category filters. | Pending |  |
| 166 | Add product record validation indicators. | Pending |  |
| 167 | Add quote lifecycle timeline. | Pending |  |
| 168 | Add sort controls to operations tables. | Pending |  |
| 169 | Add bulk selection only where authorized. | Pending |  |
| 170 | Add safe confirmation dialogs for destructive actions. | Pending |  |
| 171 | Expose last synchronization timestamp. | Pending |  |
| 172 | Add audit-log viewer with role checks. | Pending |  |
| 173 | Add admin loading skeletons. | Pending |  |
| 174 | Support constrained table layouts on mobile. | Integrated | admin mobile overflow CSS |
| 175 | Add accessible toast announcements. | Pending |  |
| 176 | Add failed-operation retry UI. | Pending |  |
| 177 | Add content preview before publishing. | Pending |  |
| 178 | Add media library search. | Pending |  |
| 179 | Add admin help linked to current section. | Pending |  |
| 180 | Add protected export history. | Pending |  |
| 181 | Keep Google OAuth as primary admin entry. | Pending |  |
| 182 | Display recovery path prominently. | Integrated | admin recovery link in Google login |
| 183 | Verify recovery page no-store headers. | Pending |  |
| 184 | Handle expired sessions with clear messaging. | Pending |  |
| 185 | Add explicit session-expired reauthentication. | Pending |  |
| 186 | Prevent admin routes from indexing. | Integrated | noindex in admin headers |
| 187 | Mask sensitive administrator fields. | Pending |  |
| 188 | Add accessible backup recovery instructions. | Pending |  |
| 189 | Rate-limit credential recovery attempts. | Pending |  |
| 190 | Avoid exposing account existence in recovery errors. | Pending |  |
| 191 | Show authentication method context. | Pending |  |
| 192 | Confirm OAuth callback error handling. | Pending |  |
| 193 | Test state and nonce verification. | Pending |  |
| 194 | Add CSRF protection assertions. | Pending |  |
| 195 | Add admin operation confirmation where needed. | Pending |  |
| 196 | Audit file upload MIME validation. | Pending |  |
| 197 | Apply safe filename sanitization. | Pending |  |
| 198 | Document privilege boundaries. | Pending |  |
| 199 | Add clear logout confirmation. | Pending |  |
| 200 | Add security regression tests. | Pending |  |
| 201 | Keep static-first homepage rendering. | Integrated | static-first index.html |
| 202 | Lazily load optional animation modules. | Integrated | lazy runtime-gate.js |
| 203 | Set device-specific animation budgets. | Pending |  |
| 204 | Disable complex effects under reduced motion. | Integrated | optional effects respect reduced motion |
| 205 | Respect data saver preference. | Integrated | runtime-gate Save-Data preference |
| 206 | Keep large canvas effects off low-end phones. | Pending |  |
| 207 | Replace decorative video with static poster when idle. | Pending |  |
| 208 | Use CSS containment for large sections. | Pending |  |
| 209 | Preload only essential hero assets. | Pending |  |
| 210 | Defer secondary page scripts. | Pending |  |
| 211 | Audit repeated animation frame loops. | Pending |  |
| 212 | Avoid global scroll interception. | Pending |  |
| 213 | Cap particle counts by viewport. | Pending |  |
| 214 | Use IntersectionObserver for offscreen effects. | Pending |  |
| 215 | Optimize SVG logo rendering. | Pending |  |
| 216 | Specify image width and height. | Pending |  |
| 217 | Minimize layout shifts. | Pending |  |
| 218 | Add performance budget CI checks. | Pending |  |
| 219 | Track Long Tasks in development. | Pending |  |
| 220 | Run Lighthouse desktop and mobile. | Pending |  |
| 221 | Set canonical URLs for public pages. | Pending |  |
| 222 | Ensure one descriptive title per page. | Integrated | unique page titles |
| 223 | Write unique descriptions for catering pages. | Integrated | sector-specific descriptions |
| 224 | Add appropriate organization JSON-LD. | Pending |  |
| 225 | Avoid duplicate structured-data injections. | Pending |  |
| 226 | Add FAQ schema only for visible verified FAQs. | Pending |  |
| 227 | Maintain a current sitemap. | Pending |  |
| 228 | Keep admin routes disallowed and noindexed. | Integrated | admin robots restriction |
| 229 | Add Open Graph image artwork. | Pending |  |
| 230 | Set social share descriptions per page. | Pending |  |
| 231 | Create consistent heading hierarchy. | Pending |  |
| 232 | Avoid thin duplicate fast-page indexing. | Pending |  |
| 233 | Add descriptive image alt text for SEO. | Pending |  |
| 234 | Use meaningful internal links. | Pending |  |
| 235 | Verify sitemap page response codes. | Pending |  |
| 236 | Add structured postal address consistency checks. | Pending |  |
| 237 | Add breadcrumb structured data when appropriate. | Pending |  |
| 238 | Test social link previews. | Pending |  |
| 239 | Add language locale metadata. | Integrated | en-ZA language on new service pages |
| 240 | Monitor broken internal links. | Pending |  |
| 241 | Run syntax checks on all public JavaScript. | Pending |  |
| 242 | Test every documented public route. | Pending |  |
| 243 | Add local homepage smoke checks. | Integrated | public homepage smoke checks |
| 244 | Add desktop browser regression suite. | Integrated | desktop Playwright public tests |
| 245 | Add mobile browser regression suite. | Integrated | mobile Playwright public tests |
| 246 | Validate RFQ happy path against test storage. | Pending |  |
| 247 | Validate failed RFQ payload handling. | Pending |  |
| 248 | Test attachment size rejection. | Pending |  |
| 249 | Verify admin unauthorized redirects. | Pending |  |
| 250 | Test Google OAuth failure state. | Pending |  |
| 251 | Test backup recovery negative cases. | Pending |  |
| 252 | Test quote deduplication policy. | Pending |  |
| 253 | Check all referenced local assets exist. | Pending |  |
| 254 | Run catering menu data integrity checks. | Pending |  |
| 255 | Test browser console errors. | Pending |  |
| 256 | Add a visual screenshot baseline. | Pending |  |
| 257 | Assert critical security response headers. | Pending |  |
| 258 | Verify sitemap and robots endpoints. | Pending |  |
| 259 | Check Cloudflare Worker dry-run build. | Pending |  |
| 260 | Make deployment verification a blocking gate. | Pending |  |
| 261 | Add structured request IDs to backend logs. | Pending |  |
| 262 | Define availability service level metrics. | Pending |  |
| 263 | Record quotation submission error rates. | Pending |  |
| 264 | Alert on spikes in 5xx responses. | Pending |  |
| 265 | Report storage backend degradation. | Pending |  |
| 266 | Track upload rejection causes. | Pending |  |
| 267 | Add analytics consent strategy. | Pending |  |
| 268 | Publish zero-PII aggregated site metrics. | Pending |  |
| 269 | Monitor Cloudflare quota thresholds. | Pending |  |
| 270 | Show integration health in admin. | Pending |  |
| 271 | Add deployment version to admin footer. | Pending |  |
| 272 | Record job failure summaries. | Pending |  |
| 273 | Make production health probes repeatable. | Pending |  |
| 274 | Add database migration status checks. | Pending |  |
| 275 | Alert on failed OAuth flows without sensitive payloads. | Pending |  |
| 276 | Add dashboard data freshness hints. | Pending |  |
| 277 | Track major browser error signatures. | Pending |  |
| 278 | Audit log retention policy. | Pending |  |
| 279 | Provide incident contact escalation rules. | Pending |  |
| 280 | Add rollback runbook. | Pending |  |
| 281 | Add tailored government buyer landing page. | Integrated | government procurement landing page |
| 282 | Add institutional catering landing page. | Integrated | corporate catering landing page |
| 283 | Add office supply landing page. | Integrated | office supply landing page |
| 284 | Add cleaning and hygiene landing page. | Integrated | cleaning/hygiene landing page |
| 285 | Add FMCG supply landing page. | Integrated | FMCG supply landing page |
| 286 | Create request-for-quotation templates. | Pending |  |
| 287 | Add downloadable tender response checklist. | Integrated | print/save RFQ checklist |
| 288 | Offer repeat-order enquiry for returning buyers. | Pending |  |
| 289 | Add case studies once real projects are verified. | Pending |  |
| 290 | Add verified testimonial collection workflow. | Pending |  |
| 291 | Add referral enquiry field. | Pending |  |
| 292 | Build service-area coverage visualization. | Pending |  |
| 293 | Add multilingual landing-page option if supported. | Pending |  |
| 294 | Add accessible interactive service selector. | Integrated | interactive service navigation |
| 295 | Add optional WhatsApp contact link when approved. | Pending |  |
| 296 | Add calendar-assisted catering date selection. | Pending |  |
| 297 | Build quote request progress steps. | Pending |  |
| 298 | Add quote-status lookup with secure authorization. | Pending |  |
| 299 | Add user feedback collection after enquiries. | Pending |  |
| 300 | Add procurement knowledge-base articles. | Pending |  |

## Remaining work requiring special approval or testing

- Verified business credentials, delivery regions, service commitments, real customer reviews, supplier certifications and official quotes.
- Secure customer-facing quote status access, notification integration, privacy policies and reporting governance.
- Authorized end-to-end production/staging verification of RFQ uploads, D1/R2/KV, admin OAuth, MFA and recovery.
- Completion of remaining accessibility, design, animation and content tasks, with screenshots and manual acceptance.
- Deployment only after final CI passes and this draft PR is reviewed.
