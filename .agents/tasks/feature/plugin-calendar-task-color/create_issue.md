# Feature Request: Colored Calendar Layout Extension for Directus

## Problem Statement

When managing date-driven collections in Directus (such as tasks, milestones, shifts, bookings, or editorial calendars), teams frequently categorize items by priority, team member, status, or category using color coding.

While Directus provides flexible schema fields and interface displays, there is currently no built-in layout that visually renders calendar events using each item's individual color attribute with automatic, accessible text contrast styling. Users viewing multiple overlapping or adjacent tasks in a calendar must read text labels or open individual detail drawers to identify task categories.

---

## Proposed Solution

Introduce a dedicated **Colored Calendar Layout** (`layout-calendar-colored` / `calendar-colored`) for Directus that:

1. **Renders Dynamic Per-Item Color Coding**:
   - Inspects each record for a color attribute (`Color` or `color` hex string e.g. `#10B981`, `#EF4444`, `#3B82F6`).
   - Falls back gracefully to Directus brand primary (`#2ECDA7`) when not defined.
2. **Computes WCAG-Compliant Text Contrast Automatically**:
   - Calculates background luminance using the YIQ relative formula to dynamically apply dark (`#0f172a`) or light (`#ffffff`) text color, ensuring badges remain readable across pastel, dark, and bright tones.
   - Supports 3-digit, 6-digit, 8-digit hex strings and named CSS colors.
3. **Supports Date Ranges and Timeframes**:
   - Spans multi-day events across dates when both `Start` and `End` dates are provided.
   - Handles epoch timestamps (`1789940640000`), ISO strings, and date-only formats (`YYYY-MM-DD`) without UTC timezone day-shifts.
4. **Integrates Seamlessly into Directus Admin SPA**:
   - Uses Directus client routing (`useRouter().push`) for instant item navigation without full browser reloads.
   - Implements bounded, field-whitelisted API queries (`limit: 500`, specific `fields`) preventing overfetching or memory bloat.

---

## Use Cases

- **Task & Sprint Management**: Categorize tasks by urgency or team (Red = Urgent, Blue = Development, Green = QA).
- **Resource & Shift Scheduling**: View shifts colored by department or employee.
- **Event & Editorial Deadlines**: Differentiate publication types or release channels at a glance.

---

## Alternatives Considered

- **Standard Table or Kanban Layouts**: Provide color tags via display interfaces, but do not provide a calendar timeline view.
- **Custom CSS overrides**: Difficult to maintain, cannot inspect dynamic item fields per row/card, and does not dynamically calculate readable contrast text colors.

---

## Technical Feasibility & Reference Implementation

A fully functional, security-audited reference implementation has been developed and validated against Directus 10+:
- Built as an official Directus Layout Extension using `@directus/extensions-sdk`.
- Zero runtime dependencies outside Vue 3 / Directus core.
- Passes end-to-end security audits (XSS sanitization, parameter URL encoding, bounded query projection).

We are ready to submit a pull request with the complete extension package or documentation on publishing to the Directus Extensions Registry.
