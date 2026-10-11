# Directus Colored Calendar Layout Extension

A custom layout extension for [Directus](https://directus.io) that renders collection items in an interactive calendar view with per-item custom color coding.

---

## Features

- **Custom Item Colors**: Displays each event/task with its own color badge (supports `#RRGGBB` hex codes or standard CSS color values).
- **Date Range Support**: Supports both single-date events and multi-day events (`Start` to `End` date).
- **Direct Navigation**: Clicking any event in the calendar navigates directly to the item editor in Directus.
- **Month Navigation**: Easy switching between months with previous/next controls and a "Today" shortcut.
- **Graceful Fallbacks**: Default colors and timestamps if optional fields (`Color`, `End`) are absent.

---

## Collection Schema Requirements

To use this layout on a collection (e.g., `Tasks`), ensure the collection contains the following fields:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Title` | String (`string`) | Yes | Event or task name displayed on the badge. |
| `Start` | DateTime (`dateTime` / `timestamp`) | Yes | Event start timestamp. |
| `End` | DateTime (`dateTime` / `timestamp`) | No | Event end timestamp (if omitted, `Start` date is used). |
| `Color` | String (`string`) | No | Hex color code (e.g., `#3B82F6`, `#10B981`, `#EF4444`). |
| `Status` | String (`string`) | No | Item workflow status (optional). |

> **Note**: Field names are case-insensitive with fallback checks (`Title` / `title` / `name`, `Start` / `start`, `End` / `end`, `Color` / `color`).

---

## Installation & Setup

### 1. Build Extension

From the root of your Directus project or within the extension directory:

```bash
cd extensions/calendar-colored
npm install
npm run build
```

The compiled extension bundle will be output to `extensions/calendar-colored/dist/index.js`.

### 2. Configure Directus

If using Docker Compose:
```yaml
services:
  directus:
    # ...
    volumes:
      - ./extensions:/directus/extensions
```

Restart Directus to register the extension:
```bash
docker compose restart directus
```

---

## How to Use in Directus

1. Open Directus App in your browser (`http://localhost:8055`).
2. Navigate to your collection (e.g., **Tasks**).
3. In the top right header, click the **Layout** selector dropdown (defaults to "Table").
4. Select **Colored Calendar**.
5. Your items will appear on the calendar grid, color-coded by their `Color` attribute.
6. Click any event chip to open the item detail view.

---

## Development

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Watch mode for active development
npm run dev
```

---

## License

MIT
