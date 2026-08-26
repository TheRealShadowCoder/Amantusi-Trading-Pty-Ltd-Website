# Amantusi Admin Settings Control Centre

This release introduces a dedicated authenticated Admin Settings Control Centre with a 50-category, 1,000-capability registry.

## Permanent access policy

`s.k.businessline@gmail.com` is the protected permanent superadmin identity. The settings control plane exposes this identity as immutable and enforces these invariants server-side:

- cannot be removed
- cannot be suspended
- cannot be demoted
- cannot be expired

The existing owner account remains authorized.

## Control plane

Settings are persisted in Cloudflare KV under `admin:control-centre:v1`. Changes are audited with a SHA-256 hash chain and can be exported as JSON. Reset restores safe defaults but never removes permanent access or mandatory security policies.

## UI

`/admin-settings.html` provides:

- responsive mobile/desktop layout
- 1,000 searchable settings across 50 categories
- enable/disable state persistence
- bulk capability actions
- core security and appearance settings
- identity policy visibility
- infrastructure diagnostics
- audit timeline
- JSON export
- protected reset
- keyboard shortcuts and unsaved-change protection

The dashboard links directly to the Settings Control Centre.

## Release validation

The platform CI must verify the exact 50 × 20 registry, protected superadmin presence in core session and active Google OIDC allowlists, server-side immutable access policy, authenticated settings routing, responsive layouts, persistence actions, audit/export/reset controls and Wrangler Worker bundling before merge.
