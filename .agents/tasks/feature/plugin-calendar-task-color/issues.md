# Technical Debt and Out-of-Scope Findings

- report.md: Section headers use `## Step N:` format. Note that commit 12a5cca (`PR.md`) was initially created for the standalone extension before migrating to Directus core patch.
- Directus API: The `/items/Tasks` endpoint requires an authentication header (`Authorization: Bearer <token>`); unauthenticated curl requests return 403 Forbidden.
- zsh: URLs with parameters such as `?fields=...` require quotation in zsh to avoid globbing syntax errors (`no matches found`).
