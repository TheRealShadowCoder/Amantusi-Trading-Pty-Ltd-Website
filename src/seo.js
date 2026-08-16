import { getSiteSettings } from './platform.js';

const PAGES = {
  '/': {
    title: 'Amantusi Trading Pty Ltd | Procurement, Supply & Catering Solutions',
    description: 'Amantusi Trading Pty Ltd provides procurement, government supply, FMCG, catering, hygiene, office and general trading solutions in Durban, South Africa.',
    type: 'website'
  },
  '/index.html': {
    title: 'Amantusi Trading Pty Ltd | Procurement, Supply & Catering Solutions',
    description: 'Amantusi Trading Pty Ltd provides procurement, government supply, FMCG, catering, hygiene, office and general trading solutions in Durban, South Africa.',
    type: 'website'
  },
  '/catering-menu.html': {
    title: 'Amantusi Catering Menu | Durban Corporate & Institutional Catering',
    description: 'Explore Amantusi Catering packages for meetings, functions, institutions and events in Durban and KwaZulu-Natal. Request a structured catering quotation online.',
    type: 'website'
  },
  '/catering-brochure.html': {
    title: 'Amantusi Catering Services | Meetings, Functions & Institutional Catering',
    description: 'Professional catering services from Amantusi Trading for meetings, events, functions and institutional requirements in KwaZulu-Natal.',
    type: 'website'
  },
  '/company-profile.html': {
    title: 'Amantusi Trading Company Profile | Procurement & General Supply',
    description: 'View the Amantusi Trading Pty Ltd company profile, procurement capabilities, registration information and service offering.',
    type: 'profile'
  }
};

function cleanBase(settings, request) {
  const configured = String(settings?.publicSiteUrl || '').trim().replace(/\/$/, '');
  return configured || new URL(request.url).origin;
}

function pageData(pathname) {
  return PAGES[pathname] || PAGES['/'];
}

function organizationSchema(base) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: 'Amantusi Trading Pty Ltd',
    url: `${base}/`,
    logo: `${base}/assets/amantusi-logo.svg`,
    email: 'zodwangema37@gmail.com',
    telephone: '+27 73 247 6716',
    foundingDate: '2016',
    identifier: [
      { '@type': 'PropertyValue', name: 'Company Registration', value: '2016/443097/07' },
      { '@type': 'PropertyValue', name: 'CSD Number', value: 'MAAA0100552' }
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2 Phoenix Court, 99 Selbourne Road, Kenneth Gardens, Umbilo',
      addressLocality: 'Durban',
      addressRegion: 'KwaZulu-Natal',
      postalCode: '4001',
      addressCountry: 'ZA'
    },
    areaServed: { '@type': 'Country', name: 'South Africa' },
    knowsAbout: [
      'Government procurement', 'FMCG supply', 'Institutional supply', 'Catering',
      'Cleaning and hygiene supply', 'Office supply', 'General trading'
    ]
  };
}

function pageSchema(base, pathname) {
  const page = pageData(pathname);
  const common = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: `${base}${pathname === '/index.html' ? '/' : pathname}`,
    isPartOf: { '@type': 'WebSite', name: 'Amantusi Trading Pty Ltd', url: `${base}/` },
    about: { '@id': `${base}/#organization` }
  };
  if (pathname === '/catering-menu.html' || pathname === '/catering-brochure.html') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Caterer',
      name: 'Amantusi Catering',
      url: `${base}${pathname}`,
      email: 'zodwangema37@gmail.com',
      telephone: '+27 73 247 6716',
      parentOrganization: { '@id': `${base}/#organization` },
      address: organizationSchema(base).address,
      areaServed: ['Durban', 'KwaZulu-Natal']
    };
  }
  return common;
}

export async function enhanceSeo(request, response, env, { home = false, admin = false } = {}) {
  if (!response.ok) return response;
  const url = new URL(request.url);
  const settings = await getSiteSettings(env);
  const base = cleanBase(settings, request);
  const meta = pageData(url.pathname);
  const canonicalPath = url.pathname === '/index.html' ? '/' : url.pathname;
  const canonical = `${base}${canonicalPath}`;
  const analyticsConfig = JSON.stringify({ gaId: settings.gaMeasurementId || '', firstParty: true });
  const schemas = admin ? [] : [organizationSchema(base), pageSchema(base, canonicalPath)];

  let rewriter = new HTMLRewriter()
    .on('title', { element(element) { if (!admin) element.setInnerContent(meta.title); } })
    .on('meta[name="description"]', { element(element) { if (!admin) element.setAttribute('content', meta.description); } })
    .on('head', {
      element(element) {
        if (admin) return;
        const verification = settings.googleSiteVerification
          ? `<meta name="google-site-verification" content="${String(settings.googleSiteVerification).replaceAll('&','&amp;').replaceAll('"','&quot;')}">`
          : '';
        const markup = [
          `<link rel="canonical" href="${canonical}">`,
          `<meta property="og:site_name" content="Amantusi Trading Pty Ltd">`,
          `<meta property="og:title" content="${meta.title}">`,
          `<meta property="og:description" content="${meta.description}">`,
          `<meta property="og:url" content="${canonical}">`,
          `<meta property="og:type" content="${meta.type}">`,
          `<meta property="og:image" content="${base}/assets/amantusi-logo.svg">`,
          `<meta name="twitter:card" content="summary">`,
          `<meta name="twitter:title" content="${meta.title}">`,
          `<meta name="twitter:description" content="${meta.description}">`,
          verification,
          `<script>window.AMANTUSI_ANALYTICS=${analyticsConfig};</script>`,
          ...schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
        ].join('');
        element.append(markup, { html: true });
      }
    });

  if (!admin) {
    rewriter = rewriter.on('body', {
      element(element) {
        element.append('<script src="/analytics.js" defer></script>', { html: true });
      }
    });
  }

  if (home) {
    rewriter = rewriter
      .on('#main-nav', {
        element(element) {
          element.append('<a href="/catering-menu.html">Catering Menu</a><a href="/company-profile.html">Company Profile</a>', { html: true });
        }
      })
      .on('.capability-grid .cap-card:nth-child(3)', {
        element(element) {
          element.setAttribute('role', 'link');
          element.setAttribute('tabindex', '0');
          element.setAttribute('data-href', '/catering-menu.html');
          element.setAttribute('style', 'cursor:pointer');
        }
      });
  }

  return rewriter.transform(response);
}

export async function sitemapResponse(request, env) {
  const settings = await getSiteSettings(env);
  const base = cleanBase(settings, request);
  const lastmod = new Date().toISOString().slice(0, 10);
  const pages = [
    ['/', '1.0', 'weekly'],
    ['/catering-menu.html', '0.9', 'weekly'],
    ['/catering-brochure.html', '0.8', 'monthly'],
    ['/company-profile.html', '0.8', 'monthly']
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([path, priority, changefreq]) => `  <url><loc>${base}${path}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

export async function robotsResponse(request, env) {
  const settings = await getSiteSettings(env);
  const base = cleanBase(settings, request);
  const text = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin.html',
    'Disallow: /admin-reset.html',
    'Disallow: /api/admin/',
    `Sitemap: ${base}/sitemap.xml`,
    ''
  ].join('\n');
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
