import { getSiteSettings } from './platform.js';

const PAGES = {
  '/procurement-guides.html': {title: 'Procurement Guides | Amantusi Trading', description: 'Practical RFQ, tender, catering and procurement guidance to prepare sourcing enquiries.', type: 'website'},
  '/supplier-onboarding.html': {title: 'Supplier Introductions | Amantusi Trading', description: 'Requirements and contact guidance for relevant suppliers introducing products and services.', type: 'website'},
  '/procurement-templates.html': {title: 'RFQ Templates & Examples | Amantusi Trading', description: 'Sample procurement, service and catering quotation request formats.', type: 'website'},
  '/capability-statement.html': {title: 'Capability Statement | Amantusi Trading', description: 'Printable company capability statement showing services, registration and contact details.', type: 'website'},
  '/procurement-faq.html': {title: 'Procurement FAQs | Amantusi Trading', description: 'Common answers to questions about procurement quotations, document attachments and catering.', type: 'website'},
  '/information-handling.html': {title: 'Information Handling | Amantusi Trading', description: 'How the Amantusi online enquiry form processes information and where to request details.', type: 'website'},
  '/government-procurement.html': {title: 'Government Procurement RFQs | Amantusi Trading', description: 'Send government procurement RFQs and detailed specifications to Amantusi Trading Pty Ltd in Durban.', type: 'website'},
  '/fmcg-supply.html': {title: 'FMCG & Institutional Supply | Amantusi Trading', description: 'Specification-based FMCG sourcing for institutional and private-sector buyers.', type: 'website'},
  '/cleaning-hygiene.html': {title: 'Cleaning and Hygiene Supply | Amantusi Trading', description: 'Structured sourcing and RFQ enquiries for cleaning products and hygiene consumables.', type: 'website'},
  '/office-institutional.html': {title: 'Office and Institutional Supply | Amantusi Trading', description: 'Request stationery, equipment and office supplies from Amantusi Trading.', type: 'website'},
  '/general-trading.html': {title: 'General Trading and Sourcing | Amantusi Trading', description: 'Submit mixed-category sourcing briefs and general procurement enquiries.', type: 'website'},
  '/corporate-catering.html': {title: 'Corporate and Institutional Catering | Amantusi Trading', description: 'Plan meeting and institutional catering with guest counts, venues and custom menu briefs.', type: 'website'},
  '/procurement-checklist.html': {title: 'RFQ Preparation Checklist | Amantusi Trading', description: 'Printable procurement RFQ checklist covering quantity, specifications and delivery information.', type: 'website'},
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
  const origin=new URL(request.url).origin;
  const configured=String(settings?.publicSiteUrl||'').trim();
  if(!configured)return origin;
  try{
    const url=new URL(configured);
    if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash)return origin;
    return url.origin;
  }catch(_){return origin;}
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
  if (pathname === '/procurement-faq.html') {
    return {
      '@context':'https://schema.org',
      '@type':'FAQPage',
      name:page.title,
      url:common.url,
      mainEntity:[
        {q:'How do I submit a quotation request?',a:'Open Request a Quote from the homepage, enter your organization and contact details, describe the products or service and submit. A reference appears only after the server confirms receipt.'},
        {q:'Can I attach an RFQ or tender schedule?',a:'Yes. The website form supports up to five PDF, Office, CSV, text or supported image files, each up to 10 MB, with a maximum combined total of 30 MB.'},
        {q:'Are prices confirmed on the catering menu?',a:'No. Catering prices depend on guest count, menu selections, venue, staffing and delivery requirements. Request a tailored quotation.'},
        {q:'Can I send a mixed-category sourcing enquiry?',a:'Yes. Choose General Procurement and give quantities, specifications and delivery location for each requested item.'},
        {q:'Does a quotation request guarantee stock or an order?',a:'No. A submitted enquiry starts a review. Availability, lead time, final price and accepted purchase terms must be confirmed separately.'},
        {q:'How can I contact the company?',a:'Use the email or phone number on the company profile. For a complete procurement brief, the secure website enquiry form is preferred.'},
        {q:'How do I prepare an accurate RFQ?',a:'State item specifications, units, quantities, brands or permissible alternatives, delivery requirements and deadline. See the printable RFQ checklist.'},
        {q:'Can I submit a catering brief without choosing a listed menu item?',a:'Yes. Describe your custom catering needs, guest count, event date, location and service format when building the catering brief.'}
      ].map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}))
    };
  }
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
  if (!admin && canonicalPath!=='/' && PAGES[canonicalPath]) {
    schemas.push({
      '@context':'https://schema.org',
      '@type':'BreadcrumbList',
      itemListElement:[
        {'@type':'ListItem',position:1,name:'Home',item:base+'/'},
        {'@type':'ListItem',position:2,name:PAGES[canonicalPath].title.split(' | ')[0],item:canonical}
      ]
    });
  }

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
    ['/company-profile.html', '0.8', 'monthly'],
    ['/government-procurement.html', '0.9', 'monthly'],
    ['/fmcg-supply.html', '0.8', 'monthly'],
    ['/cleaning-hygiene.html', '0.8', 'monthly'],
    ['/office-institutional.html', '0.8', 'monthly'],
    ['/general-trading.html', '0.8', 'monthly'],
    ['/corporate-catering.html', '0.8', 'monthly'],
    ['/procurement-checklist.html', '0.7', 'monthly'],
    ['/procurement-guides.html', '0.6', 'monthly'],
    ['/supplier-onboarding.html', '0.6', 'monthly'],
    ['/procurement-templates.html', '0.6', 'monthly'],
    ['/capability-statement.html', '0.6', 'monthly'],
    ['/procurement-faq.html', '0.6', 'monthly'],
    ['/information-handling.html', '0.6', 'monthly']
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
