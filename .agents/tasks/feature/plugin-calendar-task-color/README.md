# Feature: Directus Colored Task Cards in Calendar Layout

This module implements a Directus patch and schema enhancement that enables colored task cards in the built-in Calendar layout using a `highlight_color` parameter.

---

## Overview

- **SPEC Requirements**:
  - Implement a Directus patch that displays colored task cards in Calendar (layout).
  - Add an additional parameter `highlight_color` to make the functionality work.
  - Add the `highlight_color` field to the `Tasks` collection schema.
  - English only across all documentation and task files.

---

## Artifacts in this Directory

| File | Description |
|---|---|
| `create_issue.md` | Feature request proposal formatted for `https://github.com/directus/directus`. |
| `create_pr.md` | Pull request description and test plan formatted for Directus maintainers. |
| `patches/directus-calendar-highlight-color.patch` | The minimal core git patch for Directus `app/src/layouts/calendar`. |
| `patches/README.md` | Installation and usage instructions for the patch. |
| `reviews/security-3.md` | Round 3 security audit report by subagent (Verdict: PASS). |
| `reviews/ponytail-2.md` | Clean code and architecture review by `ponytail-reviewer` subagent. |
| `reviews/security-4.md` | Verification security review confirming all review fixes. |

---

## How to Use

1. **Directus Schema**: Ensure the collection (e.g. `Tasks`) has a string field named `highlight_color` with interface `select-color`.
2. **Calendar View**: Switch collection layout to **Calendar**.
3. **Card Coloring**: Cards automatically render with the color specified in `highlight_color` (e.g. `#10b981`), while cards without the field default to standard theme styling.
