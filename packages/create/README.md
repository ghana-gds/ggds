# @ggds/create

Makes a complete Government of Ghana website with [GGDS](https://ghana-gds.github.io/ggds/), the Ghana Government
Design System, from your institution's details. It is the
[website builder](https://ghana-gds.github.io/ggds/builder.html) on the command line: the same questions, the same
code, the same website.

```sh
npm init @ggds
```

It asks for your institution's name, initials, address, contact details and colour, and which parts your website
needs, then makes a folder with:

- every page: a homepage, services, about us, contact us, search, and the accessibility, privacy and disclaimer
  pages, with the parts you chose (applying online, fees, complaints, news, publications, jobs and tenders);
- GGDS itself, in `ggds/`;
- the server settings for security and speed: `.htaccess` (Apache and cPanel), `_headers` (Netlify, Cloudflare
  Pages) and `hosting/nginx.conf`, plus the DNS records for your email domain in `hosting/dns-records.txt`;
- `README.md`: how to make it yours and put it online;
- `ggds-site.json`: your answers, to make the same website again.

The pages are plain HTML. They work without a server and without JavaScript, under a strict Content Security
Policy, and pass [`@ggds/check`](https://www.npmjs.com/package/@ggds/check) as they are. The words on each page are
an example: rewrite them for your own services.

### In your framework

It also asks what to make the website with, or take `--stack`:

- `html` (the default): the plain pages above, with GGDS in `ggds/`.
- `next`: a Next.js project with `@ggds/react`, exported as a static website. Its build adds the hash of each script
  Next.js writes into a page to the security policy, so the policy stays strict.
- `astro`: an Astro project with `@ggds/astro`, built as a static website.
- `django`: a Django project with `ggds-django`, with Django 6's security settings and Content Security Policy.

Each has the same pages, and GGDS's tests check every page of each against the plain HTML. The parts around every
page come from the framework's `Page` component, so a newer GGDS package updates them.

## Options

```sh
npx @ggds/create --from ggds-site.json      # no questions: make it from saved settings, with this GGDS
npx @ggds/create --update my-website        # a newer GGDS for a website you have changed: only ggds/ is replaced
npx @ggds/create --stack next              # the same website as a Next.js, Astro (astro) or Django (django) project
npx @ggds/create --out our-website          # where to make it (default: <initials>-website)
npx @ggds/create --logo logo.svg            # your approved logo: SVG, PNG, JPEG or WebP, under 200 KB
npx @ggds/create --force                    # write into a folder that already has files in it
```

Then, when it is online: `npx @ggds/check https://www.your-address.gov.gh`

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md`.
