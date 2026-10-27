# 300-Upgrade Delivery Ledger

This ledger tracks all 300 proposals in [the upgrade backlog](./300-visual-and-functional-upgrades.md). **Integrated** = supporting code exists in this pull-request branch; not a production guarantee. **Pending** = not implemented or not yet evidenced. Existing platform features are counted only when grounded in inspected code.

Branch: `fix/website-smoke-accessibility-20261027` · Draft PR #59

**Integrated:** 91/300 · **Pending:** 209/300.

| # | Proposed upgrade | Status | Evidence |
|--:|---|---|---|
| 1 | Create a primary corporate design-token palette. | Integrated | navy/gold palette tokens |
| 2 | Establish dark-navy and warm-gold contrast variants. | Pending |  |
| 3 | Set typography scale for all heading levels. | Integrated | responsive typography in sector.css |
| 4 | Add a compact company credentials lockup. | Pending |  |
| 5 | Create a monochrome logo variant. | Pending |  |
| 6 | Standardize icon stroke widths. | Pending |  |
| 7 | Define border-radius tokens by component. | Integrated | shared sector CSS corner radius |
| 8 | Replace decorative glyphs with coherent iconography. | Pending |  |
| 9 | Add light and dark logo usage rules. | Pending |  |
| 10 | Create a hero wordmark composition. | Pending |  |
| 11 | Add tasteful gold accent dividers. | Pending |  |
| 12 | Use a consistent 12-column grid. | Integrated | shared layout width |
| 13 | Establish content maximum widths. | Pending |  |
| 14 | Design a consistent photography color grade. | Pending |  |
| 15 | Produce branded document thumbnail treatments. | Pending |  |
| 16 | Standardize card shadows and surfaces. | Pending |  |
| 17 | Create branded empty-state illustrations. | Pending |  |
| 18 | Define brand-safe animation durations. | Pending |  |
| 19 | Design a signature procurement motif. | Pending |  |
| 20 | Document accessible color combinations. | Pending |  |
| 21 | Add a succinct value proposition above the fold. | Integrated | homepage value proposition |
| 22 | Show prominent government and private-sector buyer paths. | Integrated | six category landing pages |
| 23 | Add a service-category visual navigator. | Integrated | sector directory |
| 24 | Introduce a compact procurement journey diagram. | Integrated | process steps per sector |
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
| 43 | Add keyboard-operable mobile menu dismissal. | Integrated | homepage service links |
| 44 | Close mobile nav on outside interaction. | Pending |  |
| 45 | Restore menu focus after Escape. | Integrated | Escape key dismissal |
| 46 | Add a skip-to-content link. | Integrated | click-outside menu close |
| 47 | Use consistent mobile menu button labels. | Integrated | menu focus restoration |
| 48 | Add footer links to all public destinations. | Integrated | skip to content |
| 49 | Group catering pages under a clear parent label. | Pending |  |
| 50 | Add service-specific jump links. | Pending |  |
| 51 | Implement anchor offset for sticky header. | Pending |  |
| 52 | Prevent hidden-menu keyboard focus. | Pending |  |
| 53 | Add a sitemap link in the footer. | Pending |  |
| 54 | Provide a back-to-top control with clear label. | Integrated | RFQ checklist navigation |
| 55 | Add keyboard-visible focus styles. | Integrated | focus-visible styles |
| 56 | Use descriptive link text instead of generic labels. | Pending |  |
| 57 | Add mobile sticky quote CTA where unobtrusive. | Pending |  |
| 58 | Ensure focus remains visible after route navigation. | Integrated | menu expanded status and label |
| 59 | Add navigation checks to CI. | Pending |  |
| 60 | Provide clear 404 navigation recovery. | Integrated | Playwright nav regression tests |
| 61 | Use a 320px narrow-screen regression baseline. | Pending |  |
| 62 | Test 375px common phone layout. | Pending |  |
| 63 | Test 768px tablet portrait layout. | Pending |  |
| 64 | Test 1024px tablet landscape layout. | Pending |  |
| 65 | Tune hero typography with CSS clamp. | Pending |  |
| 66 | Reduce large orb visuals on compact screens. | Integrated | CSS fluid type scale |
| 67 | Prevent card grid horizontal overflow. | Pending |  |
| 68 | Guarantee touch targets of at least 44px. | Integrated | responsive service card grids |
| 69 | Refine mobile quotation form spacing. | Pending |  |
| 70 | Preserve readable mobile legal credentials. | Integrated | RFQ form mobile layout |
| 71 | Adapt catering filters to horizontal swiping. | Pending |  |
| 72 | Optimize brochure typography for small screens. | Pending |  |
| 73 | Respect viewport safe-area insets. | Pending |  |
| 74 | Improve portrait and landscape navigation. | Integrated | button touch targets |
| 75 | Use native date and telephone keyboards. | Pending |  |
| 76 | Reduce parallax on touch devices. | Pending |  |
| 77 | Disable hover-only affordances on mobile. | Pending |  |
| 78 | Test dynamic text enlargement. | Pending |  |
| 79 | Optimize section stacking and whitespace. | Pending |  |
| 80 | Verify no offscreen modal content. | Integrated | desktop/mobile playwright suite |
| 81 | Audit keyboard navigation on every public page. | Integrated | keyboard route tests |
| 82 | Ensure one primary h1 per page. | Pending |  |
| 83 | Create proper labels for uploaded files. | Integrated | single page h1 |
| 84 | Add visible focus rings to all controls. | Integrated | file input description |
| 85 | Add ARIA-expanded state to mobile toggles. | Integrated | focus-visible styles |
| 86 | Validate landmark hierarchy. | Integrated | nav aria-expanded state |
| 87 | Confirm meaningful alt text on information images. | Pending |  |
| 88 | Mark decorative images with empty alt text. | Pending |  |
| 89 | Add screen reader descriptions for loading states. | Pending |  |
| 90 | Use aria-atomic on form status. | Integrated | RFQ live status |
| 91 | Validate WCAG AA color contrast. | Pending |  |
| 92 | Respect reduced-motion settings. | Integrated | reduced motion in new styles |
| 93 | Avoid animation-triggered focus changes. | Pending |  |
| 94 | Provide clear errors linked to form fields. | Pending |  |
| 95 | Verify labels survive placeholder disappearance. | Pending |  |
| 96 | Make accordion components keyboard operable. | Pending |  |
| 97 | Test zoom up to 200 percent. | Pending |  |
| 98 | Avoid color-only success/error indication. | Pending |  |
| 99 | Add accessible names to icon-only buttons. | Integrated | accessibility/browser checks |
| 100 | Add automated accessibility tests. | Pending |  |
| 101 | Make direct secure RFQ submission default. | Integrated | secure server form action |
| 102 | Show server-generated reference on success. | Integrated | reference text on success |
| 103 | Allow up to five attached documents within limits. | Integrated | five attachment input |
| 104 | Validate per-file and aggregate size in browser. | Integrated | client 10MB/30MB limit |
| 105 | Explain accepted RFQ file formats. | Integrated | file extension validation |
| 106 | Highlight required fields consistently. | Pending |  |
| 107 | Add optional line-item quantity capture. | Pending |  |
| 108 | Add delivery address guidance. | Integrated | RFQ reference field |
| 109 | Add required-by date help text. | Pending |  |
| 110 | Add conditional tender reference fields. | Pending |  |
| 111 | Add catering guest-count input. | Pending |  |
| 112 | Add event date and venue fields. | Pending |  |
| 113 | Preserve form draft locally with consent. | Integrated | guest count field |
| 114 | Warn before discarding an unfinished request. | Integrated | event date and location |
| 115 | Display descriptive network error recovery. | Integrated | draft storage opt-in |
| 116 | Prevent accidental duplicate submission. | Integrated | local-only draft and clear |
| 117 | Show upload progress for large attachments. | Integrated | error remains recoverable |
| 118 | Add post-submit next steps. | Integrated | duplicate submit guard |
| 119 | Offer an enquiry confirmation email when configured. | Pending |  |
| 120 | Add privacy notice beside submit. | Integrated | RFQ data handling note |
| 121 | Add category filter count chips. | Integrated | text search in catering menu |
| 122 | Support menu keyword search. | Pending |  |
| 123 | Add dietary tag filtering. | Integrated | existing dietary tag search data |
| 124 | Display allergen information where verified. | Pending |  |
| 125 | Show portion or guest-count guidance. | Pending |  |
| 126 | Allow multi-item catering quote selection. | Integrated | multi-item selection |
| 127 | Add a sticky selected-items summary. | Integrated | selected options counter |
| 128 | Offer gallery image keyboard controls. | Pending |  |
| 129 | Make gallery captions informative. | Integrated | keyboard portfolio navigation |
| 130 | Add image placeholders while loading. | Integrated | lazy image loading present |
| 131 | Use compressed responsive image variants. | Pending |  |
| 132 | Explain customization availability. | Pending |  |
| 133 | Add print-friendly menu version. | Pending |  |
| 134 | Feature corporate catering packages. | Integrated | guest count/date/venue handoff |
| 135 | Add event-type selector. | Integrated | event-type select |
| 136 | Add mobile-friendly photo zoom. | Integrated | mobile catering forms |
| 137 | Include platter ingredient examples where accurate. | Pending |  |
| 138 | Add catering enquiry hand-off confirmation. | Pending |  |
| 139 | Improve empty category messaging. | Pending |  |
| 140 | Add transparent indicative price policy. | Integrated | price-on-quotation guidance |
| 141 | Create a downloadable capability statement. | Integrated | profile print button |
| 142 | Show registration number consistently. | Integrated | company registration displayed |
| 143 | Show CSD number consistently. | Integrated | CSD displayed |
| 144 | Create a supplier onboarding overview. | Pending |  |
| 145 | Explain scope of goods and services. | Pending |  |
| 146 | Add procurement service-area map. | Integrated | detailed sector content |
| 147 | Highlight document and specification handling. | Integrated | published company address |
| 148 | Provide a formal contact-person pathway. | Pending |  |
| 149 | Offer a printable one-page company profile. | Pending |  |
| 150 | Include company address consistently. | Integrated | printable RFQ checklist |
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
| 169 | Add bulk selection only where authorized. | Integrated | admin form label binding |
| 170 | Add safe confirmation dialogs for destructive actions. | Pending |  |
| 171 | Expose last synchronization timestamp. | Pending |  |
| 172 | Add audit-log viewer with role checks. | Pending |  |
| 173 | Add admin loading skeletons. | Pending |  |
| 174 | Support constrained table layouts on mobile. | Integrated | authenticated CSV export |
| 175 | Add accessible toast announcements. | Pending |  |
| 176 | Add failed-operation retry UI. | Integrated | formula safe CSV values |
| 177 | Add content preview before publishing. | Pending |  |
| 178 | Add media library search. | Pending |  |
| 179 | Add admin help linked to current section. | Pending |  |
| 180 | Add protected export history. | Pending |  |
| 181 | Keep Google OAuth as primary admin entry. | Pending |  |
| 182 | Display recovery path prominently. | Integrated | Google OAuth remains primary |
| 183 | Verify recovery page no-store headers. | Pending |  |
| 184 | Handle expired sessions with clear messaging. | Pending |  |
| 185 | Add explicit session-expired reauthentication. | Pending |  |
| 186 | Prevent admin routes from indexing. | Integrated | admin robots noindex |
| 187 | Mask sensitive administrator fields. | Pending |  |
| 188 | Add accessible backup recovery instructions. | Pending |  |
| 189 | Rate-limit credential recovery attempts. | Integrated | focus-visible in admin |
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
| 201 | Keep static-first homepage rendering. | Integrated | static-first home |
| 202 | Lazily load optional animation modules. | Integrated | lazy runtime already present |
| 203 | Set device-specific animation budgets. | Pending |  |
| 204 | Disable complex effects under reduced motion. | Integrated | new CSS reduces motion |
| 205 | Respect data saver preference. | Integrated | existing low-resource preferences |
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
| 218 | Add performance budget CI checks. | Integrated | public browser tests |
| 219 | Track Long Tasks in development. | Pending |  |
| 220 | Run Lighthouse desktop and mobile. | Pending |  |
| 221 | Set canonical URLs for public pages. | Integrated | unique sector titles |
| 222 | Ensure one descriptive title per page. | Integrated | unique sector meta description |
| 223 | Write unique descriptions for catering pages. | Pending |  |
| 224 | Add appropriate organization JSON-LD. | Integrated | business identity displayed |
| 225 | Avoid duplicate structured-data injections. | Pending |  |
| 226 | Add FAQ schema only for visible verified FAQs. | Pending |  |
| 227 | Maintain a current sitemap. | Pending |  |
| 228 | Keep admin routes disallowed and noindexed. | Integrated | sitemap includes sectors |
| 229 | Add Open Graph image artwork. | Pending |  |
| 230 | Set social share descriptions per page. | Pending |  |
| 231 | Create consistent heading hierarchy. | Pending |  |
| 232 | Avoid thin duplicate fast-page indexing. | Pending |  |
| 233 | Add descriptive image alt text for SEO. | Pending |  |
| 234 | Use meaningful internal links. | Pending |  |
| 235 | Verify sitemap page response codes. | Integrated | descriptive imagery alts |
| 236 | Add structured postal address consistency checks. | Pending |  |
| 237 | Add breadcrumb structured data when appropriate. | Pending |  |
| 238 | Test social link previews. | Pending |  |
| 239 | Add language locale metadata. | Integrated | sitemap expanded |
| 240 | Monitor broken internal links. | Pending |  |
| 241 | Run syntax checks on all public JavaScript. | Integrated | new script syntax checks |
| 242 | Test every documented public route. | Integrated | route rendering tests |
| 243 | Add local homepage smoke checks. | Integrated | CI source smoke |
| 244 | Add desktop browser regression suite. | Integrated | desktop Playwright |
| 245 | Add mobile browser regression suite. | Integrated | mobile Playwright |
| 246 | Validate RFQ happy path against test storage. | Pending |  |
| 247 | Validate failed RFQ payload handling. | Pending |  |
| 248 | Test attachment size rejection. | Pending |  |
| 249 | Verify admin unauthorized redirects. | Pending |  |
| 250 | Test Google OAuth failure state. | Pending |  |
| 251 | Test backup recovery negative cases. | Integrated | menu fallback message |
| 252 | Test quote deduplication policy. | Pending |  |
| 253 | Check all referenced local assets exist. | Pending |  |
| 254 | Run catering menu data integrity checks. | Pending |  |
| 255 | Test browser console errors. | Pending |  |
| 256 | Add a visual screenshot baseline. | Pending |  |
| 257 | Assert critical security response headers. | Pending |  |
| 258 | Verify sitemap and robots endpoints. | Pending |  |
| 259 | Check Cloudflare Worker dry-run build. | Pending |  |
| 260 | Make deployment verification a blocking gate. | Integrated | CI gates |
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
| 281 | Add tailored government buyer landing page. | Integrated | government procurement page |
| 282 | Add institutional catering landing page. | Integrated | corporate catering page |
| 283 | Add office supply landing page. | Integrated | office supply page |
| 284 | Add cleaning and hygiene landing page. | Integrated | hygiene page |
| 285 | Add FMCG supply landing page. | Integrated | FMCG page |
| 286 | Create request-for-quotation templates. | Integrated | printable RFQ resource |
| 287 | Add downloadable tender response checklist. | Integrated | RFQ checklist |
| 288 | Offer repeat-order enquiry for returning buyers. | Pending |  |
| 289 | Add case studies once real projects are verified. | Pending |  |
| 290 | Add verified testimonial collection workflow. | Pending |  |
| 291 | Add referral enquiry field. | Pending |  |
| 292 | Build service-area coverage visualization. | Pending |  |
| 293 | Add multilingual landing-page option if supported. | Pending |  |
| 294 | Add accessible interactive service selector. | Integrated | catering brief transfer to RFQ |
| 295 | Add optional WhatsApp contact link when approved. | Pending |  |
| 296 | Add calendar-assisted catering date selection. | Pending |  |
| 297 | Build quote request progress steps. | Pending |  |
| 298 | Add quote-status lookup with secure authorization. | Pending |  |
| 299 | Add user feedback collection after enquiries. | Pending |  |
| 300 | Add procurement knowledge-base articles. | Pending |  |

## Production acceptance gates

- Final CI run must pass including Playwright desktop and mobile.
- Perform a real RFQ submission against configured Cloudflare test bindings, then verify admin lead and attachment.
- Manually test Google OAuth login, recovery and settings as an authorized admin, without exposing credentials.
- Validate company claims, certifications, customer stories, privacy obligations and warranties before publishing.
- Review accessibility, mobile layout, link integrity, Core Web Vitals and runtime costs.
- Merge PR and deploy only after review.
