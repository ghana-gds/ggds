# Contributing to GGDS

GGDS is maintained by NITA as its custodian (decision D-02). Contributions from MDAs, agencies and suppliers
are welcome.

## Sign off every commit (Developer Certificate of Origin)

GGDS uses the [Developer Certificate of Origin 1.1](https://developercertificate.org/) instead of a signed
contributor agreement (decision D-10). By adding a sign-off line to a commit, you certify that you wrote the
change, or otherwise have the right to submit it under the project's licence (Apache-2.0), and that you
understand the contribution is public.

Add the line with `git commit -s`. It must use your real name and an email address you can be reached at:

```
Signed-off-by: Ama Mensah <ama.mensah@example.gov.gh>
```

Commits without a sign-off cannot be merged. If you contribute as part of your job, check that your employer
allows it.

## Do not contribute

- Flag colours, the coat of arms or other national emblems as assets (see [`LICENSE.md`](LICENSE.md)).
- An agency's logo or name for use as a theme, unless the agency has approved it.
- Real personal data in examples or tests.

## Before you open a pull request

```sh
pnpm install
pnpm run build      # fails on token, theme or contrast problems
pnpm run test       # unit tests, then axe and behaviour tests in Chrome at desktop and phone widths
```
