# AMANTUSI — 300 VISUAL & FUNCTIONAL UPGRADES

This is a proposed, not-yet-implemented backlog tailored to the existing Cloudflare Worker, public procurement site, catering suite and admin/CMS. Prioritize reliability and conversions before optional 3D effects. Entries are recommendations, not claims of failures.

## Highest priority

1. Use the static-first optimized homepage as the canonical active home.
2. Keep secure RFQ submission and attachments functional.
3. Stabilize navigation, keyboard controls and responsive layouts.
4. Run public regression checks on every pull request.
5. Validate Google primary sign-in and recovery against a safe staging environment.

## 1. Brand and visual identity (#1–20)

1. Create a primary corporate design-token palette.
2. Establish dark-navy and warm-gold contrast variants.
3. Set typography scale for all heading levels.
4. Add a compact company credentials lockup.
5. Create a monochrome logo variant.
6. Standardize icon stroke widths.
7. Define border-radius tokens by component.
8. Replace decorative glyphs with coherent iconography.
9. Add light and dark logo usage rules.
10. Create a hero wordmark composition.
11. Add tasteful gold accent dividers.
12. Use a consistent 12-column grid.
13. Establish content maximum widths.
14. Design a consistent photography color grade.
15. Produce branded document thumbnail treatments.
16. Standardize card shadows and surfaces.
17. Create branded empty-state illustrations.
18. Define brand-safe animation durations.
19. Design a signature procurement motif.
20. Document accessible color combinations.

## 2. Homepage and storytelling (#21–40)

21. Add a succinct value proposition above the fold.
22. Show prominent government and private-sector buyer paths.
23. Add a service-category visual navigator.
24. Introduce a compact procurement journey diagram.
25. Add an RFQ request example.
26. Feature operational sectors served.
27. Include relevant procurement document previews.
28. Add a verified company credentials panel.
29. Add a dedicated catering callout.
30. Add a direct contact strip near the hero.
31. Add trust-building delivery workflow details.
32. Add a plain-language company mission section.
33. Provide a service availability qualifier.
34. Add prominent tender-specific CTA.
35. Surface contact turnaround policy if verified.
36. Show a structured enquiry preview.
37. Explain supplier sourcing methodology.
38. Add meaningful footer navigation.
39. Add company-profile download CTA.
40. Add related service discovery links.

## 3. Navigation and discoverability (#41–60)

41. Add breadcrumbs to secondary pages.
42. Highlight active navigation destinations.
43. Add keyboard-operable mobile menu dismissal.
44. Close mobile nav on outside interaction.
45. Restore menu focus after Escape.
46. Add a skip-to-content link.
47. Use consistent mobile menu button labels.
48. Add footer links to all public destinations.
49. Group catering pages under a clear parent label.
50. Add service-specific jump links.
51. Implement anchor offset for sticky header.
52. Prevent hidden-menu keyboard focus.
53. Add a sitemap link in the footer.
54. Provide a back-to-top control with clear label.
55. Add keyboard-visible focus styles.
56. Use descriptive link text instead of generic labels.
57. Add mobile sticky quote CTA where unobtrusive.
58. Ensure focus remains visible after route navigation.
59. Add navigation checks to CI.
60. Provide clear 404 navigation recovery.

## 4. Mobile and responsive layouts (#61–80)

61. Use a 320px narrow-screen regression baseline.
62. Test 375px common phone layout.
63. Test 768px tablet portrait layout.
64. Test 1024px tablet landscape layout.
65. Tune hero typography with CSS clamp.
66. Reduce large orb visuals on compact screens.
67. Prevent card grid horizontal overflow.
68. Guarantee touch targets of at least 44px.
69. Refine mobile quotation form spacing.
70. Preserve readable mobile legal credentials.
71. Adapt catering filters to horizontal swiping.
72. Optimize brochure typography for small screens.
73. Respect viewport safe-area insets.
74. Improve portrait and landscape navigation.
75. Use native date and telephone keyboards.
76. Reduce parallax on touch devices.
77. Disable hover-only affordances on mobile.
78. Test dynamic text enlargement.
79. Optimize section stacking and whitespace.
80. Verify no offscreen modal content.

## 5. Accessibility and inclusive UX (#81–100)

81. Audit keyboard navigation on every public page.
82. Ensure one primary h1 per page.
83. Create proper labels for uploaded files.
84. Add visible focus rings to all controls.
85. Add ARIA-expanded state to mobile toggles.
86. Validate landmark hierarchy.
87. Confirm meaningful alt text on information images.
88. Mark decorative images with empty alt text.
89. Add screen reader descriptions for loading states.
90. Use aria-atomic on form status.
91. Validate WCAG AA color contrast.
92. Respect reduced-motion settings.
93. Avoid animation-triggered focus changes.
94. Provide clear errors linked to form fields.
95. Verify labels survive placeholder disappearance.
96. Make accordion components keyboard operable.
97. Test zoom up to 200 percent.
98. Avoid color-only success/error indication.
99. Add accessible names to icon-only buttons.
100. Add automated accessibility tests.

## 6. Quote and RFQ conversion (#101–120)

101. Make direct secure RFQ submission default.
102. Show server-generated reference on success.
103. Allow up to five attached documents within limits.
104. Validate per-file and aggregate size in browser.
105. Explain accepted RFQ file formats.
106. Highlight required fields consistently.
107. Add optional line-item quantity capture.
108. Add delivery address guidance.
109. Add required-by date help text.
110. Add conditional tender reference fields.
111. Add catering guest-count input.
112. Add event date and venue fields.
113. Preserve form draft locally with consent.
114. Warn before discarding an unfinished request.
115. Display descriptive network error recovery.
116. Prevent accidental duplicate submission.
117. Show upload progress for large attachments.
118. Add post-submit next steps.
119. Offer an enquiry confirmation email when configured.
120. Add privacy notice beside submit.

## 7. Catering menu and portfolio (#121–140)

121. Add category filter count chips.
122. Support menu keyword search.
123. Add dietary tag filtering.
124. Display allergen information where verified.
125. Show portion or guest-count guidance.
126. Allow multi-item catering quote selection.
127. Add a sticky selected-items summary.
128. Offer gallery image keyboard controls.
129. Make gallery captions informative.
130. Add image placeholders while loading.
131. Use compressed responsive image variants.
132. Explain customization availability.
133. Add print-friendly menu version.
134. Feature corporate catering packages.
135. Add event-type selector.
136. Add mobile-friendly photo zoom.
137. Include platter ingredient examples where accurate.
138. Add catering enquiry hand-off confirmation.
139. Improve empty category messaging.
140. Add transparent indicative price policy.

## 8. Company profile and procurement trust (#141–160)

141. Create a downloadable capability statement.
142. Show registration number consistently.
143. Show CSD number consistently.
144. Create a supplier onboarding overview.
145. Explain scope of goods and services.
146. Add procurement service-area map.
147. Highlight document and specification handling.
148. Provide a formal contact-person pathway.
149. Offer a printable one-page company profile.
150. Include company address consistently.
151. Add verified certifications when available.
152. Avoid unverified accreditation claims.
153. Add service delivery process diagram.
154. Add public/private client suitability notes.
155. Add proof-of-delivery workflow explanation.
156. Include tender response checklist.
157. Add official document request mechanism.
158. Explain quotation terms expectations.
159. Add supplier relationship overview.
160. Add company profile version date.

## 9. Admin dashboard and CMS (#161–180)

161. Design compact KPI cards with explanatory labels.
162. Add dashboard empty states.
163. Add searchable lead lists.
164. Allow lead status filtering.
165. Add supplier category filters.
166. Add product record validation indicators.
167. Add quote lifecycle timeline.
168. Add sort controls to operations tables.
169. Add bulk selection only where authorized.
170. Add safe confirmation dialogs for destructive actions.
171. Expose last synchronization timestamp.
172. Add audit-log viewer with role checks.
173. Add admin loading skeletons.
174. Support constrained table layouts on mobile.
175. Add accessible toast announcements.
176. Add failed-operation retry UI.
177. Add content preview before publishing.
178. Add media library search.
179. Add admin help linked to current section.
180. Add protected export history.

## 10. Authentication and security UX (#181–200)

181. Keep Google OAuth as primary admin entry.
182. Display recovery path prominently.
183. Verify recovery page no-store headers.
184. Handle expired sessions with clear messaging.
185. Add explicit session-expired reauthentication.
186. Prevent admin routes from indexing.
187. Mask sensitive administrator fields.
188. Add accessible backup recovery instructions.
189. Rate-limit credential recovery attempts.
190. Avoid exposing account existence in recovery errors.
191. Show authentication method context.
192. Confirm OAuth callback error handling.
193. Test state and nonce verification.
194. Add CSRF protection assertions.
195. Add admin operation confirmation where needed.
196. Audit file upload MIME validation.
197. Apply safe filename sanitization.
198. Document privilege boundaries.
199. Add clear logout confirmation.
200. Add security regression tests.

## 11. Performance and effects (#201–220)

201. Keep static-first homepage rendering.
202. Lazily load optional animation modules.
203. Set device-specific animation budgets.
204. Disable complex effects under reduced motion.
205. Respect data saver preference.
206. Keep large canvas effects off low-end phones.
207. Replace decorative video with static poster when idle.
208. Use CSS containment for large sections.
209. Preload only essential hero assets.
210. Defer secondary page scripts.
211. Audit repeated animation frame loops.
212. Avoid global scroll interception.
213. Cap particle counts by viewport.
214. Use IntersectionObserver for offscreen effects.
215. Optimize SVG logo rendering.
216. Specify image width and height.
217. Minimize layout shifts.
218. Add performance budget CI checks.
219. Track Long Tasks in development.
220. Run Lighthouse desktop and mobile.

## 12. SEO and structured data (#221–240)

221. Set canonical URLs for public pages.
222. Ensure one descriptive title per page.
223. Write unique descriptions for catering pages.
224. Add appropriate organization JSON-LD.
225. Avoid duplicate structured-data injections.
226. Add FAQ schema only for visible verified FAQs.
227. Maintain a current sitemap.
228. Keep admin routes disallowed and noindexed.
229. Add Open Graph image artwork.
230. Set social share descriptions per page.
231. Create consistent heading hierarchy.
232. Avoid thin duplicate fast-page indexing.
233. Add descriptive image alt text for SEO.
234. Use meaningful internal links.
235. Verify sitemap page response codes.
236. Add structured postal address consistency checks.
237. Add breadcrumb structured data when appropriate.
238. Test social link previews.
239. Add language locale metadata.
240. Monitor broken internal links.

## 13. Reliability and quality assurance (#241–260)

241. Run syntax checks on all public JavaScript.
242. Test every documented public route.
243. Add local homepage smoke checks.
244. Add desktop browser regression suite.
245. Add mobile browser regression suite.
246. Validate RFQ happy path against test storage.
247. Validate failed RFQ payload handling.
248. Test attachment size rejection.
249. Verify admin unauthorized redirects.
250. Test Google OAuth failure state.
251. Test backup recovery negative cases.
252. Test quote deduplication policy.
253. Check all referenced local assets exist.
254. Run catering menu data integrity checks.
255. Test browser console errors.
256. Add a visual screenshot baseline.
257. Assert critical security response headers.
258. Verify sitemap and robots endpoints.
259. Check Cloudflare Worker dry-run build.
260. Make deployment verification a blocking gate.

## 14. Operations and observability (#261–280)

261. Add structured request IDs to backend logs.
262. Define availability service level metrics.
263. Record quotation submission error rates.
264. Alert on spikes in 5xx responses.
265. Report storage backend degradation.
266. Track upload rejection causes.
267. Add analytics consent strategy.
268. Publish zero-PII aggregated site metrics.
269. Monitor Cloudflare quota thresholds.
270. Show integration health in admin.
271. Add deployment version to admin footer.
272. Record job failure summaries.
273. Make production health probes repeatable.
274. Add database migration status checks.
275. Alert on failed OAuth flows without sensitive payloads.
276. Add dashboard data freshness hints.
277. Track major browser error signatures.
278. Audit log retention policy.
279. Provide incident contact escalation rules.
280. Add rollback runbook.

## 15. Growth and advanced features (#281–300)

281. Add tailored government buyer landing page.
282. Add institutional catering landing page.
283. Add office supply landing page.
284. Add cleaning and hygiene landing page.
285. Add FMCG supply landing page.
286. Create request-for-quotation templates.
287. Add downloadable tender response checklist.
288. Offer repeat-order enquiry for returning buyers.
289. Add case studies once real projects are verified.
290. Add verified testimonial collection workflow.
291. Add referral enquiry field.
292. Build service-area coverage visualization.
293. Add multilingual landing-page option if supported.
294. Add accessible interactive service selector.
295. Add optional WhatsApp contact link when approved.
296. Add calendar-assisted catering date selection.
297. Build quote request progress steps.
298. Add quote-status lookup with secure authorization.
299. Add user feedback collection after enquiries.
300. Add procurement knowledge-base articles.

