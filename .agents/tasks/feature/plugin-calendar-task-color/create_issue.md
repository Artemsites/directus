# Feature Request: Native Calendar Layout Task Card Coloring via `highlight_color`

## Problem Statement

When managing date-driven collections in Directus (such as tasks, milestones, shifts, bookings, or editorial calendars), teams frequently categorize items by priority, team member, status, or category using color coding.

While Directus provides flexible schema fields and interface displays, the built-in **Calendar** layout (`app/src/layouts/calendar`) renders all event pills in a single uniform color. Users cannot visually distinguish between task types, urgency, or categories on the calendar without reading individual labels or clicking to open drawer details.

---

## Proposed Solution

Enhance the built-in Directus **Calendar Layout** (`app/src/layouts/calendar`) to support custom item coloring:

1. **Native `highlight_color` Parameter Support**:
   - Inspects collection records for a `highlight_color` field containing a hex string (e.g. `#10B981`, `#EF4444`, `#3B82F6`) or standard CSS color.
   - Passes `color: highlightColor` directly to FullCalendar event objects (`FullCalendar.EventInput`).
2. **Automatic Field Projection**:
   - Automatically appends `highlight_color` to queried fields in `fields` computation whenever present in the collection schema.
3. **Zero Breaking Changes**:
   - Collections without `highlight_color` continue to render with default theme styling without any disruption.
   - Trims and validates color strings so whitespace does not create invalid CSS styles.

---

## Use Cases

- **Task & Sprint Management**: Categorize tasks by urgency or team (Red = Urgent, Blue = Development, Green = QA).
- **Resource & Shift Scheduling**: View shifts colored by department or employee.
- **Event & Editorial Deadlines**: Differentiate publication types or release channels at a glance.

---

## Reference Implementation & Patch

A clean git patch has been prepared against `directus/directus`:
- File: `patches/directus-calendar-highlight-color.patch`
- Touches only `app/src/layouts/calendar/index.ts`.
- Verified live on Directus 12.x.
