# Security policy

GGDS is used on Government of Ghana websites, so we take security problems seriously.

## Report a problem privately

**Do not open a public issue.** Use GitHub's private reporting:
[report a vulnerability](https://github.com/ghana-gds/ggds/security/advisories/new). Only the GGDS maintainers can
see it.

Tell us what the problem is, which package and version, how to reproduce it, and what someone could do with it.

We will:

- reply within 5 working days;
- tell you whether we accept it, and keep you updated while we fix it;
- release a fix, publish an advisory, and thank you in it unless you prefer not to be named.

Please give us time to release a fix before you talk about the problem publicly.

## Supported versions

| Version | Supported |
|---|---|
| Latest 0.x release | Yes |
| Earlier 0.x releases | No: update to the latest |

After version 1.0, the previous major version gets security fixes for 12 months after the next major release.
See [Versions and support](https://ghana-gds.github.io/ggds/versions.html).

## What is in scope

- `@ggds/tokens`, `@ggds/themes`, `@ggds/css`, `@ggds/js`, `@ggds/astro` on npm, `ggds-django` on PyPI, and the
  release zip.
- Anything in GGDS that stops a website running under a strict Content Security Policy.
- The release process: build, signing, provenance and publishing.

A website's own code, hosting and content are the responsibility of the institution that runs it.

## How GGDS is protected

- Releases are built and published by GitHub Actions, never from a person's computer. npm packages carry
  provenance, so anyone can check which commit and workflow built them.
- Each release lists a SHA-256 checksum and an `integrity` value for every file in the zip.
- The packages have no runtime dependencies other than each other.
