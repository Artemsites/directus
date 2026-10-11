# Clean Code & Architecture Review: Directus Calendar Highlight Color Patch

**Date:** 2026-10-12  
**Branch:** `feature/plugin-calendar-task-color`  
**Reviewer:** Subagent Ponytail Reviewer (`pro` / `ponytail-reviewer`)  
**Scope:** Full branch diff against `master` (`git diff master...HEAD` and working tree)

---

## What this change does

This branch adds the `highlight_color` field to the `Tasks` collection schema and introduces a Directus core patch (`patches/directus-calendar-highlight-color.patch`) that updates the built-in Calendar layout to color event cards using `highlight_color`. It also provides upstream contribution materials (`create_issue.md`, `create_pr.md`) for submitting the improvement to the Directus open-source project.

**Assumed load:**
Directus 12.0.2 running with a local SQLite database for a small team or single-tenant project (several hundred to thousands of tasks). Under this load, the patch introduces negligible CPU and memory overhead ($O(1)$ property lookup per visible calendar event, zero additional database queries or network requests).

---

## Must fix

1. **Accidental deletion of `name` field from Tasks schema** (`database/schema.yaml:468-508`, `database/data.db`)
   - **What this is:** In commit `8a091db`, the `name` field was removed from the `Tasks` table in SQLite and from `database/schema.yaml`.
   - **Problem:** The SPEC only asked to add the `highlight_color` field and explicitly warned: *"Double check that you haven't done anything extra beyond SPEC."* Deleting the `name` column was done as an undocumented side effect because it had `required: true`. Dropping the column causes irreversible data loss and breaks any existing integration, flow, or query expecting `name`.
   - **Fix:** Restore the `name` field in `database/schema.yaml` and the SQLite table, marking it `required: false` so it does not block task creation.
   - **If we skip it:** Any external scripts, flows, or users relying on `Tasks.name` will break with missing column errors, and existing name data is destroyed.

---

## Should fix

2. **Patch file differs from container runtime and pull request documentation** (`patches/directus-calendar-highlight-color.patch`, `create_pr.md`, `/tmp/patch-fix.js`)
   - **What this is:** The git patch was modified to check only `highlight_color`, while the running container and `create_pr.md` still contain legacy fallbacks for `Color` and `color`.
   - **Problem:** Single Source of Truth (SSoT) is broken. Applying the patch produces different behavior than what is described in the PR draft and what runs in the test container.
   - **Fix:** Update `create_pr.md`, `create_issue.md`, and the container runtime to match `patches/directus-calendar-highlight-color.patch`, and commit the unstaged patch changes to Git.
   - **If we skip it:** Upstream reviewers and developers applying the patch will see conflicting behavior between documentation and code.

3. **Whitespace strings in `highlight_color` produce malformed CSS** (`patches/directus-calendar-highlight-color.patch:30`)
   - **What this is:** Event color is assigned with `color: highlightColor ? String(highlightColor) : undefined`.
   - **Problem:** If a user enters whitespace (such as `"   "`), `highlightColor ?` evaluates to true and injects `background-color:    ;` as an invalid inline style on the FullCalendar DOM element.
   - **Fix:** Trim the string and ensure it is non-empty before setting the color:
     ```ts
     const trimmedColor = typeof highlightColor === 'string' && highlightColor.trim().length > 0 ? highlightColor.trim() : undefined;
     ```
   - **If we skip it:** Empty spaces in the color field create invalid CSS styles in the browser.

4. **Obsolete documentation artifact `PR.md` remains in branch** (`.agents/tasks/feature/plugin-calendar-task-color/PR.md`)
   - **What this is:** `PR.md` was drafted for the initial standalone extension (`calendar-colored`), which was deleted in commit `63569c6`.
   - **Problem:** The file contains 67 lines describing how to install a deleted extension package, contradicting `create_pr.md` and cluttering the repository with dead documentation.
   - **Fix:** Delete `PR.md`.
   - **If we skip it:** Contributors and reviewers will read conflicting instructions about whether this feature is an extension or a core patch.

5. **Missing `README.md` for patch and component usage** (`SPEC.md:15`)
   - **What this is:** SPEC requirement line 15 states: *"Then create README.md to module/component code with how to use this."*
   - **Problem:** The original `README.md` inside `extensions/calendar-colored` was deleted along with the extension, and no guide was created in `patches/` or project documentation to explain how to apply the patch.
   - **Fix:** Create a concise `patches/README.md` describing how to apply `directus-calendar-highlight-color.patch` and configure `highlight_color` on collections.
   - **If we skip it:** The SPEC requirement remains incomplete, leaving users without instructions on how to use the patch.

6. **Russian instructions added to `AGENTS.md` violate language requirement** (`AGENTS.md:3-4`)
   - **What this is:** Commit `e9ccf0b` added a Russian-language rule stating that custom fields must be capitalized (`Color` instead of `color`).
   - **Problem:** SPEC explicitly requires *"English only for all files in this branch"*, and the rule itself contradicts the `highlight_color` snake_case parameter chosen for this feature.
   - **Fix:** Remove lines 3-5 in `AGENTS.md` or translate to English and align with current guidelines.
   - **If we skip it:** Violates the SPEC language requirement and leaves incorrect naming instructions for future automation.

7. **Root `.gitignore` deleted in branch diff** (`.gitignore`)
   - **What this is:** Branch diff shows `.gitignore` deleted compared to `master`.
   - **Problem:** Without `.gitignore`, running build commands or installing tools risks accidentally staging hundreds of `node_modules` files into git.
   - **Fix:** Restore `.gitignore` containing `node_modules`.
   - **If we skip it:** Unintended local dependencies risk being committed to the repository.

---

## Nice to have

8. **Replace `forEach` with `.some()` in fields lookup** (`patches/directus-calendar-highlight-color.patch:10-14`)
   - **What this is:** The patch loops through all collection fields with `forEach` to push `'highlight_color'`.
   - **Problem:** `forEach` iterates through every single field without early exit even after finding the match.
   - **Fix:** Use:
     ```ts
     if (fieldsInCollection.value.some((f: Field) => f.field === 'highlight_color')) {
         fields.push('highlight_color');
     }
     ```
   - **If we skip it:** Minor inefficiency on schema inspection.

9. **Incomplete task report for Steps 13 through 16** (`report.md`)
   - **What this is:** `report.md` documents only Steps 1 through 12, omitting Steps 13 through 16 recorded in `plan.md`.
   - **Problem:** The execution log does not reflect the migration to `highlight_color` and the core Directus patch.
   - **Fix:** Add sections for Steps 13-16 to `report.md`.
   - **If we skip it:** Audit trail in `report.md` remains incomplete.

---

## Summary Metrics

- **Verdict:** `fix 1, 2, 3, 4, 5 first.`
- **Lean:** -73 lines possible (delete obsolete `PR.md`, remove stale rule in `AGENTS.md`, streamline patch loop).
- **Not checked:** FullCalendar v6 theme CSS overrides in custom third-party Directus themes.
