# Pull Request: Colored Calendar Layout Extension

## Description

This PR introduces the **Colored Calendar** layout extension (`calendar-colored`) for Directus. It enables collections with date attributes to be visualized on an interactive calendar grid with per-item dynamic background coloring and automated WCAG text contrast calculation.

---

## Key Features

- **Per-Record Color Coding**: Inspects individual record attributes (`Color` or `color` field) and applies custom background colors to event pills.
- **Dynamic Text Contrast**: Computes YIQ luminance on the fly, rendering accessible high-contrast text (`#0f172a` for light tones, `#ffffff` for dark tones) across 3-digit, 6-digit, 8-digit hex colors and CSS named colors.
- **Date Spanning & Range Support**: Correctly renders events spanning across multi-day ranges (`Start` to `End`).
- **Robust Date Parsing**: Normalizes ISO datetime strings, date-only strings (`YYYY-MM-DD` without UTC day-shifts), and numeric epoch timestamps.
- **Client-Side SPA Routing**: Integrates with Vue Router (`useRouter().push`) with safe fallback, navigating instantly to the item edit drawer without triggering full browser reloads.
- **Optimized & Secure Queries**: Strict whitelist projection (`fields: ['id', 'Title', 'title', 'name', 'Start', 'start', 'End', 'end', 'Color', 'color', 'Status', 'status']`) and bounded query limit (`limit: 500`) to prevent overfetching.
- **Zero Runtime Dependencies**: Pure Vue 3 / `@directus/extensions-sdk` implementation with zero external runtime packages.

---

## Type of Change

- [x] New feature (non-breaking change which adds layout functionality)
- [x] Documentation update (includes dedicated `README.md`)

---

## Technical Details

- **Extension Type**: `layout`
- **Source Location**: `extensions/calendar-colored/`
- **Bundle Output**: `extensions/calendar-colored/dist/index.js`
- **Target Directus Host**: `>= 10.10.0`

---

## How Has This Been Tested?

1. **Directus Runtime Verification**:
   - Tested inside standard Directus Docker container.
   - Extension loads cleanly with status `Loaded extensions: layout calendar-colored`.
2. **Schema & Compatibility Testing**:
   - Tested on `Tasks` collection with custom `Color` field (`#10B981`, `#3B82F6`, `#EF4444`).
   - Verified that missing optional fields (`Color`, `End`) fall back safely without console errors.
3. **Security Audit**:
   - Double-audited by dedicated security reviews (`security-1.md` and `security-2.md`).
   - Confirmed safe from XSS (Vue template escaping), parameter tampering (URL encoding), and information leakage (whitelisted field queries).
4. **Clean Code & Architecture Audit**:
   - Verified against KISS/YAGNI principles via ponytail audit (`ponytail.md`).
   - Memory-optimized cell rendering ($O(N)$ string key comparison instead of repeated Date allocations).

---

## Reviewer Verification Steps

1. Build extension bundle:
   ```bash
   cd extensions/calendar-colored
   npm install
   npm run build
   ```
2. Link or copy `extensions/calendar-colored` into your Directus project's `extensions/` directory.
3. Start Directus:
   ```bash
   docker compose up -d
   ```
4. Navigate to any collection with date fields (e.g. `Tasks`).
5. Select **Colored Calendar** from the layout switcher in the top right.
6. Verify event pills display with their respective colors, contrast text, and click-through navigation.
