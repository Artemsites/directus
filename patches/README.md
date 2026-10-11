# Directus Calendar Layout: Task Card Highlight Color Patch

This directory contains the official core patch for Directus that enables custom task card coloring in the built-in Calendar layout via a collection's `highlight_color` field.

---

## Patch Details

- **File:** `directus-calendar-highlight-color.patch`
- **Target Repository:** `directus/directus`
- **Target Files:** `app/src/layouts/calendar/index.ts`
- **Tested Versions:** Directus 12.0.x – 12.x

---

## How It Works

1. **Automatic Field Projection**: When viewing any collection in the Calendar layout, Directus inspects the collection schema. If a `highlight_color` field exists on the collection, it is automatically requested along with dates and titles.
2. **Native Event Coloring**: In FullCalendar, the `color` property of each event is set to the record's `highlight_color` string (e.g. `#10b981`, `#f59e0b`, `#3b82f6`).
3. **Safe Fallback**: Events without a `highlight_color` continue to render in the default theme color. Non-string or whitespace-only inputs are safely ignored without style breakage.

---

## How to Apply

### 1. In Directus Source Repository

To apply the patch to a clone of `directus/directus`:

```bash
git apply patches/directus-calendar-highlight-color.patch
pnpm --filter @directus/app build
```

### 2. In a Running Docker Container

If running the official Directus container image:

```bash
# Verify container name (e.g. directus-directus-1)
# Apply patch to app dist or rebuild frontend bundle
docker compose exec directus sh -c 'patch -p1 < /directus/patches/directus-calendar-highlight-color.patch'
```

---

## How to Configure in Directus Schema

To enable colored task cards on any collection (such as `Tasks`):

1. Go to **Settings** → **Data Model** → **Tasks**.
2. Create a new field:
   - **Type:** String (`varchar(255)`)
   - **Field Key:** `highlight_color`
   - **Interface:** Color (`select-color`)
   - **Display:** Color (`color`)
3. Open the collection view, switch layout to **Calendar**, and select:
   - **Start Date Field:** `Start` (or your date field)
   - **End Date Field:** `End` (optional)
4. Items with a `highlight_color` set will immediately render in their respective colors.
