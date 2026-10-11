# Review Findings for Branch `feature/plugin-calendar-task-color`

## 1. Security Review (Subagent `f01b91be-e78d-4d54-8a68-7eb7e3e71e1f`)

### Summary
- 🔴 **High (1):** Unbounded query `limit: -1` without date filtering (risk of Node.js server memory exhaustion and browser tab freeze with 50k+ records).
- 🟡 **Medium (3):** 
  - Vue component runtime crash on non-string values (`item.Color`, `item.Start` as numbers/objects caused `TypeError: .slice/.startsWith is not a function`).
  - Supply chain error in `package.json`: invalid version `"typescript": "^7.0.2"` (TypeScript is currently on 5.x).
  - Navigation via `window.location.href` resets Directus SPA state and does not escape URI parameters.
- 🟢 **Low (2):** 
  - Short 3-digit hex colors (`#fff`) broke YIQ luminance calculation, producing invisible white text on a white background.
  - In-place mutation of `Date` objects in week header calculations across month boundaries.
- ℹ️ **Info (2):** 
  - Hard-coded field names without layout options in `defineLayout`.
  - XSS safety verified: Vue template interpolation and DOM `title`/`style` are secure.

---

## 2. Ponytail Review (Clean Code & Architecture, Subagent `d7dc10dc-1c85-4fdb-91f6-0b2702b31095`)

### Must Fix
1. **Week boundary corruption across month transitions** (`src/layout.vue:175-178`): `curr.setDate(first)` mutates date in-place, corrupting the week interval.
2. **Month navigation stall on days 29–31** (`src/layout.vue:186, 196`): calling `d.setMonth(d.getMonth() - 1)` on day 31 skips short months. Explicit `d.setDate(1)` is required.
3. **Invisible text on 3-character hex colors** (`src/layout.vue:294-303`): `#fff` treated as dark background (YIQ=85) and sets text color to white. 6-character expansion required.
4. **Timezone date drift from UTC string slicing** (`src/layout.vue:285, 318`): `item.Start.slice(0, 10)` reads UTC date, whereas calendar cells display local browser time.
5. **Full database table fetch** (`src/layout.vue:147-152`): `limit: -1` without date range filter.

### Should Fix
6. Hard page reload in `openItem` instead of `router.push`.
7. Multi-day tasks vanishing after day one (evaluating only `Start`, ignoring `End`).
8. Hard-coded fields (`'Start'`, `'Title'`, `'Color'`) without configurable layout options.
9. Quadratic loop $O(\text{cells} \times N)$ in `calendarCells` (optimize via `Map<dateKey, TaskItem[]>`).
10. Absence of automated unit tests for date math and contrast calculations.

### Ponytail Verdict:
- `Verdict: fix 1, 2, 3, 4, 5 first.`
- `Lean: -40 lines possible.`

---

## 3. Security Review Round 3 (Subagent `eb04d023-385b-49e2-bbf6-af423f9a0ba1`)

### Verdict: PASS
- 0 Critical, 0 High, 0 Medium issues.
- CSS/JS injection & XSS: Safe. FullCalendar binds `color` via CSSOM properties safely.
- RBAC: Validated that `fieldsInCollection` respects Directus permissions.
- Operational note: Hunk header line-count corrected in `patches/directus-calendar-highlight-color.patch`.

---

## 4. Ponytail Architecture & Clean Code Review Round 2 (Subagent `31392bf0-4442-4692-8cf0-3df92390c780`)

### Summary & Actions:
- **Cleaned patch**: removed dead `types.ts` diff, added string trimming for whitespace safety, used `.some()` check.
- **SSoT alignment**: synchronized patch, container runtime, `create_pr.md`, and `create_issue.md`.
- **Removed dead documentation**: deleted obsolete `PR.md` (-67 lines).
- **Added documentation**: created `patches/README.md` and module `README.md`.
- **Verdict**: PASS after resolutions.

---

## 5. Security Verification Round 4 (Subagent `c25d8b6a-1f75-48fa-94a8-5cf2630d8a1c`)

### Verdict: PASS
- Zero security vulnerabilities or regressions.
- Verified patch syntax applies cleanly with `0` rejects via both `git apply --check` and `patch --batch`.
- Whitespace input safely trimmed to prevent invalid inline styles.
- Obsolete files cleanly removed.
