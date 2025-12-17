import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Updated to new custom domain
const DOMAIN = 'https://www.adaian.net';
const ROUTES = [
  '/',
  '/naver-search-analyzer',
  '/naver-gfa-analyzer',
  '/meta-ads-analyzer',
  '/google-ads-analyzer',
  '/coupang-ads-analyzer'
];

const generateSitemap = () => {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  ROUTES.forEach(route => {
    xml += '  <url>\n';
    // Ensure clean URL concatenation
    const url = route === '/' ? DOMAIN : `${DOMAIN}${route}`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  // Resolve public directory path (assuming scripts/ is one level deep from root)
  const publicDir = path.resolve(__dirname, '../public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)){
      fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write sitemap.xml
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  console.log('✅ Sitemap generated successfully at public/sitemap.xml');

  // Create robots.txt if it doesn't exist
  const robotsContent = `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml`;
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent);
  console.log('✅ robots.txt checked/generated');
};

generateSitemap();
