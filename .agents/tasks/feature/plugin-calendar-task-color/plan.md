# Plan: Directus Colored Calendar Extension and Color Field for Tasks
reviewer=owner auto_start=1

## Sessions
- Step 1: mid/medium
- Step 2: mid/medium
- Step 3: mid/high
- Step 4: lite/medium

- [x] Шаг 1: Add color selection field Color to Tasks collection
  - status: done, starts: 1
  - model: mid, effort: medium
  - diag: Color data missing in Tasks → add color field to Tasks schema via Directus API/schema
  - more:
    - 1.1 In Tasks collection, string field color created with select-color interface (palette + free hex selection)
    - 1.2 Created updated schema snapshot database/schema.yaml via standard directus schema snapshot command
    - 1.3 Field verified for read and write accessibility
  - tests:
    - docker compose -f /Users/artem/git_craft/_directus/docker-compose.yml exec directus npx directus schema snapshot -y /directus/database/schema.yaml - success_all
    - grep -q "color" /Users/artem/git_craft/_directus/database/schema.yaml - success_all
  - git_hash: 3f78eed

- [x] Шаг 2: Scaffold Layout Extension in extensions directory
  - status: done, starts: 1
  - model: mid, effort: medium
  - diag: extensions directory empty → create layout extension package structure
  - more:
    - 2.1 In extensions/calendar-colored, package.json created with directus:extension type (layout)
    - 2.2 Configured build script using @directus/extensions-sdk
    - 2.3 Created entry point src/index.ts registering layout contract: defineLayout
  - tests:
    - test -f /Users/artem/git_craft/_directus/extensions/calendar-colored/package.json - success_all
    - npm --prefix /Users/artem/git_craft/_directus/extensions/calendar-colored run build - success_all
  - git_hash: cc32f5e

- [x] Шаг 3: Implement calendar component with colored task cards and text contrast
  - status: done, starts: 1
  - model: mid, effort: high
  - diag: Base calendar does not color events → render cards with dynamic color and contrast calculation
  - more:
    - 3.1 Implemented Vue component for calendar grid (month/week) fetching Start, End, Title, Color
    - 3.2 Added WCAG YIQ relative luminance calculation (white on dark background, dark on light)
    - 3.3 Added fallback: default to #2ECDA7 when task has no color
    - 3.4 Implemented click navigation to task edit form
  - tests:
    - npm --prefix /Users/artem/git_craft/_directus/extensions/calendar-colored run build - success_all
    - test -f /Users/artem/git_craft/_directus/extensions/calendar-colored/dist/index.js - success_all
  - git_hash: b2d30ad

- [x] Шаг 4: Connect extension in Directus and verify in admin UI
  - status: done, starts: 1
  - model: lite, effort: medium
  - diag: Compiled extension in extensions → restart Directus and verify plugin loading
  - more:
    - 4.1 Restarted Directus container to load extension from mounted extensions directory
    - 4.2 Verified container logs for successful calendar-colored loading without errors
    - 4.3 Committed changes to Git (schema and extension source code)
  - tests:
    - docker compose restart directus - success_all
    - docker compose logs directus | grep "calendar-colored" - success_all
  - git_hash: 03ee647

- [x] Шаг 5: Migrate field color → Color per naming conventions
  - status: done, starts: 1
  - model: mid, effort: medium
  - diag: Requirement to capitalize custom fields → rename color to Color in Tasks
  - more:
    - 5.1 Field renamed to Color in Directus schema preserving existing data
    - 5.2 Updated layout.vue component and schema.yaml snapshot
  - tests:
    - bash -c "curl -s --noproxy '*' 'http://127.0.0.1:8055/items/Tasks/89?fields=id,Color'" - success_all
    - grep -q "Color" database/schema.yaml - success_all
  - git_hash: e9ccf0b

- [x] Шаг 6: Prepare Issue & PR proposals for Directus
  - status: done, starts: 1
  - model: lite, effort: low
  - diag: Request to draft proposal for Directus maintainers → format PR.md
  - more:
    - 6.1 Drafted Feature Request Issue text with problem and solution
    - 6.2 Drafted Pull Request description with summary and checklist
  - tests:
    - test -f .agents/tasks/feature/plugin-calendar-task-color/PR.md - success_all
  - git_hash: 12a5cca

- [x] Шаг 7: Resolve Security and Ponytail Review findings
  - status: done, starts: 1
  - model: mid, effort: high
  - diag: Review findings (limit: -1, date in-place mutation, 3-char hex contrast, timezone drift) → fixes in layout.vue and package.json
  - more:
    - 7.1 Added query limit of 500 records
    - 7.2 Fixed week range calculation without in-place Date mutation
    - 7.3 Added day 1 pinning before month change
    - 7.4 Supported 3-character hex colors (#RGB) in contrast calculation
    - 7.5 Converted date parsing to local timezone
    - 7.6 Fixed TypeScript version in package.json
  - tests:
    - npm --prefix extensions/calendar-colored run build - success_all
    - docker compose restart directus - success_all
  - git_hash: d26d1b0

- [x] Шаг 8: Final verification and acceptance by subagent
  - status: done, starts: 1
  - model: lite, effort: medium
  - agent: qa-verifier
  - diag: All steps implemented → end-to-end verification of container, API, build, and git status
  - more:
    - 8.1 Verification of Directus container status and extension loading logs
    - 8.2 Verification of Color field in Tasks database and schema.yaml snapshot
    - 8.3 Verification of git cleanliness and branch history
  - tests:
    - docker compose logs directus --tail 20 | grep -i "calendar-colored" - success_all
    - grep -q "Color" database/schema.yaml - success_all
  - git_hash: e51abfb

- [x] Шаг 9: Subagent security review of branch changes
  - status: done, starts: 1
  - model: mid, effort: medium
  - agent: security
  - diag: Security audit of extension and schema → inspect extensions/calendar-colored and API for vulnerabilities
  - more:
    - 9.1 Check for XSS, injections, data leakage, and authorization vulnerabilities in extensions/calendar-colored
    - 9.2 Compile report in .agents/tasks/feature/plugin-calendar-task-color/reviews/security-1.md
  - tests:
    - test -f /Users/artem/git_craft/_directus/.agents/tasks/feature/plugin-calendar-task-color/reviews/security-1.md - success_all
  - git_hash: 403cc6f

- [x] Шаг 10: Subagent clean code and architecture review across whole branch via ponytail-reviewer
  - status: done, starts: 1
  - model: mid, effort: medium
  - agent: ponytail-reviewer
  - diag: Clean code and architecture audit across branch → evaluate against ponytail guidelines (KISS, YAGNI, DRY, SSoT)
  - more:
    - 10.1 Audit full branch diff against ponytail criteria (architecture, minimalism, cleanliness)
    - 10.2 Compile report in .agents/tasks/feature/plugin-calendar-task-color/reviews/ponytail.md
  - tests:
    - test -f /Users/artem/git_craft/_directus/.agents/tasks/feature/plugin-calendar-task-color/reviews/ponytail.md - success_all
  - git_hash: f579db5

- [x] Шаг 11: Resolve findings and follow-up subagent security review
  - status: done, starts: 1
  - model: mid, effort: medium
  - agent: security
  - diag: Review findings → fix issues and perform verification security check
  - more:
    - 11.1 Apply necessary code fixes for review findings
    - 11.2 Re-run security audit by subagent and produce report
  - tests:
    - test -f /Users/artem/git_craft/_directus/.agents/tasks/feature/plugin-calendar-task-color/reviews/security-2.md - success_all
    - npm --prefix /Users/artem/git_craft/_directus/extensions/calendar-colored run build - success_all
  - git_hash: 94b80f6

- [x] Шаг 12: Generate create_issue.md and create_pr.md for Directus maintainers
  - status: done, starts: 1
  - model: lite, effort: low
  - diag: Prepare materials for upstream contribution to Directus → produce create_issue.md and create_pr.md
  - more:
    - 12.1 Format create_issue.md with problem description, use cases, and proposed solution
    - 12.2 Format create_pr.md with change summary, installation guide, and test plan
  - tests:
    - test -f /Users/artem/git_craft/_directus/.agents/tasks/feature/plugin-calendar-task-color/create_issue.md - success_all
    - test -f /Users/artem/git_craft/_directus/.agents/tasks/feature/plugin-calendar-task-color/create_pr.md - success_all
  - git_hash: 3b4c937

- [x] Шаг 13: Add highlight_color field to Tasks schema
  - status: done, starts: 1
  - model: lite, effort: low
  - diag: User requested highlight_color field → add to Tasks collection and export schema snapshot
  - more:
    - 13.1 Create highlight_color string field with select-color interface via Directus API
    - 13.2 Update database/schema.yaml snapshot
  - tests:
    - grep -q "highlight_color" /Users/artem/git_craft/_directus/database/schema.yaml - success_all
  - git_commit: pending

- [x] Шаг 14: Support highlight_color in layout extension and rebuild
  - status: done, starts: 1
  - model: lite, effort: low
  - diag: Extension layout needs highlight_color support → update layout.vue and recompile bundle
  - more:
    - 14.1 Map item.highlight_color with fallback to item.Color in layout.vue
    - 14.2 Build bundle via directus-extension build
  - tests:
    - npm --prefix /Users/artem/git_craft/_directus/extensions/calendar-colored run build - success_all
  - git_commit: pending

- [ ] Шаг 15: Create Directus core patch and apply to container calendar layout
  - status: todo, starts: 0
  - model: mid, effort: medium
  - diag: Built-in calendar needs highlight_color support → create clean git patch for directus repo and apply to container
  - more:
    - 15.1 Create patch file patches/directus-calendar-highlight-color.patch for app/src/layouts/calendar
    - 15.2 Apply patch to container assets so built-in calendar colors task cards
  - tests:
    - test -f /Users/artem/git_craft/_directus/patches/directus-calendar-highlight-color.patch
  - git_commit: pending

- [ ] Шаг 16: End-to-end verification and update upstream documentation
  - status: todo, starts: 0
  - model: mid, effort: medium
  - diag: Full flow verification → test task with highlight_color, update README, create_issue.md, and create_pr.md
  - more:
    - 16.1 Update Task item with highlight_color and verify API response
    - 16.2 Update extensions/calendar-colored/README.md, create_issue.md, and create_pr.md
    - 16.3 Run subagent security review check
  - tests:
    - grep -q "highlight_color" /Users/artem/git_craft/_directus/extensions/calendar-colored/README.md
    - grep -q "highlight_color" /Users/artem/git_craft/_directus/.agents/tasks/feature/plugin-calendar-task-color/create_pr.md
  - git_commit: pending

