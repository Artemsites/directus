# Directus Proposal: Colored Calendar Layout Extension

> **Artifact:** GitHub Issue & Pull Request draft for Directus maintainers.  
> **Target Repositories:** `directus/directus` (core layout enhancement / issue discussion) or `directus/extensions` / community registry.

---

## Part 1: GitHub Issue (Feature Request / Proposal)

### Title
`[Feature Request]: Dynamic item coloring support in Calendar layout (or dedicated Colored Calendar extension)`

### Issue Description

#### Problem Statement / Use Case
In project management, event scheduling, and resource allocation workflows managed via Directus, visual categorization by status, priority, or category is essential.
Currently, the standard built-in Calendar layout displays all item events with a single static theme color (or uniform accent color). Users cannot easily differentiate tasks or events at a glance by custom attributes (such as task priority, category, or dedicated `Color` / `color` fields).

#### Proposed Solution
Provide first-class visual color coding for calendar events:
1. **Dynamic Field Binding:** Allow the calendar layout to bind event pill background colors to an existing color field in the collection (e.g. `select-color` interface).
2. **Accessible Text Contrast:** Automatically compute text color (dark `#0f172a` vs light `#ffffff`) using WCAG YIQ relative luminance formula (`(r * 299 + g * 587 + b * 114) / 1000 >= 128`) to guarantee AA/AAA readability against custom background colors.
3. **Graceful Fallback:** Use the standard Directus brand primary color (`#2ECDA7`) when an item has no explicit color defined.

#### Alternatives Considered
- *Custom CSS overrides in project theme:* Not scalable across multiple collections, difficult for non-technical administrators to maintain.
- *Separate Kanban/Table views:* Lacks the temporal chronological context provided by a calendar view.

---

## Part 2: Pull Request (PR) Description

### Title
`feat(extensions): add Colored Calendar layout extension with WCAG contrast calculation`

### Description

#### Summary of Changes
This pull request introduces a custom Directus Layout Extension (`calendar-colored`) providing a full-featured calendar layout with item-level dynamic color coding.

- **Layout Definition (`src/index.ts`):** Registered layout extension with id `calendar-colored`, title `Colored Calendar`, and material icon `calendar_month`.
- **Dynamic Color Support (`src/layout.vue`):** Reads the collection's `Color` or `color` field (supporting standard `select-color` interfaces or raw hex strings).
- **Automated Contrast Ratio Calculation:** Implements YIQ luminance formula to dynamically toggle white or slate-dark text depending on background lightness, preventing unreadable low-contrast pills.
- **Multiple Calendar Views:** Includes responsive Month and Week views, current-period range headers, and rapid "Today" navigation.
- **Direct Navigation:** Clicking an event pill navigates directly to the Directus item edit view (`/admin/content/:collection/:id`).
- **Resilient Fallback:** Automatically defaults to `#2ECDA7` for events without a configured color value.

#### Technical Details
- **Tech Stack:** Vue 3, TypeScript, `@directus/extensions-sdk`.
- **Bundle Size:** Lightweight (<12 KB minified JS bundle).
- **Dependencies:** Pure native JS calculations for dates and luminance; no heavy third-party calendar libraries required.

#### How to Test
1. Mount or install the extension into Directus `extensions/calendar-colored`.
2. Ensure target collection (e.g., `Tasks`) contains:
   - Date field (e.g., `Start` or `date_created`)
   - Optional Color field with `select-color` interface (e.g., `Color`)
3. Navigate to Collection Settings -> Layout and switch to **Colored Calendar**.
4. Observe event pills render with their respective custom hex colors and optimal text contrast.
5. Click an event pill to confirm proper routing to the item edit drawer/page.

#### Checklist
- [x] Conforms to Directus extension guidelines and TypeScript standards.
- [x] Includes fallback behavior for items missing date or color attributes.
- [x] Passes build verification (`directus-extension build`).
- [x] Tested against Directus 12.x running on Docker.
