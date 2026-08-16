# Amantusi Spatial Experience Architecture

This document defines the immersive visual system for the Amantusi Trading website while preserving a clear procurement-first user experience.

## Experience objective

The website should feel like a living digital environment without allowing spectacle to interfere with procurement information, quotation requests, catering discovery or accessibility.

The visual metaphor is a **Supply Network**: nodes represent requirements, suppliers, institutions and destinations; routes represent sourcing, procurement and delivery; motion represents the flow from requirement to fulfilment.

## Route map

Current public routes:

- `/` — corporate experience and quotation conversion
- `/catering-menu.html` — digital catering menu
- `/catering-brochure.html` — catering brochure
- `/company-profile.html` — company profile and brand presentation
- `/admin.html` — secure CMS, excluded from immersive WebGL effects
- `/admin-reset.html` — secure password reset, excluded from immersive WebGL effects

Future route architecture can move the public routes into a client-side shell so one WebGL renderer persists across route changes.

## User journey

1. Atmospheric loader establishes the brand and initialises only the required graphics systems.
2. Hero communicates the company proposition immediately.
3. Scroll moves the persistent supply-network scene through spatial states rather than showing unrelated decorative objects.
4. Capability cards explain services through layered pointer response.
5. Government section brings the network back into visual focus to reinforce RFQ and tender flow.
6. Process section reduces visual intensity so the operating workflow is easy to understand.
7. Quote section prioritises conversion over spectacle.
8. Contact section returns to a calm dark environment.

## Application layers

```text
DOM Interface
├── Navigation
├── Semantic content
├── Capability cards
├── Quote form
├── Accessibility
└── Section progress

Spatial Experience
├── Renderer
├── Camera
├── Supply Network
├── Particle Field
├── Pointer Ribbon
├── Interaction Ripples
├── Lighting
├── Scroll State
├── Pointer State
└── Performance Controller

Cloudflare Worker
├── Static assets
├── Catering content API
├── Admin authentication
├── CMS persistence
└── Media storage
```

## State architecture

The current experience keeps frame-state outside the DOM rendering path:

```text
pointer
pointerTarget
pointerVelocity
pointerSpeed
scroll
scrollTarget
scrollVelocity
progress
activeSection
idle
visible
performanceTier
pixelRatio
```

The renderer subscribes to this state. Normal document content does not need to re-render on every animation frame.

## Scene map

### Home
Supply network foreground focus, strongest gold route lighting and visible atmospheric particles.

### Company
Network moves backward and across the frame. DOM typography becomes dominant.

### Capabilities
Network remains atmospheric while asymmetric capability panels take focus.

### Government
Network returns to strong visibility and slightly increases scale to reinforce procurement flow.

### Process
Visual intensity falls. Scroll progress communicates movement from requirement to delivery.

### Quote
Environment is restrained. Form clarity and conversion dominate.

### Contact
Dark environment returns in a calmer state.

## Interaction system

- Normalized pointer coordinates drive camera parallax and lighting.
- Pointer velocity influences the width of the world-space ribbon.
- Pointer clicks generate small world-space energy ripples.
- Scroll velocity influences camera field of view and navigation elasticity.
- Idle state progressively calms GPU activity and visual movement.
- Buttons retain semantic DOM behavior and keyboard accessibility.

## Performance tiers

### High
- higher particle density
- capped high DPR
- antialiasing
- full route network

### Medium
- reduced particles
- moderate DPR
- same interaction language

### Low / mobile
- reduced particles and route geometry
- DPR near 1
- no custom cursor
- reduced visual density

The renderer monitors frame performance and can lower DPR when sustained FPS falls.

## Accessibility

- All essential content remains semantic HTML.
- The WebGL canvas is decorative and `aria-hidden`.
- `prefers-reduced-motion` disables the real-time experience and uses the normal DOM site.
- Touch devices do not receive a desktop cursor replacement.
- Keyboard navigation remains independent of the graphics engine.
- The admin and password-reset surfaces remain visually separate from the public immersive experience.

## Security

The visual experience contains no private keys, credentials or admin logic. Authentication and CMS actions remain server-side in the Cloudflare Worker. Admin pages do not load the public WebGL experience.

## Next advanced phases

1. Render-to-texture composite pipeline and custom transition shader.
2. Persistent public application shell across menu, brochure and company-profile routes.
3. DOM-to-WebGL image transitions for catering items.
4. Optional Cloudflare Durable Object anonymous presence layer.
5. Optimised compressed media pipeline for future photography and video.
6. Visual regression screenshots for desktop, tablet, mobile and reduced-motion states.
7. Optional intelligent procurement navigator after the core public experience is stable.
