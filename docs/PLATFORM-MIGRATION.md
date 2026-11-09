# Moving the MoCDTI agency platform to GGDS

For the platform team. GGDS was extracted from the shared MoCDTI agency platform (`../agencies/platform`).
This table says which platform code each GGDS component replaces, and what changed. It is kept here, not on the
documentation site, because the site is for any government institution.

The agency evidence pages (`docs/agencies.mjs`) build each agency's homepage with GGDS from the platform's
settings, and the build fails if GGDS computes an agency colour differently from the platform.

| GGDS component | Replaces in the platform |
|---|---|
| Government website identification banner | `apps/web/src/components/OfficialBanner.astro` and `lib/official-site.ts`. Changes: wording no longer implies all official sites use .gov.gh; padlock wording corrected; register link is configuration, not the ministry hub. |
| Breadcrumbs | `components/Breadcrumbs.astro` (its JSON-LD stays in the application). |
| Button | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-quiet` in `global.css`. |
| Card | `.card`, `.card-link`, `.agency-card` in `global.css`. |
| Radios and checkboxes | Hand-written radio groups in `complaints/callback.astro:107-111`, `complaints/new.astro:223` and `grievances/new.astro:150`, which used `role="radiogroup"` on a `div`, did not tie errors to the group, and were linked from the error summary through a `div` that cannot take focus. |
| Disclosure and accordion | `.disclosure` in `global.css` (FAQs, service pages). |
| Error summary | `components/forms/ErrorSummary.astro`, which was never focused on load. |
| Text input, textarea, select and file upload | `components/forms/Field.astro` and `.input`, `.select`, `.field-label`, `.field-hint` in `global.css`. Field left `aria-describedby` to each caller and had no "Error:" prefix; textarea, select and file upload were written by hand in each form page. |
| Footer | `components/Footer.astro`. The platform had no disclaimer page (assessment, decision D-17). |
| Header and main navigation | `components/Header.astro` (desktop navigation and the full-screen `<details>` drawer) and the drawer code in `scripts/enhance.ts:21-34`. The drawer failed WCAG 2.4.11 in the assessment: focus left it after six Tab presses. The phone bottom bar is the tab bar. |
| Hero | The hero sections of `components/AgencyHome.astro` and `modules/hub/components/HubHome.astro`. Homepage scenes and photos stay platform artwork (decision D-15). |
| Notice | `.alert-*` in `global.css`; `UrgentBanner.astro` (urgent variant, which hard-coded `#7a1c14`). |
| Page template | The shell of `layouts/Base.astro`, without its data fetching and cache headers, which stay in the application. |
| Pagination | `components/Pagination.astro`, which had previous and next only. |
| Prose (rich text) | `.prose` in `global.css`. The platform's sanitiser (`lib/rich-text.ts`) stays in the platform; it should wrap tables in `.ggds-table-wrap`. |
| Skip link | `.skip-link` in `styles/global.css` and `layouts/Base.astro:84`. |
| Tab bar | `components/TabBar.astro`. |
| Tab links | The inline `nav[data-tabs]` markup in `news-notices/index.astro`, `industry-data/reports.astro`, `consultations/index.astro` and `search.astro`. |
| Table | `.table-wrap`, `.data-table` in `global.css`. Tables in CMS rich text had no wrapper. |
| Tag | `components/StatusBadge.astro` and `.badge-*` in `global.css`. |
