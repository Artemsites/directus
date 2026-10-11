# Clean Code & Architecture Review: Layout Extension `calendar-colored`

**Date:** 2026-10-11  
**Branch:** `feature/plugin-calendar-task-color`  
**Reviewer:** Subagent Ponytail Reviewer (`pro` / `ponytail-reviewer`)  
**Scope:** Full branch diff against `master` (`git diff master...HEAD`):
- `extensions/calendar-colored/src/layout.vue`
- `extensions/calendar-colored/src/index.ts`
- `extensions/calendar-colored/package.json`
- `database/schema.yaml`

---

## What this change does

This branch adds a new custom `Color` field to the `Tasks` collection schema and implements a Directus layout extension named `calendar-colored`. The extension renders tasks across monthly and weekly calendar views, applying dynamic background colors with WCAG contrast text calculation, and links events directly to Directus item editing.

---

## Summary and Verdict

**Verdict:** `Simplify & fix 1, 2, and 3 first.`

- **Architecture:** The layout extension structure is minimal and correctly registered via `@directus/extensions-sdk`. Schema migration properly adheres to project naming rules (`Color`).
- **Bloat & Lean:** Overall lean footprint (only 3 core source files, zero runtime dependencies). However, there is redundant work in date processing, unnecessary full page reloads, and over-fetching of collection fields.
- **Scaling & Load:** Currently performs $O(\text{cells} \times N)$ parsing calculations on every render and fetches all fields without server-side date bounds, which degrades performance once collections exceed 500 items.

---

## Must Fix

1. **Epoch numeric timestamps fail date parsing and hide events** (`extensions/calendar-colored/src/layout.vue:134-140, 341-344`)
   - **What this is:** `getItemDateKey` and `getEventTooltip` convert task dates using `new Date(String(val))`.
   - **Problem:** Directus and SQLite frequently store datetime values as epoch milliseconds (`1789940640000`). Calling `new Date("1789940640000")` evaluates to `Invalid Date` (`NaN`) in JavaScript. All tasks with numeric timestamps fail parsing and are silently omitted from the calendar.
   - **Fix:** Parse numeric values as numbers:
     ```ts
     const d = typeof val === 'number' || /^\d+$/.test(String(val).trim())
         ? new Date(Number(val))
         : new Date(String(val));
     ```
   - **If we skip it:** Tasks stored with numeric timestamps in the database will never appear on the calendar.

2. **Full page reloads on task click break SPA state** (`extensions/calendar-colored/src/layout.vue:353-360`)
   - **What this is:** `openItem` opens the item edit form when a user clicks a calendar event pill.
   - **Problem:** It navigates via `window.location.href = targetUrl;`, triggering a full browser page refresh. This destroys the Directus single-page app state, reloads all assets and permissions, and causes a 1–3 second navigation lag instead of instant client-side routing.
   - **Fix:** Use Vue Router with fallback:
     ```ts
     import { useRouter } from 'vue-router';
     // In setup():
     const router = useRouter();
     const openItem = (item: TaskItem) => {
         if (!item?.id || !props.collection) return;
         const path = `/content/${encodeURIComponent(String(props.collection))}/${encodeURIComponent(String(item.id))}`;
         if (router) {
             router.push(path);
         } else {
             window.location.href = `/admin${path}`;
         }
     };
     ```
   - **If we skip it:** Every task click forces an expensive full-page reload, degrading user experience.

3. **Wildcard `fields: ['*']` over-fetches heavy data and slows down page** (`extensions/calendar-colored/src/layout.vue:155-160`)
   - **What this is:** `fetchItems` requests all fields for up to 500 tasks from the Directus API.
   - **Problem:** Tasks often contain large markdown descriptions, internal notes, and relations. Fetching all columns transfers megabytes of unused data into browser memory when the calendar only displays title, dates, status, and color.
   - **Fix:** Request only the required columns:
     ```ts
     params: {
         limit: 500,
         fields: ['id', 'Title', 'name', 'Start', 'End', 'Color', 'color', 'Status'],
     }
     ```
   - **If we skip it:** Large task descriptions waste bandwidth and memory, slowing down calendar rendering.

---

## Should Fix

4. **$O(\text{cells} \times N)$ Date parsing churn on every render cycle** (`extensions/calendar-colored/src/layout.vue:292-299`)
   - **What this is:** The `calendarCells` computed property filters all tasks for each grid cell.
   - **Problem:** In month view (up to 42 cells) with 500 tasks, the loop executes 21,000 iterations. Each iteration re-instantiates `new Date()` and formats date strings for `item.Start` and `item.End`, generating up to 42,000 temporary objects on every reactive change.
   - **Fix:** Precompute `startKey` and `endKey` once per item in a separate computed property or upon fetching items, so cell binding only compares cached string keys.
   - **If we skip it:** Noticeable UI stutters when switching months or resizing windows on collections with hundreds of tasks.

5. **No date range query parameters when navigating months** (`extensions/calendar-colored/src/layout.vue:151-167`)
   - **What this is:** The calendar queries items once on mount with `limit: 500`.
   - **Problem:** When navigating to future or past months, tasks will not appear if they are not in the first 500 records returned by the initial query.
   - **Fix:** Re-fetch or window items when `currentDate` changes, filtering `Start` and `End` between the start and end of the visible month/week window.
   - **If we skip it:** Users browsing beyond the initial 500 records will see blank calendar periods.

6. **ISO date-only strings shift by -1 day in western timezones** (`extensions/calendar-colored/src/layout.vue:125-139`)
   - **What this is:** `formatDateKey` uses local date methods (`getFullYear`, `getMonth`, `getDate`).
   - **Problem:** Date-only strings like `"2026-10-15"` are parsed by JavaScript as UTC midnight. In timezones west of UTC (e.g. UTC-4 to UTC-8), local time falls on the evening of October 14th, causing tasks to appear one day early.
   - **Fix:** When input starts with `YYYY-MM-DD`, extract the key directly with `String(val).slice(0, 10)` rather than converting through UTC `Date`.
   - **If we skip it:** Users in western timezones will see tasks placed on the wrong day.

7. **8-digit hex colors (`#RRGGBBAA`) fail contrast calculation** (`extensions/calendar-colored/src/layout.vue:318`)
   - **What this is:** `getContrastTextColor` determines text color based on background luminance.
   - **Problem:** Line 318 strictly requires `clean.length === 6`. Modern color pickers and palettes often return hex with alpha channels (`#2ECDA7FF`). Length 8 is rejected and defaults to `#ffffff` without contrast calculation.
   - **Fix:** Strip the alpha channel when length is 8:
     ```ts
     if (clean.length === 8) clean = clean.slice(0, 6);
     ```
   - **If we skip it:** 8-digit hex colors default to white text even on bright or light backgrounds.

---

## Potential Code Reductions (Lean & Clean)

8. **Delete redundant `isSameDay` helper function** (`extensions/calendar-colored/src/layout.vue:142-148`)
   - **What this is:** `isSameDay` compares year, month, and day between two Date instances.
   - **Problem:** Every cell already computes `cell.dateKey` (`"YYYY-MM-DD"`). Computing `todayKey = formatDateKey(new Date())` once allows checking `cell.dateKey === todayKey`.
   - **Fix:** Delete `isSameDay` and use `cell.dateKey === todayKey`.
   - **Savings:** **-7 lines** of dead code.

9. **Extract constant arrays out of render loops** (`extensions/calendar-colored/src/layout.vue:307-310`)
   - **What this is:** `namedDark` and `namedLight` arrays inside `getContrastTextColor`.
   - **Problem:** Allocated as new arrays inside the function on every event pill render.
   - **Fix:** Move arrays outside the component definition as module-level `const Set` instances.
   - **Savings:** Cleaner memory footprint and zero allocations during renders.

10. **Replace boilerplate description in package.json** (`extensions/calendar-colored/package.json:3`)
    - **What this is:** Package description says `"Please enter a description for your extension"`.
    - **Fix:** Replace with `"Colored calendar layout for Directus with task contrast styling"`.

11. **Configurable field mappings for upstream Directus PR** (`extensions/calendar-colored/src/layout.vue:86-96`, `src/index.ts`)
    - **What this is:** Field names `Start`, `End`, `Title`, `Color` are hardcoded.
    - **Problem:** Standard Directus collections use various field names (`date_start`, `due_date`, `color`).
    - **Fix:** When preparing upstream contribution (Step 12), expose layout options via `defineLayout` to allow users to select start, end, title, and color fields.

---

## Summary Metrics

- **Verdict:** `Simplify & fix 1, 2, and 3 first.`
- **Must Fix:** 3 findings (numeric timestamp parsing bug, full page reload SPA break, wildcard field over-fetching).
- **Should Fix:** 4 findings (cell mapping re-parsing, server date windowing, timezone date shift, 8-char hex support).
- **Lean:** **-20 lines** possible through helper deletion and string key reuse.
- **Not checked:** Upstream Directus extension marketplace packaging and npm publishing workflows.
