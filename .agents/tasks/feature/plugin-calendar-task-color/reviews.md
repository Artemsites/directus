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
