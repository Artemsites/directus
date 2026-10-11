# Pull Request: Support `highlight_color` for Task Card Coloring in Native Calendar Layout

## Description

This pull request enhances Directus built-in **Calendar** layout (`app/src/layouts/calendar`) to natively color event pills using a record's `highlight_color` attribute.

---

## Key Changes

1. **FullCalendar Event Color Integration** (`app/src/layouts/calendar/index.ts`):
   - In `createEvent`, inspects the item for `highlight_color`.
   - Safely trims string values to prevent whitespace-only invalid CSS values.
   - Passes `color: highlightColor` directly into FullCalendar's event object (`color` attribute).
2. **Dynamic Field Inclusion**:
   - In `fields` computation, automatically requests `highlight_color` whenever present in the collection schema so that color values are populated without requiring manual template configuration.
3. **Zero Regressions / Breaking Changes**:
   - Collections without `highlight_color` continue to render using standard theme styling.
   - Restricted users who lack permission for `highlight_color` have the field excluded from queries, avoiding 403 Forbidden errors.

---

## Patch File

A companion git patch is provided in:
`patches/directus-calendar-highlight-color.patch`

```diff
diff --git a/app/src/layouts/calendar/index.ts b/app/src/layouts/calendar/index.ts
--- a/app/src/layouts/calendar/index.ts
+++ b/app/src/layouts/calendar/index.ts
@@ -82,6 +82,11 @@ export default defineLayout<LayoutOptions>({
 			if (endDateField.value) {
 				fields.push(endDateField.value);
 			}
+
+			// Include highlight_color if present on collection for task card coloring
+			if (fieldsInCollection.value?.some((f: Field) => f.field === 'highlight_color')) {
+				fields.push('highlight_color');
+			}
 
 			return [...fields, ...adjustFieldsForDisplays(fields, collection.value)];
 		});
@@ -107,11 +112,15 @@ export default defineLayout<LayoutOptions>({
 
 			const id = item[primaryKeyField.value.field];
 			const eventId = isVersioned.value ? item.$meta?.version_id : id;
+			const highlightColor = typeof item.highlight_color === 'string' && item.highlight_color.trim().length > 0
+				? item.highlight_color.trim()
+				: undefined;
 
 			return {
 				id: eventId,
 				title: renderDisplayStringTemplate(collection.value, template.value || `{{ ${primaryKeyField.value.field} }}`, item) || item[primaryKeyField.value.field],
 				start: item[startDateField.value],
 				end,
 				allDay,
+				color: highlightColor,
 				className: selection.value.includes(eventId) ? 'selected' : undefined,
 			};
 		}
```

---

## Verification & Testing

- Verified against Directus 12.0.2 running in Docker.
- Tasks collection with `highlight_color: "#10b981"` correctly displays colored event pills in standard FullCalendar view.
- Collections without color fields continue to render with default theme styling without regressions.
