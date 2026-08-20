# Amantusi Cost-Capped Multi-Cloud Architecture

## Objective

Keep the public website available to very large traffic volumes while making dynamic features degrade safely before free-tier limits are exhausted. No cloud provider offers unlimited free dynamic compute, so the platform is designed to keep normal browsing on free static delivery and reserve metered services for business transactions only.

## Traffic classes

### Class A — static public traffic

Examples: landing page, CSS, JavaScript, logo, company profile, catering pages.

Primary path: Cloudflare Static Assets.

Rules:
- Do not invoke the Worker for normal page views.
- Cache immutable assets aggressively.
- Progressive-load non-critical visual systems.
- Do not perform server analytics writes for every visitor.

### Class B — critical business writes

Examples: RFQ submission, admin lead changes, quotations, supplier/product changes.

Primary path: Cloudflare Worker + D1 + KV/R2.

Rules:
- Never sample or drop RFQ submissions.
- Keep queries indexed and bounded.
- Prefer one write transaction over many small writes.
- Store documents in object storage when R2 is configured; KV remains fallback only.

### Class C — optional telemetry and presentation

Examples: analytics, client error telemetry, cinematic/photo services, experimental effects.

Rules:
- Sample analytics.
- Disable automatically under save-data, low-device or runtime-pressure conditions.
- Never block core navigation, content or RFQ submission.

### Class D — overflow/background compute

Primary optional provider: Google Cloud Run.

Use only for operations that do not need to execute inside the request path, such as document conversion, report generation, batch enrichment or integrations.

Cloud Run configuration principles:
- min instances: 0
- request-based billing
- high concurrency
- small memory allocation
- strict max instances
- no public traffic routing from the landing page
- signed/internal requests only

## Free-tier protection strategy

1. Static-first public delivery.
2. Worker routes limited to `/api/*`, admin, media, sitemap and robots.
3. Analytics sampling instead of one database write per page view.
4. D1 indexes on all high-frequency filters.
5. Bounded API list sizes.
6. Lazy-load WebGL and advanced animation systems.
7. Disable heavy rendering on Save-Data, reduced-motion and weak devices.
8. Scale secondary providers to zero.
9. Optional features fail closed/off before critical procurement functions.
10. RFQ and admin operations remain the highest-priority traffic class.

## Provider roles

| Provider | Role | Cost-control rule |
| --- | --- | --- |
| Cloudflare Static Assets | Public website and assets | Default for all anonymous browsing |
| Cloudflare Worker | API gateway and authentication | Dynamic endpoints only |
| Cloudflare D1 | Leads, quotes, suppliers, products, audit events | Indexed, bounded queries |
| Cloudflare KV | CMS/auth/config/fallback media | Avoid high-frequency counters |
| Cloudflare R2 | Preferred document/media storage when configured | Keep large files out of KV |
| Google Cloud Run | Optional background/overflow compute | Scale to zero, capped max instances |
| Resend | Transactional email | Trigger only on business events |
| WhatsApp Graph API | Business/security notifications | Trigger only on important events |

## Graceful degradation order

When resource pressure or quota pressure is detected, disable in this order:

1. advanced click effects
2. WebGL overlays
3. cinematic motion layers
4. non-essential telemetry
5. optional external integrations

Never disable:

- landing page content
- company/contact information
- RFQ form
- admin authentication
- lead and quotation records

## Scaling principle

Thousands of visitors should mostly generate static asset traffic. Dynamic cloud usage should correlate with real procurement actions rather than page views. This is the core mechanism that makes the free-tier target realistic.
