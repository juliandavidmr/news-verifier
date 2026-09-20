# Deployment

Operational deployment context for this repository.

## Production

- **Platform:** Vercel
- **Vercel project:** `news-verifier`
- **Production URL:** <https://news-verifier-pi.vercel.app/>
- **GitHub repository:** <https://github.com/juliandavidmr/news-verifier>
- **Production branch:** `master`
- **Deployment trigger:** Vercel Git integration deploys every change pushed to `master` automatically.

The repository owner confirmed the Vercel project name, production URL and Git integration on 19 September 2026. The local checkout confirms the GitHub remote and current `master` branch. `.vercel/project.json` is absent and `.vercel/` is intentionally ignored, so the external Vercel project linkage must not be inferred from local metadata.

## Operational guardrails

- Treat a push to `master` as a production deployment, not merely as source synchronization.
- Local implementation requests authorize local edits and verification only; do not push, deploy, promote or roll back unless the user explicitly requests it.
- Run the relevant local checks before any authorized push to `master`.
- Do not commit Vercel tokens, project IDs, organization IDs or environment-variable values.
- Inspect the current Vercel project or deployment state before changing external settings; this document records topology, not live deployment health.
- Use non-production branches and Vercel Preview Deployments when deployment-based validation is needed before production.

## Manual report unlisting

After approving a removal request, remove the report from the homepage, sitemap and search indexing without invalidating its direct URL:

```sh
npm run report:unlist -- <short-id> "reason for removal"
```

The command requires the database variables from `.env`, records the reason and is idempotent: it fails without modifying an already unlisted or ineligible report. Full administrative withdrawal remains a separate exceptional operation.
