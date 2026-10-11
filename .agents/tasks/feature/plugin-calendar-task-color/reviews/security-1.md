# Security Audit Report: Layout Extension `calendar-colored` and `Tasks` Data Schema

**Date:** 2026-10-11  
**Branch:** `feature/plugin-calendar-task-color`  
**Commit:** `8a091db` (HEAD)  
**Auditor:** Subagent Security Reviewer (`pro` / `security`)  
**Audit Targets:**
- `extensions/calendar-colored/src/layout.vue`
- `extensions/calendar-colored/src/index.ts`
- `extensions/calendar-colored/package.json`
- `database/schema.yaml`

---

## 1. Overall Verdict

### **VERDICT: WARNINGS (Non-blocking)**

- 🔴 **Critical / High:** **0** — No critical or exploitable vulnerabilities (RCE, SQLi, Stored/Reflected XSS, Open Redirect) detected.
- 🟡 **Medium:** **1** — Excessive wildcard query `fields: ['*']` in API fetch (risk of leaking private/system data into browser memory).
- 🟢 **Low / Info:** **3** — Absence of server-side date range filtering in fetch (over-fetching/under-fetching risk when $N > 500$), unescaped `props.collection` in API query URL, hard page reload via `window.location.href` instead of SPA router.

The codebase is resilient against code execution and injection vectors. There are no blocking vulnerabilities for trusted Directus environments; however, restricting query fields and adding date filtering are recommended for production readiness.

---

## 2. Detailed Aspect Breakdown

### 2.1. XSS (Cross-Site Scripting) & Markup Injection
- **Status:** ✅ **SECURE**
- **Analysis:**
  1. **Text Interpolation (`src/layout.vue:73`):**
     ```vue
     <span class="event-title">{{ item.Title || item.name || `Task #${item.id}` }}</span>
     ```
     Uses standard Vue `{{ }}` interpolation, which automatically escapes HTML entities (`textContent`). Raw HTML rendering via `v-html` is absent.
  2. **Tooltips (`src/layout.vue:70, 337-350`):**
     The `:title="getEventTooltip(item)"` attribute binds directly to the DOM property `title`. Browsers display it as plaintext without parsing `<script>` or `<img>` tags.
  3. **CSS / Style Injection (`src/layout.vue:69, 328-335`):**
     Styles are bound through Vue's object syntax `:style="getEventStyle(item)"`:
     ```ts
     return {
         backgroundColor: bgColor,
         color: textColor,
     };
     ```
     In Vue 3, object styles are applied via direct DOM property assignments (`element.style.setProperty`), preventing arbitrary CSS injection or breakout through quotes/semicolons.
  4. **Color Contrast Calculation (`src/layout.vue:305-325`):**
     The `getContrastTextColor` function strictly validates inputs (`typeof hexColor !== 'string'` → fallback), uses safe allowlists for named colors, and relies on mathematical YIQ luminance, returning only static literals `#ffffff` or `#0f172a`.

---

### 2.2. Directus API Queries, DoS & Memory Exhaustion
- **Status:** ⚠️ **WARNINGS**
- **Analysis:**
  1. **Query Bound Limit (`src/layout.vue:157`):**
     ```ts
     const response = await api.get(`/items/${props.collection}`, {
         params: {
             limit: 500,
             fields: ['*'],
         },
     });
     ```
     The previous critical risk `limit: -1` (unbounded query) was resolved by enforcing a strict upper bound of `limit: 500`. This prevents Node.js Out of Memory crashes.
  2. **Missing Date Window Filter (Low/Perf):**
     The request lacks date range filtering on `Start` and `End`. If a collection has more than 500 tasks, only the first 500 records are retrieved. If browsing future periods, tasks might be omitted. A windowed date filter is recommended.
  3. **Collection URL Concatenation (`src/layout.vue:155`):**
     Uses template literal `/items/${props.collection}` without `encodeURIComponent(props.collection)`. Following Defense in Depth, wrapping in `encodeURIComponent` is recommended.

---

### 2.3. Data Leakage & Permissions (RBAC)
- **Status:** ⚠️ **WARNING (Medium)**
- **Analysis:**
  1. **Wildcard Field Fetch (`src/layout.vue:158`):**
     The query `fields: ['*']` requests all readable fields.
     *Risk:* If `Tasks` contains sensitive internal fields (manager notes, PII, large text descriptions), they are transmitted over the network and retained in client memory, even though the layout only displays `id`, `Title`, `Start`, `End`, `Color`, and `Status`.
     *Recommendation:* Restrict to minimal required fields:
     ```ts
     fields: ['id', 'Title', 'name', 'Start', 'End', 'Color', 'color', 'Status']
     ```
  2. **Authorization (Directus RBAC):**
     `api.get` uses `useApi()` from `@directus/extensions-sdk`, which automatically transmits active session credentials (Bearer token / cookies). Directus enforces role permissions on the server. Unauthorized access returns HTTP 403 Forbidden.

---

### 2.4. Navigation Security & Open Redirects
- **Status:** ✅ **SECURE**
- **Analysis (`src/layout.vue:353-360`):**
  ```ts
  const openItem = (item: TaskItem) => {
      if (!item?.id || !props.collection) return;
      const col = encodeURIComponent(String(props.collection));
      const id = encodeURIComponent(String(item.id));
      const targetUrl = `/admin/content/${col}/${id}`;
      window.location.href = targetUrl;
  };
  ```
  1. `props.collection` and `item.id` are cast to strings and wrapped in `encodeURIComponent`.
  2. The target URL is a fixed absolute path prefixed with `/admin/content/`.
  3. Path traversal (`../`) and pseudoprotocols (`javascript:`, `data:`) are impossible.
  4. Protocol-relative open redirects (`//attacker.com`) are prevented because `/` characters are escaped to `%2F`.

---

### 2.5. Prototype Pollution & ReDoS
- **Status:** ✅ **SECURE**
- **Analysis:**
  1. **Prototype Pollution:** No deep merge operations, uncontrolled `Object.assign`, or assignments to `__proto__` / `constructor.prototype`. All objects are constructed with safe literals.
  2. **ReDoS:** No regular expressions are used in the extension codebase. String and date parsing use native `slice`, `parseInt`, and `Date` constructor. Backtracking risk is zero.
  3. **Computational Complexity:** Cell mapping loop runs in $O(\text{cells} \times N) \le 42 \times 500 = 21\,000$ operations, completing in 1–5 ms without blocking the browser Event Loop.

---

### 2.6. Database Schema (`database/schema.yaml`)
- **Status:** ✅ **SECURE**
- **Analysis:**
  - Added `Tasks.Color`:
    - `type: string`, `data_type: varchar(255)`, `is_nullable: true`.
    - `interface: select-color`, `display: color`.
    - Field name follows project standard: uppercase `Color`.
  - Removed deprecated `Tasks.name` field (superseded by `Title`).
  - Queries are executed through Knex parameterized queries in Directus core, preventing SQL injection.

---

### 2.7. Third-Party Dependencies & Supply Chain
- **Status:** ✅ **SECURE**
- **Analysis of `package.json`:**
  - Zero runtime dependencies in `dependencies`.
  - Standard official packages in `devDependencies`:
    - `@directus/extensions-sdk`: `18.0.6`
    - `typescript`: `^5.4.5`
    - `vue`: `^3.5.43`
  - Audit result:
    ```bash
    npm audit --prefix extensions/calendar-colored
    # found 0 vulnerabilities
    ```

---

## 3. Findings Matrix

| ID | Severity | Category | File:Line | Description | Evidence / Code |
|:---|:---|:---|:---|:---|:---|
| **SEC-01** | 🟡 Medium | Data Leakage / Privacy | `src/layout.vue:158` | Wildcard query `fields: ['*']` sends hidden/heavy collection attributes to browser | `fields: ['*']` |
| **SEC-02** | 🟢 Low | Performance / DoS | `src/layout.vue:155-160` | Absence of date range filter in `api.get` risks incomplete event rendering when $N > 500$ | `params: { limit: 500, fields: ['*'] }` |
| **SEC-03** | 🟢 Low | Defense in Depth | `src/layout.vue:155` | Unescaped collection name interpolation in API query path | ``/items/${props.collection}`` |
| **SEC-04** | ℹ️ Info | UX / SPA Navigation | `src/layout.vue:359` | Hard reload via `window.location.href` resets SPA state instead of client-side routing | `window.location.href = targetUrl;` |

---

## 4. Remediation Recommendations

### Recommendation 1 (Targeted for Step 11): Restrict Query Fields
Replace wildcard `fields: ['*']` with the minimal set of required fields:
```ts
const response = await api.get(`/items/${encodeURIComponent(String(props.collection))}`, {
    params: {
        limit: 500,
        fields: ['id', 'Title', 'name', 'Start', 'End', 'Color', 'color', 'Status'],
    },
});
```

### Recommendation 2: Date Range Filtering
Add date boundaries corresponding to the active calendar window:
```ts
filter: {
    _and: [
        { Start: { _lte: periodEndDate } },
        { _or: [{ End: { _gte: periodStartDate } }, { End: { _null: true } }] }
    ]
}
```

---

## 5. Conclusion

The implementation in branch `feature/plugin-calendar-task-color` satisfies core secure development standards:
1. XSS vectors are neutralized via Vue template bindings.
2. Directus API access is guarded by RBAC and bounded by `limit: 500`.
3. Navigation in `openItem` is sanitized against path traversal and open redirects.
4. Schema field `Color` is properly typed and adheres to project conventions.
5. Zero dependency vulnerabilities detected.

Report ready for integration into `plan.md` to complete Step 9.

