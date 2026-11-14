// The server settings that go with every website the starter makes, so a site passes ggds-check's "Address and
// server" and "Speed" checks on the hosting institutions actually have: Apache (.htaccess: most shared hosting and
// cPanel), nginx, and Netlify or Cloudflare Pages (_headers). Plus the DNS records for the email domain checks.
// Runs in the browser (the website builder) and in Node (the build), so no Node imports.

/** The security headers GGDS asks for. The policy works because the pages have no inline script or style. */
export const SECURITY_HEADERS = [
  ['Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'],
];

/** The form-action in the policy must allow the server the forms send to, when it is another address. */
const headersFor = (formsOrigin) => SECURITY_HEADERS.map(([k, v]) => [k, formsOrigin && k === 'Content-Security-Policy' ? v.replace("form-action 'self'", `form-action 'self' ${formsOrigin}`) : v]);

/** The domain the email records are for: the website's address without www. */
const mailDomain = (host) => String(host ?? '').replace(/^www\./, '');

/** Files to add to the website, as { path: text }. host: the website's address; formsOrigin: where forms send, if not this site. */
export function hostingFiles({ host, formsOrigin = '' } = {}) {
  const headers = headersFor(formsOrigin);
  const domain = mailDomain(host);
  return {
    '.htaccess': `# Apache (most shared hosting and cPanel): security headers, HTTPS only, compression and caching.
# Upload this file with the website. It needs mod_headers, mod_rewrite, mod_deflate and mod_expires, which most
# hosts have. Check the result with: npx @ggds/check https://${host}

ServerSignature Off
Options -Indexes
ErrorDocument 404 /404.html
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !=https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

<IfModule mod_headers.c>
${headers.map(([k, v]) => `  Header always set ${k} "${v}"`).join('\n')}
  Header unset X-Powered-By
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript text/javascript application/json image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 7 days"
  ExpiresByType application/javascript "access plus 7 days"
  ExpiresByType text/javascript "access plus 7 days"
  ExpiresByType image/svg+xml "access plus 30 days"
  ExpiresByType image/png "access plus 30 days"
  ExpiresByType image/jpeg "access plus 30 days"
  ExpiresByType image/webp "access plus 30 days"
</IfModule>
`,
    '_headers': `# Netlify and Cloudflare Pages read this file: the security headers for every page, and caching.
# Both serve 404.html for a page that does not exist, and both use HTTPS.
/*
${headers.map(([k, v]) => `  ${k}: ${v}`).join('\n')}

/ggds/*
  Cache-Control: public, max-age=604800

/assets/*
  Cache-Control: public, max-age=604800
`,
    'hosting/nginx.conf': `# nginx: put this server block in your configuration, change root to the folder you uploaded the website to,
# and set the certificate paths. Then: sudo nginx -t && sudo systemctl reload nginx

server {
  listen 80;
  listen [::]:80;
  server_name ${host};
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  http2 on;
  server_name ${host};
  root /var/www/${domain || 'website'};
  index index.html;
  server_tokens off;

  ssl_certificate     /etc/letsencrypt/live/${host}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${host}/privkey.pem;

${headers.map(([k, v]) => `  add_header ${k} "${v}" always;`).join('\n')}

  gzip on;
  gzip_types text/css application/javascript text/javascript application/json image/svg+xml text/plain;

  location ~* \\.(css|js|svg|png|jpe?g|webp|woff2)$ {
${headers.map(([k, v]) => `    add_header ${k} "${v}" always;`).join('\n')}
    add_header Cache-Control "public, max-age=604800" always;
  }

  error_page 404 /404.html;
  location / { try_files $uri $uri.html $uri/ =404; }
}
`,
    'hosting/dns-records.txt': `DNS records for ${domain || 'your domain'}: they stop people forging email from your address, and say who may
issue your website's certificates. Ask whoever runs your domain (for .gov.gh, NITA) to add them. Change the SPF
record to the servers that really send your email first: the one below allows only the servers in your MX records.

Type   Name                   Value
TXT    ${domain || 'example.gov.gh'}${' '.repeat(Math.max(1, 23 - (domain || 'example.gov.gh').length))}v=spf1 mx -all
TXT    _dmarc.${domain || 'example.gov.gh'}${' '.repeat(Math.max(1, 16 - (domain || 'example.gov.gh').length))}v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain || 'example.gov.gh'}
CAA    ${domain || 'example.gov.gh'}${' '.repeat(Math.max(1, 23 - (domain || 'example.gov.gh').length))}0 issue "letsencrypt.org"

If your certificate comes from another authority, put its name in the CAA record instead of letsencrypt.org.
Check them, with the website, with: npx @ggds/check https://${host}
`,
  };
}

/** The "Put it online" part of the starter's README: one route for each kind of hosting. */
export const hostingGuide = (host) => `## Put it online

The website is a folder of files: any web host can serve it. Pick the route that matches what you have. Each one
comes with the server settings already written, so the website passes the GGDS checks for security and speed.

**Shared hosting or cPanel** (most hosts in Ghana). Open the File Manager, go to \`public_html\`, and upload
everything in this folder, including \`.htaccess\` (it may be hidden: turn on "show hidden files"). Turn on the free
SSL certificate (often called AutoSSL or Let's Encrypt) in cPanel.

**Your own server with nginx.** Copy the folder to \`/var/www/\`, then use \`hosting/nginx.conf\`. A free certificate:
\`sudo certbot --nginx -d ${host}\`.

**Your own server with Apache.** Copy the folder to the website's document root. \`.htaccess\` holds the settings;
make sure \`AllowOverride All\` is set for that folder.

**Netlify or Cloudflare Pages** (free, no server to look after). Drag this folder onto
https://app.netlify.com/drop, or make a Cloudflare Pages project and upload it. \`_headers\` holds the settings.
Then connect your address (${host}) in the project's domain settings.

**Your address.** Ask whoever runs your domain (for .gov.gh, NITA) to point ${host} at your host, and to add the
records in \`hosting/dns-records.txt\`.

**Check it.** When it is live: \`npx @ggds/check https://${host}\`. It checks every page, the server settings and the
email records, and says how to fix anything that fails.
`;
