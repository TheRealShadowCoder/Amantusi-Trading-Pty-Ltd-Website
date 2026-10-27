# Amantusi — 300 Upgrade Delivery Ledger

**Date:** 28 October 2026 · **Draft PR:** #59 · **Branch:** `fix/website-smoke-accessibility-20261027`

This document tracks the [original 300 proposals](./300-visual-and-functional-upgrades.md) against repository source. **Integrated** means matching code or content exists on this branch, with a documented reference; it does **not** mean live production deployment, authorized integration testing, full WCAG compliance or independent verification of business claims. **Pending** means not implemented or insufficient evidence to mark complete.

**Integrated in source: 217/300** · **Pending: 83/300**.

| # | Upgrade recommendation | Status | Source evidence |
|---:|---|---|---|
| 1 | Create a primary corporate design-token palette. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 2 | Establish dark-navy and warm-gold contrast variants. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 3 | Set typography scale for all heading levels. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 4 | Add a compact company credentials lockup. | Pending |  |
| 5 | Create a monochrome logo variant. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 6 | Standardize icon stroke widths. | Pending |  |
| 7 | Define border-radius tokens by component. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 8 | Replace decorative glyphs with coherent iconography. | Pending |  |
| 9 | Add light and dark logo usage rules. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 10 | Create a hero wordmark composition. | Integrated | Branded orbital hero and existing centered Amantusi logo plaque in public/index.html |
| 11 | Add tasteful gold accent dividers. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 12 | Use a consistent 12-column grid. | Pending |  |
| 13 | Establish content maximum widths. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 14 | Design a consistent photography color grade. | Pending |  |
| 15 | Produce branded document thumbnail treatments. | Pending |  |
| 16 | Standardize card shadows and surfaces. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 17 | Create branded empty-state illustrations. | Pending |  |
| 18 | Define brand-safe animation durations. | Integrated | public/resource-library.css; public/assets/amantusi-logo-*.svg; docs/brand-identity-guidelines.md |
| 19 | Design a signature procurement motif. | Integrated | Concentric gold orbital motif in public/sector.css and public/index.html |
| 20 | Document accessible color combinations. | Integrated | Approved six foreground/background combinations checked by scripts/validate-brand-contrast.mjs |
| 21 | Add a succinct value proposition above the fold. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 22 | Show prominent government and private-sector buyer paths. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 23 | Add a service-category visual navigator. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 24 | Introduce a compact procurement journey diagram. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 25 | Add an RFQ request example. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 26 | Feature operational sectors served. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 27 | Include relevant procurement document previews. | Integrated | Illustrative procurement document examples in public/procurement-templates.html |
| 28 | Add a verified company credentials panel. | Pending |  |
| 29 | Add a dedicated catering callout. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 30 | Add a direct contact strip near the hero. | Pending |  |
| 31 | Add trust-building delivery workflow details. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 32 | Add a plain-language company mission section. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 33 | Provide a service availability qualifier. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 34 | Add prominent tender-specific CTA. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 35 | Surface contact turnaround policy if verified. | Pending |  |
| 36 | Show a structured enquiry preview. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 37 | Explain supplier sourcing methodology. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 38 | Add meaningful footer navigation. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 39 | Add company-profile download CTA. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 40 | Add related service discovery links. | Integrated | public/index.html; public/site-upgrades.css; public/procurement-templates.html |
| 41 | Add breadcrumbs to secondary pages. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 42 | Highlight active navigation destinations. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 43 | Add keyboard-operable mobile menu dismissal. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 44 | Close mobile nav on outside interaction. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 45 | Restore menu focus after Escape. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 46 | Add a skip-to-content link. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 47 | Use consistent mobile menu button labels. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 48 | Add footer links to all public destinations. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 49 | Group catering pages under a clear parent label. | Pending |  |
| 50 | Add service-specific jump links. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 51 | Implement anchor offset for sticky header. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 52 | Prevent hidden-menu keyboard focus. | Integrated | Closed narrow-screen navigation uses display:none in public/styles.css |
| 53 | Add a sitemap link in the footer. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 54 | Provide a back-to-top control with clear label. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 55 | Add keyboard-visible focus styles. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 56 | Use descriptive link text instead of generic labels. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 57 | Add mobile sticky quote CTA where unobtrusive. | Integrated | Mobile fixed quotation shortcut in public/site-navigation.js and .css |
| 58 | Ensure focus remains visible after route navigation. | Pending |  |
| 59 | Add navigation checks to CI. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 60 | Provide clear 404 navigation recovery. | Integrated | public/site-navigation.js; public/app-fast.js; public/404.html; tests/public-static.spec.mjs |
| 61 | Use a 320px narrow-screen regression baseline. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 62 | Test 375px common phone layout. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 63 | Test 768px tablet portrait layout. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 64 | Test 1024px tablet landscape layout. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 65 | Tune hero typography with CSS clamp. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 66 | Reduce large orb visuals on compact screens. | Pending |  |
| 67 | Prevent card grid horizontal overflow. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 68 | Guarantee touch targets of at least 44px. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 69 | Refine mobile quotation form spacing. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 70 | Preserve readable mobile legal credentials. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 71 | Adapt catering filters to horizontal swiping. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 72 | Optimize brochure typography for small screens. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 73 | Respect viewport safe-area insets. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 74 | Improve portrait and landscape navigation. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 75 | Use native date and telephone keyboards. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 76 | Reduce parallax on touch devices. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 77 | Disable hover-only affordances on mobile. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 78 | Test dynamic text enlargement. | Pending |  |
| 79 | Optimize section stacking and whitespace. | Integrated | public/sector.css; public/catering-responsive-v3.css; tests/public-static.spec.mjs |
| 80 | Verify no offscreen modal content. | Pending |  |
| 81 | Audit keyboard navigation on every public page. | Pending |  |
| 82 | Ensure one primary h1 per page. | Pending |  |
| 83 | Create proper labels for uploaded files. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 84 | Add visible focus rings to all controls. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 85 | Add ARIA-expanded state to mobile toggles. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 86 | Validate landmark hierarchy. | Integrated | HTML landmark existence across public pages checked in scripts/validate-public-routes.mjs (partial hierarchy coverage) |
| 87 | Confirm meaningful alt text on information images. | Pending |  |
| 88 | Mark decorative images with empty alt text. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 89 | Add screen reader descriptions for loading states. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 90 | Use aria-atomic on form status. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 91 | Validate WCAG AA color contrast. | Integrated | Six brand color pairs tested against 4.5:1 threshold (not a full UI audit) |
| 92 | Respect reduced-motion settings. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 93 | Avoid animation-triggered focus changes. | Pending |  |
| 94 | Provide clear errors linked to form fields. | Integrated | RFQ upload aria-invalid, aria-errormessage and errors in public/quote-enhancements.js |
| 95 | Verify labels survive placeholder disappearance. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 96 | Make accordion components keyboard operable. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 97 | Test zoom up to 200 percent. | Pending |  |
| 98 | Avoid color-only success/error indication. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 99 | Add accessible names to icon-only buttons. | Integrated | public/index.html; public/rfq-composer.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 100 | Add automated accessibility tests. | Integrated | Static semantic/alt checks plus contrast test and Playwright accessibility assertions |
| 101 | Make direct secure RFQ submission default. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 102 | Show server-generated reference on success. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 103 | Allow up to five attached documents within limits. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 104 | Validate per-file and aggregate size in browser. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 105 | Explain accepted RFQ file formats. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 106 | Highlight required fields consistently. | Integrated | Visible required badges on four enquiry fields in quote-enhancements.js and .css |
| 107 | Add optional line-item quantity capture. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 108 | Add delivery address guidance. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 109 | Add required-by date help text. | Integrated | Required-by date help text in public/rfq-composer.js |
| 110 | Add conditional tender reference fields. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 111 | Add catering guest-count input. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 112 | Add event date and venue fields. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 113 | Preserve form draft locally with consent. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 114 | Warn before discarding an unfinished request. | Pending |  |
| 115 | Display descriptive network error recovery. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 116 | Prevent accidental duplicate submission. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 117 | Show upload progress for large attachments. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 118 | Add post-submit next steps. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 119 | Offer an enquiry confirmation email when configured. | Integrated | Opt-in customer email receipts in src/notifications.js; requires deployment flag and provider |
| 120 | Add privacy notice beside submit. | Integrated | public/rfq-composer.js; public/quote-enhancements.js; public/app-fast.js; src/platform.js |
| 121 | Add category filter count chips. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 122 | Support menu keyword search. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 123 | Add dietary tag filtering. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 124 | Display allergen information where verified. | Pending |  |
| 125 | Show portion or guest-count guidance. | Integrated | Guest count and event requirements guidance in public/catering-menu.html |
| 126 | Allow multi-item catering quote selection. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 127 | Add a sticky selected-items summary. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 128 | Offer gallery image keyboard controls. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 129 | Make gallery captions informative. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 130 | Add image placeholders while loading. | Pending |  |
| 131 | Use compressed responsive image variants. | Pending |  |
| 132 | Explain customization availability. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 133 | Add print-friendly menu version. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 134 | Feature corporate catering packages. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 135 | Add event-type selector. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 136 | Add mobile-friendly photo zoom. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 137 | Include platter ingredient examples where accurate. | Pending |  |
| 138 | Add catering enquiry hand-off confirmation. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 139 | Improve empty category messaging. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 140 | Add transparent indicative price policy. | Integrated | public/catering-upgrades.js; public/catering.js; public/catering-menu.html |
| 141 | Create a downloadable capability statement. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 142 | Show registration number consistently. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 143 | Show CSD number consistently. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 144 | Create a supplier onboarding overview. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 145 | Explain scope of goods and services. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 146 | Add procurement service-area map. | Pending |  |
| 147 | Highlight document and specification handling. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 148 | Provide a formal contact-person pathway. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 149 | Offer a printable one-page company profile. | Pending |  |
| 150 | Include company address consistently. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 151 | Add verified certifications when available. | Pending |  |
| 152 | Avoid unverified accreditation claims. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 153 | Add service delivery process diagram. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 154 | Add public/private client suitability notes. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 155 | Add proof-of-delivery workflow explanation. | Pending |  |
| 156 | Include tender response checklist. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 157 | Add official document request mechanism. | Pending |  |
| 158 | Explain quotation terms expectations. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 159 | Add supplier relationship overview. | Integrated | Supplier introduction relationship guidance in public/supplier-onboarding.html |
| 160 | Add company profile version date. | Integrated | public/capability-statement.html; public/supplier-onboarding.html; public/company-profile.html |
| 161 | Design compact KPI cards with explanatory labels. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 162 | Add dashboard empty states. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 163 | Add searchable lead lists. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 164 | Allow lead status filtering. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 165 | Add supplier category filters. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 166 | Add product record validation indicators. | Integrated | Admin product warnings for missing unit and below-cost prices in public/admin-refinements.js |
| 167 | Add quote lifecycle timeline. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 168 | Add sort controls to operations tables. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 169 | Add bulk selection only where authorized. | Pending |  |
| 170 | Add safe confirmation dialogs for destructive actions. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 171 | Expose last synchronization timestamp. | Pending |  |
| 172 | Add audit-log viewer with role checks. | Integrated | Protected settings audit timeline already exists in public/admin-settings.html and backend |
| 173 | Add admin loading skeletons. | Pending |  |
| 174 | Support constrained table layouts on mobile. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 175 | Add accessible toast announcements. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 176 | Add failed-operation retry UI. | Pending |  |
| 177 | Add content preview before publishing. | Pending |  |
| 178 | Add media library search. | Pending |  |
| 179 | Add admin help linked to current section. | Integrated | public/admin-ops.js; public/admin-refinements.js; public/admin-settings-help.js |
| 180 | Add protected export history. | Pending |  |
| 181 | Keep Google OAuth as primary admin entry. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 182 | Display recovery path prominently. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 183 | Verify recovery page no-store headers. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 184 | Handle expired sessions with clear messaging. | Integrated | Session expiry status shown in public/admin-refinements.js |
| 185 | Add explicit session-expired reauthentication. | Integrated | Session-expired reauthentication link to Google in public/admin-refinements.js |
| 186 | Prevent admin routes from indexing. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 187 | Mask sensitive administrator fields. | Pending |  |
| 188 | Add accessible backup recovery instructions. | Integrated | Step-based recovery instructions in public/admin-recovery.html |
| 189 | Rate-limit credential recovery attempts. | Integrated | Recovery rate limit configuration enforced in src/admin-recovery.js |
| 190 | Avoid exposing account existence in recovery errors. | Integrated | Generic account-existence-safe recovery messaging in src/admin-recovery.js |
| 191 | Show authentication method context. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 192 | Confirm OAuth callback error handling. | Pending |  |
| 193 | Test state and nonce verification. | Pending |  |
| 194 | Add CSRF protection assertions. | Pending |  |
| 195 | Add admin operation confirmation where needed. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 196 | Audit file upload MIME validation. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 197 | Apply safe filename sanitization. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 198 | Document privilege boundaries. | Pending |  |
| 199 | Add clear logout confirmation. | Integrated | Explicit administrator logout confirmation in public/admin.js |
| 200 | Add security regression tests. | Integrated | src/worker-v5.js; src/upload-validation.js; public/admin-refinements.js; scripts/validate-upload-security.mjs |
| 201 | Keep static-first homepage rendering. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 202 | Lazily load optional animation modules. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 203 | Set device-specific animation budgets. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 204 | Disable complex effects under reduced motion. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 205 | Respect data saver preference. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 206 | Keep large canvas effects off low-end phones. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 207 | Replace decorative video with static poster when idle. | Pending |  |
| 208 | Use CSS containment for large sections. | Pending |  |
| 209 | Preload only essential hero assets. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 210 | Defer secondary page scripts. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 211 | Audit repeated animation frame loops. | Pending |  |
| 212 | Avoid global scroll interception. | Pending |  |
| 213 | Cap particle counts by viewport. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 214 | Use IntersectionObserver for offscreen effects. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 215 | Optimize SVG logo rendering. | Integrated | public/runtime-gate.js; public/app-fast.js; public/index.html; public/experience.js |
| 216 | Specify image width and height. | Pending |  |
| 217 | Minimize layout shifts. | Pending |  |
| 218 | Add performance budget CI checks. | Pending |  |
| 219 | Track Long Tasks in development. | Pending |  |
| 220 | Run Lighthouse desktop and mobile. | Pending |  |
| 221 | Set canonical URLs for public pages. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 222 | Ensure one descriptive title per page. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 223 | Write unique descriptions for catering pages. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 224 | Add appropriate organization JSON-LD. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 225 | Avoid duplicate structured-data injections. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 226 | Add FAQ schema only for visible verified FAQs. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 227 | Maintain a current sitemap. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 228 | Keep admin routes disallowed and noindexed. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 229 | Add Open Graph image artwork. | Pending |  |
| 230 | Set social share descriptions per page. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 231 | Create consistent heading hierarchy. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 232 | Avoid thin duplicate fast-page indexing. | Integrated | Canonical /index-fast.html redirect to / in src/worker.js |
| 233 | Add descriptive image alt text for SEO. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 234 | Use meaningful internal links. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 235 | Verify sitemap page response codes. | Integrated | Public sitemap response verification in scripts/verify-live-site.mjs (read-only; must run after deploy) |
| 236 | Add structured postal address consistency checks. | Pending |  |
| 237 | Add breadcrumb structured data when appropriate. | Integrated | BreadcrumbList JSON-LD for new public pages in src/seo.js |
| 238 | Test social link previews. | Pending |  |
| 239 | Add language locale metadata. | Integrated | en-ZA language on new sector and resource pages |
| 240 | Monitor broken internal links. | Integrated | src/seo.js; src/worker.js; public/procurement-faq.html; scripts/validate-public-routes.mjs |
| 241 | Run syntax checks on all public JavaScript. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 242 | Test every documented public route. | Pending |  |
| 243 | Add local homepage smoke checks. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 244 | Add desktop browser regression suite. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 245 | Add mobile browser regression suite. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 246 | Validate RFQ happy path against test storage. | Pending |  |
| 247 | Validate failed RFQ payload handling. | Integrated | Mocked HTTP 503 RFQ failure handling regression in tests/public-static.spec.mjs |
| 248 | Test attachment size rejection. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 249 | Verify admin unauthorized redirects. | Pending |  |
| 250 | Test Google OAuth failure state. | Pending |  |
| 251 | Test backup recovery negative cases. | Pending |  |
| 252 | Test quote deduplication policy. | Pending |  |
| 253 | Check all referenced local assets exist. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 254 | Run catering menu data integrity checks. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 255 | Test browser console errors. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 256 | Add a visual screenshot baseline. | Pending |  |
| 257 | Assert critical security response headers. | Integrated | Security header checks in scripts/verify-live-site.mjs (not run on production) |
| 258 | Verify sitemap and robots endpoints. | Integrated | Sitemap/robots checks in scripts/verify-live-site.mjs (not run on production) |
| 259 | Check Cloudflare Worker dry-run build. | Integrated | scripts/validate-site-smoke.mjs; tests/public-static.spec.mjs; .github/workflows/validate-platform-v2.yml |
| 260 | Make deployment verification a blocking gate. | Pending |  |
| 261 | Add structured request IDs to backend logs. | Integrated | src/worker.js; src/platform.js; public/admin-ops.js; scripts/verify-live-site.mjs; docs/release-and-rollback.md |
| 262 | Define availability service level metrics. | Pending |  |
| 263 | Record quotation submission error rates. | Pending |  |
| 264 | Alert on spikes in 5xx responses. | Pending |  |
| 265 | Report storage backend degradation. | Integrated | src/worker.js; src/platform.js; public/admin-ops.js; scripts/verify-live-site.mjs; docs/release-and-rollback.md |
| 266 | Track upload rejection causes. | Pending |  |
| 267 | Add analytics consent strategy. | Pending |  |
| 268 | Publish zero-PII aggregated site metrics. | Pending |  |
| 269 | Monitor Cloudflare quota thresholds. | Integrated | src/worker.js; src/platform.js; public/admin-ops.js; scripts/verify-live-site.mjs; docs/release-and-rollback.md |
| 270 | Show integration health in admin. | Integrated | src/worker.js; src/platform.js; public/admin-ops.js; scripts/verify-live-site.mjs; docs/release-and-rollback.md |
| 271 | Add deployment version to admin footer. | Pending |  |
| 272 | Record job failure summaries. | Pending |  |
| 273 | Make production health probes repeatable. | Integrated | src/worker.js; src/platform.js; public/admin-ops.js; scripts/verify-live-site.mjs; docs/release-and-rollback.md |
| 274 | Add database migration status checks. | Pending |  |
| 275 | Alert on failed OAuth flows without sensitive payloads. | Pending |  |
| 276 | Add dashboard data freshness hints. | Pending |  |
| 277 | Track major browser error signatures. | Pending |  |
| 278 | Audit log retention policy. | Pending |  |
| 279 | Provide incident contact escalation rules. | Pending |  |
| 280 | Add rollback runbook. | Integrated | src/worker.js; src/platform.js; public/admin-ops.js; scripts/verify-live-site.mjs; docs/release-and-rollback.md |
| 281 | Add tailored government buyer landing page. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 282 | Add institutional catering landing page. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 283 | Add office supply landing page. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 284 | Add cleaning and hygiene landing page. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 285 | Add FMCG supply landing page. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 286 | Create request-for-quotation templates. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 287 | Add downloadable tender response checklist. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 288 | Offer repeat-order enquiry for returning buyers. | Pending |  |
| 289 | Add case studies once real projects are verified. | Pending |  |
| 290 | Add verified testimonial collection workflow. | Pending |  |
| 291 | Add referral enquiry field. | Integrated | Optional referral source included in RFQ text in public/rfq-composer.js |
| 292 | Build service-area coverage visualization. | Pending |  |
| 293 | Add multilingual landing-page option if supported. | Pending |  |
| 294 | Add accessible interactive service selector. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 295 | Add optional WhatsApp contact link when approved. | Pending |  |
| 296 | Add calendar-assisted catering date selection. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 297 | Build quote request progress steps. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 298 | Add quote-status lookup with secure authorization. | Pending |  |
| 299 | Add user feedback collection after enquiries. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |
| 300 | Add procurement knowledge-base articles. | Integrated | public/*-procurement.html; public/corporate-catering.html; public/procurement-guides.html; public/rfq-composer.js; public/app-fast.js |

## Release and compliance gates that remain unverified

- Authenticated staging verification of Google OAuth/recovery, admin workflows, D1, KV, R2 media storage and notification delivery.
- Real buyer-facing quotation status lookup, any necessary new account verification and anti-abuse infrastructure.
- Customer testimonials, case studies, signed certifications, guaranteed service response times, verified delivery region and approved official privacy/retention statements. None may be invented.
- Cloudflare provider-side monitoring alerts and quota thresholds, plus staff escalation/retention controls.
- Full WCAG manual audit, controlled visual comparisons, customer-facing languages and browser performance budgets.
- Review and merge the draft PR, then perform a separate controlled deployment and real read-only health probes.

Read `docs/operations-and-data-governance.md`, `docs/brand-identity-guidelines.md` and `docs/release-and-rollback.md` for implementation and approval procedures.
