# Accessibility audit of GGDS: brief

For NITA, to commission the external accessibility audit agreed in decision D-09, and for the auditor who does
it. It says what to test, how, with whom, and what to hand back. Prepared in November 2026, for GGDS 0.1.

## Why

GGDS is meant to become the standard for Government of Ghana websites. Every website that uses it inherits its
accessibility, good or bad. GGDS meets WCAG 2.2 level AA in automated tests (axe, contrast, 320px layout,
keyboard behaviour), but automated tests find only some of the barriers people meet. Before version 1.0, GGDS
needs:

1. an **expert audit** against WCAG 2.2 level AA, with assistive technology; and
2. **testing with disabled people in Ghana**, recruited with Ghanaian disability organisations, on the phones and
   connections they really use.

The results are published on each component's page and in the accessibility statement, so the audit also tells
every government website what it can rely on.

## Scope

In scope, at the version current when the audit starts:

- **The 23 components**: every example on the documentation website, <https://ghana-gds.github.io/ggds/components/>.
- **The patterns**: whole tasks such as asking for information, making a complaint, and asking for a Ghana Card
  number, phone number or address, <https://ghana-gds.github.io/ggds/patterns/>.
- **The documentation website** itself, which is built with GGDS.
- **The optional script** (`@ggds/js`): the phone menu and the error summary.
- **The Django form renderer** (`ggds-django`): forms it renders, with their errors.

Optional, if the budget allows: the example sites (12 institutions' homepages and inner pages), which are built
locally and not published.

Out of scope: institutions' own websites and content.

## Standard

- WCAG 2.2, level A and AA, every success criterion. Report AAA findings that matter for the people below as
  advice, not failures.
- The Persons with Disability Act, 2006 (Act 715) and NITA's guidance for government websites, where they apply.

## Methods

### 1. Expert audit

Test every component example and pattern page against each success criterion, with:

| Check | Setup |
|---|---|
| Keyboard only | Chrome and Firefox on Windows |
| NVDA | Latest NVDA with Firefox or Chrome on Windows |
| JAWS | Latest JAWS with Chrome on Windows |
| VoiceOver | Safari on iPhone |
| TalkBack | Chrome on a low-cost Android phone (2 GB memory or less) |
| Zoom | 400% zoom on a computer, 200% text size on a phone, and WCAG text spacing |
| Contrast themes | Windows contrast themes (forced colours) |
| Voice control | Voice Access on Android, or Dragon on Windows |

These are the eight checks each component page lists under "By people, with assistive technology". Test on
real devices, not only emulators, and on a slow mobile connection (3G or throttled) for at least the patterns.

### 2. Testing with disabled people

At least 12 participants, recruited with Ghanaian disability organisations, such as the Ghana Federation of
Disability Organisations and its member groups, covering:

- blind and partially sighted people (screen reader and magnifier users);
- Deaf and hard of hearing people;
- people with physical impairments (keyboard, switch or voice users);
- people with cognitive or learning disabilities, and people with low literacy;
- older people who are new to the web;

in more than one region, including outside Accra, on their own phones where possible.

Each session: realistic tasks using the patterns (find a service, make a complaint, give a Ghana Card number,
phone number and address, check answers, confirmation). Pay participants fairly for their time and travel, with
consent and data protection agreed in advance. Never record anything that identifies a participant without
their written consent.

## What to hand back

1. **A report**: each finding with the WCAG success criterion, the component or page, how to reproduce it, who it
   affects, a severity (critical, serious, moderate, minor) and a recommended fix.
2. **Results per component**, for each of the eight checks, in this form (it goes straight into the component's
   `component.json`, and its page shows it):

   ```json
   "manual": {
     "nvda": { "result": "pass", "date": "2027-02-10", "by": "Auditor name", "notes": "Optional notes" }
   }
   ```

   `result` is `pass`, `issues` (passed with issues) or `fail`. The keys are `keyboard`, `nvda`, `jaws`,
   `voiceover`, `talkback`, `zoom`, `forced-colours` and `voice`.
3. **Findings from testing with people**: what worked and what did not, with quotes participants agreed to share,
   kept separate from the WCAG findings.
4. **A retest** of every critical and serious finding after the GGDS team fixes it, within the contract.
5. A short **public summary** for the accessibility statement.

Report findings as GitHub issues on <https://github.com/ghana-gds/ggds> (label `accessibility`) as well, unless a
finding is a security problem.

## Timing

About 8 weeks: 1 week to agree the plan and recruit, 3 weeks of expert audit and sessions with people, 1 week to
report, 2 weeks for the GGDS team to fix, 1 week to retest. GGDS stays at its current version during the audit;
fixes go into the next release.

## Who can do it

- At least one auditor with a recognised accessibility qualification (such as IAAP CPACC or WAS) and experience of
  auditing design systems or government services against WCAG 2.2.
- Daily screen reader users on the team, or as paid testers.
- A partner organisation of disabled people for recruitment and facilitation.
- No conflict of interest: the auditor did not build GGDS.

## Budget and decision

The budget is open decision D-11. NITA, as custodian (D-02), approves the supplier, the plan and the publication
of the results. The GGDS team supports the audit: access to the source, answers to questions, and fixes.
