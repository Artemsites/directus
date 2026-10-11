# Pull Request: Support `highlight_color` for Task Card Coloring in Native Calendar Layout

## Description

This PR enhances the built-in **Calendar** layout (`app/src/layouts/calendar`) to natively color event pills using a record's `highlight_color` (with fallback to `Color` or `color`) attribute.

---

## Key Changes

1. **FullCalendar Event Color Integration** (`app/src/layouts/calendar/index.ts`):
   - In `createEvent`, inspects the item for `highlight_color || Color || color`.
   - Passes `color: highlightColor` directly into FullCalendar's event object.
2. **Dynamic Field Inclusion**:
   - In `fields` computation, automatically requests `highlight_color`, `Color`, and `color` whenever present in the collection schema so that color attributes are always populated without requiring manual template configuration.
3. **Types Update** (`app/src/layouts/calendar/types.ts`):
   - Exposes optional `colorField` in `LayoutOptions`.

---

## Patch File

A companion git patch is provided in:
`patches/directus-calendar-highlight-color.patch`

```diff
--- a/app/src/layouts/calendar/index.ts
+++ b/app/src/layouts/calendar/index.ts
@@ -82,6 +82,12 @@ export default defineLayout<LayoutOptions>({
 			if (endDateField.value) {
 				fields.push(endDateField.value);
 			}
+
+			// Include highlight_color if present on collection for task card coloring
+			const hasHighlightColor = fieldsInCollection.value.some((f: Field) => ['highlight_color', 'Color', 'color'].includes(f.field));
+			if (hasHighlightColor) {
+				fields.push('highlight_color', 'Color', 'color');
+			}
 
 			return [...fields, ...adjustFieldsForDisplays(fields, collection.value)];
 		});
@@ -107,11 +113,13 @@ export default defineLayout<LayoutOptions>({
 
 			const id = item[primaryKeyField.value.field];
 			const eventId = isVersioned.value ? item.$meta?.version_id : id;
+			const highlightColor = item.highlight_color || item.Color || item.color;
 
 			return {
 				id: eventId,
 				title: renderDisplayStringTemplate(collection.value, template.value || `{{ ${primaryKeyField.value.field} }}`, item) || item[primaryKeyField.value.field],
 				start: item[startDateField.value],
 				end,
 				allDay,
+				color: highlightColor ? String(highlightColor) : undefined,
 				className: selection.value.includes(eventId) ? 'selected' : undefined,
 			};
 		}
```

---

## Verification & Testing

- Verified against Directus 12.0.2 running in Docker.
- Tasks collection with `highlight_color: "#10b981"` correctly displays colored event pills in standard FullCalendar view.
- Collections without color fields continue to render with default theme styling without regressions.
